// Toegangsvlag voor het interne ontwerp-lab (/ontwerp en /ontwerp-lab). Dat lab is een
// concept-galerij met uitsluitend fictieve mock-content: nuttig gereedschap voor het team, maar
// geen onderdeel van het product dat klanten afnemen. Het hoort dus niet standaard in een
// productie-omgeving bereikbaar te zijn.
//
// Twee lagen sluiten het af:
//   1. rol: `roleForPath` in src/lib/route-guards.ts maakt beide paden ADMIN-only (middleware),
//      de pagina's herhalen die check als defense-in-depth;
//   2. omgeving: in productie is het lab dicht (404) tenzij DESIGN_LAB_ENABLED expliciet aanstaat.
//
// Pure functie — geen Next-runtime nodig — zodat de vlagbepaling los te testen is.

const TRUTHY = new Set(["true", "1", "yes", "on"]);

/**
 * Is het ontwerp-lab in deze omgeving bereikbaar?
 *
 * Buiten productie (lokale ontwikkeling, CI-unit-tests) altijd: daar is het lab het gereedschap
 * waarvoor het gemaakt is. In productie alleen na een expliciete opt-in via DESIGN_LAB_ENABLED,
 * zodat een deploy nooit per ongeluk een galerij met mock-schermen naast het echte product zet.
 */
export function isDesignLabEnabled(
  flag: string | undefined,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  if (nodeEnv !== "production") return true;
  return TRUTHY.has((flag ?? "").trim().toLowerCase());
}
