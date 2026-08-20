import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest voor de persona-sweep-bevinding (run 83, DOEL 1b — badge↔/acties-pariteit): de
// CLIENT-cascadebadges `cascadePerf`/`cascadeInv` (signals.ts) scopten alleen op `company.userId` +
// `disputedAt: null`, terwijl de /acties-emitters (pending-tasks.ts `approvePerformances`/
// `approveInvoices`) óók `status: "ACTIVE"` vereisen — en de factuurtelling miste bovendien de
// expliciete `company: { userId }`-scope. Nu onbereikbaar (een SUBMITTED-prestatie/-factuur kan niet
// coëxisteren met een niet-ACTIVE samenwerking), maar defense-in-depth: een toekomstige guard-
// wijziging zou het gat stil heropenen → badge telt werk mee dat /acties niet toont. We asserten dat
// beide cascadetellingen nu de exacte samenwerkings-scope van /acties dragen.

type CountArgs = { where: Record<string, unknown> };

const performanceCount = vi.fn((_a: CountArgs): Promise<number> => Promise.resolve(0));
const invoiceCount = vi.fn((_a: CountArgs): Promise<number> => Promise.resolve(0));
const collaborationFindMany = vi.fn((_a: CountArgs): Promise<unknown[]> => Promise.resolve([]));
const applicationCount = vi.fn((): Promise<number> => Promise.resolve(0));
const jobCount = vi.fn((): Promise<number> => Promise.resolve(0));

vi.mock("@/lib/db", () => ({
  prisma: {
    company: {
      findUnique: vi.fn(() => Promise.resolve({ id: "co-1" })),
    },
    application: { count: () => applicationCount(), findMany: () => Promise.resolve([]) },
    job: { count: () => jobCount() },
    conversationParticipant: { findMany: vi.fn(() => Promise.resolve([])) },
    message: { groupBy: vi.fn(() => Promise.resolve([])) },
    performance: { count: (a: CountArgs) => performanceCount(a) },
    invoice: { count: (a: CountArgs) => invoiceCount(a) },
    collaboration: {
      count: () => Promise.resolve(0),
      findMany: (a: CountArgs) => collaborationFindMany(a),
    },
  },
}));

// De compliance-ripple-loader (eigen DB-query) is niet het onderwerp; stub 'm leeg.
vi.mock("@/lib/collaboration-alerts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./collaboration-alerts")>();
  return { ...actual, clientCredentialAlerts: () => Promise.resolve([]) };
});

// navBadges(CLIENT) roept getClientColdJobs aan; neutraliseren.
vi.mock("@/lib/data/client-cold-jobs", () => ({ getClientColdJobs: vi.fn(async () => []) }));

import { navBadges } from "./signals";

describe("navBadges CLIENT — cascade-badge draagt de /acties ACTIVE-scope", () => {
  beforeEach(() => {
    performanceCount.mockClear();
    invoiceCount.mockClear();
    collaborationFindMany.mockClear();
  });

  it("prestatie-goedkeurtelling vereist een ACTIVE, niet-bevroren samenwerking", async () => {
    await navBadges("CLIENT", "cl-1");
    const perfCall = performanceCount.mock.calls.find(
      (c) => (c[0].where as { status?: string }).status === "SUBMITTED",
    );
    expect(perfCall).toBeTruthy();
    expect(perfCall![0].where).toMatchObject({
      status: "SUBMITTED",
      collaboration: { company: { userId: "cl-1" }, status: "ACTIVE", disputedAt: null },
    });
  });

  it("factuur-goedkeurtelling vereist een ACTIVE, niet-bevroren, eigenaar-gescoopte samenwerking", async () => {
    await navBadges("CLIENT", "cl-1");
    const invCall = invoiceCount.mock.calls.find(
      (c) => (c[0].where as { lifecycleStatus?: string }).lifecycleStatus === "SUBMITTED",
    );
    expect(invCall).toBeTruthy();
    expect(invCall![0].where).toMatchObject({
      counterpartyUserId: "cl-1",
      lifecycleStatus: "SUBMITTED",
      collaboration: { company: { userId: "cl-1" }, status: "ACTIVE", disputedAt: null },
    });
  });
});
