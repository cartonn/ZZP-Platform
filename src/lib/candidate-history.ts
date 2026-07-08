// "Eerder samengewerkt"-signaal voor de opdrachtgever op /kandidaten. Wanneer een reagerende ZZP'er
// al eerder een samenwerking met déze opdrachtgever heeft afgerond, is dat een sterk, laag-risico
// vertrouwenssignaal bij de beslissing ("een bekende die je bevalt inhuren is sneller en veiliger").
// Benchmark: Malt/LinkedIn/Upwork tonen "worked together before"; wij vertalen dat naar onze
// verklaarbare, server-berekende kandidatenlijst. Puur en deterministisch; de fetcher is apart.
//
// Bewust alleen AFGERONDE (COMPLETED) samenwerkingen: dat is de eenduidige "eerder samengewerkt"-claim.
// PROPOSED/ACTIVE tellen niet mee — een lopende of net-voorgestelde samenwerking kan de huidige reactie
// zelf zijn en zou het signaal misleidend maken. De telling is per opdrachtgever gescoopt (geen data
// van een andere opdrachtgever) en toont nooit tarieven of andere partij-gegevens.

/** Gedeelde historie tussen deze opdrachtgever en één kandidaat (afgeronde samenwerkingen). */
export interface SharedHistory {
  /** Aantal afgeronde samenwerkingen tussen deze opdrachtgever en de kandidaat (≥ 1). */
  count: number;
  /** Meest recente afronddatum (`completedAt`, met `createdAt`-terugval voor legacy). */
  lastCompletedAt: Date | null;
}

/** Eén afgeronde-samenwerking-rij zoals de fetcher die aanlevert. */
export interface SharedHistoryRow {
  freelancerId: string;
  /** Moment van afronding; null bij legacy-records (valt terug op `createdAt`). */
  completedAt: Date | null;
  createdAt: Date;
}

/**
 * Pure aggregator: bouwt per freelancer-profiel de gedeelde historie uit de afgeronde
 * samenwerkingen. Alleen profielen mét minstens één afgeronde samenwerking komen in de Map terug
 * (afwezig = nog nooit samengewerkt). Rijen buiten de opgegeven set worden genegeerd (defensief).
 * De effectieve afronddatum is `completedAt ?? createdAt`; de meest recente wint.
 */
export function summarizeSharedHistory(
  rows: readonly SharedHistoryRow[],
  freelancerIds: readonly string[],
): Map<string, SharedHistory> {
  const allowed = new Set(freelancerIds);
  const byProfile = new Map<string, SharedHistory>();
  for (const row of rows) {
    if (!allowed.has(row.freelancerId)) continue;
    const effective = row.completedAt ?? row.createdAt;
    const current = byProfile.get(row.freelancerId);
    if (!current) {
      byProfile.set(row.freelancerId, { count: 1, lastCompletedAt: effective });
      continue;
    }
    current.count += 1;
    if (
      effective &&
      (current.lastCompletedAt === null || effective.getTime() > current.lastCompletedAt.getTime())
    ) {
      current.lastCompletedAt = effective;
    }
  }
  return byProfile;
}

/**
 * NL-label voor het signaal. Één afgeronde samenwerking → sober "Eerder samengewerkt"; meer → met
 * telling. Puur, zodat het zonder DB te testen is; de UI wrapt het desgewenst met de vertaler.
 */
export function sharedHistoryLabel(count: number): string {
  return count <= 1 ? "Eerder samengewerkt" : `${count}× eerder samengewerkt`;
}
