import { describe, expect, it } from "vitest";
import {
  ROSTER_ENGAGEABILITY_SELECT,
  evaluateRosterEngageability,
  type RosterEngageabilityRow,
} from "./roster-engageability";

const now = new Date("2026-08-18T12:00:00.000Z");

function row(overrides: Partial<RosterEngageabilityRow> = {}): RosterEngageabilityRow {
  return {
    id: "prof-1",
    completeness: 100,
    availability: "AVAILABLE",
    user: { name: "ZZP'er", identityVerifiedAt: now, lastLoginAt: now },
    credentials: [
      { type: "VOG", status: "VERIFIED", expiresAt: null },
      { type: "INSURANCE", status: "VERIFIED", expiresAt: null },
    ],
    ...overrides,
  };
}

describe("evaluateRosterEngageability", () => {
  it("ACTIEF wanneer alle verplichte documenten geldig en profiel compleet is", () => {
    expect(evaluateRosterEngageability(row(), now).status).toBe("ACTIEF");
  });

  it("INACTIEF wanneer een verplicht document ontbreekt (plaatsing-blokkerend)", () => {
    const eng = evaluateRosterEngageability(row({ credentials: [] }), now);
    expect(eng.status).toBe("INACTIEF");
    expect(eng.blockers.length).toBeGreaterThan(0);
  });

  it("INACTIEF wanneer een verplicht document verlopen is", () => {
    const eng = evaluateRosterEngageability(
      row({
        credentials: [
          { type: "VOG", status: "VERIFIED", expiresAt: new Date("2026-01-01T00:00:00.000Z") },
          { type: "INSURANCE", status: "VERIFIED", expiresAt: null },
        ],
      }),
      now,
    );
    expect(eng.status).toBe("INACTIEF");
  });

  it("de gedeelde select bevat de velden die de evaluatie nodig heeft", () => {
    expect(ROSTER_ENGAGEABILITY_SELECT).toMatchObject({
      id: true,
      completeness: true,
      availability: true,
      user: { select: { identityVerifiedAt: true, lastLoginAt: true } },
      credentials: { select: { type: true, status: true, expiresAt: true } },
    });
  });
});
