// Regressietest voor de next-action-engine (DOEL 1b — outer-window-blindheid, run 81). De
// "Onderteken"-taak (PROPOSED, ZZP'er én opdrachtgever) en de "Uren indienen"-taak (ACTIVE zonder
// ingediende prestatie) werden afgeleid uit een GECAPTE samenwerkings-query
// (`orderBy: { updatedAt: "desc" }, take: MAX`). `Collaboration.updatedAt` is een @updatedAt-kolom die
// ALLEEN bij een directe mutatie op de rij wordt bijgewerkt (tekenen, dispuut, annuleren, auto-afronding)
// — het voorstellen/tekenen of het indienen van een prestatie bumpt de rij daarna niet. Bij >MAX
// gelijktijdige PROPOSED+ACTIVE-samenwerkingen ordent het venster puur op "hoe recent is de rij geraakt";
// een ouder-voorgestelde (of ouder-getekende) samenwerking met een openstaande teken-/indien-actie viel
// buiten `take: MAX` en verdween — anders dan de inner-window-bugs — PERMANENT uit /acties, de badge en de
// dashboard-rail (de actie zelf bumpt `updatedAt` niet → geen self-heal), terwijl het samenwerkingsdetail
// de partij nog wél als "aan zet" toonde. De fix haalt beide taken uit dedicated, status-gefilterde,
// ONGEWINDOWDE `prisma.collaboration.findMany`-queries (`createdAt asc`), gespiegeld aan de bestaande
// `rejectedPerfs`/`openInvoices`/`credentialCollabs`-aanpak. Deze test duwt één samenwerking met een
// openstaande teken-/indien-actie bewust buiten het updatedAt-venster en borgt dat de taak tóch verschijnt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const MAX = 50;

type Perf = { status: string };
type Collab = {
  id: string;
  party: "FREELANCER" | "CLIENT";
  status: string;
  disputedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
  jobTitle: string;
  companyName: string;
  freelancerName: string;
  latestPerf: Perf | null; // meest recente prestatie (null = geen prestatie)
};

const state = vi.hoisted(() => ({ collabs: [] as unknown[] }));

vi.mock("@/lib/db", () => {
  const forParty = (party: "FREELANCER" | "CLIENT") =>
    (state.collabs as Collab[]).filter((c) => c.party === party && c.disputedAt === null);
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
      performance: { findMany: vi.fn(async () => []) },
      invoice: { findMany: vi.fn(async () => []) },
      collaboration: {
        findMany: vi.fn(
          async (args?: {
            where?: {
              status?: unknown;
              endDate?: unknown;
              company?: unknown;
              freelancer?: unknown;
              job?: unknown;
              OR?: unknown;
            };
          }) => {
            const w = args?.where ?? {};
            const party: "FREELANCER" | "CLIENT" = w.company ? "CLIENT" : "FREELANCER";
            const rows = forParty(party);
            // Review-/renewal-paden leeg laten zodat de test uitsluitend de teken-/indien-tak meet.
            if (w.status === "COMPLETED") return [];
            if (w.endDate !== undefined) return [];
            // credentialCollabs (job.credentialRequirements-filter): geen certificaat-vereisten in deze
            // test → leeg. Zou de OUDE gewindowde `{ in: [...] }`-query (updatedAt desc) ook dekken; die
            // bestaat na de fix niet meer, dus een revert laat deze test correct falen (taak valt uit).
            if (w.job !== undefined || (typeof w.status === "object" && w.status !== null)) {
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
                  performances: c.latestPerf
                    ? [{ id: `${c.id}-p`, status: c.latestPerf.status }]
                    : [],
                }));
            }
            // NIEUW — ongewindowde teken-query (PROPOSED, createdAt asc).
            if (w.status === "PROPOSED") {
              return rows
                .filter((c) => c.status === "PROPOSED")
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                .slice(0, MAX)
                .map((c) => ({
                  id: c.id,
                  job: { title: c.jobTitle, credentialRequirements: [] },
                  company: { name: c.companyName },
                  freelancer: { user: { name: c.freelancerName }, credentials: [] },
                }));
            }
            // NIEUW — ongewindowde indien-query (ACTIVE, performances none/DRAFT, createdAt asc).
            if (w.status === "ACTIVE" && w.OR !== undefined) {
              return rows
                .filter(
                  (c) =>
                    c.status === "ACTIVE" &&
                    (c.latestPerf === null || c.latestPerf.status === "DRAFT"),
                )
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                .slice(0, MAX)
                .map((c) => ({
                  id: c.id,
                  job: { title: c.jobTitle },
                  performances: c.latestPerf ? [{ status: c.latestPerf.status }] : [],
                }));
            }
            return [];
          },
        ),
      },
    },
  };
});

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
vi.mock("@/lib/data/client-cold-jobs", () => ({ getClientColdJobs: vi.fn(async () => []) }));
vi.mock("@/lib/collaboration-alerts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/collaboration-alerts")>();
  return { ...actual, clientCredentialAlerts: vi.fn(async () => []) };
});

