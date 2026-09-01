// Cross-surface-regressie (DOEL 1b): de nav-badge voor open dienst-overnames (`openHandoffs` voor de
// bemiddelaar, `openAdminHandoffs` voor de admin) moet — net als de /acties-bron (`pendingTasks`) —
// óók op de samenwerking scopen: een OPEN-aanvraag op een terminale (geannuleerd/afgerond) of bevroren
// (dispuut) inzet is geen openstaande governance-beslissing meer. Zonder die scope liep de badge op
// tegen de werkelijke status in en week hij af van het actiecentrum. Deze test voedt een filter-
// honorerende `shiftHandoff.count`-mock met één OPEN-aanvraag en varieert de collab-status/dispuut-vlag.

import { describe, it, expect, vi, beforeEach } from "vitest";

type HandoffRow = { tenantId: string; collaborationStatus: string; collaborationDisputed: boolean };

const state = vi.hoisted(() => ({ handoffs: [] as HandoffRow[] }));

// Filter-honorerende telling: bootst het echte Prisma-where na (status OPEN is impliciet — alle
// fixtures zijn OPEN — plus optioneel collaboration.status en collaboration.disputedAt: null).
function countHandoffs(where: {
  collaboration?: {
    status?: string;
    disputedAt?: null | { not: null };
    job?: { tenantId?: string };
  };
}): number {
  const collab = where.collaboration ?? {};
  const tenantId = collab.job?.tenantId;
  const requireStatus = collab.status;
  const requireNotDisputed = collab.disputedAt === null;
  return state.handoffs.filter(
    (h) =>
      (tenantId ? h.tenantId === tenantId : true) &&
      (requireStatus ? h.collaborationStatus === requireStatus : true) &&
      (requireNotDisputed ? !h.collaborationDisputed : true),
  ).length;
}

// Permissieve catch-all-mock: elk prisma-model levert benigne defaults (count→0, findMany→[],
// findUnique/findFirst→null) zodat navBadges' overige queries niet omvallen; alleen user.findUnique
// (tenant-afleiding) en shiftHandoff.count (de te toetsen query) zijn echt.
vi.mock("@/lib/db", () => {
  const benign = (prop: string) => {
    if (prop === "count") return async () => 0;
    if (prop === "findMany") return async () => [];
    if (prop === "groupBy") return async () => [];
    return async () => null; // findUnique / findFirst / aggregate
  };
  const modelHandler: ProxyHandler<Record<string, unknown>> = {
    get: (_t, prop: string) => benign(prop),
  };
  const prismaHandler: ProxyHandler<Record<string, unknown>> = {
    get: (_t, model: string) => {
      if (model === "user") {
        return new Proxy(
          { findUnique: async () => ({ tenantId: "tenant-1", identityVerifiedAt: null }) },
          {
            get: (t, prop: string) =>
              prop in t ? (t as Record<string, unknown>)[prop] : benign(prop),
          },
        );
      }
      if (model === "shiftHandoff") {
        return new Proxy(
          {
            count: async (args: { where?: Parameters<typeof countHandoffs>[0] }) =>
              countHandoffs(args?.where ?? {}),
          },
          {
            get: (t, prop: string) =>
              prop in t ? (t as Record<string, unknown>)[prop] : benign(prop),
          },
        );
      }
      return new Proxy({}, modelHandler);
    },
  };
  return { prisma: new Proxy({}, prismaHandler) };
});

import { navBadges } from "@/lib/signals";

beforeEach(() => {
  state.handoffs = [];
});

// De NavBadges-map is gesleuteld op deep-link-href (niet op signaalnaam), zie SIGNAL_HREF.
const FRANCHISER_HANDOFF_HREF = "/franchise/shift-overnames";
const ADMIN_HANDOFF_HREF = "/admin/shift-overnames";

describe("nav-badge dienst-overname — collab-status-scope (cross-surface met /acties)", () => {
  it("telt een OPEN-aanvraag op een ACTIEVE, niet-bevroren inzet — bemiddelaar én admin", async () => {
    state.handoffs = [
      { tenantId: "tenant-1", collaborationStatus: "ACTIVE", collaborationDisputed: false },
    ];
    expect((await navBadges("FRANCHISER", "user-1"))[FRANCHISER_HANDOFF_HREF]?.count).toBe(1);
    expect((await navBadges("ADMIN", "user-admin"))[ADMIN_HANDOFF_HREF]?.count).toBe(1);
  });

  for (const terminal of ["CANCELLED", "COMPLETED"] as const) {
    it(`telt een OPEN-aanvraag NIET zodra de inzet ${terminal} is — bemiddelaar én admin`, async () => {
      state.handoffs = [
        { tenantId: "tenant-1", collaborationStatus: terminal, collaborationDisputed: false },
      ];
      expect((await navBadges("FRANCHISER", "user-1"))[FRANCHISER_HANDOFF_HREF]).toBeUndefined();
      expect((await navBadges("ADMIN", "user-admin"))[ADMIN_HANDOFF_HREF]).toBeUndefined();
    });
  }

  it("telt een OPEN-aanvraag NIET zodra de inzet in dispuut staat — bemiddelaar én admin", async () => {
    state.handoffs = [
      { tenantId: "tenant-1", collaborationStatus: "ACTIVE", collaborationDisputed: true },
    ];
    expect((await navBadges("FRANCHISER", "user-1"))[FRANCHISER_HANDOFF_HREF]).toBeUndefined();
    expect((await navBadges("ADMIN", "user-admin"))[ADMIN_HANDOFF_HREF]).toBeUndefined();
  });
});
