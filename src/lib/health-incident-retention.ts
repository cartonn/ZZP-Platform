// Pure retentie-/minimalisatielogica voor beveiligingsincidenten (HealthIncident). De
// anomaliedetectoren (detectors.ts) leggen bij LOGIN_BURST/PASSWORD_RESET_FLOOD het bron-IP vast in
// `evidence` (JSON) én verweven het in de mensleesbare `summary`. Een IP-adres is een persoonsgegeven;
// een beveiligingsincident onbeperkt bewaren mét dat IP is een dataminimalisatie-/opslagbeperkings-
// risico (AVG art. 5(1)(c)/(e)). Deze module bepaalt de afkapdatum en redact het IP uit een incident
// ná het retentievenster — het incident zelf (type, ernst, aantal, venster) blijft als
// beveiligingssignaal bewaard, alléén de PII (het IP) verdwijnt. Bewust geen DB-toegang zodat de
// logica zonder fixture testbaar is; de taak (health-incident-retention-task.ts) doet de
// daadwerkelijke, gebatchte update.

import { AUDIT_PII_REDACTED } from "@/lib/account-anonymization";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Sentinelwaarde die de detector schrijft wanneer het IP onbekend is (r.ipAddress == null). Dat is
// geen persoonsgegeven en hoeft dus niet geredigeerd te worden.
export const UNKNOWN_IP = "onbekend";

// Substring die de JSON-evidence heeft zodra er een string-waardig `ip`-veld in staat. De taak
// gebruikt dit om — portabel op SQLite én PostgreSQL — kandidaten voor te filteren (Prisma `contains`
// op de tekstkolom) zonder JSON-operators.
export const IP_EVIDENCE_MARKER = '"ip":"';

/**
 * De afkapdatum voor incident-IP-redactie, of `null` als redactie uit staat.
 * @param retentionDays het geconfigureerde venster in dagen (0/negatief/niet-eindig = uit).
 * @param now referentietijdstip (geïnjecteerd voor determinisme).
 * @returns een Date: incidenten met `createdAt < cutoff` mogen hun IP verliezen; `null` = niets doen.
 */
export function healthIncidentIpRetentionCutoff(retentionDays: number, now: Date): Date | null {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return null;
  return new Date(now.getTime() - Math.floor(retentionDays) * MS_PER_DAY);
}

/**
 * Bepaalt of het `ip`-veld in de evidence een persoonsgegeven bevat dat geredigeerd moet worden.
 * Leeg, reeds-geredigeerd of het "onbekend"-sentinel tellen niet mee (idempotent + geen ruis).
 */
function isRedactableIp(ip: unknown): ip is string {
  return typeof ip === "string" && ip.length > 0 && ip !== UNKNOWN_IP && ip !== AUDIT_PII_REDACTED;
}

export interface RedactableIncident {
  /** Rij-id (cuid) — gebruikt om de geredigeerde `dedupeKey` uniek te houden (@unique-constraint). */
  id: string;
  /** JSON-string uit HealthIncident.evidence (of null). */
  evidence: string | null;
  /** Mensleesbare samenvatting die het IP kan bevatten. */
  summary: string;
  /** Idempotentie-/groepeersleutel; bevat bij een burst het bron-IP verbatim. */
  dedupeKey: string;
}

export interface RedactedIncident {
  evidence: string;
  summary: string;
  dedupeKey: string;
  /** Het originele (nog IP-bevattende) IP; nodig om afgeleide kopieën (auditlog/notificatie) te matchen. */
  originalIp: string;
}

/**
 * Redact het bron-IP uit ELKE kolom van één incident die het kan bevatten: `evidence.ip`, de vrije
 * `summary`, én de machine-`dedupeKey` (`auth-login-burst-<ip>-<venster>`). Het IP is overal
 * ongewijzigd geïnterpoleerd, dus een letterlijke split/join is deterministisch en betrouwbaar
 * (en veilig tegen regex-metatekens in een client-nabij X-Forwarded-For-IP).
 *
 * De `dedupeKey` staat onder een `@unique`-constraint: twee incidenten met verschillende IP's in
 * hetzelfde venster zouden na naïeve redactie botsen. We hangen daarom het rij-id (cuid, globaal
 * uniek) achteraan. Dat is veilig: de idempotentie-rol van `dedupeKey` geldt alleen binnen het
 * rollende scanvenster (laatste uur), en deze rijen zijn per definitie ouder dan het retentievenster.
 *
 * @returns de geredigeerde velden + het originele IP, of `null` wanneer er niets te redigeren valt
 *   (geen/ongeldige evidence, geen `ip`-veld, of het IP is al geredigeerd/onbekend). `null` betekent
 *   "sla deze rij over" — dat houdt de taak idempotent.
 */
export function redactIncidentIp(incident: RedactableIncident): RedactedIncident | null {
  if (!incident.evidence) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(incident.evidence);
  } catch {
    return null; // onparseerbare evidence: niets veiligs te doen.
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

  const obj = parsed as Record<string, unknown>;
  const ip = obj.ip;
  if (!isRedactableIp(ip)) return null;

  const nextEvidence = { ...obj, ip: AUDIT_PII_REDACTED };
  // split/join i.p.v. replace met regex: het IP is gebruikersinvoer-nabij (X-Forwarded-For) en kan
  // regex-metatekens bevatten; een letterlijke split/join vermijdt injectie in het redactiepatroon.
  const nextSummary = incident.summary.split(ip).join(AUDIT_PII_REDACTED);
  // Redact ook de dedupeKey; borg uniciteit met het rij-id als suffix wanneer het IP erin zat.
  const nextDedupeKey = incident.dedupeKey.includes(ip)
    ? `${incident.dedupeKey.split(ip).join(AUDIT_PII_REDACTED)}-${incident.id}`
    : incident.dedupeKey;

  return {
    evidence: JSON.stringify(nextEvidence),
    summary: nextSummary,
    dedupeKey: nextDedupeKey,
    originalIp: ip,
  };
}
