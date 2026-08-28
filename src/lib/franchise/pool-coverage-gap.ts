// Pool-dekkingsgat voor de bemiddelaar (franchiser): aggregeert over álle open diensten van de tenant
// welke certificaten en vaardigheden het meest gevraagd worden en tegelijk schaars of afwezig zijn in
// de eigen roster-pool. Antwoordt op de wervingsvraag die geen enkel bestaand scherm beantwoordt:
// "waar moet ik op werven of welke roster-vakmens moet ik naar een certificering/vernieuwing duwen?" —
// bv. "3 open diensten vragen BIG-registratie; niemand in je pool heeft die geldig".
//
// Puur en deterministisch; geen server-only imports (geen db/auth). De aanroeper levert de reeds
// tenant-gescopet geladen vraag- en aanbodrijen aan (`/franchise/zzpers` heeft beide al in geheugen —
// geen extra query). Dit is een afgeleide presentatie; de server blijft de waarheid (CLAUDE.md regel 1).
//
// --- Bron ---
// VRAAG (`demand`): één rij per (open dienst, gevraagd item), uitsluitend voor VERPLICHTE eisen
// (`required: true`) — een "pré" mag geen dekkingsgat opwerpen. Een item is een certificaattype of een
// vaardigheid (skillId). De caller ontdubbelt niet; wij tellen distinct diensten per item.
// AANBOD (`supply`): één rij per (roster-vakmens, geleverd item). Voor een certificaat telt alleen een
// VERIFIED én niet-verlopen certificaat als "geleverd" (een verlopen certificaat dekt de eis niet); voor
// een vaardigheid telt elke gekoppelde `FreelancerSkill`. Wij tellen distinct vakmensen per item.
//
// Een item is een GAT wanneer het aanbod kleiner is dan de vraag (`qualifiedInPool < openDienstCount`):
// er zijn minder gekwalificeerde vakmensen dan gelijktijdig open diensten die het item vereisen. Volle
// dekking (aanbod ≥ vraag) is geen gat en verschijnt niet — rust boven ruis (DESIGN.md).

export type CoverageKind = "credential" | "skill";

/** Eén vraagrij: een open dienst vereist (verplicht) dit item. */
export interface CoverageDemandRow {
  kind: CoverageKind;
  /** Sleutel binnen de soort: het certificaattype of het skillId. */
  key: string;
  /** Weergavenaam (certificaat-label of vaardigheidsnaam). */
  label: string;
  /** Id van de open dienst die dit item vereist — voor distinct-telling. */
  dienstId: string;
}

/** Eén aanbodrij: een roster-vakmens levert dit item (geldig certificaat of gekoppelde vaardigheid). */
export interface CoverageSupplyRow {
  kind: CoverageKind;
  /** Sleutel binnen de soort: het certificaattype of het skillId. */
  key: string;
  /** Id van de roster-vakmens die dit item levert — voor distinct-telling. */
  freelancerId: string;
}

/** `none` = niemand in de pool levert het (hard gat, werven); `scarce` = wel, maar te weinig. */
export type CoverageSeverity = "none" | "scarce";

export interface CoverageGap {
  kind: CoverageKind;
  key: string;
  label: string;
  /** Aantal distinct open diensten dat dit item verplicht vereist. */
  openDienstCount: number;
  /** Aantal distinct roster-vakmensen dat dit item (geldig) levert. */
  qualifiedInPool: number;
  severity: CoverageSeverity;
}

export interface PoolCoverageGap {
  /** Alleen daadwerkelijke gaten (aanbod < vraag), gesorteerd op urgentie. */
  gaps: CoverageGap[];
  /** Aantal gaten waarvoor niemand in de pool kwalificeert (severity `none`). */
  criticalCount: number;
}

/**
 * Berekent het pool-dekkingsgat uit de vraag- (open diensten) en aanbodrijen (roster). Puur en
 * deterministisch; geschikt voor unit-tests zonder DB.
 *
 * Sorteervolgorde (deterministisch): eerst de harde gaten (severity `none`), dan meeste open diensten,
 * dan minste gekwalificeerde vakmensen, dan alfabetisch op label en tenslotte op sleutel (stabiel bij
 * gelijknamige items van verschillende soort).
 */
export function computePoolCoverageGap(
  demand: readonly CoverageDemandRow[],
  supply: readonly CoverageSupplyRow[],
): PoolCoverageGap {
  if (demand.length === 0) {
    return { gaps: [], criticalCount: 0 };
  }

  // Vraag: distinct diensten per (soort, sleutel); het label uit de eerste rij (identiek per item).
  const demandByItem = new Map<string, { row: CoverageDemandRow; diensten: Set<string> }>();
  for (const r of demand) {
    const id = `${r.kind}:${r.key}`;
    const entry = demandByItem.get(id);
    if (entry) {
      entry.diensten.add(r.dienstId);
    } else {
      demandByItem.set(id, { row: r, diensten: new Set([r.dienstId]) });
    }
  }

  // Aanbod: distinct vakmensen per (soort, sleutel).
  const supplyByItem = new Map<string, Set<string>>();
  for (const s of supply) {
    const id = `${s.kind}:${s.key}`;
    const set = supplyByItem.get(id);
    if (set) {
      set.add(s.freelancerId);
    } else {
      supplyByItem.set(id, new Set([s.freelancerId]));
    }
  }

  const gaps: CoverageGap[] = [];
  for (const [id, { row, diensten }] of demandByItem) {
    const openDienstCount = diensten.size;
    const qualifiedInPool = supplyByItem.get(id)?.size ?? 0;
    if (qualifiedInPool >= openDienstCount) {
      continue; // volle dekking → geen gat
    }
    gaps.push({
      kind: row.kind,
      key: row.key,
      label: row.label,
      openDienstCount,
      qualifiedInPool,
      severity: qualifiedInPool === 0 ? "none" : "scarce",
    });
  }

  gaps.sort((a, b) => {
    // Harde gaten (niemand kwalificeert) eerst.
    const aNone = a.severity === "none" ? 0 : 1;
    const bNone = b.severity === "none" ? 0 : 1;
    if (aNone !== bNone) return aNone - bNone;
    if (b.openDienstCount !== a.openDienstCount) return b.openDienstCount - a.openDienstCount;
    if (a.qualifiedInPool !== b.qualifiedInPool) return a.qualifiedInPool - b.qualifiedInPool;
    if (a.label !== b.label) return a.label < b.label ? -1 : 1;
    return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
  });

  const criticalCount = gaps.filter((g) => g.severity === "none").length;
  return { gaps, criticalCount };
}

/**
 * Eén verklarende kopregel boven de gatenlijst. `null` bij geen gaten — dan toont de strip niets.
 * Verlopen/afwezig (harde gaten) wegen zwaarder dan schaarste.
 */
export function poolCoverageGapHeadline(result: PoolCoverageGap): string | null {
  const gapCount = result.gaps.length;
  if (gapCount === 0) return null;
  if (result.criticalCount > 0) {
    return result.criticalCount === 1
      ? "1 gevraagd certificaat of vaardigheid heeft niemand in je pool — werf of laat een vakmens certificeren."
      : `${result.criticalCount} gevraagde certificaten of vaardigheden heeft niemand in je pool — werf of laat vakmensen certificeren.`;
  }
  return gapCount === 1
    ? "1 gevraagd item heeft te weinig gekwalificeerde vakmensen in je pool voor de open diensten."
    : `${gapCount} gevraagde items hebben te weinig gekwalificeerde vakmensen in je pool voor de open diensten.`;
}
