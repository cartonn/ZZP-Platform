import { describe, it, expect } from "vitest";
import type { Actor } from "@/lib/authz";
import { normalizeJobFilters, type JobFilters } from "@/lib/jobs";
import { visibleJobsWhere } from "@/lib/tenancy";
import { buildJobMarketplaceWhere } from "@/lib/jobs/marketplace-where";

/** Directe (tenant-loze) ZZP'er. `as Actor` houdt de literal minimaal maar geldig. */
const freelancer: Actor = {
  id: "u1",
  role: "FREELANCER",
  status: "ACTIVE",
  tenantId: null,
} as Actor;

const admin: Actor = { id: "adm", role: "ADMIN", status: "ACTIVE", tenantId: null } as Actor;

/** Genormaliseerde filters met veilige defaults; overrides gaan via de ruwe param-vorm. */
function filters(raw: Record<string, string | string[] | undefined> = {}): JobFilters {
  return normalizeJobFilters(raw);
}

describe("buildJobMarketplaceWhere", () => {
  it("lege filters: PUBLISHED + tenant-zichtbaarheid in AND, geen optionele velden", () => {
    const where = buildJobMarketplaceWhere(filters(), { actor: freelancer });
    expect(where.status).toBe("PUBLISHED");
    expect(where.AND).toEqual([visibleJobsWhere(freelancer)]);
    expect(where.OR).toBeUndefined();
    expect(where.location).toBeUndefined();
    expect(where.workMode).toBeUndefined();
    expect(where.skills).toBeUndefined();
    expect(where.industryId).toBeUndefined();
    expect(where.credentialRequirements).toBeUndefined();
  });

  it("q → OR op title/description contains", () => {
    const where = buildJobMarketplaceWhere(filters({ q: "verpleegkundige" }), {
      actor: freelancer,
    });
    expect(where.OR).toEqual([
      { title: { contains: "verpleegkundige" } },
      { description: { contains: "verpleegkundige" } },
    ]);
  });

  it("location/workMode/skillIds/requiredCredential mappen naar hun where-velden", () => {
    const where = buildJobMarketplaceWhere(
      filters({
        location: "Utrecht",
        workMode: "REMOTE",
        skillIds: ["s1", "s2"],
        requiredCredential: "VOG",
      }),
      { actor: freelancer },
    );
    expect(where.location).toEqual({ contains: "Utrecht" });
    expect(where.workMode).toBe("REMOTE");
    expect(where.skills).toEqual({ some: { skillId: { in: ["s1", "s2"] } } });
    expect(where.credentialRequirements).toEqual({
      some: { credentialType: "VOG", required: true },
    });
  });

  it("rateMin → AND-clausule OR(rateMax gte / null)", () => {
    const where = buildJobMarketplaceWhere(filters({ rateMin: "45" }), { actor: freelancer });
    expect(where.AND).toContainEqual({ OR: [{ rateMax: { gte: 45 } }, { rateMax: null }] });
  });

  it("rateMax → AND-clausule OR(rateMin lte / null)", () => {
    const where = buildJobMarketplaceWhere(filters({ rateMax: "90" }), { actor: freelancer });
    expect(where.AND).toContainEqual({ OR: [{ rateMin: { lte: 90 } }, { rateMin: null }] });
  });

  it("hideApplied + profileId → sluit eigen niet-ingetrokken reacties uit", () => {
    const where = buildJobMarketplaceWhere(filters({ hideApplied: "1" }), {
      actor: freelancer,
      profileId: "prof-1",
    });
    expect(where.AND).toContainEqual({
      NOT: { applications: { some: { freelancerId: "prof-1", status: { not: "WITHDRAWN" } } } },
    });
  });

  it("hideApplied zonder profileId → geen uitsluitingsclausule", () => {
    const where = buildJobMarketplaceWhere(filters({ hideApplied: "1" }), { actor: freelancer });
    expect(where.AND).toEqual([visibleJobsWhere(freelancer)]);
  });

  it("expliciete industryId wint van mine", () => {
    const where = buildJobMarketplaceWhere(filters({ industryId: "ind-1", mine: "1" }), {
      actor: freelancer,
      myIndustryIds: ["a", "b"],
    });
    expect(where.industryId).toBe("ind-1");
  });

  it("mine + myIndustryIds → industryId in de eigen branches", () => {
    const where = buildJobMarketplaceWhere(filters({ mine: "1" }), {
      actor: freelancer,
      myIndustryIds: ["a", "b"],
    });
    expect(where.industryId).toEqual({ in: ["a", "b"] });
  });

  it("mine met lege myIndustryIds → geen industryId-filter", () => {
    const where = buildJobMarketplaceWhere(filters({ mine: "1" }), {
      actor: freelancer,
      myIndustryIds: [],
    });
    expect(where.industryId).toBeUndefined();
  });

  it("ADMIN → visibleJobsWhere is {} als eerste AND-entry (ziet alles)", () => {
    const where = buildJobMarketplaceWhere(filters(), { actor: admin });
    expect(visibleJobsWhere(admin)).toEqual({});
    expect(where.AND).toEqual([{}]);
  });
});
