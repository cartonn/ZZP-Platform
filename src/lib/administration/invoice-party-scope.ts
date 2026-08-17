import { type Prisma } from "@prisma/client";

// Wélke facturen bij een partij (ZZP'er als uitschrijver, opdrachtgever als tegenpartij) horen —
// voor alle BI-aggregaties (omzet, uitgaven, trend, uitsplitsing, dossier). Er bestaan twee
// factuurpaden die deze scoping allebei moet dekken:
//
//   cascade → de event-driven werkproces-flow zet `issuerUserId` (ZZP'er) + `counterpartyUserId`
//             (opdrachtgever) + `issuerKey` (userId of "PLATFORM").
//   legacy  → de handmatige factuur via /facturen/nieuw (`createInvoice`) zet GEEN van die velden;
//             de partij is alleen af te leiden uit de gekoppelde samenwerking
//             (`collaboration.freelancer.userId` / `collaboration.company.userId`). `issuerKey` is
//             daar NULL.
//
// Alléén op `issuerUserId`/`counterpartyUserId` scopen (zoals de BI-queries eerder deden) laat dus
// ELKE ná de cutover gemaakte legacy-factuur uit de omzet/uitgaven vallen — betaalde, echte cijfers
// die op het dashboard onzichtbaar bleven. De platform-fee-factuur (`issuerKey: "PLATFORM"`,
// `issuerUserId: null`) hangt óók aan een tenant-samenwerking, dus de legacy-tak filtert die er
// expliciet uit via `issuerKey: null` (alleen een échte legacy-factuur heeft geen issuerKey).
//
// Spiegelt `account-export.ts` (dat álle facturen-die-een-partij-raken exporteert), maar enger:
// hier telt uitsluitend de factuur die de partij zélf uitschreef (ZZP'er) of ontving (opdrachtgever),
// zodat de platform-fee nooit als eigen omzet/uitgave meetelt.

/**
 * Facturen waarvan de ZZP'er de uitschrijver is (eigen omzet). Cascade via `issuerUserId`; legacy via
 * de samenwerking (`collaboration.freelancer.userId`) met `issuerKey: null` zodat een platform-fee
 * nooit als eigen omzet meetelt.
 */
export function freelancerIssuedInvoiceWhere(userId: string): Prisma.InvoiceWhereInput {
  return {
    OR: [
      { issuerUserId: userId },
      { issuerKey: null, collaboration: { is: { freelancer: { is: { userId } } } } },
    ],
  };
}

/**
 * Facturen waarvan de opdrachtgever de tegenpartij is (eigen uitgaven). Cascade via
 * `counterpartyUserId`; legacy via de samenwerking (`collaboration.company.userId`) met
 * `issuerKey: null` zodat een platform-fee nooit als eigen uitgave meetelt.
 */
export function clientReceivedInvoiceWhere(userId: string): Prisma.InvoiceWhereInput {
  return {
    OR: [
      { counterpartyUserId: userId },
      { issuerKey: null, collaboration: { is: { company: { is: { userId } } } } },
    ],
  };
}

/**
 * Pure spiegel van `freelancerIssuedInvoiceWhere` (unit-testbaar zonder database): telt deze factuur
 * als door `userId` uitgeschreven? Cascade-match op `issuerUserId`; legacy-match op de samenwerkings-
 * freelancer met `issuerKey === null` (sluit de platform-fee uit).
 */
export function isFreelancerIssuedInvoice(
  inv: {
    issuerUserId: string | null;
    issuerKey: string | null;
    collaborationFreelancerUserId: string | null;
  },
  userId: string,
): boolean {
  if (inv.issuerUserId === userId) return true;
  return inv.issuerKey === null && inv.collaborationFreelancerUserId === userId;
}

/**
 * Pure spiegel van `clientReceivedInvoiceWhere` (unit-testbaar zonder database): telt deze factuur als
 * door `userId` ontvangen? Cascade-match op `counterpartyUserId`; legacy-match op de samenwerkings-
 * opdrachtgever met `issuerKey === null` (sluit de platform-fee uit).
 */
export function isClientReceivedInvoice(
  inv: {
    counterpartyUserId: string | null;
    issuerKey: string | null;
    collaborationCompanyUserId: string | null;
  },
  userId: string,
): boolean {
  if (inv.counterpartyUserId === userId) return true;
  return inv.issuerKey === null && inv.collaborationCompanyUserId === userId;
}
