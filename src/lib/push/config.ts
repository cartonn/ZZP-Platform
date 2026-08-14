// Pure web-push (VAPID) configuratie-detectie. Gedeeld door de env-validatie (halve-activering-guard,
// src/lib/env.ts), de runtime I/O-grens (src/lib/push/web-push.ts) en de systeemstatus-posture
// (src/lib/system-status.ts), zodat die drie NIET kunnen driften over "staat web-push aan?".
//
// Geen I/O, geen geheimen gelogd — leest alleen of de twee sleutels aan-/afwezig zijn.

export type WebPushConfigState = "configured" | "partial" | "off";

/**
 * Bepaalt de web-push-configuratiestand uit de twee VAPID-sleutels:
 * - "configured": beide sleutels gezet → push kan afleveren.
 * - "partial": precies één sleutel gezet → gevaarlijke halve activering. De runtime behandelt dit als
 *   UIT (zowel de browser-subscribe als de delivery-taak eisen beide sleutels), dus push staat dan
 *   STIL uit terwijl de operator vermoedelijk denkt dat 'ie aan staat. De env-validatie maakt dit een
 *   luide boot-fout i.p.v. een stille misconfiguratie.
 * - "off": geen van beide → push bewust uit (pilot-default); in-app meldingen blijven werken, niets crasht.
 */
export function resolveWebPushConfigState(
  publicKey: string | undefined,
  privateKey: string | undefined,
): WebPushConfigState {
  const hasPublic = !!publicKey?.trim();
  const hasPrivate = !!privateKey?.trim();
  if (hasPublic && hasPrivate) return "configured";
  if (hasPublic || hasPrivate) return "partial";
  return "off";
}

/** True zodra web-push echt kan afleveren (beide sleutels gezet). */
export function isWebPushConfigured(
  publicKey: string | undefined,
  privateKey: string | undefined,
): boolean {
  return resolveWebPushConfigState(publicKey, privateKey) === "configured";
}

/**
 * VAPID_SUBJECT moet volgens de web-push-spec (RFC 8292) een mailto:- of https:-contact zijn. Een
 * lege/ongezette waarde is geldig (web-push.ts valt terug op een veilige default). Een gezette maar
 * ongeldige waarde laat `webpush.setVapidDetails()` pas throwen bij de éérste verzending — dit vangt
 * die fout bij boot af i.p.v. per verzending stil te laten mislukken.
 */
export function isValidVapidSubject(subject: string | undefined): boolean {
  if (subject === undefined || subject.trim() === "") return true;
  return /^(mailto:|https:\/\/)/i.test(subject.trim());
}
