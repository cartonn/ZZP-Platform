import { describe, expect, it } from "vitest";
import {
  currentOrNextAvailable,
  summarizeAvailability,
  upcomingWindows,
  type WindowLike,
} from "@/lib/availability";

const d = (s: string) => new Date(s);
const now = d("2026-06-15T00:00:00Z");

const windows: WindowLike[] = [
  { startDate: d("2026-01-01"), endDate: d("2026-02-01"), type: "AVAILABLE" }, // verleden
  { startDate: d("2026-06-01"), endDate: d("2026-07-01"), type: "AVAILABLE" }, // dekt nu
  { startDate: d("2026-08-01"), endDate: d("2026-09-01"), type: "LIMITED" }, //  toekomst
  { startDate: d("2026-10-01"), endDate: d("2026-11-01"), type: "UNAVAILABLE" },
];

describe("upcomingWindows", () => {
  it("filtert verleden weg en sorteert op startdatum", () => {
    const u = upcomingWindows(windows, now);
    expect(u).toHaveLength(3);
    expect(u[0]!.startDate).toEqual(d("2026-06-01"));
  });
});

describe("currentOrNextAvailable", () => {
  it("kiest het venster dat nu dekt (inzetbaar)", () => {
    expect(currentOrNextAvailable(windows, now)?.startDate).toEqual(d("2026-06-01"));
  });
  it("kiest het eerstvolgende inzetbare venster als nu niets dekt", () => {
    const future = [
      { startDate: d("2026-08-01"), endDate: d("2026-09-01"), type: "LIMITED" as const },
    ];
    expect(currentOrNextAvailable(future, now)?.startDate).toEqual(d("2026-08-01"));
  });
  it("negeert UNAVAILABLE-vensters", () => {
    const only = [
      { startDate: d("2026-07-01"), endDate: d("2026-08-01"), type: "UNAVAILABLE" as const },
    ];
    expect(currentOrNextAvailable(only, now)).toBeNull();
  });
});

describe("summarizeAvailability", () => {
  it("'t/m' als het nu dekt", () => {
    expect(summarizeAvailability(windows, now)).toBe("Beschikbaar t/m 2026-07-01");
  });
  it("'vanaf' als het in de toekomst ligt", () => {
    const future = [
      { startDate: d("2026-08-01"), endDate: d("2026-09-01"), type: "LIMITED" as const },
    ];
    expect(summarizeAvailability(future, now)).toBe("Beperkt beschikbaar vanaf 2026-08-01");
  });
  it("null als er niets inzetbaars is", () => {
    expect(summarizeAvailability([], now)).toBeNull();
  });
});
