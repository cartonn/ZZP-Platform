import { describe, it, expect } from "vitest";
import {
  detectUnavailability,
  type AvailabilityWindowInput,
} from "@/lib/franchise/roster-unavailability";

const win = (start: string, end: string, type = "UNAVAILABLE"): AvailabilityWindowInput => ({
  startDate: new Date(`${start}T00:00:00.000Z`),
  endDate: new Date(`${end}T00:00:00.000Z`),
  type,
});

describe("detectUnavailability", () => {
  it("geeft geen conflict zonder dienstdatum", () => {
    const r = detectUnavailability({
      dienstStart: null,
      windows: [win("2026-08-01", "2026-08-31")],
    });
    expect(r).toEqual({ conflict: false, windowStartISO: null, windowEndISO: null });
  });

  it("geeft geen conflict zonder vensters", () => {
    const r = detectUnavailability({
      dienstStart: new Date("2026-08-10T00:00:00.000Z"),
      windows: [],
    });
    expect(r.conflict).toBe(false);
  });

  it("markeert een dienstdatum binnen een UNAVAILABLE-venster (inclusief)", () => {
    const r = detectUnavailability({
      dienstStart: new Date("2026-08-10T00:00:00.000Z"),
      windows: [win("2026-08-05", "2026-08-15")],
    });
    expect(r).toEqual({
      conflict: true,
      windowStartISO: "2026-08-05",
      windowEndISO: "2026-08-15",
    });
  });

  it("is inclusief op beide grenzen van het venster", () => {
    const start = detectUnavailability({
      dienstStart: new Date("2026-08-05T00:00:00.000Z"),
      windows: [win("2026-08-05", "2026-08-15")],
    });
    const end = detectUnavailability({
      dienstStart: new Date("2026-08-15T00:00:00.000Z"),
      windows: [win("2026-08-05", "2026-08-15")],
    });
    expect(start.conflict).toBe(true);
    expect(end.conflict).toBe(true);
  });

  it("negeert een dienstdatum net buiten het venster", () => {
    const before = detectUnavailability({
      dienstStart: new Date("2026-08-04T00:00:00.000Z"),
      windows: [win("2026-08-05", "2026-08-15")],
    });
    const after = detectUnavailability({
      dienstStart: new Date("2026-08-16T00:00:00.000Z"),
      windows: [win("2026-08-05", "2026-08-15")],
    });
    expect(before.conflict).toBe(false);
    expect(after.conflict).toBe(false);
  });

  it("telt alleen UNAVAILABLE — AVAILABLE en LIMITED zijn geen blokkade", () => {
    const r = detectUnavailability({
      dienstStart: new Date("2026-08-10T00:00:00.000Z"),
      windows: [
        win("2026-08-01", "2026-08-31", "AVAILABLE"),
        win("2026-08-01", "2026-08-31", "LIMITED"),
      ],
    });
    expect(r.conflict).toBe(false);
  });

  it("kiest bij meerdere conflictvensters het vroegst-startende voor het label", () => {
    const r = detectUnavailability({
      dienstStart: new Date("2026-08-10T00:00:00.000Z"),
      windows: [win("2026-08-08", "2026-08-12"), win("2026-08-01", "2026-08-20")],
    });
    expect(r).toEqual({
      conflict: true,
      windowStartISO: "2026-08-01",
      windowEndISO: "2026-08-20",
    });
  });

  it("negeert een venster met een einde vóór het begin (corrupte range)", () => {
    const r = detectUnavailability({
      dienstStart: new Date("2026-08-10T00:00:00.000Z"),
      windows: [win("2026-08-20", "2026-08-05")],
    });
    expect(r.conflict).toBe(false);
  });

  it("negeert een venster met een ongeldige datum", () => {
    const r = detectUnavailability({
      dienstStart: new Date("2026-08-10T00:00:00.000Z"),
      windows: [{ startDate: new Date("nope"), endDate: new Date("nope"), type: "UNAVAILABLE" }],
    });
    expect(r.conflict).toBe(false);
  });

  it("vergelijkt op kalenderdag, niet op milliseconde (tijd binnen dezelfde NL-dag telt niet mee)", () => {
    // 10:00Z = 12:00 NL (zomer) — nog steeds 15 augustus NL, dus binnen het venster t/m 15 augustus.
    const r = detectUnavailability({
      dienstStart: new Date("2026-08-15T10:00:00.000Z"),
      windows: [win("2026-08-10", "2026-08-15")],
    });
    expect(r.conflict).toBe(true);
  });

  it("toetst op de Amsterdamse kalenderdag: een zomernachtdienst valt op de NL-dag, niet de UTC-dag", () => {
    // 2026-08-15T22:30Z = 2026-08-16 00:30 NL (CEST, UTC+2): de dienst start op NL-dag 16 augustus.
    const dienstStart = new Date("2026-08-15T22:30:00.000Z");

    // Het UNAVAILABLE-venster op de werkelijke NL-dienstdag (16 aug) moet het conflict geven —
    // vóór de fix viel de dienst op UTC-dag 15 aug en bleef dit vals negatief (verspilde voordracht).
    const onNlDay = detectUnavailability({
      dienstStart,
      windows: [win("2026-08-16", "2026-08-16")],
    });
    expect(onNlDay).toEqual({
      conflict: true,
      windowStartISO: "2026-08-16",
      windowEndISO: "2026-08-16",
    });

    // En een venster op alleen de vorige UTC-dag (15 aug) mag géén vals positief geven: op die NL-dag
    // is de ZZP'er niet onbeschikbaar.
    const onUtcDay = detectUnavailability({
      dienstStart,
      windows: [win("2026-08-15", "2026-08-15")],
    });
    expect(onUtcDay.conflict).toBe(false);
  });

  it("toetst op de Amsterdamse kalenderdag ook in de winter (CET, UTC+1)", () => {
    // 2026-01-15T23:30Z = 2026-01-16 00:30 NL (CET, UTC+1): de dienst start op NL-dag 16 januari.
    const dienstStart = new Date("2026-01-15T23:30:00.000Z");
    const r = detectUnavailability({
      dienstStart,
      windows: [win("2026-01-16", "2026-01-16")],
    });
    expect(r.conflict).toBe(true);
  });
});
