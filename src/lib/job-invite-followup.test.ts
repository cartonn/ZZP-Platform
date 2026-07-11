import { describe, expect, it } from "vitest";
import {
  parseInviteRecords,
  summarizeInviteFollowup,
  type InviteRecord,
} from "@/lib/job-invite-followup";

const NOW = new Date("2026-07-11T12:00:00Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

function invite(freelancerId: string, days: number): InviteRecord {
  return { freelancerId, invitedAt: daysAgo(days) };
}

describe("summarizeInviteFollowup", () => {
  it("returns the none-tone with no headline when nothing is invited", () => {
    const result = summarizeInviteFollowup([], new Set(), NOW);
    expect(result).toEqual({
      invited: 0,
      responded: 0,
      pending: 0,
      responseRate: null,
      oldestPendingDays: null,
      tone: "none",
      headline: null,
    });
  });

  it("counts responded vs pending and computes the response rate", () => {
    const invites = [invite("a", 3), invite("b", 3), invite("c", 3), invite("d", 3)];
    const result = summarizeInviteFollowup(invites, new Set(["a", "b"]), NOW);
    expect(result.invited).toBe(4);
    expect(result.responded).toBe(2);
    expect(result.pending).toBe(2);
    expect(result.responseRate).toBe(50);
  });

  it("marks a full response as good with a specific headline", () => {
    const invites = [invite("a", 2), invite("b", 2)];
    const result = summarizeInviteFollowup(invites, new Set(["a", "b"]), NOW);
    expect(result.tone).toBe("good");
    expect(result.pending).toBe(0);
    expect(result.headline).toBe("Alle uitgenodigde ZZP'ers hebben gereageerd.");
  });

  it("treats a >=50% response rate as good even with some pending", () => {
    const invites = [invite("a", 1), invite("b", 1), invite("c", 1)];
    const result = summarizeInviteFollowup(invites, new Set(["a", "b"]), NOW);
    expect(result.responseRate).toBe(67);
    expect(result.tone).toBe("good");
  });

  it("warns when nobody responded and an invite has gone stale", () => {
    const invites = [invite("a", 10), invite("b", 3)];
    const result = summarizeInviteFollowup(invites, new Set(), NOW);
    expect(result.responded).toBe(0);
    expect(result.tone).toBe("warning");
    expect(result.oldestPendingDays).toBe(10);
    expect(result.headline).toContain("verruim je bereik");
  });

  it("stays neutral when nobody responded but no invite is stale yet", () => {
    const invites = [invite("a", 2), invite("b", 1)];
    const result = summarizeInviteFollowup(invites, new Set(), NOW);
    expect(result.tone).toBe("neutral");
    expect(result.headline).toBe("0 reageerde, 2 wachten nog.");
  });

  it("uses the singular 'wacht' for exactly one pending invite", () => {
    // 1 invited, nobody responded, not stale -> neutral with a single pending invite.
    const result = summarizeInviteFollowup([invite("a", 1)], new Set(), NOW);
    expect(result.tone).toBe("neutral");
    expect(result.headline).toBe("0 reageerde, 1 wacht nog.");
  });

  it("dedupes duplicate invites per freelancer and keeps the earliest date", () => {
    const invites = [invite("a", 2), invite("a", 9), invite("b", 1)];
    const result = summarizeInviteFollowup(invites, new Set(), NOW);
    expect(result.invited).toBe(2);
    // earliest (9 days ago) is kept for freelancer a -> stale, nobody responded -> warning
    expect(result.oldestPendingDays).toBe(9);
    expect(result.tone).toBe("warning");
  });

  it("clamps a future invitedAt to a non-negative age", () => {
    const invites = [{ freelancerId: "a", invitedAt: new Date(NOW.getTime() + 86_400_000) }];
    const result = summarizeInviteFollowup(invites, new Set(), NOW);
    expect(result.oldestPendingDays).toBe(0);
  });

  it("ignores a responded id that was never invited", () => {
    const invites = [invite("a", 1)];
    const result = summarizeInviteFollowup(invites, new Set(["a", "x", "y"]), NOW);
    expect(result.invited).toBe(1);
    expect(result.responded).toBe(1);
    expect(result.pending).toBe(0);
  });
});

describe("parseInviteRecords", () => {
  const at = new Date("2026-07-01T00:00:00Z");

  it("extracts freelancerId + createdAt from valid records", () => {
    const records = parseInviteRecords([
      { metadata: JSON.stringify({ freelancerId: "f1" }), createdAt: at },
      { metadata: JSON.stringify({ freelancerId: "f2" }), createdAt: at },
    ]);
    expect(records).toEqual([
      { freelancerId: "f1", invitedAt: at },
      { freelancerId: "f2", invitedAt: at },
    ]);
  });

  it("skips null, malformed and freelancerId-less metadata without throwing", () => {
    const records = parseInviteRecords([
      { metadata: null, createdAt: at },
      { metadata: "{not json", createdAt: at },
      { metadata: JSON.stringify({ other: "x" }), createdAt: at },
      { metadata: JSON.stringify({ freelancerId: 42 }), createdAt: at },
      { metadata: JSON.stringify({ freelancerId: "f9" }), createdAt: at },
    ]);
    expect(records).toEqual([{ freelancerId: "f9", invitedAt: at }]);
  });
});
