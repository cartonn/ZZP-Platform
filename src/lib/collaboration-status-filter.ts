import type { Prisma } from "@prisma/client";
import { COLLABORATION_STATUSES, type CollaborationStatus } from "@/lib/enums";

/**
 * Statusfilter voor de samenwerkingenlijst van de ZZP'er/opdrachtgever (`/samenwerkingen`). Een
 * samenwerking heeft één `status` (PROPOSED/ACTIVE/COMPLETED/CANCELLED), dus het filter is een dunne,
 * cascade-vrije variant van het facturen-/opdrachtenfilter: elke samenwerking valt op zijn `status` in
 * precies één groep.
 *
 * Anders dan `/opdrachten` (dat de volledige lijst laadt en in-memory filtert) is deze lijst
 * server-side cursor-gepagineerd. Het filter gaat daarom in de Prisma-`where` ({@link collaborationStatusWhere})
 * en de pill-tellingen komen uit één goedkope `groupBy` over de eigen samenwerkingen
 * ({@link summarizeCollaborationStatusGroups}) — spiegel van het /documenten-typefilter. Pure functies
 * → unit-testbaar zonder database.
 */

export const COLLAB_STATUS_FILTER_GROUPS = ["all", ...COLLABORATION_STATUSES] as const;
export type CollabStatusFilterGroup = (typeof COLLAB_STATUS_FILTER_GROUPS)[number];

/** Labels gelijk aan de status-badge op de kaart zodat pill en badge dezelfde taal spreken. */
export const COLLAB_STATUS_FILTER_LABEL: Record<CollabStatusFilterGroup, string> = {
  all: "Alle",
  PROPOSED: "Voorgesteld",
  ACTIVE: "Actief",
  COMPLETED: "Afgerond",
  CANCELLED: "Geannuleerd",
};

/** Volgorde van de filter-pills (levensloop: voorgesteld → actief → afgerond → geannuleerd). */
export const COLLAB_STATUS_FILTER_ORDER: CollabStatusFilterGroup[] = [
  "all",
  "PROPOSED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];

/** Onbekende/lege/malicieuze waarde → "all". Eén bron voor het inlezen van de `status`-searchParam. */
export function parseCollaborationStatusFilter(value: string | undefined): CollabStatusFilterGroup {
  return (COLLAB_STATUS_FILTER_GROUPS as readonly string[]).includes(value ?? "")
    ? (value as CollabStatusFilterGroup)
    : "all";
}

/**
 * Prisma-`where`-fragment voor de gekozen groep; "all" legt geen constraint op (lege `where`). Wordt
 * met de eigenaars-`where` samengevoegd in de pagina-query.
 */
export function collaborationStatusWhere(
  group: CollabStatusFilterGroup,
): Prisma.CollaborationWhereInput {
  return group === "all" ? {} : { status: group };
}

/** Rauwe `groupBy({ by: ["status"], _count: { _all } })`-vorm; los gehouden zodat de helper puur blijft. */
export type CollaborationStatusGroupCount = {
  status: string;
  _count: { _all: number };
};

/**
 * Telling per groep uit een `groupBy`-resultaat over de volledige (ongefilterde) eigen lijst, voor de
 * pill-labels. `all` = som over alle bekende statussen. Onbekende legacy-statussen tellen niet mee in
 * een pill maar wél in `all`, zodat het totaal klopt.
 */
export function summarizeCollaborationStatusGroups(
  groups: CollaborationStatusGroupCount[],
): Record<CollabStatusFilterGroup, number> {
  const counts: Record<CollabStatusFilterGroup, number> = {
    all: 0,
    PROPOSED: 0,
    ACTIVE: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  for (const g of groups) {
    counts.all += g._count._all;
    if ((COLLABORATION_STATUSES as readonly string[]).includes(g.status)) {
      counts[g.status as CollaborationStatus] += g._count._all;
    }
  }
  return counts;
}