import { pendingTasks } from "@/lib/actions/pending-tasks";

const NOW = Date.now();
const recent = (i: number) => new Date(NOW - i * 1000);
const ANCIENT = new Date(NOW - 10_000 * 86_400_000);

beforeEach(() => {
  state.collabs = [];
});

describe("freelancerTasks — outer-window-blindheid op de teken-/indien-taak (run 81)", () => {
  it("surfacet de Onderteken-taak van een ouder-voorgestelde samenwerking buiten het updatedAt-venster", async () => {
    // MAX ACTIVE-samenwerkingen met een verse updatedAt (vullen het oude venster; geen teken-taak), plus
    // één ouder-voorgestelde samenwerking (oudste updatedAt) die nog getekend moet worden.
    const idle: Collab[] = Array.from({ length: MAX }, (_, i) => ({
      id: `f-idle-${i}`,
      party: "FREELANCER",
      status: "ACTIVE",
      disputedAt: null,
      updatedAt: recent(i + 1),
      createdAt: recent(i + 1),
      jobTitle: `Dienst ${i}`,
      companyName: "Zorgcentrum",
      freelancerName: "Sanne",
      latestPerf: { status: "APPROVED" }, // geen indien-taak
    }));
    const stuck: Collab = {
      id: "f-sign-stuck",
      party: "FREELANCER",
      status: "PROPOSED",
      disputedAt: null,
      updatedAt: ANCIENT,
      createdAt: ANCIENT,
      jobTitle: "Vastzittende nachtdienst",
      companyName: "Zorgcentrum Noord",
      freelancerName: "Sanne",
      latestPerf: null,
    };
    state.collabs = [...idle, stuck];

    const tasks = await pendingTasks({
      id: "sign-window-freelancer",
      role: "FREELANCER",
      status: "ACTIVE",
    } as never);

    const sign = tasks.find((t) => t.id === "contract-sign:f-sign-stuck");
    expect(sign).toBeDefined();
    expect(sign?.kind).toBe("contract-sign");
    expect(sign?.href).toBe("/samenwerkingen/f-sign-stuck");
  });

  it("surfacet de Uren-indienen-taak van een ouder-getekende ACTIVE-samenwerking zonder prestatie", async () => {
    const idle: Collab[] = Array.from({ length: MAX }, (_, i) => ({
      id: `f2-idle-${i}`,
      party: "FREELANCER",
      status: "ACTIVE",
      disputedAt: null,
      updatedAt: recent(i + 1),
      createdAt: recent(i + 1),
      jobTitle: `Dienst ${i}`,
      companyName: "Zorgcentrum",
      freelancerName: "Sanne",
      latestPerf: { status: "APPROVED" },
    }));
    const stuck: Collab = {
      id: "f2-submit-stuck",
      party: "FREELANCER",
      status: "ACTIVE",
      disputedAt: null,
      updatedAt: ANCIENT,
      createdAt: ANCIENT,
      jobTitle: "Vastzittende nachtdienst",
      companyName: "Zorgcentrum Noord",
      freelancerName: "Sanne",
      latestPerf: null, // nog geen uren ingediend
    };
    state.collabs = [...idle, stuck];

    const tasks = await pendingTasks({
      id: "submit-window-freelancer",
      role: "FREELANCER",
      status: "ACTIVE",
    } as never);

    const submit = tasks.find((t) => t.id === "performance-submit:f2-submit-stuck");
    expect(submit).toBeDefined();
    expect(submit?.kind).toBe("performance-submit");
  });
});

describe("clientTasks — outer-window-blindheid op de teken-taak (run 81)", () => {
  it("surfacet de Onderteken-taak van een ouder-voorgestelde samenwerking buiten het updatedAt-venster", async () => {
    const idle: Collab[] = Array.from({ length: MAX }, (_, i) => ({
      id: `c-idle-${i}`,
      party: "CLIENT",
      status: "ACTIVE",
      disputedAt: null,
      updatedAt: recent(i + 1),
      createdAt: recent(i + 1),
      jobTitle: `Dienst ${i}`,
      companyName: "Zorgcentrum",
      freelancerName: "Bram",
      latestPerf: { status: "APPROVED" },
    }));
    const stuck: Collab = {
      id: "c-sign-stuck",
      party: "CLIENT",
      status: "PROPOSED",
      disputedAt: null,
      updatedAt: ANCIENT,
      createdAt: ANCIENT,
      jobTitle: "Vastzittende nachtdienst",
      companyName: "Zorgcentrum Noord",
      freelancerName: "Bram",
      latestPerf: null,
    };
    state.collabs = [...idle, stuck];

    const tasks = await pendingTasks({
      id: "sign-window-client",
      role: "CLIENT",
      status: "ACTIVE",
    } as never);

    const sign = tasks.find((t) => t.id === "contract-sign:c-sign-stuck");
    expect(sign).toBeDefined();
    expect(sign?.kind).toBe("contract-sign");
    expect(sign?.subtitle).toContain("Bram");
  });
});
