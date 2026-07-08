// Afwijzingsredenen voor een reactie (Application): een opdrachtgever (CLIENT) mag bij het afwijzen
// van een ZZP'er optioneel een gestructureerde reden meegeven. De reden is een stabiele code
// (strings + Zod, geen native db-enum — harde architectuurregel), waar per code twee teksten bij
// horen: het korte `label` dat de opdrachtgever kiest, en de constructieve `feedback`-zin die de
// ZZP'er als respectvolle terugkoppeling op /reacties ziet.
//
// Puur en deterministisch: geen I/O, geen tijd, muteert niets.

import { z } from "zod";

/**
 * Alle afwijzingsredenen. Eén bron van waarheid: hieruit worden de union-type, de Zod-enum en de
 * label/feedback-lookups afgeleid. `OTHER` bewust als laatste — een neutrale terugval zonder
 * specifieke reden.
 */
export const REJECTION_REASONS = [
  {
    code: "POSITION_FILLED",
    label: "Positie is al vervuld",
    feedback: "De positie was al vervuld toen je reageerde — dit zegt niets over je profiel.",
  },
  {
    code: "RATE_TOO_HIGH",
    label: "Tarief boven budget",
    feedback:
      "Je tarief lag boven het budget voor deze opdracht. Voor andere opdrachten kun je een sterke match zijn.",
  },
  {
    code: "EXPERIENCE_MISMATCH",
    label: "Ervaring past niet bij de opdracht",
    feedback:
      "De gevraagde ervaring sloot deze keer niet aan. Vul je profiel verder aan om je kansen te vergroten.",
  },
  {
    code: "AVAILABILITY",
    label: "Beschikbaarheid past niet",
    feedback:
      "Je beschikbaarheid paste niet bij de planning van deze opdracht — bij een andere planning kan dat anders liggen.",
  },
  {
    code: "LOCATION",
    label: "Locatie of reisafstand",
    feedback:
      "De locatie of reisafstand paste deze keer niet. Voor opdrachten dichter bij huis blijf je goed in beeld.",
  },
  {
    code: "OTHER",
    label: "Anders",
    feedback: "De opdrachtgever koos deze keer voor een andere kandidaat.",
  },
] as const;

/** Union van alle geldige afwijzingsreden-codes, afgeleid uit `REJECTION_REASONS`. */
export type RejectionReasonCode = (typeof REJECTION_REASONS)[number]["code"];

/** Zod-enum over de codes; tuple uit `REJECTION_REASONS` zodat er één bron van waarheid is. */
export const rejectionReasonCodeSchema = z.enum(
  REJECTION_REASONS.map((r) => r.code) as [RejectionReasonCode, ...RejectionReasonCode[]],
);

/**
 * Optionele afwijzingsreden voor form-input: accepteert `undefined`, een lege string of een geldige
 * code. Een lege string normaliseert naar `undefined` (geen reden opgegeven); een niet-lege, ongeldige
 * waarde levert een parse-fout op.
 */
export const optionalRejectionReasonSchema = z
  .union([z.literal(""), rejectionReasonCodeSchema])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

/** Interne lookup van code → reden-object. */
function findReason(code: string | null | undefined): (typeof REJECTION_REASONS)[number] | null {
  if (!code) return null;
  return REJECTION_REASONS.find((r) => r.code === code) ?? null;
}

/** Geeft het opdrachtgever-label van een code, of `null` bij een onbekende/lege code. */
export function rejectionReasonLabel(code: string | null | undefined): string | null {
  return findReason(code)?.label ?? null;
}

/** Geeft de constructieve feedback-zin van een code, of `null` bij een onbekende/lege code. */
export function rejectionReasonFeedback(code: string | null | undefined): string | null {
  return findReason(code)?.feedback ?? null;
}

/**
 * Bouwt de notificatie-body voor de ZZP'er bij een afwijzing. Zonder geldige code alleen de
 * opdrachttitel; met geldige code aangevuld met het gekozen label.
 */
export function buildRejectionNotificationBody(
  jobTitle: string,
  code: string | null | undefined,
): string {
  const label = rejectionReasonLabel(code);
  if (label === null) return `Voor "${jobTitle}".`;
  return `Voor "${jobTitle}". Reden: ${label}.`;
}
