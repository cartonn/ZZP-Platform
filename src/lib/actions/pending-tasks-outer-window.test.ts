// Regressietest voor de next-action-engine (DOEL 1b — cross-surface-consistentie): OUTER-WINDOW-
// blindheid. Zowel `freelancerTasks` als `clientTasks` haalden de geld-/keur-taken (betaling markeren,
// factuur/prestatie goedkeuren) af van de sub-relaties van een GECAPTE samenwerkings-query
// (`orderBy: { updatedAt: "desc" }, take: MAX`). `Collaboration.updatedAt` is echter een @updatedAt-
// kolom die ALLEEN bij een directe mutatie op de samenwerkingsrij wordt bijgewerkt (contract tekenen,
// dispuut, annuleren, auto-afronding) — het indienen/goedkeuren van een prestatie of factuur raakt de
// rij nooit. Voor een ACTIVE-samenwerking staat `updatedAt` dus bevroren op het teken-moment. Bij >MAX
// gelijktijdige samenwerkingen ordent het venster puur op "hoe recent is het contract getekend"; een
// ouder-getekende samenwerking met vastzittend geld/goedkeuring valt buiten `take: MAX` en verdwijnt —
// anders dan de inner-window-bugs (run 76/77) — PERMANENT uit /acties, de badge en de dashboard-rail
// (afhandelen bumpt `updatedAt` niet → geen self-heal). De fix haalt die derivaties uit dedicated,
// status-gefilterde, ONGEWINDOWDE `prisma.invoice.findMany`/`prisma.performance.findMany`-queries
// (gescoopt op de samenwerkings-eigenaar), gespiegeld aan de bestaande `rejectedPerfs`-aanpak. Deze test
// duwt één samenwerking met vastzittend geld/goedkeuring bewust buiten het updatedAt-venster en borgt
// dat de taak tóch verschijnt — met de oude, vensterafhankelijke derivatie zou 'ie ontbreken.

import { describe, it, expect, vi, beforeEach } from "vitest";

const MAX = 50;

type Perf = { id: string; status: string; createdAt: Date; submittedAt?: Date | null };
type Inv = {
  id: string;
  lifecycleStatus: string;
  createdAt: Date;
  counterpartyUserId?: string;
};
type Collab = {
  id: string;
  party: "FREELANCER" | "CLIENT";
  status: string;
  disputedAt: Date | null;
  updatedAt: Date;
  jobTitle: string;
  companyName: string;
  freelancerName: string;
  performances: Perf[];
  invoices: Inv[];
};

const state = vi.hoisted(() => ({ collabs: [] as unknown[] }));

