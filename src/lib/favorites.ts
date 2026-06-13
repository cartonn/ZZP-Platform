// Flexpool/favorieten — pure logica. Server-side is de waarheid; deze module bevat alleen
// validatie en ordening, geen data-access (die zit in de server-acties).

import { z } from "zod";
import { type Availability } from "@/lib/enums";

/** Maximale lengte van de (privé) notitie die een opdrachtgever bij een favoriet bewaart. */
export const FAVORITE_NOTE_MAX = 500;

/** Notitie bij een favoriet: getrimd, begrensd; lege invoer wordt elders naar `null` vertaald. */
export const favoriteNoteSchema = z.string().trim().max(FAVORITE_NOTE_MAX);

// Beschikbaren bovenaan: de poule dient om snel "wie kan er nu?" te beantwoorden. Daarna de
// recentst toegevoegde eerst, zodat verse keuzes zichtbaar blijven.
const AVAILABILITY_ORDER: Record<Availability, number> = {
  AVAILABLE: 0,
  LIMITED: 1,
  UNKNOWN: 2,
  UNAVAILABLE: 3,
};

export interface SortableFavorite {
  availability: Availability;
  createdAt: Date;
}

/**
 * Ordent de poule: eerst op beschikbaarheid (beschikbaar → beperkt → onbekend → niet), daarna
 * de recentst toegevoegde bovenaan. Puur en stabiel; muteert de invoer niet.
 */
export function sortFavorites<T extends SortableFavorite>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const byAvailability = AVAILABILITY_ORDER[a.availability] - AVAILABILITY_ORDER[b.availability];
    if (byAvailability !== 0) return byAvailability;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}
