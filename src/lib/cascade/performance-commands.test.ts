import { describe, expect, it, vi, beforeEach } from "vitest";
import { CascadeError } from "@/lib/cascade/commands-shared";
import { MAX_PERFORMANCE_HOURS, MAX_MILESTONE_CENTS } from "@/lib/validation";
import { assertPerformanceWithinLimits } from "@/lib/cascade/performance-commands";

// Server-side ondergrens (regel 1): assertPerformanceWithinLimits is de bron van waarheid voor élk
// pad naar createPerformance/updatePerformance en moet negatieve/nul uren én bedragen weigeren,
// onafhankelijk van de Zod-formuliercheck. Zonder deze check zou een negatieve prestatie een
// negatieve factuur (performanceSubtotalCents) kunnen opleveren.
describe("assertPerformanceWithinLimits — ondergrens uren", () => {
  it("weigert negatieve uren", () => {
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: -1 })).toThrow(CascadeError);
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: -1 })).toThrow(
      "Het aantal uren moet groter dan 0 zijn.",
    );
  });

  it("weigert nul uren", () => {
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: 0 })).toThrow(CascadeError);
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: 0 })).toThrow(
      "Het aantal uren moet groter dan 0 zijn.",
    );
  });

  it("staat een normale positieve waarde toe", () => {
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: 8 })).not.toThrow();
  });

  it("behoudt het null-pad (concept zonder uren) — gooit niet", () => {
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: null })).not.toThrow();
    expect(() => assertPerformanceWithinLimits({ type: "HOURS" })).not.toThrow();
  });

  it("blijft de bovengrens en niet-eindige waarden weigeren", () => {
    expect(() =>
      assertPerformanceWithinLimits({ type: "HOURS", hours: MAX_PERFORMANCE_HOURS + 1 }),
    ).toThrow(CascadeError);
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: NaN })).toThrow(
      CascadeError,
    );
  });
});

describe("assertPerformanceWithinLimits — ondergrens bedrag (MILESTONE)", () => {
  it("weigert een negatief bedrag", () => {
    expect(() => assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: -100 })).toThrow(
      CascadeError,
    );
    expect(() => assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: -100 })).toThrow(
      "Het bedrag moet groter dan 0 zijn.",
    );
  });

  it("weigert een nul bedrag", () => {
    expect(() => assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: 0 })).toThrow(
      CascadeError,
    );
    expect(() => assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: 0 })).toThrow(
      "Het bedrag moet groter dan 0 zijn.",
    );
  });

  it("staat een normaal positief bedrag toe", () => {
    expect(() =>
      assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: 50_000 }),
    ).not.toThrow();
  });

  it("behoudt het null-pad (concept zonder bedrag) — gooit niet", () => {
    expect(() =>
      assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: null }),
    ).not.toThrow();
    expect(() => assertPerformanceWithinLimits({ type: "MILESTONE" })).not.toThrow();
  });

  it("blijft de bovengrens en niet-eindige waarden weigeren", () => {
    expect(() =>
      assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: MAX_MILESTONE_CENTS + 1 }),
    ).toThrow(CascadeError);
    expect(() => assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: NaN })).toThrow(
      CascadeError,
    );
  });
});

describe("assertPerformanceWithinLimits — ondergrens uurtarief (HOURS)", () => {
  it("weigert een nul uurtarief bij gewerkte uren (voorkomt €0-factuur voor echte uren)", () => {
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: 8, rateCents: 0 })).toThrow(
      CascadeError,
    );
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: 8, rateCents: 0 })).toThrow(
      "Het uurtarief moet groter dan 0 zijn.",
    );
  });

  it("weigert een negatief uurtarief", () => {
    expect(() =>
      assertPerformanceWithinLimits({ type: "HOURS", hours: 8, rateCents: -100 }),
    ).toThrow("Het uurtarief moet groter dan 0 zijn.");
  });

  it("staat een normaal positief uurtarief toe", () => {
    expect(() =>
      assertPerformanceWithinLimits({ type: "HOURS", hours: 8, rateCents: 7500 }),
    ).not.toThrow();
  });

  it("behoudt het null-pad (concept zonder tarief) — gooit niet", () => {
    expect(() =>
      assertPerformanceWithinLimits({ type: "HOURS", hours: 8, rateCents: null }),
    ).not.toThrow();
    expect(() => assertPerformanceWithinLimits({ type: "HOURS", hours: 8 })).not.toThrow();
  });

  it("negeert het uurtarief op het MILESTONE-pad (tarief is daar niet van toepassing)", () => {
    expect(() =>
      assertPerformanceWithinLimits({ type: "MILESTONE", amountCents: 50_000, rateCents: 0 }),
    ).not.toThrow();
  });
});

