// Integratietest voor de next-action-engine (opdrachtgever): een koud-lopende gepubliceerde opdracht
// (geen/weinig kandidaten) — tot nu toe alleen zichtbaar op de opdracht-lijst/-detail en als
// achtergrondnotificatie — moet als eigen next-action op /acties verschijnen. Gedeelde
// `getClientColdJobs` (hier gemockt) voedt ook de /opdrachten-badge; deze test grendelt de
// /acties-emissie + de prioriteitsband vast.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { P } from "@/lib/next-actions";

const state = vi.hoisted(() => ({
  cold: [] as { jobId: string; title: string; headline: string }[],
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    company: { findUnique: vi.fn(async () => null) },
    application: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    job: { count: vi.fn(async () => 0) },
    collaboration: { findMany: vi.fn(async () => []) },
    // Ongewindowde keur-query (approvePerformances) — leeg voor deze test.
    performance: { findMany: vi.fn(async () => []) },
    invoice: { findMany: vi.fn(async () => []) },
    conversationParticipant: { findMany: vi.fn(async () => []) },
    message: { groupBy: vi.fn(async () => []) },
  },
}));

// Isoleer de koud-opdracht-tak: overige opdrachtgever-signalen uitgeschakeld.
vi.mock("@/lib/signals", () => ({
  overdueInvoiceCount: vi.fn(async () => 0),
  overdueInvoiceBreakdown: vi.fn(async () => ({ legacy: 0, cascade: 0 })),
  paymentDueSoonCount: vi.fn(async () => 0),
  startOfUtcDay: (now: Date) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
}));
vi.mock("@/lib/data/income-tax-deadline", () => ({
  getIncomeTaxDeadlineForActor: vi.fn(async () => null),
}));
vi.mock("@/lib/data/vat-deadline", () => ({ getVatDeadlinesForActor: vi.fn(async () => []) }));
vi.mock("@/lib/collaboration-alerts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/collaboration-alerts")>();
  return { ...actual, clientCredentialAlerts: vi.fn(async () => []) };
});
vi.mock("@/lib/data/client-overdue-jobs", () => ({ getClientOverdueJobs: vi.fn(async () => []) }));
vi.mock("@/lib/data/client-cold-jobs", () => ({
  getClientColdJobs: vi.fn(async () => state.cold),
}));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-client", role: "CLIENT", status: "ACTIVE" } as const;

beforeEach(() => {
  state.cold = [];
});

describe("clientTasks — koud-lopende opdracht als next-action", () => {
  it("geen koude opdracht → geen taak", async () => {
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "job-needs-attention")).toBeUndefined();
  });

  it("koude opdracht → attention-taak met deep-link, band en pace-kop in de subtitel", async () => {
    state.cold = [{ jobId: "job-1", title: "Nachtdienst VVT", headline: "Weinig respons" }];
    const tasks = await pendingTasks(ACTOR);
    const t = tasks.find((x) => x.kind === "job-needs-attention");
    expect(t).toBeDefined();
    expect(t!.id).toBe("job-needs-attention:job-1");
    expect(t!.title).toBe("Nachtdienst VVT");
    expect(t!.subtitle).toContain("Weinig respons");
    expect(t!.href).toBe("/opdrachten/job-1");
    expect(t!.tone).toBe("attention");
    expect(t!.priority).toBe(P.jobNeedsAttention);
  });

  it("meerdere koude opdrachten → één taak per opdracht", async () => {
    state.cold = [
      { jobId: "job-1", title: "A", headline: "Weinig respons" },
      { jobId: "job-2", title: "B", headline: "Traag tempo" },
    ];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.filter((t) => t.kind === "job-needs-attention").map((t) => t.href)).toEqual([
      "/opdrachten/job-1",
      "/opdrachten/job-2",
    ]);
  });
});