vi.mock("@/lib/db", () => {
  const active = () =>
    (state.collabs as Collab[]).filter((c) => c.status === "ACTIVE" && c.disputedAt === null);
  return {
    prisma: {
      user: { findUnique: vi.fn(async () => ({ identityVerifiedAt: new Date() })) },
      company: { findUnique: vi.fn(async () => null) },
      credential: { findMany: vi.fn(async () => []) },
      availabilityWindow: { findMany: vi.fn(async () => []) },
      application: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
      job: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
      conversationParticipant: { findMany: vi.fn(async () => []) },
      message: { groupBy: vi.fn(async () => []) },
      conversation: { findMany: vi.fn(async () => []) },
      noShowReport: { findFirst: vi.fn(async () => null), count: vi.fn(async () => 0) },
      auditLog: { findMany: vi.fn(async () => []) },
      // GEWINDOWDE samenwerkings-query: bootst de echte Prisma-windowing na (orderBy updatedAt desc,
      // take MAX). Zo valt een ouder-getekende samenwerking (oudste updatedAt) buiten de slice — precies
      // de situatie die de bug blootlegt. De review-/renewal-paden (status COMPLETED / endDate-filter)
      // blijven leeg zodat de test uitsluitend de geld-/keur-derivatie meet.
      collaboration: {
        findMany: vi.fn(
          async (args?: {
            where?: {
              status?: unknown;
              endDate?: unknown;
              company?: unknown;
              freelancer?: unknown;
            };
          }) => {
            const w = args?.where ?? {};
            if (w.status === "COMPLETED") return [];
            if (w.endDate !== undefined) return [];
            const party = w.company ? "CLIENT" : "FREELANCER";
            return (state.collabs as Collab[])
              .filter(
                (c) =>
                  c.party === party &&
                  c.disputedAt === null &&
                  (c.status === "PROPOSED" || c.status === "ACTIVE"),
              )
              .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
              .slice(0, MAX)
              .map((c) => ({
                id: c.id,
                status: c.status,
                job: { title: c.jobTitle, credentialRequirements: [] },
                company: { name: c.companyName },
                freelancer: { user: { name: c.freelancerName }, credentials: [] },
                performances: c.performances
                  .slice(0, 5)
                  .map((p) => ({ id: p.id, status: p.status })),
              }));
          },
        ),
      },
      // ONGEWINDOWDE prestatie-query (rejectedPerfs = REJECTED voor de ZZP'er; approvePerformances =
      // SUBMITTED voor de opdrachtgever). Losgekoppeld van het samenwerkingsvenster: scant ALLE ACTIVE-
      // samenwerkingen, ongeacht updatedAt.
      performance: {
        findMany: vi.fn(async (args?: { where?: { status?: string } }) => {
          const status = args?.where?.status;
          return active()
            .flatMap((c) =>
              c.performances
                .filter((p) => p.status === status)
                .map((p) => ({
                  id: p.id,
                  createdAt: p.createdAt,
                  submittedAt: p.submittedAt ?? null,
                  collaborationId: c.id,
                  collaboration: {
                    job: { title: c.jobTitle },
                    freelancer: { user: { name: c.freelancerName } },
                  },
                })),
            )
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .slice(0, MAX);
        }),
      },
      // ONGEWINDOWDE factuur-query (openInvoices = ZZP-betaal-/concept-tak; approveInvoices = SUBMITTED-
      // keur-tak). Idem losgekoppeld van het samenwerkingsvenster.
      invoice: {
        findMany: vi.fn(
          async (args?: {
            where?: { lifecycleStatus?: { in?: string[] } | string; counterpartyUserId?: string };
          }) => {
            const ls = args?.where?.lifecycleStatus;
            const statuses = typeof ls === "string" ? [ls] : (ls?.in ?? []);
            const cpu = args?.where?.counterpartyUserId;
            return active()
              .flatMap((c) =>
                c.invoices
                  .filter((i) => statuses.includes(i.lifecycleStatus))
                  .filter((i) => cpu === undefined || i.counterpartyUserId === cpu)
                  .map((i) => ({
                    id: i.id,
                    lifecycleStatus: i.lifecycleStatus,
                    createdAt: i.createdAt,
                    collaborationId: c.id,
                    collaboration: { job: { title: c.jobTitle } },
                  })),
              )
              .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
              .slice(0, MAX);
          },
        ),
      },
    },
  };
});

// Profielblok uitschakelen (null-profiel) zodat freelancerTasks de certificaat-/no-show-taken overslaat
// en de test uitsluitend de samenwerkings-geld-tak isoleert.
vi.mock("@/lib/data/freelancer-profile", () => ({
  getCompletenessProfile: vi.fn(async () => null),
}));

vi.mock("@/lib/signals", () => ({
  overdueInvoiceCount: vi.fn(async () => 0),
  overdueInvoiceBreakdown: vi.fn(async () => ({ legacy: 0, cascade: 0 })),
  paymentDueSoonCount: vi.fn(async () => 0),
}));
vi.mock("@/lib/data/income-tax-deadline", () => ({
  getIncomeTaxDeadlineForActor: vi.fn(async () => null),
}));
vi.mock("@/lib/data/vat-deadline", () => ({ getVatDeadlinesForActor: vi.fn(async () => []) }));
vi.mock("@/lib/tax/hours-criterion-summary", () => ({
  getHoursCriterionSummary: vi.fn(async () => null),
  hoursCriterionNeedsAction: vi.fn(() => false),
}));
vi.mock("@/lib/data/client-overdue-jobs", () => ({ getClientOverdueJobs: vi.fn(async () => []) }));
vi.mock("@/lib/data/client-cold-jobs", () => ({ getClientColdJobs: vi.fn(async () => []) }));
vi.mock("@/lib/collaboration-alerts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/collaboration-alerts")>();
  return { ...actual, clientCredentialAlerts: vi.fn(async () => []) };
});

