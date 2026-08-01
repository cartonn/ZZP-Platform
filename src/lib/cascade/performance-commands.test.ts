import { describe, expect, it, vi, beforeEach } from "vitest";
import { CascadeError } from "@/lib/cascade/commands-shared";
import {
  MAX_PERFORMANCE_HOURS,
  MAX_MILESTONE_CENTS,
  MAX_PERFORMANCE_RATE_CENTS,
} from "@/lib/validation";
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

// Server-side bovengrens (regel 1) op het uurtarief: de factuurbasis is `uren × rateCents`, dus de
// uren-cap alleen borgt het afgeleide `totalCents` (int4) niet. Zonder een eigen tariefplafond kan een
// absurd hoog tarief (toekomstig admin-/importpad) het bij goedkeuring laten overlopen → 500. Deze
// grens maakt de guard zelfstandig i.p.v. afhankelijk van de €2.000/u-cap van collaborationProposalSchema.
describe("assertPerformanceWithinLimits — bovengrens uurtarief (HOURS)", () => {
  it("weigert een uurtarief boven het plafond", () => {
    expect(() =>
      assertPerformanceWithinLimits({
        type: "HOURS",
        hours: 8,
        rateCents: MAX_PERFORMANCE_RATE_CENTS + 1,
      }),
    ).toThrow(CascadeError);
    expect(() =>
      assertPerformanceWithinLimits({
        type: "HOURS",
        hours: 8,
        rateCents: MAX_PERFORMANCE_RATE_CENTS + 1,
      }),
    ).toThrow("Het uurtarief is onrealistisch hoog (maximaal € 2.000 per uur).");
  });

  it("staat het plafond zelf toe (grensgeval, inclusief)", () => {
    expect(() =>
      assertPerformanceWithinLimits({
        type: "HOURS",
        hours: 8,
        rateCents: MAX_PERFORMANCE_RATE_CENTS,
      }),
    ).not.toThrow();
  });

  it("weigert een niet-eindig uurtarief (NaN/Infinity uit corrupte invoer)", () => {
    expect(() =>
      assertPerformanceWithinLimits({ type: "HOURS", hours: 8, rateCents: NaN }),
    ).toThrow("Het uurtarief is ongeldig.");
    expect(() =>
      assertPerformanceWithinLimits({ type: "HOURS", hours: 8, rateCents: Infinity }),
    ).toThrow("Het uurtarief is ongeldig.");
  });

  it("borgt dat uren-cap × tarief-cap ruim onder int4 blijft (geen totalCents-overflow)", () => {
    // De grens bestaat om `totalCents` (int4 ≈ 2,147 mld cent) veilig te houden: het subtotaal bij de
    // uiterste toegestane combinatie moet er ruim onder blijven, óók met kop voor ORT-toeslag + BTW.
    const maxSubtotalCents = MAX_PERFORMANCE_HOURS * MAX_PERFORMANCE_RATE_CENTS;
    expect(maxSubtotalCents).toBe(200_000_000); // €2 mln
    expect(maxSubtotalCents).toBeLessThan(2_147_483_647);
  });
});

