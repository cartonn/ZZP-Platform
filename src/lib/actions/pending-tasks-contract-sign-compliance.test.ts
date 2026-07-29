// Regressietest voor de next-action-engine (DOEL 1b — persona-sweep run 58): een PROPOSED
// samenwerking waarvan de plaatsing door een certificaat-gat is geblokkeerd (vereist certificaat
// ontbreekt/verlopen → `signContract` weigert, server-waarheid) mag GEEN "Contract ondertekenen"-taak
// tonen. Tot deze fix emitte de item-engine die taak (resolver oneClick, band P.contractSign)
// onvoorwaardelijk op PROPOSED — voor zowel de ZZP'er als de opdrachtgever. Gevolg: een dode knop die
// de server weigert (de samenwerking blijft PROPOSED, de taak verdwijnt nooit) en die het
// samenwerkingsdetail tegenspreekt, dat de teken-knop in deze staat al verbergt; bij de opdrachtgever
// bovendien getoond aan de partij die het gat niet kan dichten (alleen de ZZP'er levert het bewijs aan).

import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  creds: [] as {
    id: string;
    title: string;
    type: string;
    status: string;
    expiresAt: Date | null;
  }[],
  freelancerCollabs: [] as unknown[],
  clientCollabs: [] as unknown[],
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ identityVerifiedAt: new Date() })) },
    credential: { findMany: vi.fn(async () => state.creds) },
    availabilityWindow: { findMany: vi.fn(async () => []) },
    company: { findUnique: vi.fn(async () => null) },
    collaboration: {
      findMany: vi.fn(
        async (args?: {
          where?: { status?: { in?: string[] }; company?: unknown; freelancer?: unknown };
        }) => {
          const inList = args?.where?.status?.in ?? [];
          const isProposedActive = inList.includes("ACTIVE") && !inList.includes("COMPLETED");
          if (!isProposedActive) return [];
          // Onderscheid de ZZP'er-query (where.freelancer) van de opdrachtgever-query (where.company).
          if (args?.where?.company) return state.clientCollabs;
          if (args?.where?.freelancer) return state.freelancerCollabs;
          return [];
        },
      ),
    },
    application: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    job: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    invoice: { findMany: vi.fn(async () => []) },
    conversationParticipant: { findMany: vi.fn(async () => []) },
    message: { groupBy: vi.fn(async () => []) },
    conversation: { findMany: vi.fn(async () => []) },
    noShowReport: { findFirst: vi.fn(async () => null), count: vi.fn(async () => 0) },
    auditLog: { findMany: vi.fn(async () => []) },
  },
}));

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
vi.mock("@/lib/data/vat-deadline", () => ({ getVatDeadlinesForActor: vi.fn(async () => []) }));
// Isoleer de contract-sign-tak: de compliance-ripple (opdrachtgever) staat uit zodat we puur de
// contract-sign-emissie meten (die tak is elders al getest).
vi.mock("@/lib/collaboration-alerts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/collaboration-alerts")>();
  return { ...actual, clientCredentialAlerts: vi.fn(async () => []) };
});

import { pendingTasks } from "@/lib/actions/pending-tasks";

const FREELANCER = { id: "user-zzp", role: "FREELANCER", status: "ACTIVE" } as const;
const CLIENT = { id: "user-client", role: "CLIENT", status: "ACTIVE" } as const;
const FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000);

const validMandatory = [
  { id: "vog", title: "VOG", type: "VOG", status: "VERIFIED", expiresAt: FUTURE },
  { id: "ins", title: "Verzekering", type: "INSURANCE", status: "VERIFIED", expiresAt: FUTURE },
];

// PROPOSED samenwerking (ZZP'er-vorm) waarvan de opdracht een LICENSE vereist.
function freelancerProposed() {
  return {
    id: "collab-fr",
    status: "PROPOSED",
    job: { title: "Wijkverpleegkundige", credentialRequirements: [{ credentialType: "LICENSE" }] },
    company: { name: "Zorggroep Noord" },
    performances: [],
    invoices: [],
  };
}

