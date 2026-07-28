// Verwachte doorlooptijd van certificaat-verificatie (de kerndifferentiatie): hoe lang
// duurt een beoordeling doorgaans? Puur en testbaar zonder DB. Afgeleid uit historisch
// geverifieerde certificaten (`verifiedAt − submittedAt`) zodat een ZZP'er met een
// certificaat in beoordeling een geruststellende, eerlijke indicatie ziet i.p.v. stilte.
//
// Aggregaat, nooit per-record: er wordt één mediaan + p90 getoond, en pas vanaf een
// steekproefdrempel (k-anonimiteit) — geen doorlooptijd afleidbaar uit één beoordeling.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Minimale steekproef vóór we een doorlooptijd tonen (k-anonimiteit, geen schijnprecisie). */
export const VERIFICATION_TURNAROUND_MIN_SAMPLE = 8;

export interface VerificationTurnaround {
  /** Aantal geverifieerde certificaten waarop de indicatie is gebaseerd. */
  sampleCount: number;
  /** Typische (mediane) doorlooptijd in hele dagen (>= 1). */
  typicalDays: number;
  /** 90e-percentiel doorlooptijd in hele dagen (>= typicalDays): "de meeste binnen". */
  p90Days: number;
}

/** Lineair geïnterpoleerd kwantiel over een niet-lege, oplopend gesorteerde reeks (0 <= q <= 1). */
function quantile(sortedAsc: readonly number[], q: number): number {
  const pos = (sortedAsc.length - 1) * q;
  const lo = Math.floor(pos);
  const frac = pos - lo;
  const loVal = sortedAsc[lo] ?? 0;
  // Bij de bovengrens (frac === 0) bestaat lo+1 niet → val terug op loVal; frac === 0 negeert 'm toch.
  const hiVal = sortedAsc[lo + 1] ?? loVal;
  return loVal + (hiVal - loVal) * frac;
}

/** Duur in ms → hele dagen naar boven afgerond, minimaal 1 ("binnen ~X dagen"-kader). */
function toDaysCeil(ms: number): number {
  return Math.max(1, Math.ceil(ms / DAY_MS));
}

/**
 * Vat de doorlooptijd van een reeks beoordeelde certificaten samen. De items hoeven niet
 * gesorteerd te zijn en worden niet gemuteerd. Records zonder `submittedAt`/`verifiedAt`
 * (legacy) en negatieve duren (klok-anomalie) worden defensief genegeerd. Retourneert `null`
 * onder de steekproefdrempel, zodat er nooit een misleidende indicatie uit weinig data komt.
 */
export function summarizeVerificationTurnaround(
  samples: ReadonlyArray<{ submittedAt: Date | null; verifiedAt: Date | null }>,
  minSample: number = VERIFICATION_TURNAROUND_MIN_SAMPLE,
): VerificationTurnaround | null {
  const durations: number[] = [];
  for (const s of samples) {
    if (!s.submittedAt || !s.verifiedAt) continue;
    const ms = s.verifiedAt.getTime() - s.submittedAt.getTime();
    if (ms < 0) continue; // klok-anomalie: verifiedAt vóór submittedAt
    durations.push(ms);
  }

  if (durations.length < minSample) return null;

  durations.sort((a, b) => a - b);
  const typicalDays = toDaysCeil(quantile(durations, 0.5));
  const p90Days = toDaysCeil(quantile(durations, 0.9));

  return {
    sampleCount: durations.length,
    typicalDays,
    // p90 is monotoon >= mediaan na sorteren; borg de invariant defensief tegen afronding.
    p90Days: Math.max(p90Days, typicalDays),
  };
}
