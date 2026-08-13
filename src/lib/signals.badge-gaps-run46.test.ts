import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietests voor twee DOEL-1b-bevindingen ("signaal op één oppervlak"): de nav-badge was
// stiller dan /acties + de dashboard-rail (de item-engine).
//
// 1) ADMIN /admin/gebruikersbeheer: een account dat op goedkeuring wacht (`User.status === "PENDING"`)
//    levert op /acties een `adminActivateUserTask`, en een AVG-verwijderverzoek
//    (`deletionRequestedAt` gezet) een `adminDeletionRequestTask` (de hoogst-geprioriteerde taak in de
//    hele engine) — maar de Gebruikers-nav had geen badge → beide waren onzichtbaar in de nav.
// 2) CLIENT /samenwerkingen: een lopende samenwerking waarvan de ZZP'er een vereist certificaat
//    mist/verlopen/binnenkort-verlopend heeft levert op /acties een `clientComplianceTask` (hoogste
//    opdrachtgever-prioriteit), maar de cascade-badge telde alleen proposed/submitted → stil.

type Where = { where?: Record<string, unknown> };

// --- ADMIN mocks -----------------------------------------------------------
let pendingUsersValue = 0;
let deletionRequestsValue = 0;
const userCount = vi.fn((a: Where): Promise<number> => {
  if (a.where?.status === "PENDING") return Promise.resolve(pendingUsersValue);
  return Promise.resolve(deletionRequestsValue);
});

// --- CLIENT mocks ----------------------------------------------------------
type Alert = {
  status: string;
  missing: string[];
  expired: string[];
  expiringSoon: string[];
  inReview: string[];
};
const clientCredentialAlertsMock = vi.fn(
  (): Promise<{ collaborationId: string; alert: Alert }[]> => Promise.resolve([]),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    // fiscale-deadline-bron (BTW/IB) die navBadges nu leest; geen deadlines in deze test (run 73).
    administrationEntry: { findMany: () => Promise.resolve([]) },
    // FREELANCER-tak wordt hier niet getest, maar de mock moet compleet zijn.
    freelancerProfile: {
      findUnique: vi.fn(() => Promise.resolve({ id: "fp-1" })),
      count: vi.fn(() => Promise.resolve(0)),
    },
    credential: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    conversationParticipant: { findMany: vi.fn(() => Promise.resolve([])) },
    message: { groupBy: vi.fn(() => Promise.resolve([])) },
    invoice: { count: vi.fn(() => Promise.resolve(0)) },
    collaboration: {
      findMany: vi.fn(() => Promise.resolve([])),
      count: vi.fn(() => Promise.resolve(0)),
    },
    savedJob: { count: vi.fn(() => Promise.resolve(0)) },
    supportTicket: { count: vi.fn(() => Promise.resolve(0)) },
    noShowReport: {
      count: vi.fn(() => Promise.resolve(0)),
      groupBy: vi.fn(() => Promise.resolve([])),
    },
    shiftHandoff: { count: vi.fn(() => Promise.resolve(0)) },
    user: { count: (a: Where) => userCount(a) },
    company: { findUnique: vi.fn(() => Promise.resolve({ id: "c-1" })) },
    application: {
      count: vi.fn(() => Promise.resolve(0)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    job: { count: vi.fn(() => Promise.resolve(0)) },
    performance: { count: vi.fn(() => Promise.resolve(0)) },
  },
}));

// `clientCredentialAlerts` (DB-query) mocken; de pure `clientHasComplianceAction` echt houden.
vi.mock("@/lib/collaboration-alerts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./collaboration-alerts")>();
  return { ...actual, clientCredentialAlerts: () => clientCredentialAlertsMock() };
});

// navBadges(CLIENT) roept nu getClientColdJobs aan (prisma.job.findMany); neutraliseren zodat de
// bestaande badge-assertions geïsoleerd blijven van het nieuwe koud-signaal.
vi.mock("@/lib/data/client-cold-jobs", () => ({ getClientColdJobs: vi.fn(async () => []) }));

import { navBadges } from "./signals";

describe("navBadges ADMIN — Gebruikers-nav-badge (DOEL 1b)", () => {
  beforeEach(() => {
    pendingUsersValue = 0;
    deletionRequestsValue = 0;
    userCount.mockClear();
  });

  it("1 account wacht op goedkeuring → /admin/gebruikersbeheer-badge telt het (info)", async () => {
    pendingUsersValue = 1;
    const badges = await navBadges("ADMIN", "admin-1");
    // Alleen te-activeren accounts is een rustige wachtrij → info, gelijk aan de taak-toon.
    expect(badges["/admin/gebruikersbeheer"]).toEqual({ count: 1, tone: "info" });
  });

  it("een AVG-verwijderverzoek telt mee en maakt de badge attention (blokkerend signaal)", async () => {
    pendingUsersValue = 1;
    deletionRequestsValue = 1;
    const badges = await navBadges("ADMIN", "admin-1");
    // 1 goedkeuring + 1 verwijderverzoek = 2; het verwijderverzoek tilt de toon naar attention.
    expect(badges["/admin/gebruikersbeheer"]).toEqual({ count: 2, tone: "attention" });
  });

  it("0 wachtende accounts én 0 verwijderverzoeken → geen Gebruikers-badge", async () => {
    const badges = await navBadges("ADMIN", "admin-1");
    expect(badges["/admin/gebruikersbeheer"]).toBeUndefined();
  });
});

describe("navBadges CLIENT — compliance-ripple in de cascade-badge (DOEL 1b)", () => {
  beforeEach(() => {
    clientCredentialAlertsMock.mockReset();
    clientCredentialAlertsMock.mockResolvedValue([]);
  });

  it("lopende samenwerking met een verlopen vereist certificaat → /samenwerkingen-badge ≥ 1", async () => {
    clientCredentialAlertsMock.mockResolvedValue([
      {
        collaborationId: "collab-1",
        alert: {
          status: "NON_COMPLIANT",
          missing: [],
          expired: ["VOG"],
          expiringSoon: [],
          inReview: [],
        },
      },
    ]);
    const badges = await navBadges("CLIENT", "u-1");
    // Geen proposed/submitted werk → de badge was 0; de compliance-actie maakt 'm 1 (attention).
    expect(badges["/samenwerkingen"]).toEqual({ count: 1, tone: "attention" });
  });

  it("melding zónder opdrachtgever-actie (enkel in beoordeling) laat de badge ongemoeid", async () => {
    clientCredentialAlertsMock.mockResolvedValue([
      {
        collaborationId: "collab-1",
        alert: { status: "WARNING", missing: [], expired: [], expiringSoon: [], inReview: ["VOG"] },
      },
    ]);
    const badges = await navBadges("CLIENT", "u-1");
    // clientHasComplianceAction is false voor enkel-inReview → geen bijdrage → geen badge.
    expect(badges["/samenwerkingen"]).toBeUndefined();
  });

  it("geen dubbeltelling: één samenwerking met twee ontbrekende certificaat-typen telt als 1 actie", async () => {
    clientCredentialAlertsMock.mockResolvedValue([
      {
        collaborationId: "collab-1",
        alert: {
          status: "NON_COMPLIANT",
          missing: ["VOG", "INSURANCE"],
          expired: [],
          expiringSoon: [],
          inReview: [],
        },
      },
    ]);
    const badges = await navBadges("CLIENT", "u-1");
    // Eén taak per samenwerking (niet per type), gelijk aan de emissie in de item-engine.
    expect(badges["/samenwerkingen"]).toEqual({ count: 1, tone: "attention" });
  });
});
