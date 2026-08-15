// Samenwerkings-toezicht voor de bemiddelaar (franchiser) op `/franchise/samenwerkingen`. Pure,
// deterministische aggregatie over de reeds tenant-gescopet opgehaalde samenwerkingen — geen I/O, los
// getest. Beantwoordt de kernvraag van elke bemiddeling: "welke lopende plaatsingen lopen binnenkort
// af of zijn al voorbij hun einddatum, en verdienen nu een vervolggesprek?" Dat vervolgsignaal stond
// tot nu enkel op /acties + de dashboard-rail (`franchiseCollaborationRenewalTask`), nooit op de lijst
// zelf — exact het "signaal op één oppervlak"-gat dat de andere franchise-cockpits (leads,
// opdrachtgevers, zzpers) al met een aandachtsstrip dichtten. Hergebruikt de bewezen pure
// `summarizeCollaborationRenewal` zodat de strip niet kan driften met de next-action/badge (CLAUDE.md
// regel 1: de server bepaalt de waarheid, deze helper levert enkel de afgeleide presentatie).

import {
  summarizeCollaborationRenewal,
  type CollaborationRenewalPhase,
} from "@/lib/collaboration-renewal";

/** Minimale invoer per samenwerking — volledig afleidbaar uit de al opgehaalde rijen. */
export interface FranchiseCollabInput {
  /** CollaborationStatus. Alleen ACTIVE telt mee voor het vervolgsignaal. */
  status: string;
  /** Einddatum; null = open einde → geen aflooop-signaal. */
  endDate: Date | null;
  /** Bevroren door een dispuut → geen vervolg-nudge tot dat is opgelost. */
  disputedAt: Date | null;
}

export interface FranchiseCollabOversight {
  total: number;
  /** Aantal ACTIVE-samenwerkingen (endingSoon + overdue zijn hiervan deelverzamelingen). */
  active: number;
  /** Aantal PROPOSED-samenwerkingen (wachten op akkoord opdrachtgever). */
  proposed: number;
  /** ACTIVE-inzet binnen het vervolgvenster vóór de einddatum. */
  endingSoon: number;
  /** ACTIVE-inzet voorbij de einddatum, nog binnen de grace (vraagt aandacht). */
  overdue: number;
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
    endingSoon: 0,
    overdue: 0,
  };
  for (const row of rows) {
    if (row.status === "PROPOSED") summary.proposed += 1;
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
  const attention = franchiseCollabAttention(summary);
  if (attention === 0) return null;
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
  return `${parts.join(" en ")} — plan tijdig een vervolg zodat je opdrachtgever geen bezettingsgat krijgt.`;
}

/**
 * Compacte per-rij-chip voor een ACTIVE-inzet in het vervolgvenster. `null` als de rij geen aandacht
 * vraagt (on_track/lapsed/geen einddatum/niet-ACTIVE) — dan blijft de rij rustig. Alleen presentatie;
 * de fase komt uit dezelfde pure bron als de strip en de next-action.
 */
export function renewalRowBadge(
  phase: CollaborationRenewalPhase,
  daysRemaining: number | null,
): { label: string; tone: "warning" | "danger" } | null {
  if (phase === "overdue") {
    const late = daysRemaining !== null ? -daysRemaining : 0;
    if (late <= 0) return { label: "Voorbij einddatum", tone: "danger" };
    return { label: `${late} ${late === 1 ? "dag" : "dagen"} over tijd`, tone: "danger" };
  }
  if (phase === "ending_soon") {
    if (daysRemaining === 0) return { label: "Loopt vandaag af", tone: "warning" };
    if (daysRemaining === 1) return { label: "Loopt morgen af", tone: "warning" };
    return { label: `Loopt af over ${daysRemaining} dagen`, tone: "warning" };
  }
  return null;
}