import { pendingTasks } from "@/lib/actions/pending-tasks";

const NOW = Date.now();
// Recente updatedAt (elk uniek, allemaal nieuwer dan de vastzittende samenwerking) — vult het venster.
const recent = (i: number) => new Date(NOW - i * 1000);
// Vér in het verleden getekend contract → oudste updatedAt → valt buiten de MAX-slice.
const ANCIENT = new Date(NOW - 10_000 * 86_400_000);

beforeEach(() => {
  state.collabs = [];
});

describe("freelancerTasks — outer-window-blindheid (betaal-taak op ouder-getekende samenwerking)", () => {
  it("surfacet een APPROVED-factuur die uit het gecapte updatedAt-venster viel", async () => {
    // MAX idle ACTIVE-samenwerkingen met een verse updatedAt en één APPROVED-prestatie (geen open taak),
    // plus één ouder-getekende samenwerking (oudste updatedAt) met een vastzittende APPROVED-factuur.
    const idle: Collab[] = Array.from({ length: MAX }, (_, i) => ({
      id: `f-idle-${i}`,
      party: "FREELANCER",
      status: "ACTIVE",
      disputedAt: null,
      updatedAt: recent(i + 1),
      jobTitle: `Dienst ${i}`,
      companyName: "Zorgcentrum",
      freelancerName: "Sanne",
      performances: [{ id: `f-idle-perf-${i}`, status: "APPROVED", createdAt: recent(i + 1) }],
      invoices: [],
    }));
    const stuck: Collab = {
      id: "f-stuck",
      party: "FREELANCER",
      status: "ACTIVE",
      disputedAt: null,
      updatedAt: ANCIENT,
      jobTitle: "Vastzittende nachtdienst",
      companyName: "Zorgcentrum Noord",
      freelancerName: "Sanne",
      performances: [{ id: "f-stuck-perf", status: "APPROVED", createdAt: ANCIENT }],
      invoices: [{ id: "f-stuck-inv", lifecycleStatus: "APPROVED", createdAt: ANCIENT }],
    };
    state.collabs = [...idle, stuck];

    const tasks = await pendingTasks({
      id: "outer-window-freelancer",
      role: "FREELANCER",
      status: "ACTIVE",
    } as never);

    // De betaal-taak verschijnt ondanks dat f-stuck buiten het gecapte samenwerkingsvenster viel.
    const pay = tasks.find((t) => t.id === "payment-confirm:f-stuck-inv");
    expect(pay).toBeDefined();
    expect(pay?.kind).toBe("payment-confirm");
    expect(pay?.href).toBe("/samenwerkingen/f-stuck");
    // De idle samenwerkingen (APPROVED-prestatie, geen factuur) leveren geen ruis-taken op.
    expect(tasks.some((t) => t.kind === "invoice-submit")).toBe(false);
  });

  it("surfacet een OVERDUE-factuur uit hetzelfde buiten-venster-scenario met de attention-toon", async () => {
    const idle: Collab[] = Array.from({ length: MAX }, (_, i) => ({
      id: `f2-idle-${i}`,
      party: "FREELANCER",
      status: "ACTIVE",
      disputedAt: null,
      updatedAt: recent(i + 1),
      jobTitle: `Dienst ${i}`,
      companyName: "Zorgcentrum",
      freelancerName: "Sanne",
      performances: [{ id: `f2-idle-perf-${i}`, status: "APPROVED", createdAt: recent(i + 1) }],
      invoices: [],
    }));
    const stuck: Collab = {
      id: "f2-stuck",
      party: "FREELANCER",
      status: "ACTIVE",
      disputedAt: null,
      updatedAt: ANCIENT,
      jobTitle: "Vastzittende nachtdienst",
      companyName: "Zorgcentrum Noord",
      freelancerName: "Sanne",
      performances: [{ id: "f2-stuck-perf", status: "APPROVED", createdAt: ANCIENT }],
      invoices: [{ id: "f2-stuck-inv", lifecycleStatus: "OVERDUE", createdAt: ANCIENT }],
    };
    state.collabs = [...idle, stuck];

    const tasks = await pendingTasks({
      id: "outer-window-freelancer-overdue",
      role: "FREELANCER",
      status: "ACTIVE",
    } as never);

    const pay = tasks.find((t) => t.id === "payment-confirm:f2-stuck-inv");
    expect(pay).toBeDefined();
    expect(pay?.tone).toBe("attention");
  });
});

