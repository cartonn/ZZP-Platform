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

  it("vergelijkt op kalenderdag, niet op milliseconde (tijd binnen de dag telt niet mee)", () => {
    const r = detectUnavailability({
      dienstStart: new Date("2026-08-15T22:30:00.000Z"),
      windows: [win("2026-08-10", "2026-08-15")],
    });
    expect(r.conflict).toBe(true);
  });
});
