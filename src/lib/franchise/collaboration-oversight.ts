// Samenwerkings-toezicht voor de bemiddelaar (franchiser) op `/franchise/samenwerkingen`. Pure,
// deterministische aggregatie over de reeds tenant-gescopet opgehaalde samenwerkingen — geen I/O, los
// getest. Beantwoordt de kernvraag van elke bemiddeling: "welke lopende plaatsingen lopen binnenkort
// af of zijn al voorbij hun einddatum, en verdienen nu een vervolggesprek?" Dat vervolgsignaal stond
// tot nu enkel op /acties + de dashboard-rail (`franchiseCollaborationRenewalTask`), nooit op de lijst
// zelf — exact het "signaal op één oppervlak"-gat dat de andere franchise-cockpits (leads,
// opdrachtgevers, zzpers) al met een aandachtsstrip dichtten. Hergebruikt de bewezen pure
// `summarizeCollaborationRenewal` zodat de strip niet kan driften met de next-action/badge (CLAUDE.md
// regel 1: de server bepaalt de waarheid, deze helper levert enkel de afgeleide presentatie).

import { summarizeCollaborationRenewal } from "@/lib/collaboration-renewal";
import { summarizeProposalAge, PROPOSAL_STALE_DAYS } from "@/lib/collaboration-proposal-age";

/** Minimale invoer per samenwerking — volledig afleidbaar uit de al opgehaalde rijen. */
export interface FranchiseCollabInput {
  /** CollaborationStatus. ACTIVE telt voor het vervolgsignaal, PROPOSED voor het voorstel-stilstaan. */
  status: string;
  /** ContractStatus — SIGNED = getekend → een PROPOSED-rij telt niet als stilstaand voorstel. */
  contractStatus: string;
  /** Moment van voorstellen (`Collaboration.createdAt`) — ankert het voorstel-ouderdomssignaal. */
  createdAt: Date;
  /** Einddatum; null = open einde → geen aflooop-signaal. */
  endDate: Date | null;
  /** Bevroren door een dispuut → geen vervolg-/voorstel-nudge tot dat is opgelost. */
  disputedAt: Date | null;
}

export interface FranchiseCollabOversight {
  total: number;
  /** Aantal ACTIVE-samenwerkingen (endingSoon + overdue zijn hiervan deelverzamelingen). */
  active: number;
  /** Aantal PROPOSED-samenwerkingen (wachten op akkoord opdrachtgever). */
  proposed: number;
  /** PROPOSED-inzet die al langer dan de drempel op ondertekening wacht (vraagt aandacht). */
  stalledProposals: number;
  /** ACTIVE-inzet binnen het vervolgvenster vóór de einddatum. */
  endingSoon: number;
  /** ACTIVE-inzet voorbij de einddatum, nog binnen de grace (vraagt aandacht). */
  overdue: number;
  /**
   * Lopende inzet (PROPOSED of ACTIVE) die door een open dispuut bevroren is — het cascade-werkproces
   * (uren → goedkeuring → factuur) staat stil tot het dispuut is opgelost. `openDispute` staat een
   * dispuut op zowel een PROPOSED als een ACTIVE samenwerking toe; `resolveDispute` zet `disputedAt`
   * weer op `null`, dus `disputedAt !== null` = een openstaand dispuut. Geen deelverzameling van
   * `active`/`proposed`-tellers hierboven maar een eigen, urgentere aandachtsklasse.
   */
  disputed: number;
}

/**
 * Partitioneert de samenwerkingen. `endingSoon`/`overdue` gebruiken exact dezelfde
 * `summarizeCollaborationRenewal`-fase als de bemiddelaar-next-action → geen drift tussen de strip en
 * /acties. `now` wordt geïnjecteerd zodat de functie puur en testbaar blijft.
 */
