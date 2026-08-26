import { describe, it, expect } from "vitest";
import type { Actor } from "@/lib/authz";
import { savedSearchQueryToRawParams } from "@/lib/jobs/saved-search";
import {
  savedSearchCountWhere,
  recentSavedSearchCutoff,
  withRecentPublishedWindow,
  RECENT_SAVED_SEARCH_DAYS,
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

describe("recentSavedSearchCutoff", () => {
  it("trekt precies RECENT_SAVED_SEARCH_DAYS dagen af van nu", () => {
    const now = new Date("2026-08-26T12:00:00.000Z");
    const cutoff = recentSavedSearchCutoff(now);
    const expected = new Date(now.getTime() - RECENT_SAVED_SEARCH_DAYS * 24 * 60 * 60 * 1000);
    expect(cutoff.toISOString()).toBe(expected.toISOString());
    // 7 dagen eerder in dit voorbeeld.
    expect(cutoff.toISOString()).toBe("2026-08-19T12:00:00.000Z");
  });
});

describe("withRecentPublishedWindow", () => {
  const cutoff = new Date("2026-08-19T12:00:00.000Z");

  it("laat de basis-where ongemoeid en voegt het venster non-destructief toe via AND", () => {
    const base = savedSearchCountWhere("workMode=REMOTE", ctx);
    expect(base).not.toBeNull();
    const withWindow = withRecentPublishedWindow(base!, cutoff);
    // Basis blijft de eerste AND-tak, onaangeroerd (geen mutatie).
    expect(Array.isArray(withWindow.AND)).toBe(true);
    const and = withWindow.AND as Array<Record<string, unknown>>;
    expect(and[0]).toBe(base);
    expect((and[0] as { status?: string }).status).toBe("PUBLISHED");
  });

  it("dekt publishedAt >= cutoff én de legacy-fallback op createdAt", () => {
    const withWindow = withRecentPublishedWindow({}, cutoff);
    const and = withWindow.AND as Array<Record<string, unknown>>;
    const windowClause = and[1] as { OR?: Array<Record<string, unknown>> };
    expect(Array.isArray(windowClause.OR)).toBe(true);
    const or = windowClause.OR!;
    // Primair: publishedAt binnen het venster.
    expect(or[0]).toEqual({ publishedAt: { gte: cutoff } });
    // Fallback: geen publishedAt, dan op createdAt binnen het venster (nooit onder-rapporteren).
    expect(or[1]).toEqual({ publishedAt: null, createdAt: { gte: cutoff } });
  });
});
