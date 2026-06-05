import { describe, expect, it } from "vitest";
import {
  formatDateNl,
  formatDateShortNl,
  formatDateTimeNl,
  formatDateRangeNl,
} from "@/lib/format-date";

describe("format-date", () => {
  it("formatDateNl geeft lange NL-notatie", () => {
    expect(formatDateNl("2026-05-07")).toBe("7 mei 2026");
    expect(formatDateNl(new Date("2026-12-01T00:00:00.000Z"))).toBe("1 december 2026");
  });

  it("formatDateShortNl geeft korte maand", () => {
    expect(formatDateShortNl("2026-05-07")).toBe("7 mei 2026");
    expect(formatDateShortNl("2026-06-07")).toBe("7 jun 2026");
  });

  it("formatDateTimeNl zet UTC om naar Europe/Amsterdam + toont tijd", () => {
    // 07:12 UTC = 09:12 in Amsterdam (zomertijd, +02:00)
    expect(formatDateTimeNl("2026-05-30T07:12:00.000Z")).toBe("30 mei 2026 09:12");
  });

  it("ongeldige/lege invoer valt terug op een nette placeholder", () => {
    expect(formatDateNl(null)).toBe("—");
    expect(formatDateNl(undefined)).toBe("—");
    expect(formatDateNl("")).toBe("—");
    expect(formatDateNl("geen-datum")).toBe("—");
    expect(formatDateShortNl(null, "onbekend")).toBe("onbekend");
  });

  it("formatDateRangeNl herhaalt het jaar niet bij gelijk jaar", () => {
    expect(formatDateRangeNl("2026-05-16", "2026-05-23")).toBe("16 mei – 23 mei 2026");
    expect(formatDateRangeNl("2025-12-30", "2026-01-05")).toBe("30 dec 2025 – 5 jan 2026");
    expect(formatDateRangeNl("2026-05-16", null)).toBe("16 mei 2026");
  });
});
