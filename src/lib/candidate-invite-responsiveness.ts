// Reactiesnelheid-badge op uitnodigingen voor de opdrachtgever. Op de kandidatenlijst van een
// opdracht ("Geschikte ZZP'ers") ziet de opdrachtgever welke voorgestelde ZZP'ers doorgaans snel
// op een uitnodiging reageren, zodat hij de responsieve kandidaten als eerste uitnodigt en de
// opdracht sneller vult. Benchmark: Temper/Pidz nodigen automatisch de responsieve ZZP'ers uit;
// Malt/Upwork tonen een "reageert snel"-badge naast een kandidaat.
//
// --- Waarom dit eerlijk en veilig is ---
// Afgeleid uit onveranderlijke feiten: de gezaghebbende `JOB_INVITED`-auditrecords (invitedAt =
// createdAt, freelancerId in metadata) + de niet-ingetrokken `Application.createdAt` van dezelfde
// ZZP'er op dezelfde opdracht ("gereageerd"). Puur en deterministisch. UITSLUITEND POSITIEF: een
// badge verschijnt alleen wanneer een ZZP'er aantoonbaar snel én vaak reageert — nooit een negatief
// label ("reageert zelden") dat een individuele ZZP'er zou schaden. Geen badge = geen signaal, niet
// "traag". Enkel geaggregeerde tellingen over de eigen uitnodigingshistorie van de ZZP'er.

/** Eén uitnodiging aan de ZZP'er met (optioneel) diens reactie. */
export interface InviteResponse {
  /** Moment van uitnodigen (AuditLog.createdAt, onveranderlijk). */
  invitedAt: Date;
  /** Moment waarop de ZZP'er reageerde (Application.createdAt), of null als (nog) niet gereageerd. */
  respondedAt: Date | null;
}

/** Het geaggregeerde reactiesnelheid-signaal van één ZZP'er over zijn uitnodigingen. */
export interface CandidateInviteResponsiveness {
  /** Aantal uitnodigingen waarop het signaal rust. */
  invited: number;
  /** Aantal daarvan waarop de ZZP'er (geldig, ná de uitnodiging) reageerde. */
  responded: number;
  /** Mediane reactietijd (minuten) over de beantwoorde uitnodigingen; null als er niets is beantwoord. */
  medianMinutes: number | null;
  /** Haalt de ZZP'er de "reageert snel"-drempel (positief signaal → badge tonen)? */
  fast: boolean;
  /** Korte badge-tekst, of null wanneer er geen badge getoond wordt. */
  label: string | null;
  /** Uitgebreide tooltip met de onderbouwing, of null wanneer er geen badge is. */
  detail: string | null;
}

const MS_PER_MINUTE = 60_000;
const HOUR = 60;
const HOURS_MAX = 6 * 60; // t/m ~6 uur → "binnen enkele uren"
const DAY = 24 * 60; // t/m een dag → "binnen een dag"

/** Minstens dit aantal uitnodigingen — anders is één reactie geen "gewoonte". */
export const MIN_INVITES = 3;
/** De ZZP'er moet op een meerderheid van de uitnodigingen reageren. */
export const FAST_RESPONSE_RATE = 0.6;
/** En doorgaans binnen een dag (mediaan). */
export const FAST_MEDIAN_MAX_MINUTES = DAY;

/** Mediaan van een niet-lege lijst (afgerond op hele minuten). */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
  }
  return sorted[mid] ?? 0;
}

/** Mensentaal-bucket voor de mediane reactietijd (alleen de snelle buckets — badge is positief-only). */
function bucketLabel(medianMinutes: number): string {
  if (medianMinutes <= HOUR) return "binnen een uur";
  if (medianMinutes <= HOURS_MAX) return "binnen enkele uren";
  return "binnen een dag";
}

/**
 * Vat de uitnodigingshistorie van één ZZP'er samen tot een positief reactiesnelheid-signaal. Puur en
 * deterministisch. Een reactie telt alleen wanneer `respondedAt` op of ná `invitedAt` ligt; een
 * negatieve of ontbrekende reactietijd telt als "niet gereageerd" (nooit misleiden).
 */
export function summarizeCandidateInviteResponsiveness(
  responses: readonly InviteResponse[],
): CandidateInviteResponsiveness {
  const invited = responses.length;
  const latencies: number[] = [];
  for (const r of responses) {
    if (!r.respondedAt) continue;
    const minutes = (r.respondedAt.getTime() - r.invitedAt.getTime()) / MS_PER_MINUTE;
    if (minutes >= 0) latencies.push(minutes);
  }
  const responded = latencies.length;
  const medianMinutes = responded > 0 ? median(latencies) : null;
  const responseRate = invited > 0 ? responded / invited : 0;

  const fast =
    invited >= MIN_INVITES &&
    responseRate >= FAST_RESPONSE_RATE &&
    medianMinutes !== null &&
    medianMinutes <= FAST_MEDIAN_MAX_MINUTES;

  return {
    invited,
    responded,
    medianMinutes,
    fast,
    label: fast ? "Reageert snel op uitnodigingen" : null,
    detail: fast
      ? `Reageerde op ${responded} van de ${invited} uitnodigingen, meestal ${bucketLabel(medianMinutes as number)}.`
      : null,
  };
}
