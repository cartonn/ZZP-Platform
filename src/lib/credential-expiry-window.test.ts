import { describe, expect, it } from "vitest";
import {
  assessCollaborationCredentials,
  clientHasComplianceAction,
  clientCredentialAlertsFromRows,
} from "./collaboration-alerts";
import { collaborationCredentialExpiryConcerns } from "./collaboration-credential-expiry";
import {
  CREDENTIAL_EXPIRY_WINDOW_MS,
  daysUntilExpiry,
  isExpiringSoon,
  rosterExpiringByProfile,
} from "./credentials";

import { planExpiryRun } from "./expiry";

const now = new Date("2026-09-27T12:00:00Z");
const cutoff = new Date(now.getTime() + CREDENTIAL_EXPIRY_WINDOW_MS);
const placement = {
  collaborationId: "placement",
  companyName: "Synthetic",
  jobTitle: "Synthetic",
  requiredTypes: ["LICENSE" as const],
  endDate: null,
};
describe("exact 720-hour client/freelancer expiry parity", () => {
  it.each([
    [-1, true],
    [0, true],
    [1, false],
    [43_200_000, false],
    [86_399_999, false],
    [86_400_000, false],
  ] as const)("offset %i ms beyond cutoff => %s", (offset, expected) => {
    const credential = {
      id: "license",
      title: "License",
      type: "LICENSE" as const,
      status: "VERIFIED" as const,
      expiresAt: new Date(cutoff.getTime() + offset),
    };
    const freelancer = collaborationCredentialExpiryConcerns({
      credentials: [credential],
      collaborations: [placement],
      now,
    });
    const roster = rosterExpiringByProfile(
      [{ ...credential, freelancerProfileId: "synthetic", freelancerName: "Synthetic" }],
      now,
      cutoff,
    );
    const alert = assessCollaborationCredentials(["LICENSE"], [credential], now);
    const rows = clientCredentialAlertsFromRows(
      [
        {
          id: "placement",
          disputedAt: null,
          endDate: null,
          job: {
            id: "job",
            title: "Synthetic",
            credentialRequirements: [{ credentialType: "LICENSE" }],
          },
          freelancer: { user: { name: "Synthetic" }, credentials: [credential] },
        },
      ],
      now,
    );
    expect(freelancer.length > 0).toBe(expected);
    expect(roster.length > 0).toBe(expected);
    expect({ clientAction: clientHasComplianceAction(alert), rowAlert: rows.length > 0 }).toEqual({
      clientAction: expected,
      rowAlert: expected,
    });
  });
});

describe("exact configurable expiry window", () => {
  it.each([0.5, 7, 30])("keeps the inclusive %s-day boundary exact", (windowDays) => {
    const expiresAt = new Date(now.getTime() + windowDays * 86_400_000);
    const candidate = {
      id: "synthetic",
      userId: "owner",
      title: "License",
      status: "VERIFIED" as const,
      expiresAt,
      expiryReminderFor: null,
    };
    expect(isExpiringSoon(candidate, windowDays, now)).toBe(true);
    expect(planExpiryRun([candidate], now, windowDays).toRemind).toEqual([
      {
        id: "synthetic",
        userId: "owner",
        title: "License",
        expiresAt,
        daysLeft: Math.floor(windowDays),
      },
    ]);
    const outside = { ...candidate, expiresAt: new Date(expiresAt.getTime() + 1) };
    expect(isExpiringSoon(outside, windowDays, now)).toBe(false);
    expect(planExpiryRun([outside], now, windowDays)).toEqual({ toExpire: [], toRemind: [] });
  });

  it("keeps fractional days floored for display without using them as an eligibility gate", () => {
    const expiresAt = new Date(cutoff.getTime() + 43_200_000);
    expect(daysUntilExpiry(expiresAt, now)).toBe(30);
    expect(isExpiringSoon({ status: "VERIFIED", expiresAt }, 30, now)).toBe(false);
  });

  it("preserves absent-date, nonverified and already-expired guards", () => {
    for (const status of ["DRAFT", "SUBMITTED", "REJECTED", "EXPIRED"] as const) {
      expect(isExpiringSoon({ status, expiresAt: cutoff }, 30, now)).toBe(false);
    }
    for (const expiresAt of [null, undefined, now, new Date(now.getTime() - 1)]) {
      expect(isExpiringSoon({ status: "VERIFIED", expiresAt }, 30, now)).toBe(false);
    }
    expect(
      isExpiringSoon({ status: "VERIFIED", expiresAt: new Date(now.getTime() + 1) }, 0, now),
    ).toBe(false);
  });

  it("starts the reminder exactly on entry and preserves expiry-date deduplication", () => {
    const expiresAt = new Date(cutoff.getTime() + 1);
    const candidate = {
      id: "synthetic",
      userId: "owner",
      title: "License",
      status: "VERIFIED" as const,
      expiresAt,
      expiryReminderFor: null,
    };
    expect(planExpiryRun([candidate], now).toRemind).toEqual([]);
    const entered = new Date(now.getTime() + 1);
    expect(planExpiryRun([candidate], entered).toRemind).toHaveLength(1);
    expect(
      planExpiryRun([{ ...candidate, expiryReminderFor: expiresAt }], entered).toRemind,
    ).toEqual([]);
    const expired = planExpiryRun([candidate], expiresAt);
    expect(expired.toRemind).toEqual([]);
    expect(expired.toExpire).toEqual([{ id: "synthetic", userId: "owner", title: "License" }]);
  });

  it("keeps a beyond-window warning tied to placement end instead of misclassifying it as soon", () => {
    const credential = {
      type: "LICENSE" as const,
      status: "VERIFIED" as const,
      expiresAt: new Date(cutoff.getTime() + 43_200_000),
    };
    const alert = assessCollaborationCredentials(
      ["LICENSE"],
      [credential],
      now,
      30,
      new Date(cutoff.getTime() + 86_400_000),
    );
    expect(alert.expiringSoon).toEqual([]);
    expect(alert.expiringDuringPlacement).toEqual(["LICENSE"]);
    expect(clientHasComplianceAction(alert)).toBe(true);
  });
});
