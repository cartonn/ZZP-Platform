import { describe, it, expect } from "vitest";
import {
  applicationStartUrgency,
  type ApplicationStartUrgencyInput,
} from "./application-start-urgency";

// Vast referentiemoment (UTC-middernacht-stabiel).
const NOW = new Date("2026-03-10T09:00:00.000Z");

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 86_400_000);
}

function baseInput(
  overrides: Partial<ApplicationStartUrgencyInput> = {},
): ApplicationStartUrgencyInput {
  return {
    applicationStatus: "NEW",
    hasCollaboration: false,
    jobDead: false,
    startDate: daysFromNow(2),
    now: NOW,
    ...overrides,
  };
}

describe("applicationStartUrgency", () => {
  it("markeert een aanstaande urgente start (≤3 dagen) als urgent", () => {
    const result = applicationStartUrgency(baseInput({ startDate: daysFromNow(2) }));
    expect(result).toEqual({ tone: "urgent", label: "Begint over 2 dagen — nog geen beslissing" });
  });

  it("gebruikt 'vandaag'/'morgen' uit de proximity-tekst", () => {
    expect(applicationStartUrgency(baseInput({ startDate: daysFromNow(0) }))).toEqual({
      tone: "urgent",
      label: "Begint vandaag — nog geen beslissing",
    });
    expect(applicationStartUrgency(baseInput({ startDate: daysFromNow(1) }))).toEqual({
      tone: "urgent",
      label: "Begint morgen — nog geen beslissing",
    });
  });

  it("markeert een start binnen de soon-horizon maar niet dringend als soon (gedempt)", () => {
    const result = applicationStartUrgency(baseInput({ startDate: daysFromNow(7) }));
    expect(result).toEqual({ tone: "soon", label: "Begint over 7 dagen — nog geen beslissing" });
  });

  it("markeert een reeds verstreken start als urgent (nog geen beslissing)", () => {
    const result = applicationStartUrgency(baseInput({ startDate: daysFromNow(-4) }));
    expect(result).toEqual({
      tone: "urgent",
      label: "Startdatum verstreken — nog geen beslissing",
    });
  });

  it("zwijgt wanneer de start verder weg ligt dan de soon-horizon (>14 dagen)", () => {
    expect(applicationStartUrgency(baseInput({ startDate: daysFromNow(20) }))).toBeNull();
  });

  it("zwijgt wanneer de start langer dan de horizon geleden is (>30 dagen)", () => {
    expect(applicationStartUrgency(baseInput({ startDate: daysFromNow(-45) }))).toBeNull();
  });

  it("zwijgt zonder startdatum", () => {
    expect(applicationStartUrgency(baseInput({ startDate: null }))).toBeNull();
  });

  it("zwijgt zodra er een eigen samenwerking uit de reactie is voortgekomen", () => {
    expect(
      applicationStartUrgency(baseInput({ hasCollaboration: true, startDate: daysFromNow(1) })),
    ).toBeNull();
  });

  it("zwijgt wanneer de opdracht dood is (gesloten/vervuld)", () => {
    expect(
      applicationStartUrgency(baseInput({ jobDead: true, startDate: daysFromNow(1) })),
    ).toBeNull();
  });

  it("zwijgt voor een reeds-besliste reactie (REJECTED/ACCEPTED/WITHDRAWN)", () => {
    for (const applicationStatus of ["REJECTED", "ACCEPTED", "WITHDRAWN"] as const) {
      expect(
        applicationStartUrgency(baseInput({ applicationStatus, startDate: daysFromNow(1) })),
      ).toBeNull();
    }
  });

  it("werkt voor alle openstaande statussen (NEW/VIEWED/SHORTLIST)", () => {
    for (const applicationStatus of ["NEW", "VIEWED", "SHORTLIST"] as const) {
      expect(
        applicationStartUrgency(baseInput({ applicationStatus, startDate: daysFromNow(1) })),
      ).toEqual({ tone: "urgent", label: "Begint morgen — nog geen beslissing" });
    }
  });
});
