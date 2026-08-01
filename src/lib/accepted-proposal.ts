// Pure businessregel: een geaccepteerde reactie (ACCEPTED) is nog niet "af" zolang de opdrachtgever
// er geen samenwerkingsvoorstel op heeft gestuurd. `proposeCollaboration` (ACCEPTED → een PROPOSED
// Collaboration met `applicationId` @unique) is de afrondende stap; tot dan bestaat er géén
// collaboration en wacht de ZZP'er ("Geaccepteerd! Wacht op een samenwerkingsvoorstel"). Deze helper
// is de enige bron van waarheid voor "welke geaccepteerde reacties wachten nog op een voorstel?" —
// los testbaar, zonder DB. De enumerator (pending-tasks.ts) levert de ACCEPTED-reacties met
// `hasCollaboration` aan; hier valt elke reactie af die al een collaboration heeft.
//
// Naast het filter berekent de helper de leeftijd van de acceptatie (`agingDays`): een geaccepteerde
// ZZP'er die dagen op het beloofde voorstel wacht staat in het ergste limbo (hij zei "ja" tegen de hire
// en er volgt niets). Zodra die leeftijd de drempel raakt, escaleert de next-action — spiegel van de
// eerste-blik-SLA (firstLookOverdue) en de verouderde-concept-factuur (conceptInvoiceAging).

import { daysSince } from "@/lib/concept-invoice-reminders";

/**
 * Hele dagen dat een geaccepteerde reactie al op een samenwerkingsvoorstel wacht vóór de taak
 * escaleert. Bewust kort: de opdrachtgever hééft al besloten (ACCEPTED), dus het voorstel hoort snel
 * te volgen — anders raakt de kandidaat elders aan de slag. Benchmark: Temper/Malt ronden een hire
 * binnen uren/een dag af.
 */
export const PROPOSAL_STALL_DAYS = 3;

export type AcceptedProposalRow = {
  applicationId: string;
  freelancerName: string;
  jobTitle: string;
  /** Is er al een collaboration op deze reactie? Zo ja → het voorstel is al verstuurd. */
  hasCollaboration: boolean;
  /**
   * Moment van acceptatie (→ ACCEPTED). Legacy-rijen zonder `Application.acceptedAt` leveren hier de
   * `updatedAt`-fallback aan (door de enumerator opgelost), zodat de leeftijd nooit `null` is.
   */
  acceptedAt: Date;
};

export type AcceptedProposal = {
  applicationId: string;
  freelancerName: string;
  jobTitle: string;
  /** Hele dagen sinds de acceptatie (geklemd op ≥ 0). */
  agingDays: number;
  /** True zodra `agingDays >= PROPOSAL_STALL_DAYS` — dan escaleert de next-action. */
  stalled: boolean;
};

/**
 * Filtert de geaccepteerde reacties tot die welke nog een samenwerkingsvoorstel missen, en verrijkt
 * elke overgebleven reactie met de acceptatie-leeftijd + het `stalled`-signaal. De invoervolgorde
 * blijft behouden (de enumerator sorteert oudst-eerst zodat de langst-wachtende kandidaat bovenaan
 * komt). `now` is injecteerbaar voor deterministische tests.
 */
export function pendingCollaborationProposals(
  rows: AcceptedProposalRow[],
  now: Date = new Date(),
): AcceptedProposal[] {
  return rows
    .filter((r) => !r.hasCollaboration)
    .map(({ applicationId, freelancerName, jobTitle, acceptedAt }) => {
      // Klem negatief: een (afwijkende) acceptedAt in de toekomst mag nooit een negatieve leeftijd geven.
      const agingDays = Math.max(0, daysSince(acceptedAt, now));
      return {
        applicationId,
        freelancerName,
        jobTitle,
        agingDays,
        stalled: agingDays >= PROPOSAL_STALL_DAYS,
      };
    });
}
