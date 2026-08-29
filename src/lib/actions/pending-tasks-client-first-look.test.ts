// Regressietest voor de next-action-engine (opdrachtgever): een NEW-reactie die de ghosting-drempel
// (`CANDIDATE_GHOSTING_RISK_DAYS`) bereikte zonder eerste blik moet een eigen, urgentere eerste-reactie-
// taak worden — en die onbekeken-oude reacties moeten worden afgetrokken van de generieke "nieuwe
// reacties"-telling, zodat dezelfde kandidaat nooit in beide taken opduikt. Voorheen kreeg de
// opdrachtgever alleen een leeftijdloze telling; een 8 dagen onbekeken kandidaat viel niet op.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { P } from "@/lib/next-actions";
import { CANDIDATE_GHOSTING_RISK_DAYS } from "@/lib/client-application-funnel";

const NOW = Date.now();
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000);

const state = vi.hoisted(() => ({
  newCount: 0,
  agingCount: 0,
  agingNew: [] as { createdAt: Date }[],
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    company: { findUnique: vi.fn(async () => null) },
    application: {
      // Twee count-callers: de totale NEW-telling (geen createdAt-filter) en de exacte onbekeken-oude
      // telling (mét createdAt-filter). Onderscheid op de aanwezigheid van het createdAt-filter.
      count: vi.fn(async (args: { where?: { createdAt?: unknown } }) =>
        args?.where?.createdAt != null ? state.agingCount : state.newCount,
      ),
      // Drie findMany-callers delen application.findMany; onderscheid op het status-filter.
      findMany: vi.fn(async (args: { where?: { status?: unknown } }) => {
        const status = args?.where?.status;
        if (status === "NEW") return state.agingNew;
        return [];
      }),
    },
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

// Isoleer de reactie-tak: overige opdrachtgever-signalen uitgeschakeld.
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
vi.mock("@/lib/data/client-overdue-jobs", () => ({ getClientOverdueJobs: vi.fn(async () => []) }));
vi.mock("@/lib/data/client-cold-jobs", () => ({ getClientColdJobs: vi.fn(async () => []) }));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-client", role: "CLIENT", status: "ACTIVE" } as const;

beforeEach(() => {
  state.newCount = 0;
  state.agingCount = 0;
  state.agingNew = [];
});

// Houdt de exacte aging-telling in sync met de rijen (behalve waar de MAX-cap bewust getest wordt).
const setAging = (rows: { createdAt: Date }[]) => {
  state.agingNew = rows;
  state.agingCount = rows.length;
};

describe("clientTasks — eerste-reactie-SLA (onbekeken NEW-reactie)", () => {
  it("geen onbekeken-oude reactie → geen eerste-reactie-taak", async () => {
    state.newCount = 2; // beide vers (findMany levert geen aging-rijen)
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "first-look-overdue")).toBeUndefined();
    const review = tasks.find((t) => t.kind === "applications-review");
    expect(review).toBeDefined();
    expect(review!.title).toContain("2");
  });

  it("onbekeken NEW-reactie voorbij de drempel → eigen taak met leeftijd + deep-link + band", async () => {
    state.newCount = 1;
    setAging([{ createdAt: daysAgo(CANDIDATE_GHOSTING_RISK_DAYS + 3) }]);
    const tasks = await pendingTasks(ACTOR);
    const t = tasks.find((x) => x.kind === "first-look-overdue");
    expect(t).toBeDefined();
    expect(t!.id).toBe("first-look-overdue");
    expect(t!.href).toBe("/kandidaten");
    expect(t!.title).toContain("eerste reactie");
    expect(t!.subtitle).toContain(String(CANDIDATE_GHOSTING_RISK_DAYS + 3));
    expect(t!.tone).toBe("attention");
    expect(t!.priority).toBe(P.firstLookOverdue);
    // Urgenter dan een reeds-bekeken wachtende kandidaat en de leeftijdloze nieuwe-reacties-telling.
    expect(P.firstLookOverdue).toBeGreaterThan(P.staleApplications);
    expect(P.firstLookOverdue).toBeGreaterThan(P.applications);
  });

  it("onbekeken-oude reacties worden van de generieke telling afgetrokken (geen dubbel)", async () => {
    state.newCount = 5;
    setAging([
      { createdAt: daysAgo(CANDIDATE_GHOSTING_RISK_DAYS + 1) },
      { createdAt: daysAgo(CANDIDATE_GHOSTING_RISK_DAYS + 4) },
    ]);
    const tasks = await pendingTasks(ACTOR);
    const overdue = tasks.find((t) => t.kind === "first-look-overdue");
    expect(overdue!.title).toContain("2"); // 2 onbekeken-oud
    const review = tasks.find((t) => t.kind === "applications-review");
    expect(review).toBeDefined();
    expect(review!.title).toContain("3"); // 5 − 2 = 3 vers
  });

  it("alle NEW-reacties zijn onbekeken-oud → alleen de eerste-reactie-taak, geen lege telling", async () => {
    state.newCount = 2;
    setAging([
      { createdAt: daysAgo(CANDIDATE_GHOSTING_RISK_DAYS + 2) },
      { createdAt: daysAgo(CANDIDATE_GHOSTING_RISK_DAYS + 6) },
    ]);
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.kind === "first-look-overdue")).toBeDefined();
    expect(tasks.find((t) => t.kind === "applications-review")).toBeUndefined();
  });

  it(">MAX onbekeken-oude reacties: de EXACTE telling stuurt count + aftrek (geen weglek naar 'vers')", async () => {
    // De aging-findMany is op MAX (50) gecapt, maar de exacte count is 60. Zonder de losse count zouden
    // 10 échte oude reacties als "vers" in de generieke telling weglekken. Nu: count=60, vers=0.
    state.newCount = 60;
    state.agingCount = 60;
    state.agingNew = Array.from({ length: 50 }, (_, i) => ({
      createdAt: daysAgo(CANDIDATE_GHOSTING_RISK_DAYS + 1 + i),
    }));
    const tasks = await pendingTasks(ACTOR);
    const overdue = tasks.find((t) => t.kind === "first-look-overdue");
    expect(overdue).toBeDefined();
    expect(overdue!.title).toContain("60"); // exacte telling, niet de gecapte 50
    // 60 − 60 = 0 → geen (misleidende) "nieuwe reacties"-restpost.
    expect(tasks.find((t) => t.kind === "applications-review")).toBeUndefined();
  });
});
