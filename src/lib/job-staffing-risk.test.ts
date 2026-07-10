import { describe, expect, it } from "vitest";
import {
  STAFFING_APPROACHING_DAYS,
  STAFFING_URGENT_DAYS,
  staffingRiskActionLabel,
  staffingRiskHeadline,
  summarizeStaffingRisk,
  type StaffingRiskInput,
} from "./job-staffing-risk";

const NOW = new Date("2026-07-10T12:00:00Z");

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

function baseInput(overrides: Partial<StaffingRiskInput> = {}): StaffingRiskInput {
  return {
    status: "PUBLISHED",
    startDate: daysFromNow(30),
    lockedIn: false,
    applicantCount: 0,
    shortlistCount: 0,
    now: NOW,
    ...overrides,
  };
}

describe("summarizeStaffingRisk", () => {
  it("geeft geen signaal zonder startdatum", () => {
    const s = summarizeStaffingRisk(baseInput({ startDate: null }));
    expect(s.phase).toBe("none");
    expect(s.attention).toBe(false);
    expect(s.daysUntilStart).toBeNull();
  });

  it("geeft geen signaal voor een niet-gepubliceerde opdracht", () => {
    expect(
      summarizeStaffingRisk(baseInput({ status: "DRAFT", startDate: daysFromNow(1) })).phase,
    ).toBe("none");
    expect(
      summarizeStaffingRisk(baseInput({ status: "CLOSED", startDate: daysFromNow(1) })).phase,
    ).toBe("none");
  });

  it("geeft geen signaal wanneer er al iemand is vastgelegd", () => {
    const s = summarizeStaffingRisk(baseInput({ startDate: daysFromNow(1), lockedIn: true }));
    expect(s.phase).toBe("none");
    expect(s.attention).toBe(false);
  });

  it("is on_track ruim vóór de startdatum (geen aandacht)", () => {
    const s = summarizeStaffingRisk(
      baseInput({ startDate: daysFromNow(STAFFING_APPROACHING_DAYS + 1) }),
    );
    expect(s.phase).toBe("on_track");
    expect(s.attention).toBe(false);
    expect(s.tone).toBe("neutral");
  });

  it("is approaching binnen het naderingsvenster maar buiten het urgente venster", () => {
    const s = summarizeStaffingRisk(
      baseInput({ startDate: daysFromNow(STAFFING_URGENT_DAYS + 1) }),
    );
    expect(s.phase).toBe("approaching");
    expect(s.attention).toBe(true);
    expect(s.tone).toBe("warning");
  });

  it("is urgent op de grens van het urgente venster", () => {
    const s = summarizeStaffingRisk(baseInput({ startDate: daysFromNow(STAFFING_URGENT_DAYS) }));
    expect(s.phase).toBe("urgent");
    expect(s.tone).toBe("danger");
    expect(s.daysUntilStart).toBe(STAFFING_URGENT_DAYS);
  });

  it("is urgent als de opdracht vandaag start", () => {
    const s = summarizeStaffingRisk(baseInput({ startDate: daysFromNow(0) }));
    expect(s.phase).toBe("urgent");
    expect(s.daysUntilStart).toBe(0);
  });

  it("is overdue als de startdatum verstreken is", () => {
    const s = summarizeStaffingRisk(baseInput({ startDate: daysFromNow(-2) }));
    expect(s.phase).toBe("overdue");
    expect(s.tone).toBe("danger");
    expect(s.daysUntilStart).toBe(-2);
    expect(s.attention).toBe(true);
  });

  it("gebruikt hele UTC-dagen ongeacht het tijdstip binnen de dag", () => {
    const s = summarizeStaffingRisk(
      baseInput({
        now: new Date("2026-07-10T23:00:00Z"),
        startDate: new Date("2026-07-12T01:00:00Z"),
      }),
    );
    expect(s.daysUntilStart).toBe(2);
    expect(s.phase).toBe("urgent");
  });

  it("kiest de shortlist-actie boven de reactie-actie", () => {
    const s = summarizeStaffingRisk(
      baseInput({ startDate: daysFromNow(1), applicantCount: 4, shortlistCount: 2 }),
    );
    expect(s.action).toBe("review_shortlist");
  });

  it("kiest de reactie-actie als er reacties maar geen shortlist zijn", () => {
    const s = summarizeStaffingRisk(
      baseInput({ startDate: daysFromNow(1), applicantCount: 3, shortlistCount: 0 }),
    );
    expect(s.action).toBe("review_applicants");
  });

  it("kiest widen_reach zonder enige reactie", () => {
    const s = summarizeStaffingRisk(baseInput({ startDate: daysFromNow(1) }));
    expect(s.action).toBe("widen_reach");
  });

  it("respecteert aangepaste vensters", () => {
    const s = summarizeStaffingRisk(
      baseInput({ startDate: daysFromNow(5), urgentDays: 2, approachingDays: 4 }),
    );
    expect(s.phase).toBe("on_track");
  });
});

describe("staffingRiskHeadline", () => {
  it("formuleert de urgente/naderende koppen op dagbasis", () => {
    expect(staffingRiskHeadline("urgent", 0)).toBe(
      "De opdracht start vandaag — nog niemand vastgelegd",
    );
    expect(staffingRiskHeadline("urgent", 1)).toBe(
      "De opdracht start morgen — nog niemand vastgelegd",
    );
    expect(staffingRiskHeadline("approaching", 6)).toBe(
      "De opdracht start over 6 dagen — nog niemand vastgelegd",
    );
  });

  it("formuleert de overdue-kop", () => {
    expect(staffingRiskHeadline("overdue", -1)).toBe(
      "De startdatum was gisteren — nog niemand vastgelegd",
    );
    expect(staffingRiskHeadline("overdue", -5)).toBe(
      "De startdatum is verstreken — nog niemand vastgelegd",
    );
  });

  it("formuleert de rustige on_track-kop", () => {
    expect(staffingRiskHeadline("on_track", 20)).toBe("De opdracht is op tijd te bezetten");
  });
});

describe("staffingRiskActionLabel", () => {
  it("geeft een concrete zin per actie", () => {
    expect(staffingRiskActionLabel("review_shortlist")).toContain("shortlist");
    expect(staffingRiskActionLabel("review_applicants")).toContain("reacties");
    expect(staffingRiskActionLabel("widen_reach")).toContain("uit");
  });
});
