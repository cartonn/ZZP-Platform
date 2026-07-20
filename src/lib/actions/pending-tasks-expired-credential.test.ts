// Regressietest voor de next-action-engine: een écht verlopen (EXPIRED) NIET-verplicht certificaat
// (diploma/certificaat/licentie/overig) moet de ZZP'er een blijvende vernieuw-taak geven. Vóór deze
// fix matchte pending-tasks.ts alleen REJECTED en expiring-VERIFIED; een verlopen niet-verplicht
// certificaat verdween stil na de expiry-notificatie. Verplichte types (VOG/verzekering) worden al
// door de mandatoryDocumentTask("expired") gedekt en mogen géén tweede rij krijgen.

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
    collaboration: { findMany: vi.fn(async () => []) },
    conversationParticipant: { findMany: vi.fn(async () => []) },
    message: { groupBy: vi.fn(async () => []) },
    conversation: { findMany: vi.fn(async () => []) },
    noShowReport: { findFirst: vi.fn(async () => null), count: vi.fn(async () => 0) },
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
  paymentDueSoonCount: vi.fn(async () => 0),
}));

vi.mock("@/lib/data/vat-deadline", () => ({
  getVatDeadlinesForActor: vi.fn(async () => []),
}));

import { pendingTasks } from "@/lib/actions/pending-tasks";

const ACTOR = { id: "user-zzp", role: "FREELANCER", status: "ACTIVE" } as const;

beforeEach(() => {
  state.creds = [];
});

describe("verlopen niet-verplicht certificaat — blijvende vernieuw-taak", () => {
  it("een EXPIRED diploma geeft een credential-fix vernieuw-taak", async () => {
    state.creds = [
      {
        id: "cred-diploma",
        title: "Diploma Verpleegkunde",
        type: "DIPLOMA",
        status: "EXPIRED",
        expiresAt: new Date("2020-01-01"),
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const fix = tasks.find((t) => t.id === "credential-fix:cred-diploma");
    expect(fix).toBeDefined();
    expect(fix?.title).toBe("Verlopen certificaat vernieuwen");
    expect(fix?.href).toBe("/certificaten/cred-diploma/bewerken");
    expect(fix && "cause" in fix ? fix.cause : undefined).toBe("expired");
  });

  it("een EXPIRED verplicht type (VOG) geeft alleen de mandatory-taak, geen dubbele fix-taak", async () => {
    state.creds = [
      {
        id: "cred-vog",
        title: "VOG",
        type: "VOG",
        status: "EXPIRED",
        expiresAt: new Date("2020-01-01"),
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const ids = tasks.map((t) => t.id);
    // De mandatory-taak (hogere band, blokkeert inzetbaarheid) dekt het al.
    expect(ids).toContain("mandatory-document:VOG");
    // Geen tweede, dubbele credential-fix-rij voor hetzelfde document.
    expect(ids).not.toContain("credential-fix:cred-vog");
  });

  it("een VERIFIED (nog geldig) certificaat geeft geen vernieuw-taak", async () => {
    state.creds = [
      {
        id: "cred-cert",
        title: "BHV",
        type: "CERTIFICATE",
        status: "VERIFIED",
        expiresAt: new Date("2099-01-01"),
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    expect(tasks.map((t) => t.id)).not.toContain("credential-fix:cred-cert");
  });
});
