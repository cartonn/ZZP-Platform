// Pure businessregel: een geaccepteerde reactie (ACCEPTED) is nog niet "af" zolang de opdrachtgever
// er geen samenwerkingsvoorstel op heeft gestuurd. `proposeCollaboration` (ACCEPTED → een PROPOSED
// Collaboration met `applicationId` @unique) is de afrondende stap; tot dan bestaat er géén
// collaboration en wacht de ZZP'er ("Geaccepteerd! Wacht op een samenwerkingsvoorstel"). Deze helper
// is de enige bron van waarheid voor "welke geaccepteerde reacties wachten nog op een voorstel?" —
// los testbaar, zonder DB. De enumerator (pending-tasks.ts) levert de ACCEPTED-reacties met
// `hasCollaboration` aan; hier valt elke reactie af die al een collaboration heeft.

export type AcceptedProposalRow = {
  applicationId: string;
  freelancerName: string;
  jobTitle: string;
  /** Is er al een collaboration op deze reactie? Zo ja → het voorstel is al verstuurd. */
  hasCollaboration: boolean;
};

export type AcceptedProposal = {
  applicationId: string;
  freelancerName: string;
  jobTitle: string;
};

/**
 * Filtert de geaccepteerde reacties tot die welke nog een samenwerkingsvoorstel missen. De
 * invoervolgorde blijft behouden (de enumerator sorteert oudst-eerst zodat de langst-wachtende
 * kandidaat bovenaan komt).
 */
export function pendingCollaborationProposals(rows: AcceptedProposalRow[]): AcceptedProposal[] {
  return rows
    .filter((r) => !r.hasCollaboration)
    .map(({ applicationId, freelancerName, jobTitle }) => ({
      applicationId,
      freelancerName,
      jobTitle,
    }));
}
