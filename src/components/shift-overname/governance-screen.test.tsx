// Regressietest voor tenant-isolatie op het gedeelde shift-overname-governance-scherm. Het scherm
// haalt de PII (naam) + certificaatstatus van de voorgestelde overnemer op; die kandidaat-lookup
// moet expliciet op de tenant van de actor gescopet zijn (defense-in-depth, CLAUDE.md regel 2) en
// nooit leunen op een cross-file-invariant. Een franchiser mag zo nooit een ZZP'er uit een andere
// tenant zien; een admin ziet platform-breed. We mocken prisma en awaiten de async server-component
// om de where-clause van de `freelancerProfile.findMany` te inspecteren.

import { describe, it, expect, vi, beforeEach } from "vitest";

const calls = vi.hoisted(() => ({ profileWhere: [] as unknown[], handoffWhere: [] as unknown[] }));

vi.mock("@/lib/db", () => ({
  prisma: {
    shiftHandoff: {
      findMany: vi.fn(async (args: { where: unknown }) => {
        calls.handoffWhere.push(args.where);
        return [
          {
            id: "ho-1",
            reason: "Kan niet verder",
            candidateFreelancerId: "cand-1",
            createdAt: new Date("2026-06-01"),
            collaboration: {
              id: "col-1",
              freelancer: { user: { name: "Huidige ZZP'er" } },
              job: { title: "Nachtdienst", credentialRequirements: [] },
            },
          },
        ];
      }),
    },
    freelancerProfile: {
      findMany: vi.fn(async (args: { where: unknown }) => {
        calls.profileWhere.push(args.where);
        return [{ id: "cand-1", user: { name: "Kandidaat" }, credentials: [] }];
      }),
    },
  },
}));

import { ShiftHandoffGovernanceScreen } from "./governance-screen";
import type { Actor } from "@/lib/authz";

beforeEach(() => {
  calls.profileWhere = [];
  calls.handoffWhere = [];
});

const FRANCHISER: Actor = {
  id: "fr-1",
  role: "FRANCHISER",
  status: "ACTIVE",
  tenantId: "tenant-A",
};
const ADMIN: Actor = { id: "ad-1", role: "ADMIN", status: "ACTIVE", tenantId: null };

describe("ShiftHandoffGovernanceScreen — kandidaat-lookup is tenant-gescopet", () => {
  it("scopet de kandidaat-lookup van een franchiser op de eigen tenant (geen cross-tenant PII-lek)", async () => {
    await ShiftHandoffGovernanceScreen({ actor: FRANCHISER });
    expect(calls.profileWhere).toHaveLength(1);
    // Zonder de tenant-scope zou dit alleen { id: { in: [...] } } zijn — dan lekt een ZZP'er uit een
    // andere tenant zodra de aanmaak-invariant breekt (rood→groen).
    expect(calls.profileWhere[0]).toEqual({ id: { in: ["cand-1"] }, tenantId: "tenant-A" });
  });

  it("laat de admin platform-breed zoeken (geen tenant-filter)", async () => {
    await ShiftHandoffGovernanceScreen({ actor: ADMIN });
    expect(calls.profileWhere).toHaveLength(1);
    expect(calls.profileWhere[0]).toEqual({ id: { in: ["cand-1"] } });
  });
});

describe("ShiftHandoffGovernanceScreen — de lijst scopet op de samenwerkingsstatus (cross-surface met badge/acties)", () => {
  // De canonieke beslis-surface moet dezelfde parent-scope hanteren als de nav-badge
  // (openHandoffs/openAdminHandoffs) en het actiecentrum (shift-handoff-decide): een OPEN-aanvraag op
  // een terminale of bevroren inzet is geen te-nemen beslissing meer. Zonder deze scope bleef de
  // aanvraag hier — mét werkende approve/reject-formulieren — zichtbaar terwijl badge en taak al
  // verdwenen waren (agent-review BLOCK, run 104).
  it("beperkt de OPEN-handoff-query tot een ACTIEVE, niet-bevroren samenwerking (franchiser + admin)", async () => {
    await ShiftHandoffGovernanceScreen({ actor: FRANCHISER });
    await ShiftHandoffGovernanceScreen({ actor: ADMIN });
    expect(calls.handoffWhere).toHaveLength(2);
    for (const where of calls.handoffWhere as {
      status: string;
      collaboration: { status?: string; disputedAt?: unknown };
    }[]) {
      expect(where.status).toBe("OPEN");
      expect(where.collaboration.status).toBe("ACTIVE");
      expect(where.collaboration.disputedAt).toBeNull();
    }
    // De franchiser-query behoudt bovendien de tenant-scope; de admin-query is platform-breed.
    const franchiserWhere = calls.handoffWhere[0] as {
      collaboration: { job: { is: { tenantId?: string } } };
    };
    expect(franchiserWhere.collaboration.job.is.tenantId).toBe("tenant-A");
  });
});
