// TOCTOU- + plan-limiet-grendel op `changeJobStatus` (DOEL 2 — robuustheid/integriteit onder
// concurrency; persona-sweep 2026-08-02, run 67).
//
// Defect (HIGH, CLAUDE.md regel 1/2/3): `changeJobStatus` las `job.status` één keer (stale snapshot),
// telde de plan-limiet (`canApply`) in een APARTE read, en schreef de nieuwe status daarna met een
// ONgeguarde `job.update({ where: { id } })`. Twee bereikbare races:
//   (1) Plan-limiet-bypass: twee gelijktijdige publish-verzoeken van een FREE-opdrachtgever (maxJobs=1)
//       lezen beide activeCount=0, passeren beide `canApply(1,0)` en publiceren allebei → 2 actieve
//       opdrachten op een plan dat er 1 toestaat (de betaalde upgrade omzeild).
//   (2) Moderatie-resurrectie: een concurrente `adminCloseJob` (CLOSED) wordt door de blinde heropen-
//       write overschreven terug naar PUBLISHED.
//
// Fix: interactieve transactie met compound-guarded `updateMany({ where: { id, status: from } })`
// (count 0 → StaleJobStatusError → rollback) + de plan-telling BINNEN dezelfde transactie ná de write
// (write-lock serialiseert gelijktijdige publishes → de tweede telt de eerste mee → PlanLimitReached).
// Deze test drijft de callback ván $transaction zelf, zodat de guards daadwerkelijk worden uitgeoefend.

import { describe, it, expect, vi, beforeEach } from "vitest";

// De rij zoals de PRE-check hem ziet (nog DRAFT). De transactie-uitkomst wordt los gemodelleerd om de
// race te simuleren.
const preCheckJob = {
  id: "job-1",
  status: "DRAFT" as string,
  publishedAt: null as Date | null,
  title: "Klus",
  description: "Omschrijving",
  tenantId: null as string | null,
  company: { userId: "client-1" },
  tenant: null as { openOverflow: boolean } | null,
};

// Uitkomst van de compound-guarded updateMany binnen de transactie (0 = race verloren, 1 = gewonnen).
let updatedCount = 1;
// Aantal REEDS gepubliceerde opdrachten dat de in-transactie plan-telling ziet (excl. deze).
let activePublished = 0;
// Planmaximum (FREE = 1).
let freeMaxJobs = 1;

const jobUpdateMany = vi.fn(async (_args: { where?: unknown; data?: unknown }) => ({
  count: updatedCount,
}));
const jobCount = vi.fn(async (_args: { where?: unknown }) => activePublished);

vi.mock("@/lib/db", () => ({
  prisma: {
    job: {
      findUnique: vi.fn(async () => preCheckJob),
    },
    subscription: { findUnique: vi.fn(async () => null) },
    plan: { findUnique: vi.fn(async () => ({ key: "FREE", maxJobs: freeMaxJobs })) },
    // Flexpool bij eerste publicatie: geen bedrijf → korte sluiting, geen uitnodigingen.
    company: { findUnique: vi.fn(async () => null) },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({ job: { updateMany: jobUpdateMany, count: jobCount } }),
    ),
  },
}));

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({ id: "client-1", role: "CLIENT", status: "ACTIVE" })),
  owns: vi.fn(() => true),
  AuthorizationError: class AuthorizationError extends Error {},
}));

const auditFn = vi.fn(async () => {});
vi.mock("@/lib/audit", () => ({ audit: auditFn, auditData: vi.fn(() => ({})) }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

beforeEach(() => {
  preCheckJob.status = "DRAFT";
  preCheckJob.publishedAt = null;
  updatedCount = 1;
  activePublished = 0;
  freeMaxJobs = 1;
  jobUpdateMany.mockClear();
  jobCount.mockClear();
  auditFn.mockClear();
});

describe("changeJobStatus — TOCTOU compound-guard + atomische plan-limiet", () => {
  it("verloren race (concurrente statuswissel won): geen blinde overschrijving, transactie rolt terug", async () => {
    // Pre-check ziet nog DRAFT, maar de compound-guarded updateMany matcht 0 (een concurrente
    // adminCloseJob/publiceer heeft de status al veranderd vóór onze write).
    updatedCount = 0;
    const { changeJobStatus } = await import("./actions");
    const result = await changeJobStatus("job-1", "PUBLISHED");
    expect(result).toEqual({ error: expect.stringMatching(/net gewijzigd/i) });
    // De guard-where moet id + de geziene status zijn (kan niet driften naar id-only).
    expect(jobUpdateMany).toHaveBeenCalledTimes(1);
    const where = jobUpdateMany.mock.calls[0]?.[0]?.where as { id: string; status: string };
    expect(where).toEqual({ id: "job-1", status: "DRAFT" });
    // Geen redirect/audit bij een verloren race.
    expect(auditFn).not.toHaveBeenCalled();
  });

  it("plan-limiet-bypass: de in-transactie telling ziet de al-gepubliceerde opdracht en weigert de tweede", async () => {
    // De write slaagt (count 1), maar er staat al 1 gepubliceerde opdracht → totaal 2 > FREE-limiet 1.
    updatedCount = 1;
    activePublished = 1;
    freeMaxJobs = 1;
    const { changeJobStatus } = await import("./actions");
    const result = await changeJobStatus("job-1", "PUBLISHED");
    expect(result).toEqual({
      error: expect.stringMatching(/maximum aantal actieve opdrachten \(1\)/i),
    });
    // De telling draaide BINNEN de transactie, ná de guarded write (atomair).
    expect(jobUpdateMany).toHaveBeenCalledTimes(1);
    expect(jobCount).toHaveBeenCalledTimes(1);
    const countWhere = jobCount.mock.calls[0]?.[0]?.where as Record<string, unknown>;
    expect(countWhere).toMatchObject({ status: "PUBLISHED", id: { not: "job-1" } });
    // De transactie rolt terug: geen audit van een geslaagde publicatie.
    expect(auditFn).not.toHaveBeenCalled();
  });

  it("gewonnen race binnen de limiet: publiceert (guarded write + plan-check geslaagd)", async () => {
    updatedCount = 1;
    activePublished = 0; // nog geen actieve opdracht → binnen FREE-limiet
    freeMaxJobs = 1;
    const { changeJobStatus } = await import("./actions");
    // Happy path eindigt in redirect() → gooit NEXT_REDIRECT; dat bewijst dat de transactie slaagde.
    await expect(changeJobStatus("job-1", "PUBLISHED")).rejects.toThrow(/NEXT_REDIRECT/);
    expect(jobUpdateMany).toHaveBeenCalledTimes(1);
    expect(jobCount).toHaveBeenCalledTimes(1);
    expect(auditFn).toHaveBeenCalledWith(
      expect.objectContaining({ action: "JOB_STATUS_CHANGED", entityId: "job-1" }),
    );
  });

  it("onbeperkt plan (maxJobs = -1): slaat de plan-limiet over maar houdt de compound-guard", async () => {
    updatedCount = 1;
    activePublished = 999;
    freeMaxJobs = -1; // onbeperkt
    const { changeJobStatus } = await import("./actions");
    await expect(changeJobStatus("job-1", "PUBLISHED")).rejects.toThrow(/NEXT_REDIRECT/);
    expect(jobUpdateMany).toHaveBeenCalledTimes(1);
    // canApply(-1, …) = onbeperkt → geen weigering ondanks 999 actieve opdrachten.
    expect(auditFn).toHaveBeenCalled();
  });
});