// ─── submitPerformance — anti-dubbelfacturatie (overlap-guard) ──────────────
// Server-side backstop (regel 1): het indienen van een urenstaat waarvan de periode overlapt met een
// reeds in de cascade levende urenstaat (SUBMITTED/APPROVED) op dezelfde samenwerking wordt geweigerd —
// anders draaien twee prestaties voor exact dezelfde gewerkte periode elk hun eigen factuur-cascade en
// wordt er dubbel uitbetaald. De findFirst-mock evalueert de where-clause over een in-memory tabel,
// zodat de tests de échte overlap-semantiek (collaboratie-scope, id-uitsluiting, status-notIn,
// periode-vergelijking) uitoefenen i.p.v. een vast gemockt resultaat.

interface Row {
  id: string;
  collaborationId: string;
  type: string;
  status: string;
  periodStart: Date | null;
  periodEnd: Date | null;
}

// vi.hoisted zodat de mock-referenties beschikbaar zijn wanneer de gehoisteerde vi.mock-factory draait.
const { applyMock, performanceFindUnique, performanceFindFirst } = vi.hoisted(() => ({
  applyMock: vi.fn().mockResolvedValue({}),
  performanceFindUnique: vi.fn(),
  performanceFindFirst: vi.fn(),
}));

vi.mock("@/lib/cascade/apply", () => ({ applyCascadeEffects: applyMock }));
vi.mock("@/lib/db", () => ({
  prisma: {
    performance: { findUnique: performanceFindUnique, findFirst: performanceFindFirst },
    // assertNotDisputed + assertCollaborationNotTerminal + loadCollabMeta lezen de samenwerking; één
    // niet-bevroren, actieve mock voedt alle drie (loadCollabMeta valt op de nested-select in try/catch).
    collaboration: {
      findUnique: vi.fn().mockResolvedValue({ disputedAt: null, status: "ACTIVE" }),
    },
    domainEvent: { findUnique: vi.fn().mockResolvedValue(null) },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        collaboration: {
          findUnique: vi.fn().mockResolvedValue({ disputedAt: null, status: "ACTIVE" }),
        },
        domainEvent: { create: vi.fn().mockResolvedValue({ id: "event-1" }) },
        eventHandlerRun: { create: vi.fn().mockResolvedValue({}) },
      }),
    ),
  },
}));

// Evalueert de Prisma-where van de overlap-query tegen één rij (spiegelt de guard-semantiek).
function matchesWhere(row: Row, where: Record<string, unknown>): boolean {
  const collaborationId = where.collaborationId as string | undefined;
  if (collaborationId !== undefined && row.collaborationId !== collaborationId) return false;
  const idNot = (where.id as { not?: string } | undefined)?.not;
  if (idNot !== undefined && row.id === idNot) return false;
  const type = where.type as string | undefined;
  if (type !== undefined && row.type !== type) return false;
  const notIn = (where.status as { notIn?: string[] } | undefined)?.notIn;
  if (Array.isArray(notIn) && notIn.includes(row.status)) return false;
  const startLt = (where.periodStart as { lt?: Date } | undefined)?.lt;
  if (startLt !== undefined && !(row.periodStart != null && row.periodStart < startLt))
    return false;
  const endGt = (where.periodEnd as { gt?: Date } | undefined)?.gt;
  if (endGt !== undefined && !(row.periodEnd != null && row.periodEnd > endGt)) return false;
  return true;
}

// De prestatie die wordt ingediend (voedt zowel loadPerformance als de guard-lees).
function makeSubject(overrides: Partial<Row> = {}): Record<string, unknown> {
  return {
    id: "perf-subject",
    status: "DRAFT",
    type: "HOURS",
    hours: 8,
    rateCents: 5000,
    amountCents: null,
    ortSegments: null,
    periodStart: new Date("2026-07-01T09:00:00.000Z"),
    periodEnd: new Date("2026-07-01T17:00:00.000Z"),
    collaborationId: "col-1",
    collaboration: {
      ortProfile: null,
      ortCustomRates: null,
      freelancer: { userId: "f1" },
      company: { userId: "c1" },
    },
    ...overrides,
  };
}

const FREELANCER = { id: "f1", role: "FREELANCER" as const, status: "ACTIVE" };

