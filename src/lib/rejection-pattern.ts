// Afwijzingspatroon-inzicht voor de ZZP'er: aggregeert de gestructureerde afwijzingsredenen van
// zijn afgewezen reacties tot één actiegericht patroon ("Tarief boven budget was de meest genoemde
// reden — overweeg je tarief bij te stellen"). Losse afwijzingen tonen we al per reactie
// (rejectionReasonFeedback); dit tilt ze naar een leerbaar patroon zodat de ZZP'er zijn slaagkans
// gericht kan verbeteren i.p.v. de terugkoppeling stuk voor stuk te moeten optellen.
//
// Puur en deterministisch: geen I/O, geen tijd, muteert de invoer niet. Afgeleid uit de al
// opgehaalde reacties, zodat /reacties geen extra query nodig heeft.

import { type ApplicationStatus } from "@/lib/enums";
import { rejectionReasonLabel, type RejectionReasonCode } from "@/lib/rejection-reason";

/**
 * Minimaal aantal keer dat de meest genoemde reden moet voorkomen voordat we van een "patroon"
 * spreken. Eén afwijzing is toeval; pas bij een herhaalde reden is een gerichte tip zinvol (en niet
 * ontmoedigend). De losse per-reactie-feedback dekt de enkelvoudige afwijzing al af.
 */
export const REJECTION_PATTERN_MIN_COUNT = 2;

/**
 * Actiegerichte coachingszin per reden-code. Bewust anders dan de per-reactie `feedback` (die de
 * enkele afwijzing juist relativeert): hier gaat het om een terugkerend patroon, dus een concrete,
 * respectvolle volgende stap. `OTHER` staat er niet in — een neutrale "anders"-reden levert geen
 * actiegericht patroon op en wordt daarom nooit als inzicht getoond.
 */
export const REJECTION_PATTERN_ADVICE: Record<Exclude<RejectionReasonCode, "OTHER">, string> = {
  POSITION_FILLED:
    "De positie was meerdere keren al vervuld toen je reageerde. Reageer sneller — zet opdracht-attenderingen aan om er eerder bij te zijn.",
  RATE_TOO_HIGH:
    "Je tarief lag meerdere keren boven het budget. Overweeg een scherper tarief of richt je op opdrachten met meer ruimte.",
  EXPERIENCE_MISMATCH:
    "De gevraagde ervaring sloot meerdere keren niet aan. Vul je profiel en certificaten verder aan om beter te matchen.",
  AVAILABILITY:
    "Je beschikbaarheid botste vaker met de planning. Houd je beschikbaarheidsagenda actueel en reageer op opdrachten die passen.",
  LOCATION:
    "Reisafstand speelde vaker mee. Richt je op opdrachten dichter bij huis of verruim je reisbereidheid in je profiel.",
};

export interface RejectionPatternInput {
  status: ApplicationStatus;
  /** Gestructureerde afwijzingscode (RejectionReasonCode) of null als er geen reden is meegegeven. */
  rejectionReason: string | null;
}

export interface RejectionPattern {
  /** De meest genoemde reden-code (actiegericht; nooit OTHER). */
  code: Exclude<RejectionReasonCode, "OTHER">;
  /** Opdrachtgever-label van die reden ("Tarief boven budget"). */
  label: string;
  /** Hoe vaak deze reden voorkwam onder de afwijzingen met een reden. */
  count: number;
  /** Totaal aantal afwijzingen mét een gestructureerde reden (de noemer). */
  totalWithReason: number;
  /** Actiegerichte coachingszin voor deze reden. */
  advice: string;
}

function isAdvisableCode(code: string): code is Exclude<RejectionReasonCode, "OTHER"> {
  return Object.prototype.hasOwnProperty.call(REJECTION_PATTERN_ADVICE, code);
}

/**
 * Vat de afwijzingsredenen samen tot het dominante, actiegerichte patroon — of `null` als er geen
 * betekenisvol patroon is (te weinig herhaling, of de dominante reden is niet actiegericht).
 *
 * - Alleen REJECTED-reacties mét een gestructureerde reden tellen mee.
 * - `OTHER` telt niet mee (geen actiegerichte tip); onbekende/lege codes evenmin.
 * - Pas bij `count >= REJECTION_PATTERN_MIN_COUNT` voor de meest genoemde reden tonen we iets.
 * - Bij een gelijkspel wint de reden die als eerste die drempel bereikte (stabiel, invoervolgorde).
 */
export function summarizeRejectionPattern(
  applications: readonly RejectionPatternInput[],
  minCount: number = REJECTION_PATTERN_MIN_COUNT,
): RejectionPattern | null {
  const counts = new Map<string, number>();
  let totalWithReason = 0;

  for (const app of applications) {
    if (app.status !== "REJECTED") continue;
    const code = app.rejectionReason;
    if (!code || !isAdvisableCode(code)) continue;
    totalWithReason += 1;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  let topCode: string | null = null;
  let topCount = 0;
  for (const [code, count] of counts) {
    if (count > topCount) {
      topCount = count;
      topCode = code;
    }
  }

  if (topCode === null || topCount < minCount || !isAdvisableCode(topCode)) return null;

  return {
    code: topCode,
    label: rejectionReasonLabel(topCode) ?? topCode,
    count: topCount,
    totalWithReason,
    advice: REJECTION_PATTERN_ADVICE[topCode],
  };
}
