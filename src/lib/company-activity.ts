// Publiek activiteits-/anciënniteitssignaal van een opdrachtgever voor het beslismoment van de
// ZZP'er op de opdracht-detailpagina. Cold-start-vertrouwen: waar betaalgedrag, reputatie en
// reactiebereidheid nog leeg zijn (een nieuwe opdrachtgever zonder historie verbergt al die
// blokken), geeft "lid sinds" + activiteit tóch een eerlijke basis om "kan ik dit vertrouwen?" te
// beantwoorden. Spiegelbeeld van "op het platform sinds" op het ZZP-profiel.
//
// Puur, geen PII: alleen geaggregeerde tellingen + de accountleeftijd van het bedrijf. De
// tel-velden worden alleen getoond bij een positieve waarde — een nieuwkomer met 0 mag niet
// onterecht zwak lijken (het vertrouwensniveau draagt daar). Dezelfde filosofie als de null-gating
// in company-reputation.ts.

export interface CompanyActivityInput {
  /** Aanmaakmoment van het opdrachtgever-account (Company.createdAt). */
  memberSince: Date;
  /** Aantal ooit gepubliceerde opdrachten (niet-DRAFT). */
  publishedJobs: number;
  /** Aantal afgeronde samenwerkingen (COMPLETED). */
  completedCollaborations: number;
}

export interface CompanyActivity {
  memberSince: Date;
  /** `null` = niet tonen (0 of negatief). */
  publishedJobs: number | null;
  /** `null` = niet tonen (0 of negatief). */
  completedCollaborations: number | null;
}

/**
 * Vormt de ruwe tellingen tot het weergavemodel: "lid sinds" blijft altijd behouden (accountleeftijd
 * is altijd een eerlijk basissignaal), de tel-velden vallen weg bij een niet-positieve waarde zodat
 * een nieuwkomer geen misleidende "0 opdrachten geplaatst" te zien krijgt.
 */
export function summarizeCompanyActivity(input: CompanyActivityInput): CompanyActivity {
  return {
    memberSince: input.memberSince,
    publishedJobs: input.publishedJobs > 0 ? input.publishedJobs : null,
    completedCollaborations:
      input.completedCollaborations > 0 ? input.completedCollaborations : null,
  };
}
