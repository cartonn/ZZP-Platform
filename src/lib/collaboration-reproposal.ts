// Businessregel: wanneer mag een opdrachtgever een geaccepteerde reactie *opnieuw* een
// samenwerkingsvoorstel sturen?
//
// Flow-gat (persona-sweep): CLIENT accepteert een reactie (ACCEPTED) → stuurt een voorstel
// (`proposeCollaboration` → een PROPOSED-Collaboration met `applicationId` @unique) → annuleert dat
// voorstel vóór ondertekening (geldige PROPOSED→CANCELLED-overgang). De reactie blijft ACCEPTED met
// een (geannuleerde) collaboration eraan; `proposeCollaboration` blokkeert een nieuw voorstel hard
// (`applicationId` @unique) en de next-action-motor onderdrukt de propose-taak (er ís immers een
// collaboration) → de geaccepteerde kandidaat hangt in limbo, onzichtbaar voor iedereen.
//
// Deze module is de ENIGE bron van waarheid voor "is de bestaande collaboration een herbruikbaar,
// geannuleerd voorstel?" — gedeeld door de mutatie (compound-guarded reset op dezelfde @unique-rij),
// de next-action-enumerator + badge-teller (resurface de propose-taak) en de kandidaten-UI (toon het
// voorstelformulier opnieuw i.p.v. een dode "bekijk samenwerking"-knop). Één definitie → geen drift.
//
// Herbruikbaar = geannuleerd terwijl het nog een PROPOSED-voorstel was (nooit ondertekend → nooit
// ACTIVE) én zonder enig financieel/afgerond artefact. `signContract` is het enige pad
// PROPOSED→ACTIVE en zet daarbij `contractStatus: "SIGNED"`; een nooit-getekend voorstel staat dus op
// DRAFT/SENT. De handtekening-timestamps + `completedAt` + de afwezigheid van facturen/prestaties zijn
// belt-and-suspenders: een nooit-actieve inzet kan die per definitie niet dragen.

import type { Prisma } from "@prisma/client";

/**
 * Prisma where-fragment dat een CANCELLED samenwerking selecteert die opnieuw voorgesteld mag worden.
 * Gebruikt in de compound-guarded `updateMany`-reset (TOCTOU-dicht: een parallelle ondertekening/
 * factuur laat de guard 0 rijen raken) én — als leesfilter — nergens anders dan via de pure spiegel
 * hieronder, zodat de mutatie en de UI/enumerator niet uit elkaar lopen.
 */
export const REPROPOSABLE_CANCELLED_WHERE = {
  status: "CANCELLED",
  contractStatus: { not: "SIGNED" },
  agreementClientSignedAt: null,
  agreementFreelancerSignedAt: null,
  completedAt: null,
  invoices: { none: {} },
  performances: { none: {} },
} satisfies Prisma.CollaborationWhereInput;

/** De velden die `isReproposableCancelledProposal` inspecteert (geladen rij of testfixture). */
export type ProposalCollaborationState = {
  status: string;
  contractStatus: string;
  agreementClientSignedAt: Date | null;
  agreementFreelancerSignedAt: Date | null;
  completedAt: Date | null;
  /** Aantal facturen op de collaboration (`_count.invoices`). */
  invoicesCount: number;
  /** Aantal prestaties op de collaboration (`_count.performances`). */
  performancesCount: number;
};

/**
 * Pure spiegel van `REPROPOSABLE_CANCELLED_WHERE` op een geladen rij. Waar de where het in de DB
 * afdwingt (mutatie), beslist deze functie het in leescode (enumerator/badge/UI). Beide moeten exact
 * dezelfde voorwaarden dekken — de gedeelde constante + deze functie staan daarom naast elkaar.
 */
export function isReproposableCancelledProposal(c: ProposalCollaborationState): boolean {
  return (
    c.status === "CANCELLED" &&
    c.contractStatus !== "SIGNED" &&
    c.agreementClientSignedAt === null &&
    c.agreementFreelancerSignedAt === null &&
    c.completedAt === null &&
    c.invoicesCount === 0 &&
    c.performancesCount === 0
  );
}

/**
 * Blokkeert een bestaande collaboration nog een (nieuw) samenwerkingsvoorstel op dezelfde reactie?
 *
 * - `null` (geen collaboration) → `false`: een eerste voorstel mag.
 * - een levende/afgeronde samenwerking (PROPOSED-getekend/ACTIVE/COMPLETED, of CANCELLED mét
 *   artefacten) → `true`: geen nieuw voorstel.
 * - een herbruikbaar geannuleerd voorstel → `false`: een nieuw voorstel mag (de @unique-rij wordt
 *   hergebruikt).
 *
 * Dit is exact het `hasCollaboration`-predicaat dat de next-action-enumerator, de badge-teller en de
 * kandidaten-triage delen, zodat een herbruikbare reactie op álle oppervlakken als "vraagt nog actie"
 * telt (en het propose-formulier niet in de ingeklapte "afgehandeld"-sectie verdwijnt).
 */
export function collaborationBlocksProposal(c: ProposalCollaborationState | null): boolean {
  if (c === null) return false;
  return !isReproposableCancelledProposal(c);
}
