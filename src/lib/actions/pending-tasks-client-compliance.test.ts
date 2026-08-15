// Regressietest voor de next-action-engine (opdrachtgever): de compliance-ripple van een lopende
// samenwerking (ZZP'er mist/verlopen/binnenkort-verlopend vereist certificaat) moet als item-taak in
// /acties verschijnen. Dit signaal leefde in de dode aggregaat-engine (clientNextActions,
// P.complianceRipple = hoogste opdrachtgever-actie) maar ontbrak in de item-engine die /acties, de
// dashboard-rail en de zijbalk-badge voedt — een zichzelf tegensprekend paar next-action-surfaces.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { P } from "@/lib/next-actions";
import { type ClientCredentialAlert } from "@/lib/collaboration-alerts";

const state = vi.hoisted(() => ({
  alerts: [] as ClientCredentialAlert[],
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
    conversation: { findMany: vi.fn(async () => []) },
  },
}));

// Isoleer de compliance-tak: overige opdrachtgever-signalen uitgeschakeld.
vi.mock("@/lib/signals", () => ({
  overdueInvoiceCount: vi.fn(async () => 0),
  overdueInvoiceBreakdown: vi.fn(async () => ({ legacy: 0, cascade: 0 })),
  paymentDueSoonCount: vi.fn(async () => 0),
}));
vi.mock("@/lib/data/income-tax-deadline", () => ({
  getIncomeTaxDeadlineForActor: vi.fn(async () => null),
}));
vi.mock("@/lib/data/vat-deadline", () => ({ getVatDeadlinesForActor: vi.fn(async () => []) }));
vi.mock("@/lib/collaboration-alerts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/collaboration-alerts")>();
  return { ...actual, clientCredentialAlerts: vi.fn(async () => state.alerts) };
});

// clientTasks roept nu getClientColdJobs aan (prisma.job.findMany); neutraliseren zoals de overige
// externe data-helpers, zodat deze tak geïsoleerd blijft.
vi.mock("@/lib/data/client-cold-jobs", () => ({ getClientColdJobs: vi.fn(async () => []) }));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-client", role: "CLIENT", status: "ACTIVE" } as const;

beforeEach(() => {
  state.alerts = [];
});

describe("clientTasks — compliance-ripple", () => {
  it("geen alert → geen compliance-taak", async () => {
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "client-compliance")).toBeUndefined();
  });

  it("ontbrekend vereist certificaat → één client-compliance-taak, hoogste band, deep-link", async () => {
    state.alerts = [
      {
        collaborationId: "collab-1",
        jobId: "job-1",
        jobTitle: "Verpleegkundige",
        freelancerName: "Sanne",
        alert: {
          status: "NON_COMPLIANT",
          missing: ["VOG"],
          expired: [],
          expiringSoon: [],
          inReview: [],
        },
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const t = tasks.find((x) => x.kind === "client-compliance");
    expect(t).toBeDefined();
    expect(t!.id).toBe("client-compliance:collab-1");
    expect(t!.href).toBe("/samenwerkingen/collab-1");
    expect(t!.title).toContain("Sanne mist een vereist certificaat");
    expect(t!.priority).toBe(P.complianceRipple);
    // Bovenaan gerangschikt: geen enkele andere opdrachtgever-taak weegt zwaarder dan 85.
    expect(tasks[0]).toBe(t);
  });

  it("meerdere samenwerkingen → één taak per samenwerking (gap vóór warning)", async () => {
    state.alerts = [
      {
        collaborationId: "c-warn",
        jobId: "j2",
        jobTitle: "Dagdienst",
        freelancerName: "Iris",
        alert: {
          status: "WARNING",
          missing: [],
          expired: [],
          expiringSoon: ["DIPLOMA"],
          inReview: [],
        },
      },
      {
        collaborationId: "c-gap",
        jobId: "j3",
        jobTitle: "Nachtdienst",
        freelancerName: "Bram",
        alert: {
          status: "NON_COMPLIANT",
          missing: [],
          expired: ["INSURANCE"],
          expiringSoon: [],
          inReview: [],
        },
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const compliance = tasks.filter((t) => t.kind === "client-compliance");
    expect(compliance.map((t) => t.id)).toEqual([
      "client-compliance:c-gap",
      "client-compliance:c-warn",
    ]);
  });

  it("alleen in-beoordeling (verse indiening) → géén client-compliance-taak (admin is aan zet)", async () => {
    state.alerts = [
      {
        collaborationId: "c-review",
        jobId: "j4",
        jobTitle: "Weekenddienst",
        freelancerName: "Youssef",
        alert: {
          status: "WARNING",
          missing: [],
          expired: [],
          expiringSoon: [],
          inReview: ["CERTIFICATE"],
        },
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "client-compliance")).toBeUndefined();
  });

  it("in-beoordeling náást een gat → taak blijft (het gat is de client-actie)", async () => {
    state.alerts = [
      {
        collaborationId: "c-mixed",
        jobId: "j5",
        jobTitle: "Avonddienst",
        freelancerName: "Nadia",
        alert: {
          status: "NON_COMPLIANT",
          missing: ["VOG"],
          expired: [],
          expiringSoon: [],
          inReview: ["CERTIFICATE"],
        },
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const t = tasks.find((x) => x.kind === "client-compliance");
    expect(t).toBeDefined();
    expect(t!.title).toContain("mist een vereist certificaat");
    expect(t!.priority).toBe(P.complianceRipple);
  });
});
