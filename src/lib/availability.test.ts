import { describe, expect, it } from "vitest";
import {
  availabilityOnDate,
  awayUntil,
  currentOrNextAvailable,
  summarizeAvailability,
  summarizeAvailabilityFreshness,
  summarizeAway,
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
  it("behandelt de einddatum INCLUSIEF (t/m): venster t/m vandaag blijft de hele dag geldig", () => {
    // Venster eindigt 'vandaag' (00:00 UTC); now is later op de dag. Mag niet wegvallen.
    const sameDay = [
      { startDate: d("2026-06-10"), endDate: d("2026-06-15"), type: "AVAILABLE" as const },
    ];
    const later = d("2026-06-15T14:00:00Z");
    expect(currentOrNextAvailable(sameDay, later)?.startDate).toEqual(d("2026-06-10"));
    expect(upcomingWindows(sameDay, later)).toHaveLength(1);
  });
  it("een UNAVAILABLE-periode domineert een overlappend inzetbaar venster (nu niet beschikbaar)", () => {
    const conflict = [
      { startDate: d("2026-06-01"), endDate: d("2026-06-30"), type: "UNAVAILABLE" as const },
      { startDate: d("2026-01-01"), endDate: d("2026-12-31"), type: "AVAILABLE" as const },
    ];
    expect(currentOrNextAvailable(conflict, now)).toBeNull();
    expect(summarizeAvailability(conflict, now)).toBeNull();
  });
});

describe("availabilityOnDate", () => {
  const start = d("2026-06-15T00:00:00Z");
  it("AVAILABLE als een inzetbaar venster de datum dekt", () => {
    expect(availabilityOnDate(windows, start)).toBe("AVAILABLE");
  });
  it("NONE als geen enkel venster de datum dekt", () => {
    expect(availabilityOnDate(windows, d("2026-07-15T00:00:00Z"))).toBe("NONE");
  });
  it("LIMITED als alleen een LIMITED-venster de datum dekt", () => {
    expect(availabilityOnDate(windows, d("2026-08-15T00:00:00Z"))).toBe("LIMITED");
  });
  it("UNAVAILABLE als een onbeschikbaar venster de datum dekt", () => {
    expect(availabilityOnDate(windows, d("2026-10-15T00:00:00Z"))).toBe("UNAVAILABLE");
  });
  it("UNAVAILABLE domineert een overlappend inzetbaar venster", () => {
    const conflict: WindowLike[] = [
      { startDate: d("2026-01-01"), endDate: d("2026-12-31"), type: "AVAILABLE" },
      { startDate: d("2026-06-01"), endDate: d("2026-06-30"), type: "UNAVAILABLE" },
    ];
    expect(availabilityOnDate(conflict, start)).toBe("UNAVAILABLE");
  });
  it("behandelt de einddatum INCLUSIEF: een venster t/m de startdatum dekt die dag nog", () => {
    const sameDay: WindowLike[] = [
      { startDate: d("2026-06-10"), endDate: d("2026-06-15"), type: "AVAILABLE" },
    ];
    expect(availabilityOnDate(sameDay, start)).toBe("AVAILABLE");
  });
  it("NONE bij een lege agenda", () => {
    expect(availabilityOnDate([], start)).toBe("NONE");
  });
});

describe("summarizeAvailability", () => {
  it("'t/m' als het nu dekt", () => {
    expect(summarizeAvailability(windows, now)).toBe("Beschikbaar t/m 1 jul 2026");
  });
  it("'vanaf' als het in de toekomst ligt", () => {
    const future = [
      { startDate: d("2026-08-01"), endDate: d("2026-09-01"), type: "LIMITED" as const },
    ];
    expect(summarizeAvailability(future, now)).toBe("Beperkt beschikbaar vanaf 1 aug 2026");
  });
  it("null als er niets inzetbaars is", () => {
    expect(summarizeAvailability([], now)).toBeNull();
  });
});

describe("awayUntil", () => {
  it("geeft de einddatum als een UNAVAILABLE-venster nu dekt", () => {
    const away: WindowLike[] = [
      { startDate: d("2026-06-10"), endDate: d("2026-06-20"), type: "UNAVAILABLE" },
    ];
    expect(awayUntil(away, now)).toEqual(d("2026-06-20"));
  });
  it("null als er geen UNAVAILABLE-venster nu dekt", () => {
    expect(awayUntil(windows, now)).toBeNull(); // dekkende venster is AVAILABLE
    expect(awayUntil([], now)).toBeNull();
  });
  it("een toekomstig UNAVAILABLE-venster telt niet als 'nu afwezig'", () => {
    const future: WindowLike[] = [
      { startDate: d("2026-08-01"), endDate: d("2026-09-01"), type: "UNAVAILABLE" },
    ];
    expect(awayUntil(future, now)).toBeNull();
  });
  it("kiest de láátste einddatum bij overlappende afwezigheidsperiodes", () => {
    const overlap: WindowLike[] = [
      { startDate: d("2026-06-01"), endDate: d("2026-06-18"), type: "UNAVAILABLE" },
      { startDate: d("2026-06-10"), endDate: d("2026-06-30"), type: "UNAVAILABLE" },
    ];
    expect(awayUntil(overlap, now)).toEqual(d("2026-06-30"));
  });
});

describe("summarizeAway", () => {
  it("'Afwezig t/m' als de ZZP'er nu onbeschikbaar is", () => {
    const away: WindowLike[] = [
      { startDate: d("2026-06-10"), endDate: d("2026-06-20"), type: "UNAVAILABLE" },
    ];
    expect(summarizeAway(away, now)).toBe("Afwezig t/m 20 jun 2026");
  });
  it("null als de ZZP'er nu niet expliciet onbeschikbaar is", () => {
    expect(summarizeAway(windows, now)).toBeNull();
    expect(summarizeAway([], now)).toBeNull();
  });
});

describe("summarizeAvailabilityFreshness", () => {
  it("empty bij een lege agenda", () => {
    expect(summarizeAvailabilityFreshness([], now)).toEqual({ status: "empty", total: 0 });
  });
  it("fresh zolang er een venster nu of in de toekomst eindigt", () => {
    expect(summarizeAvailabilityFreshness(windows, now)).toEqual({ status: "fresh", total: 4 });
  });
  it("expired als alle einddata in het verleden liggen", () => {
    const past: WindowLike[] = [
      { startDate: d("2026-01-01"), endDate: d("2026-02-01"), type: "AVAILABLE" },
      { startDate: d("2026-03-01"), endDate: d("2026-04-01"), type: "LIMITED" },
    ];
    expect(summarizeAvailabilityFreshness(past, now)).toEqual({ status: "expired", total: 2 });
  });
  it("een toekomstig UNAVAILABLE-venster telt óók als fresh (agenda is bijgehouden)", () => {
    const onlyBlockedFuture: WindowLike[] = [
      { startDate: d("2026-08-01"), endDate: d("2026-09-01"), type: "UNAVAILABLE" },
    ];
    expect(summarizeAvailabilityFreshness(onlyBlockedFuture, now).status).toBe("fresh");
  });
  it("een venster dat t/m vandaag loopt is nog fresh (einddatum inclusief)", () => {
    const endsToday: WindowLike[] = [
      { startDate: d("2026-06-01"), endDate: d("2026-06-15"), type: "AVAILABLE" },
    ];
    expect(summarizeAvailabilityFreshness(endsToday, now).status).toBe("fresh");
  });
});
