import { describe, expect, it, vi, beforeEach } from "vitest";
import { parseGraceDays } from "./config";
import {
  graceCutoff,
  isGraceEligible,
  overduePerformanceGraceWhere,
  type GraceCandidate,
} from "./performance-grace-task";

// --- Runner-tests voor runPerformanceGraceTask ------------------------------

const store = {
  performances: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    performance: {
      findMany: vi.fn(async () => store.performances),
    },
  },
}));

vi.mock("@/lib/cascade/commands", () => ({
  autoApprovePerformance: vi.fn(async () => ({ ok: true })),
}));

const NOW = new Date("2026-06-09T12:00:00.000Z");

describe("overduePerformanceGraceWhere", () => {
  it("beschrijft precies de auto-goedkeur-kandidaten (SUBMITTED, over cutoff, niet geannuleerd/betwist)", () => {
    const cutoff = graceCutoff(NOW, 3);
    // Zelfde vorm als de findMany-where in runPerformanceGraceTask én de metrics-gauge-telling:
    // één bron van waarheid, zodat de stille-faal-gauge niet kan driften t.o.v. de cron.
    expect(overduePerformanceGraceWhere(cutoff)).toEqual({
      status: "SUBMITTED",
      submittedAt: { not: null, lte: cutoff },
      collaboration: { status: { not: "CANCELLED" }, disputedAt: null },
    });
  });
});

describe("parseGraceDays", () => {
  it("is uit (0) bij leeg, ontbrekend of ongeldig", () => {
    expect(parseGraceDays(undefined)).toBe(0);
    expect(parseGraceDays("")).toBe(0);
    expect(parseGraceDays("  ")).toBe(0);
    expect(parseGraceDays("nee")).toBe(0);
    expect(parseGraceDays("0")).toBe(0);
    expect(parseGraceDays("-3")).toBe(0);
  });

  it("parseert een positief geheel aantal dagen", () => {
    expect(parseGraceDays("7")).toBe(7);
    expect(parseGraceDays("5.9")).toBe(5);
  });
});

describe("graceCutoff", () => {
  it("ligt het opgegeven aantal dagen vóór nu", () => {
    const now = new Date("2026-06-09T12:00:00.000Z");
    expect(graceCutoff(now, 7).toISOString()).toBe("2026-06-02T12:00:00.000Z");
  });
});

describe("isGraceEligible", () => {
  const cutoff = new Date("2026-06-02T12:00:00.000Z");
  const base: GraceCandidate = {
    status: "SUBMITTED",
    submittedAt: new Date("2026-06-01T00:00:00.000Z"),
    collabStatus: "ACTIVE",
    disputedAt: null,
  };

  it("keurt een tijdige, ingediende, schone prestatie goed", () => {
    expect(isGraceEligible(base, cutoff)).toBe(true);
  });

  it("slaat een te recent ingediende prestatie over", () => {
    expect(
      isGraceEligible({ ...base, submittedAt: new Date("2026-06-05T00:00:00.000Z") }, cutoff),
    ).toBe(false);
  });

  it("slaat niet-ingediende, betwiste of geannuleerde gevallen over", () => {
    expect(isGraceEligible({ ...base, status: "APPROVED" }, cutoff)).toBe(false);
    expect(isGraceEligible({ ...base, submittedAt: null }, cutoff)).toBe(false);
    expect(
      isGraceEligible({ ...base, disputedAt: new Date("2026-06-01T00:00:00.000Z") }, cutoff),
    ).toBe(false);
    expect(isGraceEligible({ ...base, collabStatus: "CANCELLED" }, cutoff)).toBe(false);
  });
});

// --- Runner-tests -----------------------------------------------------------

describe("runPerformanceGraceTask", () => {
  beforeEach(async () => {
    store.performances = [];
    vi.resetModules();
    delete process.env.PERFORMANCE_GRACE_DAYS;
  });

  it("grace-venster uit (PERFORMANCE_GRACE_DAYS niet gezet) → enabled = false, geen DB-query", async () => {
    const { runPerformanceGraceTask } = await import("@/lib/performance-grace-task");
    const result = await runPerformanceGraceTask({ actorId: null, now: NOW });
    expect(result).toEqual({ enabled: false, considered: 0, approved: 0 });
  });

  it("happy path — prestatie over grace-grens → goedgekeurd", async () => {
    process.env.PERFORMANCE_GRACE_DAYS = "7";
    // Ingediend 8 dagen geleden → voorbij 7-dagengrens
    const submittedAt = new Date(NOW.getTime() - 8 * 24 * 60 * 60 * 1000);
    store.performances = [
      {
        id: "perf-1",
        status: "SUBMITTED",
        submittedAt,
        collaboration: { status: "ACTIVE", disputedAt: null },
      },
    ];
    const { runPerformanceGraceTask } = await import("@/lib/performance-grace-task");
    const result = await runPerformanceGraceTask({ actorId: null, now: NOW });
    expect(result.enabled).toBe(true);
    expect(result.considered).toBe(1);
    expect(result.approved).toBe(1);
  });

  it("lege toestand — geen kandidaten → enabled, considered = 0, approved = 0", async () => {
    process.env.PERFORMANCE_GRACE_DAYS = "7";
    store.performances = [];
    const { runPerformanceGraceTask } = await import("@/lib/performance-grace-task");
    const result = await runPerformanceGraceTask({ actorId: null, now: NOW });
    expect(result).toEqual({ enabled: true, considered: 0, approved: 0 });
  });

  it("idempotentie — tweede run zonder kandidaten in de DB doet niets extra", async () => {
    process.env.PERFORMANCE_GRACE_DAYS = "7";
    store.performances = [];
    const { runPerformanceGraceTask } = await import("@/lib/performance-grace-task");
    const first = await runPerformanceGraceTask({ actorId: null, now: NOW });
    const second = await runPerformanceGraceTask({ actorId: null, now: NOW });
    expect(first).toEqual(second);
    expect(first.approved).toBe(0);
  });
});
