// Regressietest voor de next-action-engine: een ouder, FEITELIJK verlopen NIET-verplicht certificaat
// (VERIFIED + expiresAt in het verleden, óf status EXPIRED) waarvan een NIEUWER, nu-geldig VERIFIED-
// exemplaar van hetzelfde type de compliance al draagt, mag GEEN "verlopen certificaat vernieuwen"-taak
// meer geven. De reeds-verlopen tak keyde puur op credential-id zonder dekkings-uitsluiting en emitteerde
// daarom een valse fix-nudge op het gedekte, oudere exemplaar — een next-action die nooit nuttig verdwijnt
// (het onderliggende record blijft verlopen). `supersededVerifiedCredentialIds` dekt dit niet (die markeert
// alleen nu-geldige VERIFIED-exemplaren als superseded, niet de al-verlopen exemplaren), dus de fix leunt op
// dezelfde dekkingsregel (`coveredCredentialTypes`) als de roster-tak `rosterExpiredByProfile`.

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
    // Geen actief abonnement → getHoursCriterionSummary geeft null (geen IB_VOORBEREIDING-entitlement),
    // zodat de urencriterium-tak de credential-tak niet vervuilt.
    subscription: { findUnique: vi.fn(async () => null) },
    credential: { findMany: vi.fn(async () => state.creds) },
    availabilityWindow: { findMany: vi.fn(async () => []) },
    performance: { findMany: vi.fn(async () => []) },
    invoice: { findMany: vi.fn(async () => []) },
    // Geen samenwerkingen → de generieke reeds-verlopen tak (niet de collab-gebonden) is de code onder test.
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

// Volledig, niet-vindbaar (PRIVATE) profiel: score 100 + geen agenda-tak, zodat de test puur de
// certificaat-tak isoleert.
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

const PAST = new Date("2020-01-01");
const FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

beforeEach(() => {
  state.creds = [];
});

describe("verlopen niet-verplicht certificaat dat door een nieuwer exemplaar is gedekt — geen valse vernieuw-taak", () => {
  it("ouder VERIFIED + voorbije expiresAt, met nieuwer VERIFIED-geldig van hetzelfde type → geen fix-taak (gedekt)", async () => {
    state.creds = [
      { id: "lic-oud", title: "BIG (oud)", type: "LICENSE", status: "VERIFIED", expiresAt: PAST },
      { id: "lic-nieuw", title: "BIG", type: "LICENSE", status: "VERIFIED", expiresAt: FUTURE },
    ];
    const ids = (await pendingTasks(ACTOR)).map((t) => t.id);
    expect(ids).not.toContain("credential-fix:lic-oud"); // het nieuwe cert dekt het type al
    expect(ids).not.toContain("credential-fix:lic-nieuw"); // ruim geldig → geen taak
  });

  it("ouder EXPIRED, met nieuwer VERIFIED-geldig van hetzelfde type → geen fix-taak (gedekt)", async () => {
    state.creds = [
      { id: "lic-oud", title: "BIG (oud)", type: "LICENSE", status: "EXPIRED", expiresAt: PAST },
      { id: "lic-nieuw", title: "BIG", type: "LICENSE", status: "VERIFIED", expiresAt: FUTURE },
    ];
    const ids = (await pendingTasks(ACTOR)).map((t) => t.id);
    expect(ids).not.toContain("credential-fix:lic-oud");
  });

  it("onbeperkt-geldig nieuwer exemplaar (expiresAt=null) dekt het verlopen exemplaar óók", async () => {
    state.creds = [
      { id: "lic-oud", title: "BIG (oud)", type: "LICENSE", status: "EXPIRED", expiresAt: PAST },
      { id: "lic-eeuwig", title: "BIG", type: "LICENSE", status: "VERIFIED", expiresAt: null },
    ];
    const ids = (await pendingTasks(ACTOR)).map((t) => t.id);
    expect(ids).not.toContain("credential-fix:lic-oud");
  });

  it("controle: enkel verlopen certificaat zonder geldige vervanger → wél de vernieuw-taak", async () => {
    state.creds = [
      { id: "lic-solo", title: "BIG", type: "LICENSE", status: "EXPIRED", expiresAt: PAST },
    ];
    const tasks = await pendingTasks(ACTOR);
    const fix = tasks.find((t) => t.id === "credential-fix:lic-solo");
    expect(fix).toBeDefined();
    expect(fix && "cause" in fix ? fix.cause : undefined).toBe("expired");
  });

  it("controle: een óók-verlopen exemplaar van hetzelfde type dekt niet (geen nu-geldig cert) → taak blijft", async () => {
    state.creds = [
      { id: "lic-a", title: "BIG (a)", type: "LICENSE", status: "EXPIRED", expiresAt: PAST },
      { id: "lic-b", title: "BIG (b)", type: "LICENSE", status: "VERIFIED", expiresAt: PAST },
    ];
    const ids = (await pendingTasks(ACTOR)).map((t) => t.id);
    // Geen enkel nu-geldig VERIFIED-exemplaar → het type is niet gedekt → beide verlopen exemplaren
    // leveren een vernieuw-taak (per credential-id).
    expect(ids).toContain("credential-fix:lic-a");
    expect(ids).toContain("credential-fix:lic-b");
  });
});