// PROPOSED samenwerking (opdrachtgever-vorm) waarvan de opdracht een LICENSE vereist; de
// freelancer-credentials + requirements zitten nu in de query (nodig voor de plaatsings-gate).
function clientProposed(creds: { type: string; status: string; expiresAt: Date | null }[]) {
  return {
    id: "collab-cl",
    status: "PROPOSED",
    job: { title: "Wijkverpleegkundige", credentialRequirements: [{ credentialType: "LICENSE" }] },
    freelancer: { user: { name: "Sanne" }, credentials: creds },
    performances: [],
    invoices: [],
  };
}

beforeEach(() => {
  state.creds = [...validMandatory];
  state.freelancerCollabs = [];
  state.clientCollabs = [];
});

describe("contract-sign next-action — plaatsings-gate (freelancer)", () => {
  it("ontbrekend vereist LICENSE → GEEN contract-sign-taak (dode knop onderdrukt)", async () => {
    state.freelancerCollabs = [freelancerProposed()];
    const tasks = await pendingTasks(FREELANCER);
    expect(tasks.find((t) => t.id === "contract-sign:collab-fr")).toBeUndefined();
    // De ZZP'er krijgt in plaats daarvan de aanlever-taak (de échte volgende stap).
    expect(tasks.find((t) => t.id === "credential-collab-missing:LICENSE")).toBeDefined();
  });

  it("verlopen vereist LICENSE → GEEN contract-sign-taak", async () => {
    state.creds = [
      ...validMandatory,
      { id: "lic-exp", title: "BIG", type: "LICENSE", status: "EXPIRED", expiresAt: PAST },
    ];
    state.freelancerCollabs = [freelancerProposed()];
    const tasks = await pendingTasks(FREELANCER);
    expect(tasks.find((t) => t.id === "contract-sign:collab-fr")).toBeUndefined();
  });

  it("geldig vereist LICENSE → contract-sign-taak verschijnt wél", async () => {
    state.creds = [
      ...validMandatory,
      { id: "lic", title: "BIG", type: "LICENSE", status: "VERIFIED", expiresAt: FUTURE },
    ];
    state.freelancerCollabs = [freelancerProposed()];
    const tasks = await pendingTasks(FREELANCER);
    expect(tasks.find((t) => t.id === "contract-sign:collab-fr")).toBeDefined();
  });

  it("LICENSE in beoordeling (SUBMITTED) blokkeert plaatsing niet → contract-sign-taak verschijnt", async () => {
    state.creds = [
      ...validMandatory,
      { id: "lic-sub", title: "BIG", type: "LICENSE", status: "SUBMITTED", expiresAt: null },
    ];
    state.freelancerCollabs = [freelancerProposed()];
    const tasks = await pendingTasks(FREELANCER);
    // WARNING (in beoordeling) blokkeert niet (complianceBlocksPlacement = alleen NON_COMPLIANT).
    expect(tasks.find((t) => t.id === "contract-sign:collab-fr")).toBeDefined();
  });
});

describe("contract-sign next-action — plaatsings-gate (opdrachtgever)", () => {
  it("ZZP'er mist vereist LICENSE → GEEN contract-sign-taak voor de opdrachtgever (verkeerde partij)", async () => {
    state.clientCollabs = [
      clientProposed([{ type: "VOG", status: "VERIFIED", expiresAt: FUTURE }]),
    ];
    const tasks = await pendingTasks(CLIENT);
    expect(tasks.find((t) => t.id === "contract-sign:collab-cl")).toBeUndefined();
  });

  it("ZZP'er voldoet aan de eis → contract-sign-taak verschijnt voor de opdrachtgever", async () => {
    state.clientCollabs = [
      clientProposed([{ type: "LICENSE", status: "VERIFIED", expiresAt: FUTURE }]),
    ];
    const tasks = await pendingTasks(CLIENT);
    expect(tasks.find((t) => t.id === "contract-sign:collab-cl")).toBeDefined();
  });

  it("opdracht zonder harde eis → contract-sign-taak verschijnt altijd", async () => {
    const collab = clientProposed([]);
    collab.job.credentialRequirements = [];
    state.clientCollabs = [collab];
    const tasks = await pendingTasks(CLIENT);
    expect(tasks.find((t) => t.id === "contract-sign:collab-cl")).toBeDefined();
  });
});
