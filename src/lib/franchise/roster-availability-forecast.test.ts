import { describe, expect, it } from "vitest";
import {
  FORECAST_HORIZON_DAYS,
  FORECAST_SOON_DAYS,
  daysUntilFree,
  forecastChipLabel,
  freeDateFromActiveCollaborations,
  rosterForecastHeadline,
  summarizeRosterForecast,
} from "./roster-availability-forecast";

const now = new Date("2026-07-16T12:00:00.000Z");
const inDays = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

describe("freeDateFromActiveCollaborations", () => {
  it("null zonder lopende samenwerkingen", () => {
    expect(freeDateFromActiveCollaborations([])).toBeNull();
  });

  it("neemt de láátste einddatum (bezet tot de laatste eindigt)", () => {
    const d = freeDateFromActiveCollaborations([inDays(5), inDays(12), inDays(3)]);
    expect(d?.getTime()).toBe(inDays(12).getTime());
  });

  it("null zodra één samenwerking een open einde heeft", () => {
    expect(freeDateFromActiveCollaborations([inDays(5), null])).toBeNull();
    expect(freeDateFromActiveCollaborations([undefined])).toBeNull();
  });
});

describe("daysUntilFree", () => {
  it("rondt naar boven af op dagbasis en klemt op 0", () => {
    expect(daysUntilFree(inDays(3), now)).toBe(3);
    // 2.5 dagen → 3
    expect(daysUntilFree(new Date(now.getTime() + 2.5 * 86_400_000), now)).toBe(3);
    // in het verleden → 0
    expect(daysUntilFree(inDays(-2), now)).toBe(0);
  });
});

describe("forecastChipLabel", () => {
  it("null zonder vrijkomdatum, in het verleden/vandaag, of buiten de horizon", () => {
    expect(forecastChipLabel(null, now)).toBeNull();
    expect(forecastChipLabel(now, now)).toBeNull();
    expect(forecastChipLabel(inDays(-1), now)).toBeNull();
    expect(forecastChipLabel(inDays(FORECAST_HORIZON_DAYS + 1), now)).toBeNull();
  });

  it("toont de resterende looptijd binnen de weekgrens", () => {
    expect(forecastChipLabel(inDays(1), now)).toBe("Komt vrij over 1 dag");
    expect(forecastChipLabel(inDays(FORECAST_SOON_DAYS), now)).toBe("Komt vrij over 7 dagen");
  });

  it("toont de exacte einddatum verder weg (binnen de horizon)", () => {
    const label = forecastChipLabel(inDays(20), now);
    expect(label).toMatch(/^Komt vrij op /);
  });
});

describe("summarizeRosterForecast", () => {
  it("telt alleen bekende, toekomstige data binnen de horizon", () => {
    const s = summarizeRosterForecast(
      [
        { freeDate: inDays(3) }, // deze week
        { freeDate: inDays(5) }, // deze week
        { freeDate: inDays(20) }, // binnen horizon, niet deze week
        { freeDate: inDays(FORECAST_HORIZON_DAYS + 5) }, // te ver → uit
        { freeDate: inDays(-2) }, // verleden → uit
        { freeDate: null }, // onbekend/niet ingezet → uit
      ],
      now,
    );
    expect(s).toEqual({ soon: 3, thisWeek: 2, earliestDays: 3 });
  });

  it("leeg beeld zonder aankomende vrijval", () => {
    expect(summarizeRosterForecast([{ freeDate: null }, { freeDate: inDays(-1) }], now)).toEqual({
      soon: 0,
      thisWeek: 0,
      earliestDays: null,
    });
  });
});

describe("rosterForecastHeadline", () => {
  it("null zonder aankomende vrijval", () => {
    expect(rosterForecastHeadline({ soon: 0, thisWeek: 0, earliestDays: null })).toBeNull();
  });

  it("noemt het deze-week-deel wanneer aanwezig", () => {
    expect(rosterForecastHeadline({ soon: 3, thisWeek: 2, earliestDays: 3 })).toBe(
      "3 vakmensen komen binnen 30 dagen vrij — 2 deze week. Plan herplaatsing vast vooruit.",
    );
  });

  it("enkelvoud + geen deze-week-deel", () => {
    expect(rosterForecastHeadline({ soon: 1, thisWeek: 0, earliestDays: 12 })).toBe(
      "1 vakmens komt binnen 30 dagen vrij. Plan herplaatsing vast vooruit.",
    );
  });
});
