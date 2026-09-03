import { beforeEach, describe, expect, it, vi } from "vitest";

// Regressietest voor badge↔/acties-drift (persona-sweep run 71, DOEL 1b): een aflopende plaatsing binnen
// de tenant geeft op /acties (pending-tasks.ts `franchiseCollaborationRenewalTask`) een "plan een
// vervolg"-taak die naar /franchise/samenwerkingen linkt, maar de FRANCHISER-nav-badges telden alleen
// leads/shift-overnames/roster/diensten → /franchise/samenwerkingen had als enige franchiser-navitem een
// /acties-taak zonder badge (het "signaal op één oppervlak"-anti-patroon; de partij-zijde kreeg deze
// pariteit al in #1034). Deze test grendelt vast dat de badge het vervolgsignaal nu meetelt — via exact
// dezelfde gedeelde `renewalAttentionBadgeCount`/`countAttentionRenewals`-bron als /acties.

type Args = { where?: Record<string, unknown> };

const NOW = new Date();
const inDays = (d: number) => new Date(NOW.getTime() + d * 86_400_000);

// Eén aflopende, niet-gedisputeerde ACTIEVE plaatsing die binnen het aandacht-venster valt.
const endingSoon = { endDate: inDays(2) };

// Rij voor de plaatsing-compliance-query (COLLABORATION_ALERT_INCLUDE-vorm): een ACTIEVE plaatsing die
// VOG verplicht stelt terwijl de ZZP'er geen (geldig) VOG heeft → NON_COMPLIANT-gat → compliance-actie.
type ComplianceRow = {
  id: string;
  disputedAt: Date | null;
  endDate: Date | null;
  job: { id: string; title: string; credentialRequirements: { credentialType: string }[] };
  freelancer: {
    user: { name: string | null };
    credentials: { type: string; status: string; expiresAt: Date | null }[];
  };
};
const nonCompliantPlacement: ComplianceRow = {
  id: "collab-gap",
  disputedAt: null,
  endDate: null,
  job: { id: "job-1", title: "Nachtdienst", credentialRequirements: [{ credentialType: "VOG" }] },
  freelancer: { user: { name: "Sanne" }, credentials: [] },
};

const state = {
  renewals: [] as { endDate: Date | null }[],
  compliance: [] as ComplianceRow[],
};

// De franchiser-tak roept collaboration.findMany twee keer aan: (1) het vervolgsignaal
// (`renewalAttentionBadgeCount`, select endDate) en (2) de plaatsing-compliance-query (include met
// job.credentialRequirements). Onderscheid ze aan het `credentialRequirements`-filter, zodat elke query
// zijn eigen fixture krijgt en de compliance-rijen niet als renewal-rijen worden misgelezen (en omgekeerd).
const collaborationFindMany = vi.fn((a: Args) =>
  Promise.resolve(
    (a?.where?.job as { credentialRequirements?: unknown } | undefined)?.credentialRequirements
      ? state.compliance
      : state.renewals,
  ),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(() => Promise.resolve({ tenantId: "t-1" })) },
    company: { findMany: vi.fn(() => Promise.resolve([])) },
    lead: { count: vi.fn(() => Promise.resolve(0)) },
    shiftHandoff: { count: vi.fn(() => Promise.resolve(0)) },
    credential: { findMany: vi.fn(() => Promise.resolve([])) },
    freelancerProfile: { findMany: vi.fn(() => Promise.resolve([])) },
    job: { findMany: vi.fn(() => Promise.resolve([])), groupBy: vi.fn(() => Promise.resolve([])) },
    collaboration: {
      findMany: (a: Args) => collaborationFindMany(a),
      groupBy: vi.fn(() => Promise.resolve([])),
    },
  },
}));

import { navBadges } from "./signals";

beforeEach(() => {
  collaborationFindMany.mockClear();
  state.renewals = [];
  state.compliance = [];
});

