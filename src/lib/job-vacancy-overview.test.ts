import { describe, expect, it } from "vitest";
import { summarizeVacancyPortfolio, vacancyPortfolioHeadline } from "./job-vacancy-overview";
import { summarizeVacancyPerformance, VACANCY_COLD_MIN_AGE_DAYS } from "./job-vacancy-performance";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-07-05T12:00:00.000Z");

function daysAgo(d: number): Date {
  return new Date(NOW.getTime() - d * DAY);
}

/** Koude opdracht: lang open, (bijna) geen reacties → attention. */
function cold() {
  return summarizeVacancyPerformance({
    publishedAt: daysAgo(VACANCY_COLD_MIN_AGE_DAYS + 3),
    now: NOW,
    applicationDates: [],
  });
}

/** Sterke opdracht: veel recente reacties → strong, geen attention. */
function strong() {
  return summarizeVacancyPerformance({
    publishedAt: daysAgo(7),
    now: NOW,
    applicationDates: [daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4), daysAgo(5)],
  });
}

describe("summarizeVacancyPortfolio", () => {
  it("telt gepubliceerde, aandacht- en sterke opdrachten", () => {
    const summary = summarizeVacancyPortfolio([cold(), cold(), strong()]);
    expect(summary.published).toBe(3);
    expect(summary.attention).toBe(2);
    expect(summary.strong).toBe(1);
  });

  it("geeft nul-tellingen voor een lege portefeuille", () => {
    const summary = summarizeVacancyPortfolio([]);
    expect(summary).toEqual({ published: 0, attention: 0, strong: 0 });
  });

  it("bevestigt de aannames: cold=attention, strong=strong & niet-attention", () => {
    const c = cold();
    const s = strong();
    expect(c.attention).toBe(true);
    expect(c.pace).toBe("cold");
    expect(s.pace).toBe("strong");
    expect(s.attention).toBe(false);
  });
});

describe("vacancyPortfolioHeadline", () => {
  it("is null zonder aandacht-opdrachten (geen ruis)", () => {
    expect(vacancyPortfolioHeadline({ published: 4, attention: 0, strong: 2 })).toBeNull();
  });

  it("gebruikt enkelvoud bij precies één", () => {
    const h = vacancyPortfolioHeadline({ published: 3, attention: 1, strong: 0 });
    expect(h).toContain("1 gepubliceerde opdracht vraagt");
  });

  it("gebruikt meervoud bij meerdere", () => {
    const h = vacancyPortfolioHeadline({ published: 5, attention: 3, strong: 1 });
    expect(h).toContain("3 gepubliceerde opdrachten vragen");
  });
});
