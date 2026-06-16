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

/**
 * Marktband zonder eigen-tarief-context: mediaan + spreiding van een peer-set.
 * Gebruikt waar er geen enkel "eigen tarief" is, maar wél een marktbeeld nodig is
 * (bijv. de opdrachtgever die een tarief voor een opdracht bepaalt).
 */
export interface MarketBand {
  /** Welke peer-set is gebruikt. */
  scope: MarketRateScope;
  /** Aantal gebruikte peer-tarieven. */
  sampleSize: number;
  /** Mediaan, afgerond op heel getal (euro); null bij scope "none". */
  median: number | null;
  /** 25e percentiel, afgerond op heel getal (euro); null bij scope "none". */
  p25: number | null;
  /** 75e percentiel, afgerond op heel getal (euro); null bij scope "none". */
  p75: number | null;
  /**
   * 25e percentiel, NIET afgerond; null bij scope "none". Gebruik dit (niet de
   * afgeronde `p25`) voor `ratePosition`, zodat de grensclassificatie consistent is
   * met `computeMarketRate` op `/profiel/bewerken` (vermijdt grensruis bij afronden).
   */
  p25Raw: number | null;
  /** 75e percentiel, NIET afgerond; null bij scope "none". Zie `p25Raw`. */
  p75Raw: number | null;
}

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
 * Bepaalt de positie van een tarief t.o.v. een marktbandbreedte (p25–p75).
 *
 * "unknown" wanneer het tarief ontbreekt/niet-positief is of de band onbekend is.
 * Puur — werkt zowel op afgeronde als niet-afgeronde grenswaarden.
 */
export function ratePosition(
  p25: number | null,
  p75: number | null,
  rate: number | null,
): MarketRatePosition {
  if (rate === null || rate <= 0 || !Number.isFinite(rate)) return "unknown";
  if (p25 === null || p75 === null) return "unknown";
  if (rate < p25) return "below";
  if (rate > p75) return "above";
  return "within";
}

/**
 * Berekent de marktband (mediaan + p25/p75) van een peer-set, zonder eigen-tarief-context.
 *
 * Zelfde scope-keuze als `computeMarketRate`: industrie bij genoeg peers, anders platform,
 * anders "none". Waarden worden afgerond op hele euro's. Puur en deterministisch.
 */
export function computeMarketBand(input: {
  /** Peers binnen dezelfde branche/functie. */
  industryPeerRates: number[];
  /** Alle peers op het platform. */
  platformPeerRates: number[];
  /** Minimale steekproefgrootte vóór een marktband getoond wordt. */
  minSample: number;
}): MarketBand {
  const { minSample } = input;

  const industryFiltered = input.industryPeerRates.filter((r) => r > 0 && Number.isFinite(r));
  const platformFiltered = input.platformPeerRates.filter((r) => r > 0 && Number.isFinite(r));

  let scope: MarketRateScope;
  let peers: number[];

  if (industryFiltered.length >= minSample) {
    scope = "industry";
    peers = industryFiltered;
  } else if (platformFiltered.length >= minSample) {
    scope = "platform";
    peers = platformFiltered;
  } else {
    return {
      scope: "none",
      sampleSize: Math.max(industryFiltered.length, platformFiltered.length),
      median: null,
      p25: null,
      p75: null,
      p25Raw: null,
      p75Raw: null,
    };
  }

  const medianRaw = median(peers);
  const p25Raw = percentile(peers, 0.25);
  const p75Raw = percentile(peers, 0.75);

  return {
    scope,
    sampleSize: peers.length,
    median: medianRaw !== null ? Math.round(medianRaw) : null,
    p25: p25Raw !== null ? Math.round(p25Raw) : null,
    p75: p75Raw !== null ? Math.round(p75Raw) : null,
    p25Raw,
    p75Raw,
  };
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

  // Stap 4: bepaal positie van het eigen tarief op basis van de NIET-afgeronde
  // grenswaarden (vermijdt grensruis bij afronden).
  const position = ratePosition(p25Raw, p75Raw, ownRate);

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