describe("FRANCHISER /franchise/samenwerkingen-badge — vervolgsignaal telt mee (run 71)", () => {
  it("toont de badge wanneer een plaatsing binnen het venster afloopt (pariteit met /acties)", async () => {
    state.renewals = [endingSoon];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/samenwerkingen"]).toEqual({ count: 1, tone: "attention" });
  });

  it("geen badge wanneer er geen aflopende plaatsing is (spiegelt geen taak op /acties)", async () => {
    state.renewals = [];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/samenwerkingen"]).toBeUndefined();
  });

  it("scoopt de vervolg-query op de eigen tenant via job.tenantId (geen cross-tenant lek)", async () => {
    state.renewals = [endingSoon];
    await navBadges("FRANCHISER", "u-1");
    const arg = collaborationFindMany.mock.calls[0]?.[0];
    const where = arg?.where as
      | { job?: { tenantId?: string }; status?: string; disputedAt?: null }
      | undefined;
    expect(where?.job?.tenantId).toBe("t-1");
    expect(where?.status).toBe("ACTIVE");
    expect(where?.disputedAt).toBeNull();
  });
});

// Pariteit voor het plaatsing-niveau compliance-signaal (deze PR): de bemiddelaar krijgt op /acties de
// `franchiseComplianceRippleTask` voor een lopende plaatsing met een certificaat-gat, die naar
// /franchise/samenwerkingen linkt. De badge op datzelfde navitem moet die actie meetellen — anders
// opnieuw een /acties-taak zonder badge. De telling deelt exact de pure bron (`assessCollaborationCredentials`
// via `clientCredentialAlertsFromRows`) + de `clientHasComplianceAction`-gate met /acties, dus geen drift.
describe("FRANCHISER /franchise/samenwerkingen-badge — plaatsing-compliance telt mee", () => {
  it("toont de badge voor een plaatsing met een certificaat-gat (pariteit met /acties)", async () => {
    state.compliance = [nonCompliantPlacement];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/samenwerkingen"]).toEqual({ count: 1, tone: "attention" });
  });

  it("combineert vervolg- en compliance-acties in één telling (geen dedup tussen de dimensies)", async () => {
    state.renewals = [endingSoon];
    state.compliance = [nonCompliantPlacement];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/samenwerkingen"]).toEqual({ count: 2, tone: "attention" });
  });

  it("scoopt de compliance-query op de eigen tenant + verplicht-vereiste, ACTIEF en niet-bevroren", async () => {
    state.compliance = [nonCompliantPlacement];
    await navBadges("FRANCHISER", "u-1");
    const complianceCall = collaborationFindMany.mock.calls.find(
      (c) =>
        (c[0]?.where?.job as { credentialRequirements?: unknown } | undefined)
          ?.credentialRequirements,
    );
    const where = complianceCall?.[0]?.where as
      | {
          job?: { tenantId?: string; credentialRequirements?: unknown };
          status?: string;
          disputedAt?: null;
        }
      | undefined;
    expect(where?.job?.tenantId).toBe("t-1");
    expect(where?.job?.credentialRequirements).toEqual({ some: { required: true } });
    expect(where?.status).toBe("ACTIVE");
    expect(where?.disputedAt).toBeNull();
  });

  it("een enkel in-beoordeling-signaal geeft geen badge (admin is aan zet, geen bemiddelaar-actie)", async () => {
    state.compliance = [
      {
        ...nonCompliantPlacement,
        id: "collab-review",
        // VOG in beoordeling (SUBMITTED) dekt de vereiste nog niet, maar vraagt geen bemiddelaar-actie.
        freelancer: {
          user: { name: "Sanne" },
          credentials: [{ type: "VOG", status: "SUBMITTED", expiresAt: null }],
        },
      },
    ];
    const badges = await navBadges("FRANCHISER", "u-1");
    expect(badges["/franchise/samenwerkingen"]).toBeUndefined();
  });
});
