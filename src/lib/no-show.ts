// No-show-regels (productbesluit eigenaar 12-6-2026, concurrentie-backlog punt 6 deel 2):
// de melder (opdrachtgever/franchiser) registreert een no-show met reden; de admin beoordeelt
// gegrond/ongegrond. Alleen ONGEGRONDE no-shows tellen mee. Bij NO_SHOW_LIMIT verschijnt een
// uitschrijf-taak in de admin-wachtrij — uitschrijving is altijd een handmatige adminbeslissing
// (User.status → SUSPENDED), nooit automatisch.

export const NO_SHOW_LIMIT = 3;

export interface NoShowStanding {
  /** Aantal ongegronde no-shows. */
  unjustified: number;
  /** Hoeveel ongegronde no-shows er nog bij kunnen vóór de grens; 0 = grens bereikt. */
  remaining: number;
  /** Grens bereikt → uitschrijf-taak voor de admin. */
  atLimit: boolean;
}

export function noShowStanding(
  unjustifiedCount: number,
  limit: number = NO_SHOW_LIMIT,
): NoShowStanding {
  const unjustified = Math.max(0, unjustifiedCount);
  return {
    unjustified,
    remaining: Math.max(0, limit - unjustified),
    atLimit: unjustified >= limit,
  };
}
