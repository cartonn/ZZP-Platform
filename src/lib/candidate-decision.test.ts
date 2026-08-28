import { describe, expect, it } from "vitest";
import {
  candidateTier,
  DECISION_PATIENCE_DAYS,
  MODERATE_MATCH_MIN,
  STRONG_MATCH_MIN,
  summarizeCandidateDecision,
  summarizeCandidatesAwaitingDecision,
  jobDecisionChip,
  type CandidateDecisionInput,
} from "@/lib/candidate-decision";

const NOW = new Date("2026-06-25T12:00:00.000Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

function input(overrides: Partial<CandidateDecisionInput> = {}): CandidateDecisionInput {
  return {
    status: "NEW",
    matchScore: 80,
    createdAt: daysAgo(0),
    hasCollaboration: false,
    ...overrides,
  };
}

describe("candidateTier", () => {
  it("classifies on the match-score boundaries (inclusive)", () => {
    expect(candidateTier(STRONG_MATCH_MIN)).toBe("strong");
    expect(candidateTier(STRONG_MATCH_MIN - 1)).toBe("moderate");
    expect(candidateTier(MODERATE_MATCH_MIN)).toBe("moderate");
    expect(candidateTier(MODERATE_MATCH_MIN - 1)).toBe("modest");
    expect(candidateTier(0)).toBe("modest");
  });

  it("treats a missing score as the most cautious (modest) tier", () => {
    expect(candidateTier(null)).toBe("modest");
  });
});

describe("summarizeCandidateDecision", () => {
  it("returns null once the reaction is decided or led to a collaboration", () => {
    expect(summarizeCandidateDecision(input({ status: "ACCEPTED" }), NOW)).toBeNull();
    expect(summarizeCandidateDecision(input({ status: "REJECTED" }), NOW)).toBeNull();
    expect(summarizeCandidateDecision(input({ status: "WITHDRAWN" }), NOW)).toBeNull();
    expect(summarizeCandidateDecision(input({ hasCollaboration: true }), NOW)).toBeNull();
  });

  it("flags a strong candidate that waited past the short strong-tier patience", () => {
    const signal = summarizeCandidateDecision(
      input({ matchScore: 90, createdAt: daysAgo(DECISION_PATIENCE_DAYS.strong) }),
      NOW,
    );
    expect(signal).toEqual({
      kind: "urgency",
      daysWaiting: DECISION_PATIENCE_DAYS.strong,
      tier: "strong",
      attention: true,
      urgency: "high",
    });
  });

  it("does not flag a strong candidate that is still within patience", () => {
    const signal = summarizeCandidateDecision(
      input({ matchScore: 90, createdAt: daysAgo(DECISION_PATIENCE_DAYS.strong - 1) }),
      NOW,
    );
    expect(signal?.attention).toBe(false);
    expect(signal?.urgency).toBe("high");
  });

  it("gives a modest match more patience than a strong one (inverse weighting)", () => {
    const waited = daysAgo(DECISION_PATIENCE_DAYS.strong + 1);
    const strong = summarizeCandidateDecision(input({ matchScore: 95, createdAt: waited }), NOW);
    const modest = summarizeCandidateDecision(input({ matchScore: 20, createdAt: waited }), NOW);
    expect(strong?.attention).toBe(true);
    // Same wait, but a modest match (8-day patience) is not yet urgent.
    expect(modest?.attention).toBe(false);
    expect(modest?.urgency).toBe("low");
  });

  it("maps tiers to escalating urgency", () => {
    expect(summarizeCandidateDecision(input({ matchScore: 85 }), NOW)?.urgency).toBe("high");
    expect(summarizeCandidateDecision(input({ matchScore: 60 }), NOW)?.urgency).toBe("medium");
    expect(summarizeCandidateDecision(input({ matchScore: 30 }), NOW)?.urgency).toBe("low");
  });

  it("clamps a future createdAt to 0 days (never negative)", () => {
    const signal = summarizeCandidateDecision(input({ createdAt: daysAgo(-5) }), NOW);
    expect(signal?.daysWaiting).toBe(0);
    expect(signal?.attention).toBe(false);
  });

  it("counts whole days waiting", () => {
    const signal = summarizeCandidateDecision(
      input({ status: "VIEWED", matchScore: 40, createdAt: daysAgo(9) }),
      NOW,
    );
    expect(signal?.daysWaiting).toBe(9);
    expect(signal?.tier).toBe("modest");
    expect(signal?.attention).toBe(true); // modest patience is 8 days
    expect(signal?.kind).toBe("urgency");
  });

  it("turns a non-compliant strong candidate into a compliance signal, never an urgency nudge", () => {
    // Zonder blokkade: verse sterke match, geen urgentie.
    const nudge = summarizeCandidateDecision(input({ matchScore: 90, createdAt: daysAgo(0) }), NOW);
    expect(nudge).toMatchObject({ kind: "urgency", attention: false });

    // Zelfde reactie, maar compliance-geblokkeerd: altijd aandacht, en als compliance-blokkade.
    const blocked = summarizeCandidateDecision(
      input({ matchScore: 90, createdAt: daysAgo(0), complianceBlocked: true }),
      NOW,
    );
    expect(blocked).toMatchObject({ kind: "compliance", attention: true });
  });

  it("blocks on compliance regardless of how long the reaction has waited", () => {
    const blocked = summarizeCandidateDecision(
      input({ matchScore: 95, createdAt: daysAgo(39), complianceBlocked: true }),
      NOW,
    );
    expect(blocked?.kind).toBe("compliance");
    expect(blocked?.attention).toBe(true);
    expect(blocked?.daysWaiting).toBe(39);
  });
});

describe("summarizeCandidatesAwaitingDecision", () => {
  it("counts only the reactions that exceed their tier patience, plus the strong subset", () => {
    const summary = summarizeCandidatesAwaitingDecision(
      [
        input({ matchScore: 90, createdAt: daysAgo(5) }), // strong, overdue -> strong+total
        input({ matchScore: 88, createdAt: daysAgo(3) }), // strong, overdue -> strong+total
        input({ matchScore: 60, createdAt: daysAgo(5) }), // moderate, overdue -> total
        input({ matchScore: 60, createdAt: daysAgo(1) }), // moderate, within patience -> none
        input({ status: "ACCEPTED", matchScore: 95, createdAt: daysAgo(30) }), // decided -> none
        input({ hasCollaboration: true, createdAt: daysAgo(30) }), // collaborated -> none
      ],
      NOW,
    );
    expect(summary).toEqual({ total: 3, strong: 2 });
  });

  it("excludes compliance-blocked reactions from the page-wide urgency band", () => {
    const summary = summarizeCandidatesAwaitingDecision(
      [
        input({ matchScore: 90, createdAt: daysAgo(5) }), // strong urgency -> counts
        input({ matchScore: 90, createdAt: daysAgo(5), complianceBlocked: true }), // blocked -> not counted
        input({ matchScore: 60, createdAt: daysAgo(5), complianceBlocked: true }), // blocked -> not counted
      ],
      NOW,
    );
    expect(summary).toEqual({ total: 1, strong: 1 });
  });

  it("does not mutate its input and returns zero for an empty set", () => {
    const inputs = [input()];
    const snapshot = JSON.stringify(inputs);
    summarizeCandidatesAwaitingDecision(inputs, NOW);
    expect(JSON.stringify(inputs)).toBe(snapshot);
    expect(summarizeCandidatesAwaitingDecision([], NOW)).toEqual({ total: 0, strong: 0 });
  });
});

describe("jobDecisionChip", () => {
  it("returns null when nothing is waiting (quiet card stays clean)", () => {
    expect(jobDecisionChip({ total: 0, strong: 0 })).toBeNull();
    expect(jobDecisionChip({ total: -1, strong: 0 })).toBeNull();
  });

  it("uses the singular noun and a muted tone for one non-strong candidate", () => {
    expect(jobDecisionChip({ total: 1, strong: 0 })).toEqual({
      total: 1,
      strong: 0,
      tone: "muted",
      label: "1 kandidaat wacht op je beslissing",
    });
  });

  it("uses the plural noun for multiple candidates", () => {
    expect(jobDecisionChip({ total: 3, strong: 0 })).toEqual({
      total: 3,
      strong: 0,
      tone: "muted",
      label: "3 kandidaten wachten op je beslissing",
    });
  });

  it("keeps the muted tone and flags the strong match", () => {
    expect(jobDecisionChip({ total: 2, strong: 1 })).toEqual({
      total: 2,
      strong: 1,
      tone: "muted",
      label: "2 kandidaten wachten op je beslissing (sterke match)",
    });
  });

  it("clamps a strong count that exceeds the total (defensive)", () => {
    const chip = jobDecisionChip({ total: 1, strong: 5 });
    expect(chip?.strong).toBe(1);
    expect(chip?.tone).toBe("muted");
  });

  // Regressie: dit signaal is bewust een zachte herinnering zonder /acties-pariteit (geen
  // next-action, geen nav-badge). Het mag daarom nooit de alarmkleur (warning) krijgen, ook niet
  // wanneer een sterke match wacht — anders valt het visueel samen met een echte volgende actie.
  it("never uses a warning tone, even with a strong match waiting", () => {
    expect(jobDecisionChip({ total: 5, strong: 3 })?.tone).toBe("muted");
    expect(jobDecisionChip({ total: 1, strong: 1 })?.tone).toBe("muted");
  });
});
