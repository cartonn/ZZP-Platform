// Regressietest voor de next-action-engine (DOEL 1b — persona-sweep): een ouder VERIFIED-certificaat
// dat binnenkort verloopt, maar waarvan een NIEUWER, nu-geldig exemplaar van hetzelfde type de
// compliance al draagt (bv. de ZZP'er vernieuwde het cert vroeg), mag GEEN "certificaat verloopt
// binnenkort"-taak meer geven. De generieke expiry-loop keyde puur op credential-id en emitteerde
// daarom een valse nudge op het superseded (ouder-vervallende) exemplaar — een next-action die nooit
// nuttig verdwijnt (het nieuwe cert dekt het type al). De collab-gebonden expiry-tak leunde al op het
// laatst-vervallende exemplaar per type; deze fix trekt de generieke tak gelijk.

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
    // Geen samenwerkingen → de generieke expiry-loop (niet de collab-gebonden tak) is de code onder test.
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

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-zzp", role: "FREELANCER", status: "ACTIVE" } as const;

const FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
const SOON = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // binnen het 30-dagen-venster
const LATER = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000); // ruim buiten het venster

// Geldige verplichte documenten → geen mandatory-ruis; isoleert de LICENSE-expiry-tak.
const validMandatory = [
  { id: "vog", title: "VOG", type: "VOG", status: "VERIFIED", expiresAt: FUTURE },
  { id: "ins", title: "Verzekering", type: "INSURANCE", status: "VERIFIED", expiresAt: FUTURE },
];

beforeEach(() => {
  state.creds = [...validMandatory];
});

describe("verlopend certificaat dat door een nieuwer exemplaar is vervangen — geen valse nudge", () => {
  it("ouder-vervallend + nieuwer-geldig VERIFIED van hetzelfde type → geen expiry-taak (superseded)", async () => {
    state.creds = [
      ...validMandatory,
      { id: "lic-oud", title: "BIG (oud)", type: "LICENSE", status: "VERIFIED", expiresAt: SOON },
      { id: "lic-nieuw", title: "BIG", type: "LICENSE", status: "VERIFIED", expiresAt: LATER },
    ];
    const ids = (await pendingTasks(ACTOR)).map((t) => t.id);
    expect(ids).not.toContain("credential-fix:lic-oud"); // het nieuwe cert dekt het type al
    expect(ids).not.toContain("credential-fix:lic-nieuw"); // verloopt pas ruim buiten het venster
  });

  it("controle: enkel verlopend certificaat zonder vervanger → wél de expiry-taak", async () => {
    state.creds = [
      ...validMandatory,
      { id: "lic-solo", title: "BIG", type: "LICENSE", status: "VERIFIED", expiresAt: SOON },
    ];
    const ids = (await pendingTasks(ACTOR)).map((t) => t.id);
    expect(ids).toContain("credential-fix:lic-solo");
  });

  it("controle: onbeperkt-geldig nieuwer exemplaar supersedet het verlopende óók", async () => {
    state.creds = [
      ...validMandatory,
      { id: "lic-oud", title: "BIG (oud)", type: "LICENSE", status: "VERIFIED", expiresAt: SOON },
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
});
