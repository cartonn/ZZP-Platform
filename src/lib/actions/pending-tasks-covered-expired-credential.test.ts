// Regressietest voor de next-action-engine (DOEL 1b — persona-sweep run 89): een REEDS VERLOPEN
// (of afgewezen) niet-verplicht certificaat waarvan het type al door een nu-geldig VERIFIED-exemplaar
// wordt gedragen, mag GEEN "verlopen certificaat vernieuwen"-taak meer geven. De verlopen-tak in
// `freelancerTasks` paste — anders dan de expiry-tak en de bemiddelaar-zijde (`rosterExpiredByProfile`)
// — geen dekkings-uitsluiting toe: elk verlopen cert leverde een taak op, ook als de compliance voor
// dat type al gedekt was. `computeCompliance` gaf voor zo'n type COMPLIANT terwijl /acties + de badge
// een verleng-actie toonden — een valse next-action die nooit nuttig verdwijnt (er is geen gat om te
// dichten). De superseded-check dekte dit niet: die kijkt alleen naar VERIFIED-exemplaren, niet naar
// een cert met status EXPIRED. Deze fix trekt de verlopen-tak gelijk via de gedeelde
// `coveredCredentialTypes`.

import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  creds: [] as {
    id: string;
    title: string;
    type: string;
    status: string;
    expiresAt: Date | null;
  }[],
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(async () => ({ identityVerifiedAt: new Date() })) },
    credential: { findMany: vi.fn(async () => state.creds) },
    availabilityWindow: { findMany: vi.fn(async () => []) },
    performance: { findMany: vi.fn(async () => []) },
    invoice: { findMany: vi.fn(async () => []) },
    // Geen samenwerkingen → de generieke verlopen-loop (niet de collab-gebonden tak) is de code onder test.
    collaboration: { findMany: vi.fn(async () => []) },
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
vi.mock("@/lib/data/vat-deadline", () => ({
  getVatDeadlinesForActor: vi.fn(async () => []),
}));
vi.mock("@/lib/tax/hours-criterion-summary", () => ({
  getHoursCriterionSummary: vi.fn(async () => null),
  hoursCriterionNeedsAction: vi.fn(() => false),
}));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-zzp", role: "FREELANCER", status: "ACTIVE" } as const;

const FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

// Geldige verplichte documenten → geen mandatory-ruis; isoleert de LICENSE-verlopen-tak.
const validMandatory = [
  { id: "vog", title: "VOG", type: "VOG", status: "VERIFIED", expiresAt: FUTURE },
  { id: "ins", title: "Verzekering", type: "INSURANCE", status: "VERIFIED", expiresAt: FUTURE },
];

beforeEach(() => {
  state.creds = [...validMandatory];
});

describe("verlopen certificaat waarvan het type al gedekt is — geen valse verleng-taak", () => {
  it("status EXPIRED + nu-geldig VERIFIED van hetzelfde type → geen verleng-taak (gedekt)", async () => {
    state.creds = [
      ...validMandatory,
      { id: "lic-oud", title: "BIG (oud)", type: "LICENSE", status: "EXPIRED", expiresAt: PAST },
      { id: "lic-nieuw", title: "BIG", type: "LICENSE", status: "VERIFIED", expiresAt: FUTURE },
    ];
    const ids = (await pendingTasks(ACTOR)).map((t) => t.id);
    expect(ids).not.toContain("credential-fix:lic-oud"); // het geldige cert dekt het type al
    expect(ids).not.toContain("credential-fix:lic-nieuw"); // nog ruim geldig
  });

  it("computed-verlopen (VERIFIED maar expiresAt voorbij) + nu-geldig cover → geen verleng-taak", async () => {
    state.creds = [
      ...validMandatory,
      { id: "lic-oud", title: "BIG (oud)", type: "LICENSE", status: "VERIFIED", expiresAt: PAST },
      {
        id: "lic-eeuwig",
        title: "BIG",
        type: "LICENSE",
        status: "VERIFIED",
        expiresAt: null,
      },
    ];
    const ids = (await pendingTasks(ACTOR)).map((t) => t.id);
    expect(ids).not.toContain("credential-fix:lic-oud");
  });

  it("controle: enkel verlopen certificaat zonder geldige cover → wél de verleng-taak", async () => {
    state.creds = [
      ...validMandatory,
      { id: "lic-solo", title: "BIG", type: "LICENSE", status: "EXPIRED", expiresAt: PAST },
    ];
    const ids = (await pendingTasks(ACTOR)).map((t) => t.id);
    expect(ids).toContain("credential-fix:lic-solo");
  });
});
