// Portefeuille-aggregaat van het vacaturetempo voor de opdrachtgever: vat de per-opdracht
// `summarizeVacancyPerformance`-uitkomsten samen tot een lijst-breed beeld ("hoeveel van mijn
// gepubliceerde opdrachten vragen bijsturen?"). Zo ziet de opdrachtgever op "Mijn opdrachten" in
// één oogopslag waar aandacht nodig is, zonder elke opdracht te openen. Puur en deterministisch;
// server-side is de waarheid (CLAUDE.md regel 1) — de client toont het, berekent het nooit zelf.

import { type VacancyPerformanceSummary } from "@/lib/job-vacancy-performance";

export interface VacancyPortfolioSummary {
  /** Aantal gepubliceerde opdrachten waarover het tempo is beoordeeld. */
  published: number;
  /** Opdrachten die bijsturen vragen (koud of stilgevallen — `summary.attention`). */
  attention: number;
  /** Opdrachten met een sterk tempo. */
  strong: number;
}

/** Vat de per-opdracht-tempo's samen tot portefeuille-tellingen. Alleen gepubliceerde opdrachten
 * horen als input; concept/gesloten opdrachten hebben geen "tempo". */
export function summarizeVacancyPortfolio(
  summaries: VacancyPerformanceSummary[],
): VacancyPortfolioSummary {
  let attention = 0;
  let strong = 0;
  for (const s of summaries) {
    if (s.attention) attention += 1;
    if (s.pace === "strong") strong += 1;
  }
  return { published: summaries.length, attention, strong };
}

/** Kop voor de aandacht-strip; null wanneer geen enkele opdracht bijsturen vraagt (dan geen ruis). */
export function vacancyPortfolioHeadline(summary: VacancyPortfolioSummary): string | null {
  if (summary.attention <= 0) return null;
  return summary.attention === 1
    ? "1 gepubliceerde opdracht vraagt aandacht — weinig of geen reacties."
    : `${summary.attention} gepubliceerde opdrachten vragen aandacht — weinig of geen reacties.`;
}