// Server-side bovengrens (regel 1) voor de ORT-dimensie (zorg): zodra segmenten het factuursubtotaal
// bepalen (performanceSubtotalCents → ortSubtotalCents) loopt de grens via de segment-som, niet via
// `hours`. Zonder deze check zou een absurd/NaN segment-uur een int4-overflow/NaN op de Int-kolom
// `totalCents` opleveren (500 i.p.v. een nette weigering) — onafhankelijk van het formulier.
describe("assertPerformanceWithinLimits — bovengrens ORT-segmenten (HOURS)", () => {
  it("weigert een niet-eindig segment-uur (NaN)", () => {
    expect(() =>
      assertPerformanceWithinLimits({
        type: "HOURS",
        rateCents: 7500,
        ortSegments: [{ category: "NORMAL", hours: NaN }],
      }),
    ).toThrow(CascadeError);
    expect(() =>
      assertPerformanceWithinLimits({
        type: "HOURS",
        rateCents: 7500,
        ortSegments: [{ category: "NORMAL", hours: Infinity }],
      }),
    ).toThrow("Het aantal uren is ongeldig.");
  });

  it("weigert een negatief segment-uur", () => {
    expect(() =>
      assertPerformanceWithinLimits({
        type: "HOURS",
        rateCents: 7500,
        ortSegments: [
          { category: "NORMAL", hours: 4 },
          { category: "NIGHT", hours: -2 },
        ],
      }),
    ).toThrow("Het aantal uren moet groter dan 0 zijn.");
  });

  it("weigert een segment-som van nul (alle segmenten 0)", () => {
    expect(() =>
      assertPerformanceWithinLimits({
        type: "HOURS",
        rateCents: 7500,
        ortSegments: [
          { category: "NORMAL", hours: 0 },
          { category: "NIGHT", hours: 0 },
        ],
      }),
    ).toThrow("Het aantal uren moet groter dan 0 zijn.");
  });

  it("weigert een segment-som boven de bovengrens (ook als `hours` niet is meegegeven)", () => {
    expect(() =>
      assertPerformanceWithinLimits({
        type: "HOURS",
        rateCents: 7500,
        ortSegments: [
          { category: "NORMAL", hours: MAX_PERFORMANCE_HOURS },
          { category: "NIGHT", hours: 1 },
        ],
      }),
    ).toThrow("onrealistisch hoog");
  });

  it("staat een normale segment-verdeling binnen de grens toe", () => {
    expect(() =>
      assertPerformanceWithinLimits({
        type: "HOURS",
        rateCents: 7500,
        ortSegments: [
          { category: "NORMAL", hours: 6 },
          { category: "SATURDAY", hours: 2.25 },
        ],
      }),
    ).not.toThrow();
  });

  it("laat het MILESTONE-pad ongemoeid (segmenten niet van toepassing)", () => {
    expect(() =>
      assertPerformanceWithinLimits({
        type: "MILESTONE",
        amountCents: 50_000,
        ortSegments: [{ category: "NORMAL", hours: NaN }],
      }),
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
// De pre-transactionele lees (`performanceFindFirst`, op `prisma`) en de in-transactie-herverificatie
// (`txPerformanceFindFirst`, op `tx`) zijn aparte mocks: zo kunnen tests het TOCTOU-interleaving
// modelleren waarbij de pre-check nog niets ziet maar de transactie-lees inmiddels een overlap vindt.
const {
  applyMock,
  performanceFindUnique,
  performanceFindFirst,
  performanceUpdateMany,
  txPerformanceFindUnique,
  txPerformanceFindFirst,
} = vi.hoisted(() => ({
  applyMock: vi.fn().mockResolvedValue({}),
  performanceFindUnique: vi.fn(),
  performanceFindFirst: vi.fn(),
  performanceUpdateMany: vi.fn(),
  txPerformanceFindUnique: vi.fn(),
  txPerformanceFindFirst: vi.fn(),
}));

vi.mock("@/lib/cascade/apply", () => ({ applyCascadeEffects: applyMock }));
vi.mock("@/lib/db", () => ({
  prisma: {
    performance: {
      findUnique: performanceFindUnique,
      findFirst: performanceFindFirst,
      updateMany: performanceUpdateMany,
    },
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
        // De in-transactie-overlap-guard leest de guard-prestatie + zoekt een levende botsing via `tx`.
        performance: {
          findUnique: txPerformanceFindUnique,
          findFirst: txPerformanceFindFirst,
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
    // Default: de in-transactie-lees deelt dezelfde in-memory tabel als de pre-check (geen interleaving) —
    // de guard-prestatie is de subject, de overlap-zoektocht evalueert dezelfde where-semantiek.
    txPerformanceFindUnique.mockReset().mockImplementation(async () => ({
      type: subject.type,
      periodStart: subject.periodStart,
      periodEnd: subject.periodEnd,
      collaborationId: subject.collaborationId,
    }));
    txPerformanceFindFirst
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

  // De echte parallelle race is op SQLite niet te reproduceren (writes serialiseren, geen twee gelijktijdige
  // transacties op één connectie). Daarom modelleren we het TOCTOU-interleaving deterministisch: de
  // pre-transactionele lees ziet nog geen overlap (de concurrente urenstaat was op dat moment nog DRAFT),
  // maar tegen de tijd dat de effect-transactie draait is die concurrente urenstaat al SUBMITTED. De
  // in-transactie-herverificatie op `tx` moet dan alsnog weigeren en de transactie terugrollen — dat is de
  // defense-in-depth die op Postgres (READ COMMITTED) de dubbele urenstaat/uitbetaling voorkomt.
  it("(g) in-transactie-guard: pre-check schoon, maar tx ziet een overlap → weiger + rollback", async () => {
    // Pre-check: geen levende overlap zichtbaar (concurrente submit was nog DRAFT).
    performanceFindFirst.mockResolvedValue(null);
    // Binnen de transactie is de concurrente urenstaat inmiddels SUBMITTED → de her-lees vindt een botsing.
    txPerformanceFindFirst.mockResolvedValue({ id: "perf-concurrent" });

    const { submitPerformance } = await import("@/lib/cascade/performance-commands");
    await expect(submitPerformance(FREELANCER, "perf-subject")).rejects.toThrow(
      "Er bestaat al een ingediende urenstaat voor deze periode.",
    );
    // De pre-check liet door; de in-transactie-guard blokkeerde. Geen enkel effect weggeschreven (rollback).
    expect(performanceFindFirst).toHaveBeenCalledTimes(1);
    expect(txPerformanceFindFirst).toHaveBeenCalledTimes(1);
    expect(applyMock).not.toHaveBeenCalled();
  });

  it("(h) geeft overlapGuardPerformanceId door aan de in-transactie-guard met de juiste where-semantiek", async () => {
    performanceFindFirst.mockResolvedValue(null);
    txPerformanceFindFirst.mockResolvedValue({ id: "perf-concurrent" });

    const { submitPerformance } = await import("@/lib/cascade/performance-commands");
    await expect(submitPerformance(FREELANCER, "perf-subject")).rejects.toThrow(CascadeError);

    // De guard leest de in te dienen prestatie zelf (guard-id) en zoekt daarna een levende botsing die
    // de prestatie zelf uitsluit en alleen SUBMITTED/APPROVED (niet REJECTED/DRAFT) telt.
    expect(txPerformanceFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "perf-subject" } }),
    );
    const txCall = txPerformanceFindFirst.mock.calls[0] as
      | [{ where: Record<string, unknown> }]
      | undefined;
    const where = txCall?.[0].where ?? {};
    expect(where.collaborationId).toBe("col-1");
    expect(where.id).toEqual({ not: "perf-subject" });
    expect(where.type).toBe("HOURS");
    expect((where.status as { notIn: string[] }).notIn).toEqual(
      expect.arrayContaining(["REJECTED", "DRAFT"]),
    );
  });

  it("(i) MILESTONE slaat óók de in-transactie-guard over (geen tx-overlap-query)", async () => {
    // Zelfs met een gemockte overlap-hit mag een MILESTONE nooit blokkeren: de guard leest guardPerf.type.
    txPerformanceFindFirst.mockResolvedValue({ id: "perf-concurrent" });
    subject = makeSubject({ type: "MILESTONE", periodStart: null, periodEnd: null });

    const { submitPerformance } = await import("@/lib/cascade/performance-commands");
    await expect(submitPerformance(FREELANCER, "perf-subject")).resolves.toBeUndefined();
    // guardPerf.type !== "HOURS" → de findFirst wordt nooit bereikt.
    expect(txPerformanceFindFirst).not.toHaveBeenCalled();
    expect(applyMock).toHaveBeenCalledTimes(1);
  });
});

// updatePerformance corrigeert de invoervelden van een concept/afgekeurde prestatie vóór (her)indiening.
// De statuscheck leunt op de pre-transactionele lees (loadPerformance); tussen die lees en de write kan
// een parallelle submitPerformance de rij al naar SUBMITTED hebben geflipt. Zonder statusguard zou de
// veld-write dan stil op de SUBMITTED-rij landen (uren/tarief overschreven, geen event/audit/notificatie).
// Daarom is de write compound-guarded (updateMany where { id, status: geziene-status } + count-gate).
describe("updatePerformance — TOCTOU-statusguard op de veld-write", () => {
  beforeEach(() => {
    applyMock.mockClear();
    performanceUpdateMany.mockReset().mockResolvedValue({ count: 1 });
    performanceFindUnique
      .mockReset()
      .mockImplementation(async () => makeSubject({ status: "REJECTED" }));
  });

  const input = {
    type: "HOURS" as const,
    hours: 40,
    rateCents: 5000,
    periodStart: new Date("2026-07-01T09:00:00.000Z"),
    periodEnd: new Date("2026-07-01T17:00:00.000Z"),
    description: "",
  };

  it("(a) guardt de write op de exact geziene status (∈ {DRAFT, REJECTED})", async () => {
    const { updatePerformance } = await import("@/lib/cascade/performance-commands");
    await expect(updatePerformance(FREELANCER, "perf-subject", input)).resolves.toBeUndefined();

    expect(performanceUpdateMany).toHaveBeenCalledTimes(1);
    const call = performanceUpdateMany.mock.calls[0] as [{ where: Record<string, unknown> }];
    expect(call[0].where).toEqual({ id: "perf-subject", status: "REJECTED" });
  });

  it("(b) TOCTOU: rij flipte in het race-venster naar SUBMITTED (count 0) → weiger, geen stille overschrijving", async () => {
    // Pre-check zag REJECTED; tegen de tijd van de write is de rij al SUBMITTED (parallelle submit) →
    // de compound-where matcht niets → count 0.
    performanceUpdateMany.mockResolvedValue({ count: 0 });

    const { updatePerformance } = await import("@/lib/cascade/performance-commands");
    await expect(updatePerformance(FREELANCER, "perf-subject", input)).rejects.toThrow(
      CascadeError,
    );
    await expect(updatePerformance(FREELANCER, "perf-subject", input)).rejects.toThrow(
      "intussen door een andere actie gewijzigd",
    );
  });

  it("(c) happy path: count 1 → de correctie landt zonder fout", async () => {
    const { updatePerformance } = await import("@/lib/cascade/performance-commands");
    await expect(updatePerformance(FREELANCER, "perf-subject", input)).resolves.toBeUndefined();
    expect(performanceUpdateMany).toHaveBeenCalledTimes(1);
  });
});
