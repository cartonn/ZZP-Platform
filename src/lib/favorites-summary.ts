// Flexpool-samenvatting — pure logica. Beantwoordt in één oogopslag "wie kan er nu?"
// over de hele poule van een opdrachtgever, zodat een groeiende flexpool niet meer
// rij-voor-rij gescand hoeft te worden. Server-side waarheid; geen data-access, geen I/O.

import { type Availability } from "@/lib/enums";

export interface FlexpoolSummary {
  /** Aantal ZZP'ers dat zichzelf als volledig beschikbaar heeft gezet. */
  available: number;
  /** Aantal met beperkte beschikbaarheid. */
  limited: number;
  /** Aantal expliciet niet-beschikbaar. */
  unavailable: number;
  /** Aantal zonder opgegeven beschikbaarheid. */
  unknown: number;
  /** Totaal aantal ZZP'ers in de poule. */
  total: number;
}

export interface SummarizableFavorite {
  availability: Availability;
}

/**
 * Telt de poule per beschikbaarheidsbucket. Puur en totaal-behoudend: de vier buckets
 * sommeren altijd tot `total` (elke `Availability` valt in precies één bucket).
 */
export function summarizeFlexpool(items: readonly SummarizableFavorite[]): FlexpoolSummary {
  const summary: FlexpoolSummary = {
    available: 0,
    limited: 0,
    unavailable: 0,
    unknown: 0,
    total: items.length,
  };
  for (const item of items) {
    switch (item.availability) {
      case "AVAILABLE":
        summary.available += 1;
        break;
      case "LIMITED":
        summary.limited += 1;
        break;
      case "UNAVAILABLE":
        summary.unavailable += 1;
        break;
      default:
        summary.unknown += 1;
        break;
    }
  }
  return summary;
}

/** Toon de strip alleen bij een niet-lege poule. */
export function hasFlexpoolSummary(summary: FlexpoolSummary): boolean {
  return summary.total > 0;
}
