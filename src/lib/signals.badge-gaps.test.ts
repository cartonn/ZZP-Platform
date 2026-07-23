import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietests voor twee persona-sweep-bevindingen (DOEL 1b, "signaal op één oppervlak"): de
// nav-badge was stiller dan /acties + de dashboard-rail.
//
// 1) FREELANCER /certificaten: een ontbrekend/verlopen VERPLICHT document (VOG/verzekering) levert op
//    /acties een `mandatoryDocumentTask`, maar de badge telde alleen REJECTED + binnenkort-verlopende
//    VERIFIED certificaten → een verse ZZP'er zonder certificaten zag een stille nav.
// 2) ADMIN /admin/no-shows: een ZZP'er op/over de grens van ongegronde no-shows levert op /acties een
//    `adminSuspendNoShowTask` (+ de pagina toont "Grens bereikt"), maar de badge telde alleen
//    PENDING-meldingen → de uitschrijf-beslissing was onzichtbaar in de nav.

type Where = { where?: Record<string, unknown> };

const credentialCount = vi.fn((_a: Where): Promise<number> => Promise.resolve(0));
const credentialFindMany = vi.fn(
  (): Promise<{ type: string; status: string; expiresAt: Date | null }[]> => Promise.resolve([]),
);
const noShowReportCount = vi.fn((): Promise<number> => Promise.resolve(0));
const noShowReportGroupBy = vi.fn(
  (): Promise<{ freelancerProfileId: string; _count: { _all: number } }[]> => Promise.resolve([]),
);
const freelancerProfileCount = vi.fn((): Promise<number> => Promise.resolve(0));

vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: {
      findUnique: vi.fn(() => Promise.resolve({ id: "fp-1" })),
      count: () => freelancerProfileCount(),
    },
    credential: {
      count: (a: Where) => credentialCount(a),
      findMany: () => credentialFindMany(),
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
    noShowReport: { count: () => noShowReportCount(), groupBy: () => noShowReportGroupBy() },
    shiftHandoff: { count: vi.fn(() => Promise.resolve(0)) },
  },
}));

import { navBadges } from "./signals";

describe("navBadges FREELANCER — verplicht-document-badge (DOEL 1b)", () => {
  beforeEach(() => {
    credentialCount.mockClear();
    credentialFindMany.mockReset();
  });

  it("verse ZZP'er zonder certificaten → /certificaten-badge telt de ontbrekende verplichte documenten", async () => {
    credentialFindMany.mockResolvedValue([]); // geen VOG, geen verzekering
    const badges = await navBadges("FREELANCER", "u-1");
    // 2 verplichte types ontbreken → badge count 2, tone attention.
    expect(badges["/certificaten"]).toEqual({ count: 2, tone: "attention" });
  });

  it("alle verplichte documenten geldig geverifieerd → geen /certificaten-badge", async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 400);
    credentialFindMany.mockResolvedValue([
      { type: "VOG", status: "VERIFIED", expiresAt: future },
      { type: "INSURANCE", status: "VERIFIED", expiresAt: future },
    ]);
    const badges = await navBadges("FREELANCER", "u-1");
    expect(badges["/certificaten"]).toBeUndefined();
  });
});

describe("navBadges ADMIN — no-show-uitschrijfbadge (DOEL 1b)", () => {
  beforeEach(() => {
    noShowReportCount.mockReset();
    noShowReportGroupBy.mockReset();
    freelancerProfileCount.mockReset();
  });

  it("een ZZP'er op de grens (nog ACTIEF) → /admin/no-shows-badge telt de uitschrijf-beslissing", async () => {
    noShowReportCount.mockResolvedValue(0); // geen PENDING-meldingen
    noShowReportGroupBy.mockResolvedValue([{ freelancerProfileId: "fp-9", _count: { _all: 3 } }]);
    freelancerProfileCount.mockResolvedValue(1); // het account is nog ACTIVE
    const badges = await navBadges("ADMIN", "admin-1");
    expect(badges["/admin/no-shows"]).toEqual({ count: 1, tone: "attention" });
  });

  it("telt PENDING-meldingen én uitschrijf-beslissingen samen (gelijk aan /acties)", async () => {
    noShowReportCount.mockResolvedValue(2); // 2 te beoordelen meldingen
    noShowReportGroupBy.mockResolvedValue([{ freelancerProfileId: "fp-9", _count: { _all: 4 } }]);
    freelancerProfileCount.mockResolvedValue(1);
    const badges = await navBadges("ADMIN", "admin-1");
    expect(badges["/admin/no-shows"]).toEqual({ count: 3, tone: "attention" });
  });

  it("een al-geschorste ZZP'er op de grens telt NIET (geen ACTIVE account meer)", async () => {
    noShowReportCount.mockResolvedValue(0);
    noShowReportGroupBy.mockResolvedValue([
      { freelancerProfileId: "fp-susp", _count: { _all: 5 } },
    ]);
    freelancerProfileCount.mockResolvedValue(0); // niemand meer ACTIVE
    const badges = await navBadges("ADMIN", "admin-1");
    expect(badges["/admin/no-shows"]).toBeUndefined();
  });
});
