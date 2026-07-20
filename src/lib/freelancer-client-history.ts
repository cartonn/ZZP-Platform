// "Eerder voor deze opdrachtgever gewerkt"-signaal voor de ZZP'er op de opdracht-detailpagina.
// Wanneer een ZZP'er een opdracht bekijkt van een opdrachtgever waarvoor hij al eerder een
// samenwerking heeft AFGEROND, is dat een sterk, laag-risico vertrouwenssignaal bij de beslissing
// om te reageren ("een bekende opdrachtgever die je bevalt is sneller en zekerder"). Dit is het
// symmetrische spiegelbeeld van het "eerder samengewerkt"-signaal dat de opdrachtgever al ziet op
// /kandidaten (candidate-history.ts). Benchmark: Malt/Upwork tonen "worked together before"
// bidirectioneel; wij vertalen dat naar onze verklaarbare, server-berekende opdracht-detailpagina.
// Puur en deterministisch; de fetcher is apart.
//
// Bewust alleen AFGERONDE (COMPLETED) samenwerkingen: dat is de eenduidige "eerder samengewerkt"-
// claim. PROPOSED/ACTIVE tellen niet mee — een lopende of net-voorgestelde samenwerking kan niet
// als bewezen historie gelden. De telling is per (ZZP'er, opdrachtgever)-paar gescoopt: nooit data
// van een andere opdrachtgever, en nooit tarieven of andere partij-gegevens.

/** Eén afgeronde-samenwerking-rij zoals de fetcher die aanlevert. */
export interface FreelancerClientHistoryRow {
  /** Moment van afronding; null bij legacy-records (valt terug op `createdAt`). */
  completedAt: Date | null;
  createdAt: Date;
}

/** Gedeelde historie tussen deze ZZP'er en deze opdrachtgever (afgeronde samenwerkingen). */
export interface FreelancerClientHistory {
  /** Aantal afgeronde samenwerkingen met deze opdrachtgever (≥ 1). */
  count: number;
  /** Meest recente afronddatum (`completedAt`, met `createdAt`-terugval voor legacy). */
  lastCompletedAt: Date;
}

/**
 * Pure aggregator: bouwt uit de afgeronde-samenwerking-rijen (al gescoopt op dit ZZP'er/
 * opdrachtgever-paar) de gedeelde historie. Geeft `null` terug als er geen enkele afgeronde
 * samenwerking is (nog nooit voor deze opdrachtgever gewerkt) → dan rendert de UI niets. De
 * effectieve afronddatum is `completedAt ?? createdAt`; de meest recente wint.
 */
export function summarizeFreelancerClientHistory(
  rows: readonly FreelancerClientHistoryRow[],
): FreelancerClientHistory | null {
  const [first, ...rest] = rows;
  if (!first) return null;
  let lastCompletedAt = first.completedAt ?? first.createdAt;
  for (const row of rest) {
    const effective = row.completedAt ?? row.createdAt;
    if (effective.getTime() > lastCompletedAt.getTime()) lastCompletedAt = effective;
  }
  return { count: rows.length, lastCompletedAt };
}

/**
 * NL-label voor het signaal. Eén afgeronde samenwerking → sober; meer → met telling. Puur, zodat
 * het zonder DB te testen is; de UI wrapt het desgewenst met de vertaler.
 */
export function freelancerClientHistoryLabel(count: number): string {
  return count <= 1 ? "Eerder samengewerkt" : `${count}× eerder samengewerkt`;
}
