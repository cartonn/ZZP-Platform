import { describe, expect, it } from "vitest";

import {
  STALE_DRAFT_JOB_DAYS,
  draftAgeDays,
  summarizeDraftJobAging,
  type DraftJobInput,
} from "./draft-job-aging";

const NOW = new Date("2026-08-30T12:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

describe("draftAgeDays", () => {
  it("telt hele verstreken dagen", () => {
    expect(draftAgeDays(daysAgo(0), NOW)).toBe(0);
    expect(draftAgeDays(daysAgo(1), NOW)).toBe(1);
    expect(draftAgeDays(daysAgo(20), NOW)).toBe(20);
  });

  it("klemt een toekomstige updatedAt (data-ruis) op 0", () => {
    expect(draftAgeDays(new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000), NOW)).toBe(0);
  });
});

describe("summarizeDraftJobAging", () => {
  it("lege invoer → geen stille concepten, geen verse", () => {
    expect(summarizeDraftJobAging([], NOW)).toEqual({ stale: [], freshCount: 0 });
  });

  it("splitst op de drempel: vers blijft telling, stil wordt eigen item", () => {
    const drafts: DraftJobInput[] = [
      { jobId: "fresh", title: "Vers concept", updatedAt: daysAgo(3) },
      { jobId: "old", title: "Oud concept", updatedAt: daysAgo(20) },
    ];
    const result = summarizeDraftJobAging(drafts, NOW);
    expect(result.freshCount).toBe(1);
    expect(result.stale).toEqual([{ jobId: "old", title: "Oud concept", ageDays: 20 }]);
  });

  it("de drempeldag zelf telt al als stil (>=)", () => {
    const drafts: DraftJobInput[] = [
      { jobId: "edge", title: "Grens", updatedAt: daysAgo(STALE_DRAFT_JOB_DAYS) },
      { jobId: "under", title: "Net vers", updatedAt: daysAgo(STALE_DRAFT_JOB_DAYS - 1) },
    ];
    const result = summarizeDraftJobAging(drafts, NOW);
    expect(result.stale.map((s) => s.jobId)).toEqual(["edge"]);
    expect(result.freshCount).toBe(1);
  });

  it("sorteert stille concepten oudste eerst", () => {
    const drafts: DraftJobInput[] = [
      { jobId: "a", title: "A", updatedAt: daysAgo(15) },
      { jobId: "b", title: "B", updatedAt: daysAgo(40) },
      { jobId: "c", title: "C", updatedAt: daysAgo(22) },
    ];
    const result = summarizeDraftJobAging(drafts, NOW);
    expect(result.stale.map((s) => s.jobId)).toEqual(["b", "c", "a"]);
    expect(result.freshCount).toBe(0);
  });

  it("houdt gelijke leeftijd in invoervolgorde (stabiel)", () => {
    const drafts: DraftJobInput[] = [
      { jobId: "first", title: "Eerste", updatedAt: daysAgo(18) },
      { jobId: "second", title: "Tweede", updatedAt: daysAgo(18) },
    ];
    const result = summarizeDraftJobAging(drafts, NOW);
    expect(result.stale.map((s) => s.jobId)).toEqual(["first", "second"]);
  });
});