describe("clientTasks — outer-window-blindheid (keur-taken op ouder-getekende samenwerking)", () => {
  it("surfacet SUBMITTED-prestatie én -factuur die uit het gecapte updatedAt-venster vielen", async () => {
    const CLIENT_ID = "outer-window-client";
    const idle: Collab[] = Array.from({ length: MAX }, (_, i) => ({
      id: `c-idle-${i}`,
      party: "CLIENT",
      status: "ACTIVE",
      disputedAt: null,
      updatedAt: recent(i + 1),
      jobTitle: `Dienst ${i}`,
      companyName: "Zorgcentrum",
      freelancerName: "Sanne",
      performances: [],
      invoices: [],
    }));
    const stuck: Collab = {
      id: "c-stuck",
      party: "CLIENT",
      status: "ACTIVE",
      disputedAt: null,
      updatedAt: ANCIENT,
      jobTitle: "Vastzittende nachtdienst",
      companyName: "Zorgcentrum Noord",
      freelancerName: "Bram",
      performances: [{ id: "c-stuck-perf", status: "SUBMITTED", createdAt: ANCIENT }],
      invoices: [
        {
          id: "c-stuck-inv",
          lifecycleStatus: "SUBMITTED",
          createdAt: ANCIENT,
          counterpartyUserId: CLIENT_ID,
        },
      ],
    };
    state.collabs = [...idle, stuck];

    const tasks = await pendingTasks({
      id: CLIENT_ID,
      role: "CLIENT",
      status: "ACTIVE",
    } as never);

    const approvePerf = tasks.find((t) => t.id === "performance-approve:c-stuck-perf");
    expect(approvePerf).toBeDefined();
    expect(approvePerf?.kind).toBe("performance-approve");
    expect(approvePerf?.subtitle).toContain("Bram");

    const approveInv = tasks.find((t) => t.id === "invoice-approve:c-stuck-inv");
    expect(approveInv).toBeDefined();
    expect(approveInv?.kind).toBe("invoice-approve");
    expect(approveInv?.href).toBe("/samenwerkingen/c-stuck");
  });

  it("laat de keur-taak escaleren zodra de ingediende urenstaat al lang op goedkeuring wacht", async () => {
    const CLIENT_ID = "wait-aware-client";
    state.collabs = [
      {
        id: "c-old-submit",
        party: "CLIENT",
        status: "ACTIVE",
        disputedAt: null,
        updatedAt: recent(1),
        jobTitle: "Weekenddienst",
        companyName: "Zorgcentrum Zuid",
        freelancerName: "Nadia",
        // Al lang geleden ingediend → voorbij PERFORMANCE_WAIT_ATTENTION_DAYS.
        performances: [
          { id: "c-old-perf", status: "SUBMITTED", createdAt: ANCIENT, submittedAt: ANCIENT },
        ],
        invoices: [],
      },
    ];

    const tasks = await pendingTasks({
      id: CLIENT_ID,
      role: "CLIENT",
      status: "ACTIVE",
    } as never);

    const approvePerf = tasks.find((t) => t.id === "performance-approve:c-old-perf");
    expect(approvePerf).toBeDefined();
    // Spiegelt /prestaties + de dag-3/7-e-mail: overdue-band (67) i.p.v. de vlakke approve-band (65).
    expect(approvePerf?.priority).toBe(67);
    expect(approvePerf?.subtitle).toContain("wacht al");
  });
});
