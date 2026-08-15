// Regressietest voor de next-action-engine (DOEL 1b — persona-sweep run 57): een door een lopende
// samenwerking VEREIST (niet-verplicht) certificaat dat de ZZP'er volledig MIST (nooit aangeleverd,
// of alleen een concept) moet de ZZP'er een eigen next-action geven. Tot deze fix kreeg alléén de
// opdrachtgever een actie ("mist een vereist certificaat — vraag om aan te leveren") via
// clientComplianceTask, terwijl de ZZP'er — de enige die het bewijsstuk kán aanleveren — niets in
// zijn actielijst zag: een asymmetrie (de spiegel van de EXPIRED-fix uit run 56).

import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  creds: [] as {
    id: string;
    title: string;
    type: string;
    status: string;
    expiresAt: Date | null;
  }[],
  collabs: [] as unknown[],
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ identityVerifiedAt: new Date() })) },
    credential: { findMany: vi.fn(async () => state.creds) },
    availabilityWindow: { findMany: vi.fn(async () => []) },
    performance: { findMany: vi.fn(async () => []) },
    // Ongewindowde betaal-/factuur-query (openInvoices) — leeg voor deze certificaat-gescope test.
    invoice: { findMany: vi.fn(async () => []) },
    collaboration: {
      findMany: vi.fn(async (args?: { where?: { status?: { in?: string[] } } }) => {
        // freelancerTasks doet meerdere collaboration.findMany-calls; alleen de PROPOSED/ACTIVE-
        // query (de fase-/certificaat-tak) krijgt onze fixture. De review-/renewal-queries (COMPLETED
        // e.d.) horen leeg te blijven zodat ze de test niet vervuilen.
        const inList = args?.where?.status?.in ?? [];
        if (inList.includes("ACTIVE") && !inList.includes("COMPLETED")) return state.collabs;
        return [];
      }),
    },
    conversationParticipant: { findMany: vi.fn(async () => []) },
    message: { groupBy: vi.fn(async () => []) },
    conversation: { findMany: vi.fn(async () => []) },
    noShowReport: { findFirst: vi.fn(async () => null), count: vi.fn(async () => 0) },
    auditLog: { findMany: vi.fn(async () => []) },
    job: { findMany: vi.fn(async () => []) },
    application: { findMany: vi.fn(async () => []) },
  },
}));

vi.mock("@/lib/data/freelancer-profile", () => ({
  getCompletenessProfile: vi.fn(async () => ({
    id: "prof-1",
    visibility: "PRIVATE",
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
vi.mock("@/lib/data/vat-deadline", () => ({
  getVatDeadlinesForActor: vi.fn(async () => []),
}));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-zzp", role: "FREELANCER", status: "ACTIVE" } as const;

const FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

// Geldige verplichte documenten → geen mandatory-ruis; isoleert de niet-verplichte LICENSE-tak.
const validMandatory = [
  { id: "vog", title: "VOG", type: "VOG", status: "VERIFIED", expiresAt: FUTURE },
  { id: "ins", title: "Verzekering", type: "INSURANCE", status: "VERIFIED", expiresAt: FUTURE },
];

// Een ACTIVE samenwerking waarvan de opdracht een LICENSE vereist. SUBMITTED-prestatie → geen
// performance-submit-taak, zodat de test puur de certificaat-tak toont.
function activeCollabRequiringLicense() {
  return {
    id: "collab-1",
    status: "ACTIVE",
    job: {
      title: "Wijkverpleegkundige",
      credentialRequirements: [{ credentialType: "LICENSE" }],
    },
    company: { name: "Zorggroep Noord" },
    performances: [{ id: "perf-1", status: "SUBMITTED" }],
    invoices: [],
  };
}

beforeEach(() => {
  state.creds = [...validMandatory];
  state.collabs = [activeCollabRequiringLicense()];
});

describe("ontbrekend vereist certificaat op een lopende samenwerking — freelancer next-action", () => {
  it("geen LICENSE → de ZZP'er krijgt de aanlever-taak (asymmetrie gedicht)", async () => {
    const tasks = await pendingTasks(ACTOR);
    const task = tasks.find((t) => t.id === "credential-collab-missing:LICENSE");
    expect(task).toBeDefined();
    // Geen bestaand exemplaar → deep-link naar het aanmaak-formulier met vooringevuld type.
    expect(task?.href).toBe("/certificaten/nieuw?type=LICENSE");
  });

  it("alleen een DRAFT LICENSE → taak deep-linkt naar het concept (indienen)", async () => {
    state.creds = [
      ...validMandatory,
      { id: "draft-lic", title: "BIG", type: "LICENSE", status: "DRAFT", expiresAt: null },
    ];
    const tasks = await pendingTasks(ACTOR);
    const task = tasks.find((t) => t.id === "credential-collab-missing:LICENSE");
    expect(task?.href).toBe("/certificaten/draft-lic/bewerken");
  });

  it("geldige LICENSE → geen aanlever-taak", async () => {
    state.creds = [
      ...validMandatory,
      { id: "lic", title: "BIG", type: "LICENSE", status: "VERIFIED", expiresAt: FUTURE },
    ];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.id === "credential-collab-missing:LICENSE")).toBeUndefined();
  });

  it("LICENSE in beoordeling (SUBMITTED) → geen taak (ZZP'er heeft al aangeleverd)", async () => {
    state.creds = [
      ...validMandatory,
      { id: "lic-sub", title: "BIG", type: "LICENSE", status: "SUBMITTED", expiresAt: null },
    ];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.find((t) => t.id === "credential-collab-missing:LICENSE")).toBeUndefined();
  });

  it("afgewezen LICENSE → alleen de fix-taak, geen dubbele aanlever-taak", async () => {
    state.creds = [
      ...validMandatory,
      { id: "lic-rej", title: "BIG", type: "LICENSE", status: "REJECTED", expiresAt: null },
    ];
    const tasks = await pendingTasks(ACTOR);
    const ids = tasks.map((t) => t.id);
    expect(ids).toContain("credential-fix:lic-rej");
    expect(ids).not.toContain("credential-collab-missing:LICENSE");
  });
});