export function summarizeFranchiseCollaborations(
  rows: readonly FranchiseCollabInput[],
  now: Date,
): FranchiseCollabOversight {
  const summary: FranchiseCollabOversight = {
    total: rows.length,
    active: 0,
    proposed: 0,
    stalledProposals: 0,
    endingSoon: 0,
    overdue: 0,
    disputed: 0,
  };
  for (const row of rows) {
    // Bevroren door een open dispuut heeft voorrang op elk vervolg-/voorstelsignaal (het werkproces
    // staat stil). Beperk tot de lopende statussen — een afgeronde/geannuleerde inzet is geen actie.
    if (row.disputedAt !== null && (row.status === "ACTIVE" || row.status === "PROPOSED")) {
      summary.disputed += 1;
    }
    if (row.status === "PROPOSED") {
      summary.proposed += 1;
      // Voorstel-ouderdom uit dezelfde pure bron als de samenwerkingenlijst → geen drift.
      const age = summarizeProposalAge({
        status: row.status,
        contractStatus: row.contractStatus,
        createdAt: row.createdAt,
        disputed: row.disputedAt !== null,
        now,
      });
      if (age.attention) summary.stalledProposals += 1;
    }
    if (row.status !== "ACTIVE") continue;
    summary.active += 1;
    const phase = summarizeCollaborationRenewal({
      status: row.status,
      endDate: row.endDate,
      disputed: row.disputedAt !== null,
      now,
    }).phase;
    if (phase === "ending_soon") summary.endingSoon += 1;
    else if (phase === "overdue") summary.overdue += 1;
  }
  return summary;
}

/** Totaal aantal ACTIVE-inzetten dat nu aandacht vraagt (aflopend of voorbij de einddatum). */
export function franchiseCollabAttention(summary: FranchiseCollabOversight): number {
  return summary.endingSoon + summary.overdue;
}

/**
 * Eén verklarende regel boven de tegels ("wat vraagt nu mijn aandacht?"). `null` bij een lege lijst of
 * wanneer niets aandacht vraagt — dan is de strip zelf al rustig genoeg.
 */
export function franchiseCollabHeadline(summary: FranchiseCollabOversight): string | null {
  if (summary.total === 0) return null;

  const sentences: string[] = [];

  // Dispuut eerst: een bevroren plaatsing legt het werkproces (en daarmee de facturatie) stil — dat is
  // urgenter dan een aflopende of stilstaande inzet.
  if (summary.disputed > 0) {
    const n = summary.disputed;
    sentences.push(
      `${n} ${n === 1 ? "plaatsing is" : "plaatsingen zijn"} bevroren door een open dispuut — het werkproces staat stil tot dit is opgelost.`,
    );
  }

  // Vervolgsignaal (ACTIVE-inzet die afloopt of voorbij de einddatum is).
  if (franchiseCollabAttention(summary) > 0) {
    const parts: string[] = [];
    if (summary.overdue > 0) {
      parts.push(
        `${summary.overdue} ${summary.overdue === 1 ? "inzet is" : "inzetten zijn"} voorbij de einddatum`,
      );
    }
    if (summary.endingSoon > 0) {
      parts.push(
        `${summary.endingSoon} ${summary.endingSoon === 1 ? "loopt" : "lopen"} binnenkort af`,
      );
    }
    sentences.push(
      `${parts.join(" en ")} — plan tijdig een vervolg zodat je opdrachtgever geen bezettingsgat krijgt.`,
    );
  }

  // Voorstel-stilstaan (PROPOSED-inzet die te lang op ondertekening wacht).
  if (summary.stalledProposals > 0) {
    const n = summary.stalledProposals;
    sentences.push(
      `${n} ${n === 1 ? "voorstel wacht" : "voorstellen wachten"} al langer dan ${PROPOSAL_STALE_DAYS} dagen op ondertekening — stuur een herinnering of heropen de zoektocht.`,
    );
  }

  return sentences.length > 0 ? sentences.join(" ") : null;
}

/**
 * Compacte per-rij-chip voor een lopende inzet die door een open dispuut bevroren is. `null` als de rij
 * geen open dispuut heeft of niet meer loopt (afgerond/geannuleerd) — dan is er geen actie. Presentatie
 * uit dezelfde bron als de teller (`summarizeFranchiseCollaborations`) → geen drift tussen strip en lijst.
 */
export function collaborationFrozenRowBadge(
  disputedAt: Date | null,
  status: string,
): { label: string; tone: "danger" } | null {
  if (disputedAt !== null && (status === "ACTIVE" || status === "PROPOSED")) {
    return { label: "Bevroren · dispuut", tone: "danger" };
  }
  return null;
}

/**
 * Compacte per-rij-chip voor een ACTIVE-inzet in het vervolgvenster. Verhuisd naar de canonieke
 * `collaboration-renewal`-module (naast `renewalHeadline`), zodat zowel de bemiddelaar-lijst als de
 * deelnemer-lijst (`/samenwerkingen`) dezelfde chip uit één bron tekenen — geen drift. Hier
 * her-geëxporteerd zodat de bestaande importpaden ongewijzigd blijven.
 */
export { renewalRowBadge } from "@/lib/collaboration-renewal";
