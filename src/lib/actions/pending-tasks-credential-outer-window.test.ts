// Regressietest voor de next-action-engine (DOEL 1b — persona-sweep run 79): OUTER-WINDOW-blindheid
// op de CERTIFICAAT-taken van de ZZP'er. De drie samenwerking-gebonden certificaat-taken
// (credentialCollabExpiry / credentialCollabExpired / credentialCollabMissing) werden afgeleid uit de
// `collabs`-relatie die op `orderBy: { updatedAt: "desc" }, take: MAX` staat. `Collaboration.updatedAt`
// is een @updatedAt-kolom die ALLEEN bij een directe mutatie op de samenwerkingsrij wordt bijgewerkt
// (contract tekenen, dispuut, annuleren, auto-afronding) — een certificaat dat verloopt/wordt afgekeurd/
// nooit wordt aangeleverd raakt de rij nooit. Bij >MAX gelijktijdige samenwerkingen viel een ouder-
// getekende samenwerking met een net verlopen/ontbrekend vereist certificaat buiten `take: MAX` en
// verdween — anders dan de inner-window-bugs (run 76/77) — PERMANENT uit /acties, de badge én de
// dashboard-rail (het aanleveren/vernieuwen bumpt `updatedAt` niet → geen self-heal), terwijl de
// opdrachtgever de spiegel-alert (clientComplianceTask) wél zag. Run 78 dichtte ditzelfde gat voor de
// geld-taken (openInvoices/rejectedPerfs) maar niet voor deze drie certificaat-emitters. De fix haalt
// ze uit een dedicated, `credentialRequirements: { some: { required: true } }`-gefilterde, `createdAt
// asc`-geordende query (alleen certificaat-dragende samenwerkingen vullen het venster, oudste blijft
// staan → self-healing). Deze test duwt één certificaat-dragende samenwerking bewust buiten het
// updatedAt-venster en borgt dat de aanlever-taak tóch verschijnt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const MAX = 50;

type Collab = {
  id: string;
  status: string;
  updatedAt: Date;
  createdAt: Date;
  jobTitle: string;
  companyName: string;
  requiredTypes: string[];
};

const state = vi.hoisted(() => ({
  creds: [] as {
    id: string;
    title: string;
    type: string;
    status: string;
    expiresAt: Date | null;
  }[],
  collabs: [] as Collab[],
}));

vi.mock("@/lib/db", () => {
  const proposedOrActive = () =>
    state.collabs.filter((c) => c.status === "PROPOSED" || c.status === "ACTIVE");
  return {
    prisma: {
      user: { findUnique: vi.fn(async () => ({ identityVerifiedAt: new Date() })) },
      company: { findUnique: vi.fn(async () => null) },
      credential: { findMany: vi.fn(async () => state.creds) },
      availabilityWindow: { findMany: vi.fn(async () => []) },
      performance: { findMany: vi.fn(async () => []) },
      invoice: { findMany: vi.fn(async () => []) },
      conversationParticipant: { findMany: vi.fn(async () => []) },
      message: { groupBy: vi.fn(async () => []) },
      conversation: { findMany: vi.fn(async () => []) },
      noShowReport: { findFirst: vi.fn(async () => null), count: vi.fn(async () => 0) },
      auditLog: { findMany: vi.fn(async () => []) },
      job: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
      application: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
      collaboration: {
        findMany: vi.fn(
          async (args?: {
            where?: { status?: { in?: string[] }; endDate?: unknown; job?: unknown };
          }) => {
            const w = args?.where ?? {};
            const inList = w.status?.in ?? [];
            if (w.endDate !== undefined) return []; // renewal-tak
            if (!inList.includes("ACTIVE") || inList.includes("COMPLETED")) return [];
            // De CERTIFICAAT-query is de enige met een `job`-filter (credentialRequirements.some).
            // Bootst `job: { credentialRequirements: { some: { required: true } } }` + `orderBy
            // createdAt asc, take MAX` na: alleen certificaat-dragende samenwerkingen, oudste eerst.
            if (w.job !== undefined) {
              return proposedOrActive()
                .filter((c) => c.requiredTypes.length > 0)
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                .slice(0, MAX)
                .map((c) => ({
                  id: c.id,
                  job: {
                    title: c.jobTitle,
                    credentialRequirements: c.requiredTypes.map((t) => ({ credentialType: t })),
                  },
                  company: { name: c.companyName },
                }));
            }
            // De GEWINDOWDE fase-query: orderBy updatedAt desc, take MAX (met performances-relatie).
            return proposedOrActive()
              .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
              .slice(0, MAX)
              .map((c) => ({
                id: c.id,
                status: c.status,
                job: {
                  title: c.jobTitle,
                  credentialRequirements: c.requiredTypes.map((t) => ({ credentialType: t })),
                },
                company: { name: c.companyName },
                performances: [{ id: `${c.id}-perf`, status: "SUBMITTED" }],
              }));
          },
        ),
      },
    },
  };
});

