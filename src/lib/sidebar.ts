// Zijbalk-voorkeur (uitgeklapt/ingeklapt). Standaard = uitgeklapt: labels + sectiekoppen zijn
// meteen zichtbaar (geen naamloze icoon-rail). De keuze wordt onthouden in een cookie zodat de
// server hem al bij de eerste render kent — geen flits van een verkeerde breedte.

/** Cookienaam voor de zijbalk-voorkeur. */
export const SIDEBAR_COOKIE = "sidebar";

/** Voorkeurwaarden: uitgeklapt (labels zichtbaar) of ingeklapt (icoon-rail). */
export type SidebarState = "expanded" | "collapsed";

/** Standaard = uitgeklapt. Alleen een expliciete "collapsed"-cookie klapt de rail in. */
export function parseSidebarState(cookieValue: string | undefined): SidebarState {
  return cookieValue === "collapsed" ? "collapsed" : "expanded";
}