describe("submitPerformance — anti-dubbelfacturatie (overlap-guard)", () => {
  let subject: Record<string, unknown>;
  let table: Row[];

  beforeEach(() => {
    subject = makeSubject();
    table = [];
    applyMock.mockClear();
    performanceFindUnique.mockReset().mockImplementation(async () => subject);
    performanceFindFirst
      .mockReset()
      .mockImplementation(async (args: { where: Record<string, unknown> }) => {
        const hit = table.find((row) => matchesWhere(row, args.where));
        return hit ? { id: hit.id } : null;
      });
  });

  it("(a) weigert indienen bij een overlappende SUBMITTED-urenstaat op dezelfde samenwerking", async () => {
    table = [
      {
        id: "perf-existing",
        collaborationId: "col-1",
        type: "HOURS",
        status: "SUBMITTED",
        periodStart: new Date("2026-07-01T08:00:00.000Z"),
        periodEnd: new Date("2026-07-01T16:00:00.000Z"),
      },
    ];
    const { submitPerformance } = await import("@/lib/cascade/performance-commands");
    await expect(submitPerformance(FREELANCER, "perf-subject")).rejects.toThrow(
      "Er bestaat al een ingediende urenstaat voor deze periode.",
    );
    // Geen enkel factuur-/statuseffect weggeschreven.
    expect(applyMock).not.toHaveBeenCalled();
    // De query is correct opgebouwd: zelf-uitsluiting + alleen levende (niet-REJECTED/DRAFT) prestaties.
    const firstCall = performanceFindFirst.mock.calls[0] as
      | [{ where: Record<string, unknown> }]
      | undefined;
    const where = firstCall?.[0].where ?? {};
    expect(where.id).toEqual({ not: "perf-subject" });
    expect((where.status as { notIn: string[] }).notIn).toEqual(
      expect.arrayContaining(["REJECTED", "DRAFT"]),
    );
  });

  it("(b) staat een niet-overlappende periode op dezelfde samenwerking toe", async () => {
    table = [
      {
        id: "perf-existing",
        collaborationId: "col-1",
        type: "HOURS",
        status: "SUBMITTED",
        periodStart: new Date("2026-07-02T09:00:00.000Z"),
        periodEnd: new Date("2026-07-02T17:00:00.000Z"),
      },
    ];
    const { submitPerformance } = await import("@/lib/cascade/performance-commands");
    await expect(submitPerformance(FREELANCER, "perf-subject")).resolves.toBeUndefined();
    expect(applyMock).toHaveBeenCalledTimes(1);
  });

  it("(c) staat een overlappende periode op een ANDERE samenwerking toe", async () => {
    table = [
      {
        id: "perf-other",
        collaborationId: "col-2",
        type: "HOURS",
        status: "SUBMITTED",
        periodStart: new Date("2026-07-01T08:00:00.000Z"),
        periodEnd: new Date("2026-07-01T16:00:00.000Z"),
      },
    ];
    const { submitPerformance } = await import("@/lib/cascade/performance-commands");
    await expect(submitPerformance(FREELANCER, "perf-subject")).resolves.toBeUndefined();
    expect(applyMock).toHaveBeenCalledTimes(1);
  });

  it("(d) een overlappende maar AFGEKEURDE (REJECTED) prestatie blokkeert niet", async () => {
    table = [
      {
        id: "perf-rejected",
        collaborationId: "col-1",
        type: "HOURS",
        status: "REJECTED",
        periodStart: new Date("2026-07-01T08:00:00.000Z"),
        periodEnd: new Date("2026-07-01T16:00:00.000Z"),
      },
    ];
    const { submitPerformance } = await import("@/lib/cascade/performance-commands");
    await expect(submitPerformance(FREELANCER, "perf-subject")).resolves.toBeUndefined();
    expect(applyMock).toHaveBeenCalledTimes(1);
  });

  it("(e) opnieuw indienen van de prestatie zelf blokkeert niet (zelf-uitsluiting)", async () => {
    subject = makeSubject({ status: "REJECTED" });
    // De eigen rij staat in de tabel met een overlappende periode; zonder id-uitsluiting zou de guard
    // zichzelf als botsing zien. We modelleren de eigen rij als SUBMITTED om te bewijzen dat de
    // `id: { not }`-clausule — en niet enkel de status-notIn — de zelf-botsing wegfiltert.
    table = [
      {
        id: "perf-subject",
        collaborationId: "col-1",
        type: "HOURS",
        status: "SUBMITTED",
        periodStart: new Date("2026-07-01T08:00:00.000Z"),
        periodEnd: new Date("2026-07-01T16:00:00.000Z"),
      },
    ];
    const { submitPerformance } = await import("@/lib/cascade/performance-commands");
    await expect(submitPerformance(FREELANCER, "perf-subject")).resolves.toBeUndefined();
    expect(applyMock).toHaveBeenCalledTimes(1);
  });

  it("(f) MILESTONE en null-periodes slaan de guard over (geen overlap-query)", async () => {
    // Overlappende SUBMITTED-rij aanwezig — mag toch niet blokkeren op deze paden.
    table = [
      {
        id: "perf-existing",
        collaborationId: "col-1",
        type: "HOURS",
        status: "SUBMITTED",
        periodStart: new Date("2026-07-01T08:00:00.000Z"),
        periodEnd: new Date("2026-07-01T16:00:00.000Z"),
      },
    ];
    const { submitPerformance } = await import("@/lib/cascade/performance-commands");

    // MILESTONE: guard slaat over (geen HOURS).
    subject = makeSubject({ type: "MILESTONE", periodStart: null, periodEnd: null });
    await expect(submitPerformance(FREELANCER, "perf-subject")).resolves.toBeUndefined();
    expect(performanceFindFirst).not.toHaveBeenCalled();

    // HOURS zonder eindtijd: overlap niet te bepalen → guard slaat over.
    applyMock.mockClear();
    subject = makeSubject({ periodEnd: null });
    await expect(submitPerformance(FREELANCER, "perf-subject")).resolves.toBeUndefined();
    expect(performanceFindFirst).not.toHaveBeenCalled();
  });
});
