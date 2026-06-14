/**
 * Motor voor "jouw tarief vs. de markt": mediaan + spreiding (p25/p75) van
 * uurtarieven, met positie van het eigen tarief t.o.v. de bandbreedte.
 *
 * Puur deterministisch — geen externe afhankelijkheden, geen neveneffecten.
 * Resultaten zijn server-side berekend; de client toont, beslist nooit.
 */

/** Welke peer-set is gebruikt voor de marktband. */
export type MarketRateScope = "industry" | "platform" | "none";

/**
 * Positie van het eigen tarief t.o.v. de marktbandbreedte (p25–p75).
 * "unknown" wanneer eigen tarief ontbreekt of de steekproef te klein is.
 */
export type MarketRatePosition = "below" | "within" | "above" | "unknown";

/** Volledig marktband-inzicht voor één ZZP'er. */
export interface MarketRateInsight {
  /** Welke peer-set is gebruikt. */
  scope: MarketRateScope;
  /** Aantal gebruikte peer-tarieven (exclusief eigen tarief). */
  sampleSize: number;
  /** Mediaan van de gekozen set, afgerond op heel getal (euro); null bij scope "none". */
  median: number | null;
  /** 25e percentiel van de gekozen set, afgerond op heel getal (euro); null bij scope "none". */
  p25: number | null;
  /** 75e percentiel van de gekozen set, afgerond op heel getal (euro); null bij scope "none". */
  p75: number | null;
  /** Positie van het eigen tarief t.o.v. de bandbreedte. */
  position: MarketRatePosition;
  /** Het eigen uurtarief (euro), ongewijzigd doorgegeven. */
  ownRate: number | null;
}

/**
 * Berekent de mediaan van een reeks getallen.
 *
 * Bij een even aantal waarden: gemiddelde van de twee middelste.
 * Retourneert null bij een lege array.
 * Waarden worden NIET afgerond — afronden gebeurt in computeMarketRate.
 */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    // Oneven lengte: het middelste element is gegarandeerd aanwezig.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return sorted[mid]!;
  }

  // Even lengte: gemiddelde van de twee middelste waarden.
  // mid >= 1 gegarandeerd (length even en >= 2).
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Berekent het p-de percentiel van een reeks getallen via lineaire interpolatie.
 *
 * p loopt van 0 (minimum) t/m 1 (maximum).
 * Retourneert null bij een lege array.
 * De invoerarray wordt NIET gemuteerd — intern wordt een kopie gesorteerd.
 */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  // Lineaire interpolatie tussen rangen
  const idx = p * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);

  // lo en hi zijn beide geldige indices: lo = floor(idx), hi = ceil(idx), idx in [0, n-1].
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const valLo = sorted[lo]!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const valHi = sorted[hi]!;

  return valLo + (valHi - valLo) * (idx - lo);
}

/**
 * Berekent het volledige marktband-inzicht voor één ZZP'er.
 *
 * Werkwijze:
 * 1. Filter beide peer-arrays: behoud alleen positieve, eindige waarden.
 * 2. Kies de scope: industrie bij genoeg peers, anders platform, anders "none".
 * 3. Bereken mediaan/p25/p75 van de gekozen set (afgerond op heel getal).
 * 4. Bepaal positie op basis van NIET-afgeronde p25/p75 (vermijdt grensruis).
 */
export function computeMarketRate(input: {
  ownRate: number | null;
  /** Peers die minimaal één industrie met de ZZP'er delen, excl. eigen tarief. */
  industryPeerRates: number[];
  /** Alle peers op het platform, excl. eigen tarief. */
  platformPeerRates: number[];
  /** Minimale steekproefgrootte vóór een marktband getoond wordt. */
  minSample: number;
}): MarketRateInsight {
  const { ownRate, minSample } = input;

  // Stap 1: filter niet-positieve en niet-eindige waarden uit beide sets
  const industryFiltered = input.industryPeerRates.filter((r) => r > 0 && Number.isFinite(r));
  const platformFiltered = input.platformPeerRates.filter((r) => r > 0 && Number.isFinite(r));

  // Stap 2: scope-keuze
  let scope: MarketRateScope;
  let peers: number[];

  if (industryFiltered.length >= minSample) {
    scope = "industry";
    peers = industryFiltered;
  } else if (platformFiltered.length >= minSample) {
    scope = "platform";
    peers = platformFiltered;
  } else {
    // Te weinig peers — geef terug hoeveel we al hebben zodat de UI "nog N van minSample" kan tonen
    const sampleSize = Math.max(industryFiltered.length, platformFiltered.length);
    return {
      scope: "none",
      sampleSize,
      median: null,
      p25: null,
      p75: null,
      position: "unknown",
      ownRate,
    };
  }

  // Stap 3: bereken statistieken van de gekozen set
  const medianRaw = median(peers);
  // Niet-afgeronde p25/p75 voor positiebepaling (vermijdt grensruis bij afronden)
  const p25Raw = percentile(peers, 0.25);
  const p75Raw = percentile(peers, 0.75);

  // Afgeronde waarden voor het resultaat
  const medianRounded = medianRaw !== null ? Math.round(medianRaw) : null;
  const p25Rounded = p25Raw !== null ? Math.round(p25Raw) : null;
  const p75Rounded = p75Raw !== null ? Math.round(p75Raw) : null;

  // Stap 4: bepaal positie van het eigen tarief
  let position: MarketRatePosition;

  if (ownRate === null || ownRate <= 0 || !Number.isFinite(ownRate)) {
    position = "unknown";
  } else if (p25Raw === null || p75Raw === null) {
    // Kan theoretisch niet voorkomen bij peers.length >= minSample >= 1,
    // maar defensief afhandelen
    position = "unknown";
  } else if (ownRate < p25Raw) {
    position = "below";
  } else if (ownRate > p75Raw) {
    position = "above";
  } else {
    position = "within";
  }

  return {
    scope,
    sampleSize: peers.length,
    median: medianRounded,
    p25: p25Rounded,
    p75: p75Rounded,
    position,
    ownRate,
  };
}
