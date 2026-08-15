// Regressietest voor de next-action-engine (DOEL 1b — cross-surface-consistentie): het
// vervolgsignaal van een lopende samenwerking (naderende/verstreken einddatum) leefde alléén op het
// samenwerkingsdetail (`RenewalNudge`) en ontbrak op /acties, de dashboard-rail én de zijbalk-badge
// (alle gevoed door de item-engine `pendingTasks` → clientTasks/freelancerTasks). Deze test borgt dat
// de item-engine de vervolg-taak nu wél emit voor de opdrachtgever, met de juiste query-scope (ACTIVE,
// niet-bevroren, einddatum binnen het venster), id/toon/deep-link, en dat een rij zonder attentie
// (open einde / ruim vóór het venster) geen taak oplevert.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { P } from "@/lib/next-actions";
import { RENEWAL_WINDOW_DAYS, RENEWAL_OVERDUE_GRACE_DAYS } from "@/lib/collaboration-renewal";

type RenewalRow = {
  id: string;
  endDate: Date | null;
  job: { title: string };
  company: { name: string | null };
  freelancer: { user: { name: string | null } };
};

const state = vi.hoisted(() => ({
  renewalRows: [] as RenewalRow[],
  lastRenewalWhere: undefined as unknown,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    company: { findUnique: vi.fn(async () => null) },
    application: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    job: { count: vi.fn(async () => 0) },
    // Twee collaboration.findMany-paden in clientTasks: het contract/cascade-pad (status in
    // [PROPOSED,ACTIVE], geen endDate-filter) en het nieuwe vervolg-pad (endDate-filter aanwezig).
    // We herkennen het vervolg-pad aan `where.endDate` en serveren daar de testrijen.
    collaboration: {
      findMany: vi.fn(async (args: { where?: { endDate?: unknown } }) => {
        if (args?.where?.endDate !== undefined) {
          state.lastRenewalWhere = args.where;
          return state.renewalRows;
        }
        return [];
      }),
    },
    invoice: { findMany: vi.fn(async () => []) },
    // Ongewindowde keur-/betaal-queries (approvePerformances/rejectedPerfs) — leeg voor deze test.
    performance: { findMany: vi.fn(async () => []) },
    conversationParticipant: { findMany: vi.fn(async () => []) },
    message: { groupBy: vi.fn(async () => []) },
    conversation: { findMany: vi.fn(async () => []) },
  },
}));

// Behoud de echte helpers (o.a. startOfUtcDay, gebruikt door summarizeCollaborationRenewal); stub
// alleen de tel-signalen die we willen uitschakelen.
vi.mock("@/lib/signals", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/signals")>();
  return {
    ...actual,
    overdueInvoiceCount: vi.fn(async () => 0),
    overdueInvoiceBreakdown: vi.fn(async () => ({ legacy: 0, cascade: 0 })),
    paymentDueSoonCount: vi.fn(async () => 0),
  };
});
vi.mock("@/lib/data/income-tax-deadline", () => ({
  getIncomeTaxDeadlineForActor: vi.fn(async () => null),
}));
vi.mock("@/lib/data/vat-deadline", () => ({ getVatDeadlinesForActor: vi.fn(async () => []) }));
vi.mock("@/lib/collaboration-alerts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/collaboration-alerts")>();
  return { ...actual, clientCredentialAlerts: vi.fn(async () => []) };
});

// clientTasks roept nu getClientColdJobs aan (prisma.job.findMany); neutraliseren zoals de overige
// externe data-helpers, zodat deze tak geïsoleerd blijft.
vi.mock("@/lib/data/client-cold-jobs", () => ({ getClientColdJobs: vi.fn(async () => []) }));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-client", role: "CLIENT", status: "ACTIVE" } as const;
const DAY = 86_400_000;

beforeEach(() => {
  state.renewalRows = [];
  state.lastRenewalWhere = undefined;
});

describe("clientTasks — vervolgsignaal (collaboration-renewal)", () => {
  it("geen rijen → geen vervolg-taak", async () => {
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "collaboration-renewal")).toBeUndefined();
  });

  it("query scoped op ACTIVE, niet-bevroren, einddatum binnen het venster", async () => {
    await pendingTasks(ACTOR);
    const where = state.lastRenewalWhere as Record<string, unknown>;
    expect(where.status).toBe("ACTIVE");
    expect(where.disputedAt).toBeNull();
    expect(where.endDate).toHaveProperty("lte");
    // Grace-vloer: ver-verstreken (voorbij grace) inzet wordt niet meer opgehaald.
    expect(where.endDate).toHaveProperty("gte");
    expect(where.company).toEqual({ userId: "user-client" });
  });

  it("naderende einddatum → één info-taak per samenwerking met deep-link en tegenpartijnaam", async () => {
    state.renewalRows = [
      {
        id: "collab-1",
        endDate: new Date(Date.now() + 4 * DAY),
        job: { title: "Wijkverpleging" },
        company: { name: "ZorgGroep" },
        freelancer: { user: { name: "Sanne" } },
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const t = tasks.find((x) => x.kind === "collaboration-renewal");
    expect(t).toBeDefined();
    expect(t!.id).toBe("collaboration-renewal:collab-1");
    expect(t!.href).toBe("/samenwerkingen/collab-1");
    expect(t!.tone).toBe("info");
    expect(t!.priority).toBe(P.collaborationRenewal);
    expect(t!.title).toContain("Sanne");
  });

  it("verstreken einddatum → attention", async () => {
    state.renewalRows = [
      {
        id: "collab-2",
        endDate: new Date(Date.now() - 2 * DAY),
        job: { title: "Nachtdienst" },
        company: { name: "ZorgGroep" },
        freelancer: { user: { name: "Mark" } },
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const t = tasks.find((x) => x.kind === "collaboration-renewal");
    expect(t!.tone).toBe("attention");
  });

  it("voorbij het grace-venster verstreken → gedempt (lapsed), geen taak", async () => {
    state.renewalRows = [
      {
        id: "collab-lapsed",
        endDate: new Date(Date.now() - (RENEWAL_OVERDUE_GRACE_DAYS + 5) * DAY),
        job: { title: "Oud project" },
        company: { name: "ZorgGroep" },
        freelancer: { user: { name: "Noor" } },
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "collaboration-renewal")).toBeUndefined();
  });

  it("open einde (endDate null) of ruim vóór het venster → geen attentie, geen taak", async () => {
    state.renewalRows = [
      {
        id: "collab-open",
        endDate: null,
        job: { title: "Doorlopend" },
        company: { name: "ZorgGroep" },
        freelancer: { user: { name: "Iris" } },
      },
      {
        id: "collab-far",
        endDate: new Date(Date.now() + (RENEWAL_WINDOW_DAYS + 10) * DAY),
        job: { title: "Langlopend" },
        company: { name: "ZorgGroep" },
        freelancer: { user: { name: "Youssef" } },
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "collaboration-renewal")).toBeUndefined();
  });
});
