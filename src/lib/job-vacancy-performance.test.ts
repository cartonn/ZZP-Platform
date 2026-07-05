import { describe, expect, it } from "vitest";
import {
  summarizeVacancyPerformance,
  VACANCY_COLD_MIN_AGE_DAYS,
  VACANCY_MOMENTUM_WINDOW_DAYS,
} from "./job-vacancy-performance";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-07-05T12:00:00.000Z");

/** `d` dagen vóór NOW. */
function daysAgo(d: number): Date {
  return new Date(NOW.getTime() - d * DAY);
}

describe("summarizeVacancyPerformance", () => {
  it("markeert een verse opdracht zonder reacties als 'net geplaatst' (neutraal, niet koud)", () => {
    const s = summarizeVacancyPerformance({
      publishedAt: daysAgo(0),
      now: NOW,
      applicationDates: [],
    });
    expect(s.momentum).toBe("fresh");
    expect(s.pace).toBe("slow");
    expect(s.tone).toBe("neutral");
    expect(s.applicationCount).toBe(0);
    expect(s.perWeek).toBe(0);
    expect(s.headline).toBe("Net geplaatst");
    expect(s.attention).toBe(false);
  });

  it("toont een verse opdracht mét vroege reacties positief zonder opgeblazen tempo", () => {
    const s = summarizeVacancyPerformance({
      publishedAt: daysAgo(1),
      now: NOW,
      applicationDates: [daysAgo(0.5), daysAgo(0.2)],
    });
    expect(s.momentum).toBe("fresh");
    // Vers → terughoudend "steady" i.p.v. een opgeblazen "strong" ondanks 2 reacties op 1 dag.
    expect(s.pace).toBe("steady");
    expect(s.tone).toBe("positive");
    expect(s.applicationCount).toBe(2);
    expect(s.headline).toBe("Net geplaatst");
  });

  it("classificeert een sterk tempo op een volwassen opdracht", () => {
    // 10 reacties over 14 dagen ≈ 5/week → sterk.
    const dates = Array.from({ length: 10 }, (_, i) => daysAgo(1 + i));
    const s = summarizeVacancyPerformance({
      publishedAt: daysAgo(14),
      now: NOW,
      applicationDates: dates,
    });
    expect(s.daysOpen).toBe(14);
    expect(s.perWeek).toBe(5);
    expect(s.pace).toBe("strong");
    expect(s.tone).toBe("positive");
    expect(s.headline).toBe("Sterk tempo");
    expect(s.firstResponseDays).toBe(4);
    expect(s.hint).toContain("Eerste reactie na 4 dagen");
  });

  it("classificeert een gestaag tempo", () => {
    // 4 reacties over 21 dagen ≈ 1,3/week → gestaag.
    const dates = [daysAgo(3), daysAgo(8), daysAgo(14), daysAgo(19)];
    const s = summarizeVacancyPerformance({
      publishedAt: daysAgo(21),
      now: NOW,
      applicationDates: dates,
    });
    expect(s.pace).toBe("steady");
    expect(s.perWeek).toBeGreaterThanOrEqual(1);
    expect(s.perWeek).toBeLessThan(3);
  });

  it("markeert een koude opdracht (lang open, ≤2 reacties) met bijstuur-tip", () => {
    const s = summarizeVacancyPerformance({
      publishedAt: daysAgo(VACANCY_COLD_MIN_AGE_DAYS + 5),
      now: NOW,
      applicationDates: [daysAgo(10)],
    });
    expect(s.pace).toBe("cold");
    expect(s.tone).toBe("warning");
    expect(s.headline).toBe("Weinig respons");
    expect(s.attention).toBe(true);
    expect(s.hint).toMatch(/tarief|eisen|zichtbaarheid/);
  });

  it("detecteert stilgevallen momentum (geen recente reacties) op een niet-koude opdracht", () => {
    // 4 reacties, allemaal > venster geleden → quiet momentum, maar count > 2 dus niet koud.
    const old = VACANCY_MOMENTUM_WINDOW_DAYS + 3;
    const dates = [daysAgo(old), daysAgo(old + 1), daysAgo(old + 2), daysAgo(old + 3)];
    const s = summarizeVacancyPerformance({
      publishedAt: daysAgo(30),
      now: NOW,
      applicationDates: dates,
    });
    expect(s.pace).not.toBe("cold");
    expect(s.momentum).toBe("quiet");
    expect(s.recentCount).toBe(0);
    expect(s.hint).toContain("Geen nieuwe reacties");
    expect(s.attention).toBe(false); // count 4 ≥ 3 → geen bijstuur-alarm
  });

  it("negeert toekomstige tijdstempels en telt alleen geldige reacties", () => {
    const s = summarizeVacancyPerformance({
      publishedAt: daysAgo(10),
      now: NOW,
      applicationDates: [daysAgo(2), new Date(NOW.getTime() + DAY), new Date("invalid")],
    });
    expect(s.applicationCount).toBe(1);
  });

  it("valt terug op daagteller 0 wanneer publishedAt ontbreekt", () => {
    const s = summarizeVacancyPerformance({ publishedAt: null, now: NOW, applicationDates: [] });
    expect(s.daysOpen).toBe(0);
    expect(s.momentum).toBe("fresh");
    expect(s.firstResponseDays).toBeNull();
  });
});
