// Regressietest voor tenant-isolatie op het gedeelde shift-overname-governance-scherm. Het scherm
// haalt de PII (naam) + certificaatstatus van de voorgestelde overnemer op; die kandidaat-lookup
// moet expliciet op de tenant van de actor gescopet zijn (defense-in-depth, CLAUDE.md regel 2) en
// nooit leunen op een cross-file-invariant. Een franchiser mag zo nooit een ZZP'er uit een andere
// tenant zien; een admin ziet platform-breed. We mocken prisma en awaiten de async server-component
// om de where-clause van de `freelancerProfile.findMany` te inspecteren.

import { describe, it, expect, vi, beforeEach } from "vitest";

const calls = vi.hoisted(() => ({ profileWhere: [] as unknown[] }));

vi.mock("@/lib/db", () => ({
  prisma: {
    shiftHandoff: {
      findMany: vi.fn(async () => [
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
      ]),
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
