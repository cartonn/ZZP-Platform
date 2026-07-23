/**
 * Omzetconcentratie voor de bemiddelaar: hoe afhankelijk is de bemiddeling van
 * één opdrachtgever? Een hoge concentratie (één opdrachtgever draagt het leeuwendeel
 * van het doorgezette volume) is een reëel bedrijfsrisico — valt die klant weg, dan
 * valt een groot deel van de fee-omzet weg. Staffing-/marketplace-dashboards tonen
 * dit standaard als portefeuille-gezondheidssignaal.
 *
 * Pure afleiding uit de reeds-geladen per-opdrachtgever-omzetverdeling — geen extra
 * query, geen schemawijziging. Apart van de DB zodat het deterministisch te testen is.
 */

/** Grens waarboven de grootste-opdrachtgever-afhankelijkheid als danger telt (bps). */
export const CONCENTRATION_DANGER_BPS = 6000; // 60%
/** Grens waarboven de afhankelijkheid als warning telt (bps). */
export const CONCENTRATION_WARNING_BPS = 4000; // 40%
/** Aandeel-drempel waarvoor "kern"-opdrachtgevers geteld worden (bps). */
export const MAJORITY_BPS = 8000; // 80%

export interface RevenueConcentration {
  /** Totaal betaald doorgezet volume over alle opdrachtgevers met omzet (centen). */
  totalCents: number;
  /** Aantal opdrachtgevers met betaalde omzet. */
  activeClients: number;
  /** Naam van de grootste opdrachtgever. */
  topName: string;
  /** Aandeel van de grootste opdrachtgever in het totaal (basispunten, 0–10000). */
  topShareBps: number;
  /**
   * Kleinste aantal opdrachtgevers dat samen ≥ 80% van het volume vormt — een lage
   * waarde betekent hoge concentratie (weinig klanten dragen bijna alles).
   */
  clientsForMajority: number;
  /** Ernst van de afhankelijkheid, afgeleid van het top-aandeel. */
  tone: "danger" | "warning" | "default";
}

/** Ronde-half-up van a/b naar basispunten (0–10000), guard tegen deling door 0. */
function shareBps(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 10000);
}

/**
 * Vat de omzetconcentratie samen. Retourneert `null` wanneer er geen betekenisvol
 * signaal is: nul totale omzet, of minder dan twee betalende opdrachtgevers
 * (concentratie is pas zinvol bij ≥ 2 klanten — met één klant is het triviaal 100%).
 */
export function summarizeRevenueConcentration(
  companies: readonly { name: string; revenuePaidCents: number }[],
): RevenueConcentration | null {
  const paying = companies
    .filter((c) => c.revenuePaidCents > 0)
    .slice()
    .sort((a, b) => b.revenuePaidCents - a.revenuePaidCents);

  if (paying.length < 2) return null;

  const totalCents = paying.reduce((sum, c) => sum + c.revenuePaidCents, 0);
  if (totalCents <= 0) return null;

  const top = paying[0]!;
  const topShareBps = shareBps(top.revenuePaidCents, totalCents);

  const majorityFloor = (totalCents * MAJORITY_BPS) / 10000;
  let cumulative = 0;
  let clientsForMajority = 0;
  for (const c of paying) {
    cumulative += c.revenuePaidCents;
    clientsForMajority += 1;
    if (cumulative >= majorityFloor) break;
  }

  const tone: RevenueConcentration["tone"] =
    topShareBps >= CONCENTRATION_DANGER_BPS
      ? "danger"
      : topShareBps >= CONCENTRATION_WARNING_BPS
        ? "warning"
        : "default";

  return {
    totalCents,
    activeClients: paying.length,
    topName: top.name,
    topShareBps,
    clientsForMajority,
    tone,
  };
}
