import { describe, expect, it } from "vitest";
import {
  assessJobStartAvailability,
  type AvailabilityWindowInput,
} from "@/lib/job-availability-signal";

const NOW = new Date("2026-07-12T00:00:00Z");

function win(
  start: string,
  end: string,
  type: AvailabilityWindowInput["type"],
  note?: string,
): AvailabilityWindowInput {
  return { startDate: new Date(start), endDate: new Date(end), type, note };
}

describe("assessJobStartAvailability", () => {
  it("geeft null zonder startdatum", () => {
    expect(
      assessJobStartAvailability(null, [win("2026-08-01", "2026-08-31", "UNAVAILABLE")], NOW),
    ).toBeNull();
    expect(assessJobStartAvailability(undefined, [], NOW)).toBeNull();
  });

  it("geeft null zonder vensters", () => {
    expect(assessJobStartAvailability(new Date("2026-08-10"), [], NOW)).toBeNull();
  });

  it("signaleert een startdatum binnen een UNAVAILABLE-venster", () => {
    const signal = assessJobStartAvailability(
      new Date("2026-08-10"),
      [win("2026-08-01", "2026-08-31", "UNAVAILABLE", "Vakantie")],
      NOW,
    );
    expect(signal).not.toBeNull();
    expect(signal!.windowType).toBe("UNAVAILABLE");
    expect(signal!.note).toBe("Vakantie");
  });

  it("signaleert een LIMITED-venster", () => {
    const signal = assessJobStartAvailability(
      new Date("2026-08-10"),
      [win("2026-08-01", "2026-08-31", "LIMITED")],
      NOW,
    );
    expect(signal!.windowType).toBe("LIMITED");
    expect(signal!.note).toBeNull();
  });

  it("negeert AVAILABLE-vensters", () => {
    expect(
      assessJobStartAvailability(
        new Date("2026-08-10"),
        [win("2026-08-01", "2026-08-31", "AVAILABLE")],
        NOW,
      ),
    ).toBeNull();
  });

  it("negeert vensters die volledig in het verleden liggen", () => {
    expect(
      assessJobStartAvailability(
        new Date("2026-05-10"),
        [win("2026-05-01", "2026-05-31", "UNAVAILABLE")],
        NOW,
      ),
    ).toBeNull();
  });

  it("is inclusief op de venstergrenzen", () => {
    const start = assessJobStartAvailability(
      new Date("2026-08-01"),
      [win("2026-08-01", "2026-08-31", "UNAVAILABLE")],
      NOW,
    );
    const end = assessJobStartAvailability(
      new Date("2026-08-31"),
      [win("2026-08-01", "2026-08-31", "UNAVAILABLE")],
      NOW,
    );
    expect(start).not.toBeNull();
    expect(end).not.toBeNull();
  });

  it("geeft null net buiten het venster", () => {
    expect(
      assessJobStartAvailability(
        new Date("2026-09-01"),
        [win("2026-08-01", "2026-08-31", "UNAVAILABLE")],
        NOW,
      ),
    ).toBeNull();
  });

  it("kiest UNAVAILABLE boven LIMITED bij overlap", () => {
    const signal = assessJobStartAvailability(
      new Date("2026-08-10"),
      [
        win("2026-08-05", "2026-08-20", "LIMITED"),
        win("2026-08-01", "2026-08-31", "UNAVAILABLE", "Ziek"),
      ],
      NOW,
    );
    expect(signal!.windowType).toBe("UNAVAILABLE");
    expect(signal!.note).toBe("Ziek");
  });

  it("kiest bij gelijk type het venster met de vroegste start", () => {
    const signal = assessJobStartAvailability(
      new Date("2026-08-15"),
      [
        win("2026-08-10", "2026-08-31", "UNAVAILABLE", "later"),
        win("2026-08-01", "2026-08-20", "UNAVAILABLE", "eerder"),
      ],
      NOW,
    );
    expect(signal!.note).toBe("eerder");
  });
});
