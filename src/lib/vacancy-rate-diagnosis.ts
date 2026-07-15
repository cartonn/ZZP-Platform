// Tarief-diagnose voor de OPDRACHTGEVER: wanneer een gepubliceerde opdracht koud loopt, is de meest
// waarschijnlijke — en direct oplosbare — oorzaak een tarief onder de markt. Waar `job-vacancy-
// performance.ts` het tempo samenvat ("Weinig respons, X dagen open") en een generieke tip geeft
// ("overweeg tarief/eisen/zichtbaarheid bij te stellen"), verbindt deze module dat signaal met de
// bestaande marktband-engine (`market-rate.ts` / `data/job-rate-bands.ts`) tot één concrete,
// cijfermatige conclusie: "je biedt tot €X/u, het markttarief ligt rond €Y/u". Zo verandert
// "reacties blijven uit, geen idee waarom" in een meetbare, uitvoerbare knop.
//
// Puur en deterministisch (getest). Server-side is de waarheid (CLAUDE.md regel 1): de client toont
// de diagnose, berekent haar nooit. Toont uitsluitend geaggregeerde marktstatistiek (mediaan) — nooit
// een individueel tarief van een ZZP'er.

import type { MarketRateScope } from "@/lib/market-rate";

export interface VacancyRateDiagnosisInput {
  /** Vraagt de opdracht om bijsturen? (koud, of stil gevallen met weinig reacties.) */
  attention: boolean;
  /** Welke peer-set de marktband gebruikte ("none" = te weinig data → geen diagnose). */
  scope: MarketRateScope;
  /** Mediaan-uurtarief van de markt (euro), afgerond; null bij scope "none". */
  median: number | null;
  /** De geboden bovengrens van de opdracht (euro); null wanneer open-eind ("€X+/uur"). */
  rateMax: number | null;
}

export interface VacancyRateDiagnosis {
  /** Markttarief (mediaan, euro) — geaggregeerd, nooit een individueel tarief. */
  median: number;
  /** De geboden bovengrens (euro). */
  rateMax: number;
  /** Compacte kop voor de chip. */
  label: string;
  /** Uitleg + concrete sturingstip. */
  hint: string;
}

/**
 * Geeft een tarief-diagnose terug wanneer — en alleen wanneer — een koud lopende opdracht een
 * bovengrens biedt die ónder het markttarief (mediaan) ligt. In alle andere gevallen `null`, zodat
 * de kaart rustig blijft:
 *
 * - `attention === false`  → de opdracht loopt niet koud; geen reden voor een tarief-alarm.
 * - `scope === "none"` / `median === null` → te weinig markt-data voor een betrouwbaar oordeel.
 * - `rateMax === null` → open-eind tarief ("€80+/uur"); de bovengrens is niet begrensbaar onder de
 *   markt, dus geen "te laag"-claim.
 * - `rateMax >= median` → de bovengrens haalt minstens het markttarief; geen tarief-probleem.
 *
 * Bewust de mediaan als drempel (niet p25): pas wanneer méér dan de helft van de markt boven jouw
 * bovengrens verdient, is "tarief" de aannemelijke oorzaak van de lage respons. Puur.
 */
export function diagnoseVacancyRate(input: VacancyRateDiagnosisInput): VacancyRateDiagnosis | null {
  const { attention, scope, median, rateMax } = input;

  if (!attention) return null;
  if (scope === "none" || median === null || median <= 0) return null;
  if (rateMax === null || !Number.isFinite(rateMax) || rateMax <= 0) return null;
  if (rateMax >= median) return null;

  return {
    median,
    rateMax,
    label: "Tarief onder de markt",
    hint:
      `Je biedt tot € ${rateMax}/u, terwijl het markttarief rond € ${median}/u ligt. ` +
      `Een hoger tarief trekt doorgaans meer kandidaten.`,
  };
}
