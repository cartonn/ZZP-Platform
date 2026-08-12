// Regressietest voor de next-action-engine (opdrachtgever): een cascade-factuur die OVER de vervaldatum
// staat (lifecycleStatus=OVERDUE) waarvan de opdrachtgever de betalende partij is, moet als item-taak in
// /acties verschijnen. In de cascade betaalt de opdrachtgever out-of-band (geen "Markeer als betaald"-knop,
// `canPay = !cascade`); wordt de factuur OVERDUE dan zag hij tot nu toe NIETS — terwijl de ZZP'er wél een
// `paymentConfirmTask(overdue)` kreeg. Het geparkeerde run-53 "Besluit 1"-gat: de opdrachtgever moet weten
// dát er een openstaande betaling is (betaal 'm / laat de betaling bevestigen).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { P } from "@/lib/next-actions";

type OverdueInvoiceRow = {
  id: string;
  collaboration: {
    id: string;
    job: { title: string };
    freelancer: { user: { name: string | null } };
  } | null;
};

const state = vi.hoisted(() => ({
  overdueInvoices: [] as OverdueInvoiceRow[],
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    company: { findUnique: vi.fn(async () => null) },
    application: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    job: { count: vi.fn(async () => 0) },
    collaboration: { findMany: vi.fn(async () => []) },
    invoice: { findMany: vi.fn(async () => state.overdueInvoices) },
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

// clientTasks roept nu getClientColdJobs aan (prisma.job.findMany); neutraliseren zoals de overige
// externe data-helpers, zodat deze tak geïsoleerd blijft.
vi.mock("@/lib/data/client-cold-jobs", () => ({ getClientColdJobs: vi.fn(async () => []) }));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-client", role: "CLIENT", status: "ACTIVE" } as const;

beforeEach(() => {
  state.overdueInvoices = [];
});

describe("clientTasks — cascade-overdue betaal-nudge", () => {
  it("geen overdue cascade-factuur → geen betaal-nudge", async () => {
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "client-overdue-payment")).toBeUndefined();
  });

  it("overdue cascade-factuur → één betaal-nudge met deep-link, ZZP-naam en overdue-band", async () => {
    state.overdueInvoices = [
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
    const t = tasks.find((x) => x.kind === "client-overdue-payment");
    expect(t).toBeDefined();
    expect(t!.id).toBe("client-overdue-payment:inv-1");
    expect(t!.href).toBe("/samenwerkingen/collab-1");
    expect(t!.title).toContain("Sanne");
    expect(t!.subtitle).toContain("Nachtdienst VVT");
    expect(t!.subtitle).toContain("over de vervaldatum");
    expect(t!.tone).toBe("attention");
    expect(t!.priority).toBe(P.clientCascadeOverduePayment);
    // Boven de pre-due nudge, onder de generieke al-verstreken roll-up.
    expect(P.clientCascadeOverduePayment).toBeGreaterThan(P.paymentDueSoon);
    expect(P.clientCascadeOverduePayment).toBeLessThan(P.overdueInvoice);
    // Een reeds-verstreken cascade-betaling (post-due) moet BOVEN elke pre-due nudge staan, incl. de
    // naderende (nog-niet-verstreken) BTW-deadline — anders rangschikt /acties een soft heads-up
    // boven een echte, openstaande betaalverplichting van dezelfde opdrachtgever.
    expect(P.clientCascadeOverduePayment).toBeGreaterThan(P.vatDeadlineDueSoon);
  });

  it("meerdere overdue cascade-facturen → één nudge per factuur", async () => {
    state.overdueInvoices = [
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
    const nudges = tasks.filter((t) => t.kind === "client-overdue-payment");
    expect(nudges.map((t) => t.id)).toEqual([
      "client-overdue-payment:inv-a",
      "client-overdue-payment:inv-b",
    ]);
  });

  it("ZZP'er zonder naam → veilige fallback in de titel", async () => {
    state.overdueInvoices = [
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
    const t = tasks.find((x) => x.kind === "client-overdue-payment");
    expect(t).toBeDefined();
    expect(t!.title).toContain("de ZZP'er");
  });

  it("verweesde factuur (geen samenwerking) → overgeslagen, geen nudge", async () => {
    state.overdueInvoices = [{ id: "inv-orphan", collaboration: null }];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "client-overdue-payment")).toBeUndefined();
  });
});
