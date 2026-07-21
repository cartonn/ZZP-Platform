// Regressietest voor de next-action-engine: een AFGEWEZEN verplicht document (VOG/verzekering)
// mag géén dubbele, tegenstrijdige rij opleveren. Een REJECTED-certificaat valt in de "missing"-
// emmer van computeCompliance, waardoor het vroeger zowel de credentialFixTask ("Afgewezen
// certificaat opnieuw indienen" → bewerk-pagina) als de mandatoryDocumentTask ("Verplicht document
// ontbreekt" → /certificaten/nieuw) kreeg. De tweede wees naar het AANMAKEN van een nieuw document
// i.p.v. het herstellen van het afgewezene — een foutieve remediatie. Er hoort exact één taak te
// zijn (de fix-taak). Een echt verlopen (EXPIRED) verplicht document houdt wél zijn mandatory-taak.

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

// Een volledig, vindbaar profiel: score 100 (geen completeness-taak), PRIVATE uitgesloten zodat er
// geen profilePrivateTask bijkomt en de agenda-tak wordt overgeslagen. Zo isoleert de test puur de
// verplichte-documenten-tak.
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

describe("verplicht document — afgewezen certificaat geen dubbele taak", () => {
  it("een REJECTED VOG geeft alleen de fix-taak, niet ook 'document ontbreekt'", async () => {
    state.creds = [
      { id: "cred-vog", title: "VOG", type: "VOG", status: "REJECTED", expiresAt: null },
    ];
    const tasks = await pendingTasks(ACTOR);
    const ids = tasks.map((t) => t.id);

    // De correcte, enige nudge: herstel het afgewezen certificaat (deep-link naar bewerken).
    expect(ids).toContain("credential-fix:cred-vog");
    // De foutieve, tegenstrijdige rij mag NIET meer verschijnen.
    expect(ids).not.toContain("mandatory-document:VOG");
    // Precies één rij voor dit fysieke document.
    expect(ids.filter((id) => id.includes("cred-vog") || id === "mandatory-document:VOG")).toEqual([
      "credential-fix:cred-vog",
    ]);
  });

  it("een echt ONTBREKEND verplicht document (geen certificaat) houdt de mandatory-taak", async () => {
    state.creds = [];
    const tasks = await pendingTasks(ACTOR);
    const ids = tasks.map((t) => t.id);
    // Zonder enig certificaat blijven beide verplichte documenten als 'ontbreekt' staan.
    expect(ids).toContain("mandatory-document:VOG");
    expect(ids).toContain("mandatory-document:INSURANCE");
  });

  it("een EXPIRED verplicht document houdt zijn mandatory-taak (correcte vernieuw-link)", async () => {
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
    // EXPIRED is geen REJECTED: de mandatory-taak (verlopen) hoort te blijven.
    expect(ids).toContain("mandatory-document:VOG");
    // Geen fix-taak: EXPIRED krijgt geen credentialFixTask("rejected").
    expect(ids).not.toContain("credential-fix:cred-vog");
  });

  it("REJECTED + VERIFIED-verlopen van hetzelfde type geeft één taak (de fix-taak), niet ook 'verlopen'", async () => {
    // Realistisch: een oude VOG is verlopen én een nieuwe indiening is afgewezen. computeCompliance
    // classificeert VOG dan als "expired" (verlopen VERIFIED-cert), waardoor de mandatory-taak vroeger
    // tóch náást de credentialFixTask verscheen — een dubbele, tegenstrijdige next-action.
    state.creds = [
      { id: "cred-vog-rej", title: "VOG", type: "VOG", status: "REJECTED", expiresAt: null },
      {
        id: "cred-vog-old",
        title: "VOG",
        type: "VOG",
        status: "VERIFIED",
        expiresAt: new Date("2020-01-01"),
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const ids = tasks.map((t) => t.id);
    // Exact één rij voor VOG: herstel het afgewezen certificaat.
    expect(ids).toContain("credential-fix:cred-vog-rej");
    expect(ids).not.toContain("mandatory-document:VOG");
  });

  it("EXPIRED verplicht document (geen rejected) deep-linkt naar VERLENGEN van dat certificaat", async () => {
    state.creds = [
      {
        id: "cred-vog-old",
        title: "VOG",
        type: "VOG",
        status: "VERIFIED",
        expiresAt: new Date("2020-01-01"),
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const vog = tasks.find((t) => t.id === "mandatory-document:VOG");
    expect(vog).toBeDefined();
    // Verlengen van het bestaande document, niet een nieuw aanmaken.
    expect(vog?.href).toBe("/certificaten/cred-vog-old/bewerken");
  });

  it("bij meerdere verlopen exemplaren van een type wint het meest recent verlopen exemplaar", async () => {
    state.creds = [
      {
        id: "cred-vog-2019",
        title: "VOG",
        type: "VOG",
        status: "VERIFIED",
        expiresAt: new Date("2019-01-01"),
      },
      {
        id: "cred-vog-2022",
        title: "VOG",
        type: "VOG",
        status: "EXPIRED",
        expiresAt: new Date("2022-06-01"),
      },
    ];
    const tasks = await pendingTasks(ACTOR);
    const vog = tasks.find((t) => t.id === "mandatory-document:VOG");
    expect(vog?.href).toBe("/certificaten/cred-vog-2022/bewerken");
  });

  it("REJECTED VOG onderdrukt alleen VOG; een ontbrekende INSURANCE blijft nudgen", async () => {
    state.creds = [
      { id: "cred-vog", title: "VOG", type: "VOG", status: "REJECTED", expiresAt: null },
    ];
    const tasks = await pendingTasks(ACTOR);
    const ids = tasks.map((t) => t.id);
    expect(ids).toContain("credential-fix:cred-vog");
    expect(ids).not.toContain("mandatory-document:VOG");
    // INSURANCE heeft geen certificaat → blijft als 'ontbreekt' staan (geen over-onderdrukking).
    expect(ids).toContain("mandatory-document:INSURANCE");
  });
});
