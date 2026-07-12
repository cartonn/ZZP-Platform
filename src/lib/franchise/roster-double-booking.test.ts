import { describe, expect, it } from "vitest";
import {
  detectDoubleBooking,
  FAR_FUTURE,
  type ActivePlacement,
  type DoubleBookingInput,
} from "./roster-double-booking";

const placement = (overrides: Partial<ActivePlacement> = {}): ActivePlacement => ({
  collaborationId: "c1",
  jobId: "job-A",
  jobTitle: "Nachtdienst verpleegkundige",
  startDate: new Date("2026-08-01T00:00:00.000Z"),
  endDate: new Date("2026-08-31T00:00:00.000Z"),
  ...overrides,
});

const input = (overrides: Partial<DoubleBookingInput> = {}): DoubleBookingInput => ({
  dienstStart: new Date("2026-08-15T00:00:00.000Z"),
  dienstJobId: "job-Z",
  placements: [],
  ...overrides,
});

describe("detectDoubleBooking", () => {
  it("geeft geen signaal wanneer de dienststart onbekend is (null)", () => {
    const signal = detectDoubleBooking(input({ dienstStart: null, placements: [placement()] }));
    expect(signal).toEqual({ count: 0, firstTitle: null });
  });

  it("geeft geen signaal zonder plaatsingen", () => {
    expect(detectDoubleBooking(input({ placements: [] }))).toEqual({ count: 0, firstTitle: null });
  });

  it("detecteert één overlappende plaatsing", () => {
    const signal = detectDoubleBooking(input({ placements: [placement()] }));
    expect(signal.count).toBe(1);
    expect(signal.firstTitle).toBe("Nachtdienst verpleegkundige");
  });

  it("sluit de plaatsing op de dienst zelf uit (jobId === dienstJobId)", () => {
    const signal = detectDoubleBooking(
      input({
        dienstJobId: "job-A",
        placements: [placement({ jobId: "job-A" })],
      }),
    );
    expect(signal).toEqual({ count: 0, firstTitle: null });
  });

  it("negeert een plaatsing zonder startdatum (te onzeker)", () => {
    const signal = detectDoubleBooking(input({ placements: [placement({ startDate: null })] }));
    expect(signal).toEqual({ count: 0, firstTitle: null });
  });

  it("laat een open einde (endDate null) doorlopen tot ver in de toekomst", () => {
    const signal = detectDoubleBooking(
      input({
        dienstStart: new Date("2030-01-01T00:00:00.000Z"),
        placements: [placement({ endDate: null })],
      }),
    );
    expect(signal.count).toBe(1);
    expect(signal.firstTitle).toBe("Nachtdienst verpleegkundige");
  });

  it("telt de grens inclusief wanneer de dienststart gelijk is aan startDate", () => {
    const signal = detectDoubleBooking(
      input({
        dienstStart: new Date("2026-08-01T00:00:00.000Z"),
        placements: [placement()],
      }),
    );
    expect(signal.count).toBe(1);
  });

  it("telt de grens inclusief wanneer de dienststart gelijk is aan endDate", () => {
    const signal = detectDoubleBooking(
      input({
        dienstStart: new Date("2026-08-31T00:00:00.000Z"),
        placements: [placement()],
      }),
    );
    expect(signal.count).toBe(1);
  });

  it("geeft geen overlap wanneer de dienststart vóór de looptijd-start valt", () => {
    const signal = detectDoubleBooking(
      input({
        dienstStart: new Date("2026-07-31T00:00:00.000Z"),
        placements: [placement()],
      }),
    );
    expect(signal).toEqual({ count: 0, firstTitle: null });
  });

  it("geeft geen overlap wanneer de dienststart ná het looptijd-eind valt", () => {
    const signal = detectDoubleBooking(
      input({
        dienstStart: new Date("2026-09-01T00:00:00.000Z"),
        placements: [placement()],
      }),
    );
    expect(signal).toEqual({ count: 0, firstTitle: null });
  });

  it("telt meerdere overlaps en kiest de vroegst-startende als firstTitle", () => {
    const signal = detectDoubleBooking(
      input({
        dienstStart: new Date("2026-08-15T00:00:00.000Z"),
        placements: [
          placement({
            collaborationId: "c-late",
            jobId: "job-B",
            jobTitle: "Latere opdracht",
            startDate: new Date("2026-08-10T00:00:00.000Z"),
            endDate: new Date("2026-08-20T00:00:00.000Z"),
          }),
          placement({
            collaborationId: "c-early",
            jobId: "job-C",
            jobTitle: "Vroegste opdracht",
            startDate: new Date("2026-08-01T00:00:00.000Z"),
            endDate: null,
          }),
        ],
      }),
    );
    expect(signal.count).toBe(2);
    expect(signal.firstTitle).toBe("Vroegste opdracht");
  });

  it("negeert niet-overlappende plaatsingen bij het bepalen van de telling en titel", () => {
    const signal = detectDoubleBooking(
      input({
        dienstStart: new Date("2026-08-15T00:00:00.000Z"),
        placements: [
          placement({ jobId: "job-B", jobTitle: "Overlapt" }),
          placement({
            collaborationId: "c-out",
            jobId: "job-C",
            jobTitle: "Valt buiten",
            startDate: new Date("2026-09-01T00:00:00.000Z"),
            endDate: new Date("2026-09-30T00:00:00.000Z"),
          }),
        ],
      }),
    );
    expect(signal.count).toBe(1);
    expect(signal.firstTitle).toBe("Overlapt");
  });

  it("muteert de invoer-array niet", () => {
    const placements = [
      placement({ jobId: "job-B", startDate: new Date("2026-08-12T00:00:00.000Z") }),
      placement({ jobId: "job-C", startDate: new Date("2026-08-02T00:00:00.000Z") }),
    ];
    const snapshot = placements.map((p) => p.startDate?.getTime());
    detectDoubleBooking(input({ placements }));
    expect(placements.map((p) => p.startDate?.getTime())).toEqual(snapshot);
  });

  it("stelt FAR_FUTURE in op de maximaal representeerbare Date", () => {
    expect(FAR_FUTURE.getTime()).toBe(8640000000000000);
  });
});
