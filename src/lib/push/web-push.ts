// I/O-grens voor web-push: configureert de VAPID-sleutels en verstuurt naar één abonnement. De pure
// payload-/statuslogica staat in payload.ts; de DB-orchestratie in push-delivery-task.ts. Zonder
// VAPID-env (mensenwerk-secrets) is alles een no-op — de feature degradeert netjes, niets crasht.

import webpush from "web-push";
import { isExpiredSubscriptionStatus } from "@/lib/push/payload";
import {
  isWebPushConfigured as resolveIsWebPushConfigured,
  resolveWebPushConfigState,
} from "@/lib/push/config";

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
