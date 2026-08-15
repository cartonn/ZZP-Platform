import { describe, expect, it } from "vitest";
import {
  franchiseCollabAttention,
  franchiseCollabHeadline,
  renewalRowBadge,
  summarizeFranchiseCollaborations,
  type FranchiseCollabInput,
} from "@/lib/franchise/collaboration-oversight";
import { summarizeCollaborationRenewal } from "@/lib/collaboration-renewal";

const NOW = new Date("2026-07-10T12:00:00Z");

function daysFromNow(n: number): Date {
  return new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);
}

function collab(overrides: Partial<FranchiseCollabInput> = {}): FranchiseCollabInput {
  return { status: "ACTIVE", endDate: null, disputedAt: null, ...overrides };
}

describe("summarizeFranchiseCollaborations", () => {
  it("telt statussen en het vervolgvenster", () => {
    const rows: FranchiseCollabInput[] = [
      collab({ status: "ACTIVE", endDate: daysFromNow(5) }), // ending_soon (binnen 21)
      collab({ status: "ACTIVE", endDate: daysFromNow(-3) }), // overdue (binnen grace)
      collab({ status: "ACTIVE", endDate: daysFromNow(60) }), // on_track
      collab({ status: "ACTIVE", endDate: null }), // open einde, geen signaal
      collab({ status: "PROPOSED", endDate: daysFromNow(2) }),
      collab({ status: "COMPLETED", endDate: daysFromNow(2) }),
      collab({ status: "CANCELLED", endDate: null }),
    ];
    const s = summarizeFranchiseCollaborations(rows, NOW);
    expect(s.total).toBe(7);
    expect(s.active).toBe(4);
    expect(s.proposed).toBe(1);
    expect(s.endingSoon).toBe(1);
    expect(s.overdue).toBe(1);
  });

  it("negeert het vervolgsignaal bij een dispuut (bevroren)", () => {
    const rows = [collab({ status: "ACTIVE", endDate: daysFromNow(3), disputedAt: NOW })];
    const s = summarizeFranchiseCollaborations(rows, NOW);
    expect(s.active).toBe(1);
    expect(s.endingSoon).toBe(0);
    expect(s.overdue).toBe(0);
  });

  it("dempt een voorbij-de-grace inzet (lapsed telt niet als aandacht)", () => {
    const rows = [collab({ status: "ACTIVE", endDate: daysFromNow(-45) })];
    const s = summarizeFranchiseCollaborations(rows, NOW);
    expect(s.overdue).toBe(0);
    expect(franchiseCollabAttention(s)).toBe(0);
  });

  it("is leeg voor een lege lijst", () => {
    const s = summarizeFranchiseCollaborations([], NOW);
    expect(s).toEqual({ total: 0, active: 0, proposed: 0, endingSoon: 0, overdue: 0 });
  });

  it("blijft consistent met summarizeCollaborationRenewal (geen drift)", () => {
    const rows = [collab({ status: "ACTIVE", endDate: daysFromNow(10) })];
    const s = summarizeFranchiseCollaborations(rows, NOW);
    const phase = summarizeCollaborationRenewal({
      status: "ACTIVE",
      endDate: daysFromNow(10),
      disputed: false,
      now: NOW,
    }).phase;
    expect(phase).toBe("ending_soon");
    expect(s.endingSoon).toBe(1);
  });
});

describe("franchiseCollabHeadline", () => {
  it("is null zonder aandacht", () => {
    const s = summarizeFranchiseCollaborations(
      [collab({ status: "ACTIVE", endDate: daysFromNow(90) })],
      NOW,
    );
    expect(franchiseCollabHeadline(s)).toBeNull();
  });

  it("is null bij een lege lijst", () => {
    expect(franchiseCollabHeadline(summarizeFranchiseCollaborations([], NOW))).toBeNull();
  });

  it("noemt beide takken enkelvoudig correct", () => {
    const s = summarizeFranchiseCollaborations(
      [
        collab({ status: "ACTIVE", endDate: daysFromNow(-2) }),
        collab({ status: "ACTIVE", endDate: daysFromNow(4) }),
      ],
      NOW,
    );
    const headline = franchiseCollabHeadline(s);
    expect(headline).toContain("1 inzet is voorbij de einddatum");
    expect(headline).toContain("1 loopt binnenkort af");
  });

  it("gebruikt meervoud bij meerdere aflopende inzetten", () => {
    const s = summarizeFranchiseCollaborations(
      [
        collab({ status: "ACTIVE", endDate: daysFromNow(3) }),
        collab({ status: "ACTIVE", endDate: daysFromNow(5) }),
      ],
      NOW,
    );
    expect(franchiseCollabHeadline(s)).toContain("2 lopen binnenkort af");
  });
});

describe("renewalRowBadge", () => {
  it("toont niets voor een rustige/onbekende fase", () => {
    expect(renewalRowBadge("on_track", 40)).toBeNull();
    expect(renewalRowBadge("lapsed", -50)).toBeNull();
    expect(renewalRowBadge("none", null)).toBeNull();
  });

  it("labelt het aflopende venster met aftelling", () => {
    expect(renewalRowBadge("ending_soon", 0)).toEqual({
      label: "Loopt vandaag af",
      tone: "warning",
    });
    expect(renewalRowBadge("ending_soon", 1)).toEqual({
      label: "Loopt morgen af",
      tone: "warning",
    });
    expect(renewalRowBadge("ending_soon", 5)).toEqual({
      label: "Loopt af over 5 dagen",
      tone: "warning",
    });
  });

  it("labelt een verlopen inzet met de overschrijding", () => {
    expect(renewalRowBadge("overdue", 0)).toEqual({ label: "Voorbij einddatum", tone: "danger" });
    expect(renewalRowBadge("overdue", -1)).toEqual({ label: "1 dag over tijd", tone: "danger" });
    expect(renewalRowBadge("overdue", -4)).toEqual({ label: "4 dagen over tijd", tone: "danger" });
  });
});
