import { describe, it, expect } from "vitest";
import type { Actor } from "@/lib/authz";
import { savedSearchQueryToRawParams } from "@/lib/jobs/saved-search";
import {
  savedSearchCountWhere,
  type SavedSearchCountContext,
} from "@/lib/jobs/saved-search-counts";

/** Minimale, directe (niet-tenant) ZZP'er-actor. */
const actor: Actor = {
  id: "user-1",
  role: "FREELANCER",
  status: "ACTIVE",
  tenantId: null,
};

const ctx: SavedSearchCountContext = {
  actor,
  myIndustryIds: [],
  profileId: "profile-1",
};

describe("savedSearchQueryToRawParams", () => {
  it("maakt een meervoudige sleutel een array", () => {
    expect(savedSearchQueryToRawParams("skillIds=a&skillIds=b")).toEqual({ skillIds: ["a", "b"] });
  });

  it("houdt een enkele waarde een string", () => {
    expect(savedSearchQueryToRawParams("workMode=REMOTE")).toEqual({ workMode: "REMOTE" });
  });

  it("geeft een leeg object voor een lege query", () => {
    expect(savedSearchQueryToRawParams("")).toEqual({});
  });
});

describe("savedSearchCountWhere", () => {
  it("geeft null voor een onlyEligible-query (niet betrouwbaar DB-telbaar)", () => {
    expect(savedSearchCountWhere("onlyEligible=1", ctx)).toBeNull();
  });

  it("geeft een niet-lege where voor een normale query met status PUBLISHED", () => {
    const where = savedSearchCountWhere("workMode=REMOTE&rateMin=50", ctx);
    expect(where).not.toBeNull();
    expect(where?.status).toBe("PUBLISHED");
    // workMode-clausule aanwezig.
    expect(where?.workMode).toBe("REMOTE");
    // rateMin vertaalt naar een AND-tariefclausule (rateMax >= 50 of null).
    const and = Array.isArray(where?.AND) ? where?.AND : where?.AND ? [where.AND] : [];
    const hasRateClause = and.some((clause) => JSON.stringify(clause).includes('"rateMax"'));
    expect(hasRateClause).toBe(true);
  });

  it("geeft een niet-lege where (zichtbaarheid + PUBLISHED) voor een lege query", () => {
    const where = savedSearchCountWhere("", ctx);
    expect(where).not.toBeNull();
    expect(where?.status).toBe("PUBLISHED");
    // Zichtbaarheids-AND blijft aanwezig ook zonder filters.
    expect(where?.AND).toBeTruthy();
  });
});
