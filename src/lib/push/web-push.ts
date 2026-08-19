// I/O-grens voor web-push: configureert de VAPID-sleutels en verstuurt naar één abonnement. De pure
// payload-/statuslogica staat in payload.ts; de DB-orchestratie in push-delivery-task.ts. Zonder
// VAPID-env (mensenwerk-secrets) is alles een no-op — de feature degradeert netjes, niets crasht.

import { createECDH } from "node:crypto";
import webpush from "web-push";
import { isExpiredSubscriptionStatus } from "@/lib/push/payload";
import {
  isValidVapidSubject,
  isWebPushConfigured as resolveIsWebPushConfigured,
  resolveWebPushConfigState,
} from "@/lib/push/config";

/** Uitkomst van de lokale VAPID-probe (zie `probeWebPushVapid`). Geen sleutelwaarden. */
export interface WebPushProbeResult {
  /** VAPID_SUBJECT is geldig (mailto:/https:) of afwezig (default). */
  subjectValid: boolean;
  /** De private key kan een geldige VAPID-verzendheader signeren (sleutels welgevormd + bruikbaar). */
  signed: boolean;
  /** De geconfigureerde public key hoort bij de private key (geen copy-paste-mismatch). */
  keypairMatches: boolean;
}

/** Representatieve push-audience voor de signeer-probe (geen echt bericht — alleen JWT-signering). */
const VAPID_PROBE_AUDIENCE = "https://fcm.googleapis.com";
const VAPID_DEFAULT_SUBJECT = "mailto:support@zzp-platform.nl";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  // Vereist beide sleutels (een halve config = stil uit; de env-validatie blokkeert dat al bij boot).
  if (resolveWebPushConfigState(pub, priv) !== "configured") return false;
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:support@zzp-platform.nl";
  webpush.setVapidDetails(subject, pub!, priv!);
  configured = true;
  return true;
}

/** True zodra de VAPID-sleutels geconfigureerd zijn; anders slaat de delivery-taak over. */
export function isWebPushConfigured(): boolean {
  return resolveIsWebPushConfigured(process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

/** De publieke VAPID-sleutel voor de browser-subscribe (veilig om te delen). */
export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

/**
 * Lokale, read-only operationele probe van de VAPID-configuratie voor de web-push-zelftest
 * (/admin/systeemstatus). Verstuurt GEEN pushbericht: het signeert een VAPID-JWT (exact de signering die
 * élke echte verzending doet) en vergelijkt de public/private-keypair — puur crypto, geen netwerk.
 *
 * Bewijst: (1) VAPID_SUBJECT is geldig, (2) de private key signeert een geldige verzendheader (sleutels
 * welgevormd), en (3) de geconfigureerde public key is daadwerkelijk afgeleid van de private key (vangt de
 * klassieke copy-paste-mismatch die anders pas bij de eerste echte melding stil faalt). Werpt nooit: elke
 * deelcheck vangt zijn eigen fout af en degradeert naar `false`.
 */
export function probeWebPushVapid(): WebPushProbeResult {
  const pub = process.env.VAPID_PUBLIC_KEY?.trim() ?? "";
  const priv = process.env.VAPID_PRIVATE_KEY?.trim() ?? "";
  const subject = process.env.VAPID_SUBJECT;
  const subjectValid = isValidVapidSubject(subject);
  const signingSubject = subject?.trim() || VAPID_DEFAULT_SUBJECT;

  let signed = false;
  try {
    const headers = webpush.getVapidHeaders(
      VAPID_PROBE_AUDIENCE,
      signingSubject,
      pub,
      priv,
      "aes128gcm",
    );
    signed = typeof headers.Authorization === "string" && headers.Authorization.length > 0;
  } catch {
    signed = false;
  }

  let keypairMatches = false;
  try {
    // Leid de public key af uit de private-scalar en vergelijk byte-voor-byte met de geconfigureerde
    // public key. VAPID-sleutels zijn P-256 (prime256v1): priv = 32-byte scalar, pub = 65-byte
    // ongecomprimeerd punt, beide base64url.
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(Buffer.from(priv, "base64url"));
    keypairMatches = ecdh.getPublicKey().equals(Buffer.from(pub, "base64url"));
  } catch {
    keypairMatches = false;
  }

  return { subjectValid, signed, keypairMatches };
}

export interface SendResult {
  ok: boolean;
  /** Het endpoint bestaat niet meer (404/410) → opruimen. */
  expired: boolean;
}

export async function sendToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payloadJson: string,
): Promise<SendResult> {
  if (!ensureConfigured()) return { ok: false, expired: false };
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payloadJson,
    );
    return { ok: true, expired: false };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode ?? 0;
    return { ok: false, expired: isExpiredSubscriptionStatus(status) };
  }
}