// Volledig, geldig profiel: `allCreds` (en de certificaat-taak-derivatie) draait binnen `if (profile)`,
// dus een echte ZZP'er heeft altijd een profiel. Score 100 + geverifieerde identiteit → geen ruis-taken.
vi.mock("@/lib/data/freelancer-profile", () => ({
  getCompletenessProfile: vi.fn(async () => ({
    id: "prof-1",
    visibility: "PUBLIC",
    headline: "Verpleegkundige",
    bio: "Ervaren verpleegkundige met tien jaar ervaring in de zorg.",
    hourlyRate: 65,
    location: "Amsterdam",
    availability: "AVAILABLE",
    languages: JSON.stringify(["nl", "en"]),
    monthlyIncomeGoalCents: 500000,
    skills: [{ skillId: "s1" }],
    industries: [{ industryId: "i1" }],
  })),
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

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-zzp", role: "FREELANCER", status: "ACTIVE" } as const;
const NOW = Date.now();
const FUTURE = new Date(NOW + 365 * 24 * 60 * 60 * 1000);
const recent = (i: number) => new Date(NOW - i * 1000);
const ANCIENT = new Date(NOW - 10_000 * 86_400_000);

// Geldige verplichte documenten → geen mandatory-ruis; isoleert de niet-verplichte LICENSE-tak.
const validMandatory = [
  { id: "vog", title: "VOG", type: "VOG", status: "VERIFIED", expiresAt: FUTURE },
  { id: "ins", title: "Verzekering", type: "INSURANCE", status: "VERIFIED", expiresAt: FUTURE },
];

beforeEach(() => {
  state.creds = [...validMandatory];
  state.collabs = [];
});

describe("freelancerTasks — outer-window-blindheid op de certificaat-taak", () => {
  it("surfacet een ontbrekend vereist certificaat op een samenwerking die uit het updatedAt-venster viel", async () => {
    // MAX ACTIVE-samenwerkingen met verse updatedAt maar ZONDER certificaat-vereiste — die vullen het
    // updatedAt-venster (fase-query) maar niet de certificaat-query.
    const idle: Collab[] = Array.from({ length: MAX }, (_, i) => ({
      id: `idle-${i}`,
      status: "ACTIVE",
      updatedAt: recent(i + 1),
      createdAt: recent(i + 1),
      jobTitle: `Dienst ${i}`,
      companyName: "Zorgcentrum",
      requiredTypes: [],
    }));
    // Eén ouder-getekende samenwerking (oudste updatedAt → buiten het fase-venster) die een LICENSE
    // vereist, terwijl de ZZP'er geen LICENSE heeft (allCreds = alleen VOG/INSURANCE).
    const stuck: Collab = {
      id: "stuck",
      status: "ACTIVE",
      updatedAt: ANCIENT,
      createdAt: ANCIENT,
      jobTitle: "Vastzittende wijkdienst",
      companyName: "Zorggroep Noord",
      requiredTypes: ["LICENSE"],
    };
    state.collabs = [...idle, stuck];

    const tasks = await pendingTasks(ACTOR);

    // De aanlever-taak verschijnt ondanks dat `stuck` buiten het gecapte updatedAt-venster viel.
    const task = tasks.find((t) => t.id === "credential-collab-missing:LICENSE");
    expect(task).toBeDefined();
    expect(task?.href).toBe("/certificaten/nieuw?type=LICENSE");
  });

  it("een geldige LICENSE op de buiten-venster-samenwerking levert géén taak op (self-heal)", async () => {
    state.creds = [
      ...validMandatory,
      { id: "lic", title: "BIG", type: "LICENSE", status: "VERIFIED", expiresAt: FUTURE },
    ];
    const idle: Collab[] = Array.from({ length: MAX }, (_, i) => ({
      id: `idle2-${i}`,
      status: "ACTIVE",
      updatedAt: recent(i + 1),
      createdAt: recent(i + 1),
      jobTitle: `Dienst ${i}`,
      companyName: "Zorgcentrum",
      requiredTypes: [],
    }));
    const stuck: Collab = {
      id: "stuck2",
      status: "ACTIVE",
      updatedAt: ANCIENT,
      createdAt: ANCIENT,
      jobTitle: "Vastzittende wijkdienst",
      companyName: "Zorggroep Noord",
      requiredTypes: ["LICENSE"],
    };
    state.collabs = [...idle, stuck];

    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.id === "credential-collab-missing:LICENSE")).toBeUndefined();
  });
});
