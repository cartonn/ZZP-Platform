// Regressietest voor de next-action-engine (opdrachtgever): een goedgekeurde cascade-factuur die
// BINNENKORT vervalt (lifecycleStatus=APPROVED, dueAt in het pre-due venster) waarvan de opdrachtgever de
// betalende partij is, moet als item-taak in /acties verschijnen — de pre-due tegenhanger van de
// clientCascadeOverduePaymentTask. Zo kan de opdrachtgever op tijd betalen (out-of-band via het
// samenwerkingsdetail) vóórdat de factuur OVERDUE wordt en zijn betaalreputatie raakt.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { P } from "@/lib/next-actions";

type DueSoonInvoiceRow = {
  id: string;
  collaboration: {
    id: string;
    job: { title: string };
    freelancer: { user: { name: string | null } };
  } | null;
};

const state = vi.hoisted(() => ({
  dueSoonInvoices: [] as DueSoonInvoiceRow[],
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    company: { findUnique: vi.fn(async () => null) },
    application: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    job: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    collaboration: { findMany: vi.fn(async () => []) },
    performance: { findMany: vi.fn(async () => []) },
    // Drie invoice.findMany-paden in clientTasks: OVERDUE-nudge, SUBMITTED-keur-query, en de nieuwe
    // pre-due APPROVED-nudge. Serveer de testrijen alleen op het APPROVED-pad; de rest blijft leeg.
    invoice: {
      findMany: vi.fn(async (args?: { where?: { lifecycleStatus?: unknown } }) =>
        args?.where?.lifecycleStatus === "APPROVED" ? state.dueSoonInvoices : [],
      ),
    },
    conversationParticipant: { findMany: vi.fn(async () => []) },
    message: { groupBy: vi.fn(async () => []) },
    conversation: { findMany: vi.fn(async () => []) },
  },
}));

// Isoleer de betaal-nudge-tak: overige opdrachtgever-signalen uitgeschakeld.
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
  return { ...actual, clientCredentialAlerts: vi.fn(async () => []) };
});
vi.mock("@/lib/data/client-overdue-jobs", () => ({ getClientOverdueJobs: vi.fn(async () => []) }));
vi.mock("@/lib/data/client-cold-jobs", () => ({ getClientColdJobs: vi.fn(async () => []) }));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-client", role: "CLIENT", status: "ACTIVE" } as const;

beforeEach(() => {
  state.dueSoonInvoices = [];
});

describe("clientTasks — pre-due cascade betaal-nudge", () => {
  it("geen binnenkort-vervallende cascade-factuur → geen nudge", async () => {
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "client-payment-due-soon")).toBeUndefined();
  });

  it("binnenkort-vervallende cascade-factuur → één info-nudge met deep-link, ZZP-naam en pre-due band", async () => {
    state.dueSoonInvoices = [
      {
        id: "inv-1",
        collaboration: {
          id: "collab-1",
          job: { title: "Nachtdienst VVT" },
          freelancer: { user: { name: "Sanne" } },
        },
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const t = tasks.find((x) => x.kind === "client-payment-due-soon");
    expect(t).toBeDefined();
    expect(t!.id).toBe("client-payment-due-soon:inv-1");
    expect(t!.href).toBe("/samenwerkingen/collab-1");
    expect(t!.title).toContain("Sanne");
    expect(t!.subtitle).toContain("Nachtdienst VVT");
    expect(t!.tone).toBe("info");
    expect(t!.priority).toBe(P.clientCascadePaymentDueSoon);
    // Post-due (OVERDUE) blijft strikt boven deze pre-due nudge (post-due > pre-due-principe).
    expect(P.clientCascadeOverduePayment).toBeGreaterThan(P.clientCascadePaymentDueSoon);
  });

  it("meerdere binnenkort-vervallende cascade-facturen → één nudge per factuur", async () => {
    state.dueSoonInvoices = [
      {
        id: "inv-a",
        collaboration: {
          id: "c-a",
          job: { title: "Dagdienst" },
          freelancer: { user: { name: "Iris" } },
        },
      },
      {
        id: "inv-b",
        collaboration: {
          id: "c-b",
          job: { title: "Weekenddienst" },
          freelancer: { user: { name: "Bram" } },
        },
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const nudges = tasks.filter((t) => t.kind === "client-payment-due-soon");
    expect(nudges.map((t) => t.id)).toEqual([
      "client-payment-due-soon:inv-a",
      "client-payment-due-soon:inv-b",
    ]);
  });

  it("ZZP'er zonder naam → veilige fallback in de titel", async () => {
    state.dueSoonInvoices = [
      {
        id: "inv-x",
        collaboration: {
          id: "c-x",
          job: { title: "Avonddienst" },
          freelancer: { user: { name: null } },
        },
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const t = tasks.find((x) => x.kind === "client-payment-due-soon");
    expect(t).toBeDefined();
    expect(t!.title).toContain("de ZZP'er");
  });

  it("verweesde factuur (geen samenwerking) → overgeslagen, geen nudge", async () => {
    state.dueSoonInvoices = [{ id: "inv-orphan", collaboration: null }];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "client-payment-due-soon")).toBeUndefined();
  });
});
