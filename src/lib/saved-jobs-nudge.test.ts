import { describe, expect, it } from "vitest";
import {
  SAVED_JOB_START_SOON_DAYS,
  countUnactedSavedJobs,
  summarizeSavedJobAction,
  type SavedJobAction,
} from "./saved-jobs-nudge";

const NOW = new Date("2026-07-10T12:00:00.000Z");

function inDays(days: number): Date {
  return new Date(NOW.getTime() + days * 86_400_000);
}

describe("summarizeSavedJobAction", () => {
  it("is 'applied' zonder aftelling zodra er gereageerd is, ongeacht de startdatum", () => {
    expect(summarizeSavedJobAction({ hasApplied: true, startDate: inDays(2) }, NOW)).toEqual({
      state: "applied",
      daysUntilStart: null,
    });
    expect(summarizeSavedJobAction({ hasApplied: true, startDate: null }, NOW)).toEqual({
      state: "applied",
      daysUntilStart: null,
    });
  });

  it("is 'open' zonder startdatum wanneer er nog niet gereageerd is", () => {
    expect(summarizeSavedJobAction({ hasApplied: false, startDate: null }, NOW)).toEqual({
      state: "open",
      daysUntilStart: null,
    });
  });

  it("is 'start_soon' met aftelling binnen het venster", () => {
    expect(summarizeSavedJobAction({ hasApplied: false, startDate: inDays(3) }, NOW)).toEqual({
      state: "start_soon",
      daysUntilStart: 3,
    });
  });

  it("telt vandaag als startdatum als 0 dagen (start_soon)", () => {
    expect(summarizeSavedJobAction({ hasApplied: false, startDate: inDays(0) }, NOW)).toEqual({
      state: "start_soon",
      daysUntilStart: 0,
    });
  });

  it("is 'start_soon' op precies de venstergrens, 'open' één dag erbuiten", () => {
    expect(
      summarizeSavedJobAction(
        { hasApplied: false, startDate: inDays(SAVED_JOB_START_SOON_DAYS) },
        NOW,
      ).state,
    ).toBe("start_soon");
    const justOutside = summarizeSavedJobAction(
      { hasApplied: false, startDate: inDays(SAVED_JOB_START_SOON_DAYS + 1) },
      NOW,
    );
    expect(justOutside.state).toBe("open");
    expect(justOutside.daysUntilStart).toBe(SAVED_JOB_START_SOON_DAYS + 1);
  });

  it("valt terug op 'open' zonder aftelling bij een reeds verstreken startdatum", () => {
    expect(summarizeSavedJobAction({ hasApplied: false, startDate: inDays(-2) }, NOW)).toEqual({
      state: "open",
      daysUntilStart: null,
    });
  });

  it("rekent op hele UTC-dagen, ongevoelig voor het tijdstip binnen de dag", () => {
    const lateToday = new Date("2026-07-10T23:30:00.000Z");
    // Startdatum morgen vroeg → 1 hele dag, niet 0.
    const tomorrowEarly = new Date("2026-07-11T01:00:00.000Z");
    expect(
      summarizeSavedJobAction({ hasApplied: false, startDate: tomorrowEarly }, lateToday)
        .daysUntilStart,
    ).toBe(1);
  });
});

describe("countUnactedSavedJobs", () => {
  it("telt alles behalve 'applied'", () => {
    const actions: SavedJobAction[] = [
      { state: "applied", daysUntilStart: null },
      { state: "open", daysUntilStart: null },
      { state: "start_soon", daysUntilStart: 4 },
      { state: "applied", daysUntilStart: null },
    ];
    expect(countUnactedSavedJobs(actions)).toBe(2);
  });

  it("is 0 op een lege lijst", () => {
    expect(countUnactedSavedJobs([])).toBe(0);
  });
});
