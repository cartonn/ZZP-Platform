// Pure VAPID-sleutelvalidatie voor de web-push-connectiviteitszelftest (admin-only,
// /admin/systeemstatus). Geen netwerk, geen abonnee nodig, geen mutatie — alleen deterministische
// cryptografische controles op de twee VAPID-sleutels + het subject.
//
// Waarom dit bestaat: de env-validatie (src/lib/env.ts) blokkeert al een HALVE activering (precies
// één sleutel) en een ongeldig subject, maar bewijst NIET dat de twee sleutels bij elkaar horen. Een
// mismatched paar — de publieke sleutel uit paar A, de private uit paar B (klassieke plak-fout) —
// overleeft de boot én de browser-subscribe (die alleen de publieke sleutel gebruikt), maar laat
// vervolgens ÉLKE aflevering stil met een 403 (ongeldige VAPID-signature) mislukken. Precies de
// stille faalmodus die de codebase overal elders afvangt met een zelftest. Deze module leidt de
// publieke sleutel af uit de private sleutel (ECDH op P-256) en vergelijkt — zo valt een mismatch
// vóór go-live door de mand, zonder een echte push te versturen.
//
// Geen geheimen in de uitvoer: de functies geven alleen een gecategoriseerde uitkomst terug, nooit
// een (deel van een) sleutel.

import { createECDH } from "node:crypto";
import {
  isValidVapidSubject,
  resolveWebPushConfigState,
  type WebPushConfigState,
} from "@/lib/push/config";

/**
 * Uitkomst van de VAPID-validatie:
 * - "off"             — geen van beide sleutels gezet (push bewust uit, pilot-default).
 * - "partial"         — precies één sleutel gezet (gevaarlijke halve activering; boot blokkeert dit).
 * - "invalid-public"  — publieke sleutel is geen 65-byte ongecomprimeerd P-256-punt.
 * - "invalid-private" — private sleutel is geen bruikbare 32-byte P-256-scalar.
 * - "invalid-subject" — VAPID_SUBJECT is geen geldig mailto:-/https:-contact (RFC 8292).
 * - "mismatched"      — beide sleutels zijn geldig van vorm maar vormen GEEN paar (403 bij elke push).
 * - "valid"           — beide sleutels vormen een geldig paar en het subject klopt.
 */
export type VapidValidationOutcome =
  | "off"
  | "partial"
  | "invalid-public"
  | "invalid-private"
  | "invalid-subject"
  | "mismatched"
  | "valid";

export interface VapidValidationResult {
  outcome: VapidValidationOutcome;
  configState: WebPushConfigState;
}

/** Web-push VAPID-formaat: P-256 (prime256v1), ongecomprimeerd publiek punt (65 bytes), scalar (32 bytes). */
const PUBLIC_KEY_BYTES = 65;
const PRIVATE_KEY_BYTES = 32;
const UNCOMPRESSED_POINT_PREFIX = 0x04;

/**
 * Decodeert een base64url-string naar bytes. Buffer.from is lankmoedig (negeert ongeldige tekens
 * i.p.v. te werpen), dus de aanroeper valideert de verwachte LENGTE — niet of de string "netjes" was.
 */
function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value.trim(), "base64url");
}

/**
 * Valideert het VAPID-sleutelpaar + subject volledig lokaal (geen netwerk, geen mutatie). De
 * kerncontrole is de sleutelPARING: we leiden het publieke punt af uit de private scalar via ECDH op
 * P-256 en vergelijken byte-voor-byte met de opgegeven publieke sleutel. Een mismatch (of een
 * onbruikbare scalar) betekent dat push stil met 403 zou afleveren.
 */
export function validateVapid(
  publicKey: string | undefined,
  privateKey: string | undefined,
  subject: string | undefined,
): VapidValidationResult {
  const configState = resolveWebPushConfigState(publicKey, privateKey);

  // Niets (of half) geconfigureerd: geen paar om te valideren. "partial" wordt bij boot al een harde
  // fout; we melden het hier defensief zodat de zelftest nooit vals groen geeft.
  if (configState !== "configured") {
    return { outcome: configState === "partial" ? "partial" : "off", configState };
  }

  const publicBuf = decodeBase64Url(publicKey!);
  if (publicBuf.length !== PUBLIC_KEY_BYTES || publicBuf[0] !== UNCOMPRESSED_POINT_PREFIX) {
    return { outcome: "invalid-public", configState };
  }

  // De P-256-scalar is ten hoogste 32 bytes; base64url laat leidende nul-bytes weg, dus een legitieme
  // sleutel kan (zeldzaam) korter zijn. We accepteren 1..32 bytes en laten de ECDH-afleiding hieronder
  // de échte waarheid zijn (een onbruikbare scalar werpt of leidt een niet-passend punt af).
  const privateBuf = decodeBase64Url(privateKey!);
  if (privateBuf.length < 1 || privateBuf.length > PRIVATE_KEY_BYTES) {
    return { outcome: "invalid-private", configState };
  }

  // Subject is een onafhankelijke delivery-blocker (setVapidDetails werpt anders pas bij de eerste
  // verzending). Controleer het vóór de dure ECDH-afleiding.
  if (!isValidVapidSubject(subject)) {
    return { outcome: "invalid-subject", configState };
  }

  // Leid het publieke punt af uit de private scalar en vergelijk. Een onbruikbare scalar laat
  // setPrivateKey/getPublicKey werpen — dat telt als een ongeldige private sleutel.
  let derivedPublic: Buffer;
  try {
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(privateBuf);
    derivedPublic = ecdh.getPublicKey();
  } catch {
    return { outcome: "invalid-private", configState };
  }

  if (!derivedPublic.equals(publicBuf)) {
    return { outcome: "mismatched", configState };
  }

  return { outcome: "valid", configState };
}
