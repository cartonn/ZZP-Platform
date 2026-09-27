import { describe, expect, it } from "vitest";
import { assessCollaborationCredentials } from "./collaboration-alerts";
import {
  collaborationCredentialExpiryConcerns,
  type CollabCredentialInput,
  type CollabRequirementInput,
} from "./collaboration-credential-expiry";

const now = new Date("2026-09-27T00:00:00Z");
const day = 86_400_000;
const atDay = (days: number, offset = 0) => new Date(now.getTime() + days * day + offset);
const credential = (expiresAt: Date | null, id = "vog"): CollabCredentialInput => ({
  id,
  title: "VOG",
  type: "VOG",
  status: "VERIFIED",
  expiresAt,
});
const placement = (
  endDate: Date | null,
  collaborationId = "placement",
): CollabRequirementInput => ({
  collaborationId,
  companyName: "Testbedrijf",
  jobTitle: "Testopdracht",
  requiredTypes: ["VOG"],
  endDate,
});

describe("placement-end expiry boundary", () => {
  it.each([
    [-1, 1],
    [0, 0],
    [1, 0],
  ])("matches the client at placement end plus %i ms", (offset, expected) => {
    const credentials = [credential(atDay(60, offset))];
    const concerns = collaborationCredentialExpiryConcerns({
      now,
      credentials,
      collaborations: [placement(atDay(60))],
    });
    const client = assessCollaborationCredentials(["VOG"], credentials, now, 30, atDay(60));
    expect(client.expiringDuringPlacement).toHaveLength(expected);
    expect(concerns).toHaveLength(expected);
    if (expected) expect(concerns[0]!.duringPlacementOnly).toBe(true);
  });

  it.each([null, atDay(10), atDay(30)])("keeps day 30 inclusive for end date %s", (endDate) => {
    const concerns = collaborationCredentialExpiryConcerns({
      now,
      credentials: [credential(atDay(30))],
      collaborations: [placement(endDate)],
    });
    expect(concerns).toHaveLength(1);
    expect(concerns[0]!.duringPlacementOnly).toBe(false);
  });

  it.each([null, undefined])("has no placement extension without an end date (%s)", (endDate) => {
    expect(
      collaborationCredentialExpiryConcerns({
        now,
        credentials: [credential(atDay(30, 1))],
        collaborations: [{ ...placement(null), endDate }],
      }),
    ).toEqual([]);
  });

  it("groups only affected placements once, in input order", () => {
    const longer = placement(atDay(90), "longer");
    const concerns = collaborationCredentialExpiryConcerns({
      now,
      credentials: [credential(atDay(60))],
      collaborations: [
        placement(atDay(60), "equal"),
        longer,
        placement(null, "open"),
        placement(atDay(45), "shorter"),
        longer,
        placement(atDay(60, 1), "just-longer"),
      ],
    });
    expect(concerns).toHaveLength(1);
    expect(concerns[0]!.collaborations.map((c) => c.collaborationId)).toEqual([
      "longer",
      "just-longer",
    ]);
    expect(concerns[0]!.duringPlacementOnly).toBe(true);
  });

  it("uses the later verified replacement at the exact boundary", () => {
    expect(
      collaborationCredentialExpiryConcerns({
        now,
        credentials: [credential(atDay(10), "old"), credential(atDay(60), "replacement")],
        collaborations: [placement(atDay(60))],
      }),
    ).toEqual([]);
  });

  it("retains a valid fallback when the later replacement is not verified", () => {
    const concerns = collaborationCredentialExpiryConcerns({
      now,
      credentials: [
        credential(atDay(45), "fallback"),
        { ...credential(atDay(60), "pending"), status: "SUBMITTED" },
      ],
      collaborations: [placement(atDay(60))],
    });
    expect(concerns.map((c) => c.credentialId)).toEqual(["fallback"]);
  });

  it("keeps permanent verified coverage across multiple placements", () => {
    expect(
      collaborationCredentialExpiryConcerns({
        now,
        credentials: [credential(atDay(60)), credential(null, "permanent")],
        collaborations: [placement(atDay(60)), placement(atDay(90), "longer")],
      }),
    ).toEqual([]);
  });
});
