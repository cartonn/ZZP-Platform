// Contract van saveJobSearch/deleteJobSearch: auth → rol FREELANCER → eigen profiel → Zod (naam) →
// server-side hernormalisatie naar een CANONIEKE query → limietcheck → upsert/deleteMany → audit.
// De pure helpers (normalizeJobFilters/jobFiltersToQueryString/hasActiveJobFilters) blijven ECHT
// zodat de test de werkelijke canonieke query verifieert; prisma/authz/audit/next-cache gemockt.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MAX_SAVED_SEARCHES } from "@/lib/jobs/saved-search";

const roleState = vi.hoisted(() => ({ role: "FREELANCER" as string }));
const { FakeAuthError } = vi.hoisted(() => ({ FakeAuthError: class extends Error {} }));

const db = vi.hoisted(() => ({
  profileFindUnique: vi.fn(
    async (_args: { where: Record<string, unknown>; select?: unknown }) =>
      ({ id: "profile-1" }) as { id: string } | null,
  ),
  searchFindUnique: vi.fn(
    async (_args: { where: Record<string, unknown>; select?: unknown }) =>
      null as { id: string } | null,
  ),
  searchCount: vi.fn(async (_args: { where: Record<string, unknown> }) => 0),
  searchUpsert: vi.fn(
    async (_args: {
      where: { freelancerProfileId_query: { freelancerProfileId: string; query: string } };
      create: { name: string; query: string; freelancerProfileId: string };
      update: { name: string };
    }) => ({ id: "search-1" }),
  ),
  searchDeleteMany: vi.fn(async (_args: { where: Record<string, unknown> }) => ({ count: 1 })),
}));
const auditMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/authz", () => ({
  AuthorizationError: FakeAuthError,
  requireRole: vi.fn(async (...roles: string[]) => {
    if (!roles.includes(roleState.role)) throw new FakeAuthError("Geen toegang.");
    return { id: "user-1", role: roleState.role, status: "ACTIVE" };
  }),
}));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/db", () => ({
  prisma: {
    freelancerProfile: { findUnique: db.profileFindUnique },
    savedJobSearch: {
      findUnique: db.searchFindUnique,
      count: db.searchCount,
      upsert: db.searchUpsert,
      deleteMany: db.searchDeleteMany,
    },
  },
}));

import { saveJobSearch, deleteJobSearch } from "./saved-search-actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  roleState.role = "FREELANCER";
  db.profileFindUnique.mockResolvedValue({ id: "profile-1" });
  db.searchFindUnique.mockResolvedValue(null);
  db.searchCount.mockResolvedValue(0);
});

describe("saveJobSearch", () => {
  it("weigert een niet-FREELANCER zonder te schrijven", async () => {
    roleState.role = "CLIENT";
    const res = await saveJobSearch(undefined, form({ name: "Zorg", query: "q=zorg" }));
    expect(res?.error).toBeTruthy();
    expect(db.searchUpsert).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("weigert een lege naam", async () => {
    const res = await saveJobSearch(undefined, form({ name: "   ", query: "q=zorg" }));
    expect(res?.error).toBeTruthy();
    expect(db.searchUpsert).not.toHaveBeenCalled();
  });

  it("weigert een lege filterset", async () => {
    const res = await saveJobSearch(undefined, form({ name: "Zorg", query: "" }));
    expect(res?.error).toBe("Stel eerst filters in om een zoekopdracht te bewaren.");
    expect(db.searchUpsert).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("slaat op met de canonieke query + audit bij een geldige naam en actieve filters", async () => {
    const res = await saveJobSearch(
      undefined,
      form({ name: "Zorg op locatie", query: "q=zorg&workMode=ONSITE" }),
    );
    expect(res).toEqual({ ok: true });

    expect(db.searchUpsert).toHaveBeenCalledTimes(1);
    const args = db.searchUpsert.mock.calls[0]![0] as {
      where: { freelancerProfileId_query: { freelancerProfileId: string; query: string } };
      create: { name: string; query: string; freelancerProfileId: string };
    };
    expect(args.where.freelancerProfileId_query.query).toBe("q=zorg&workMode=ONSITE");
    expect(args.where.freelancerProfileId_query.freelancerProfileId).toBe("profile-1");
    expect(args.create.name).toBe("Zorg op locatie");
    expect(args.create.query).toBe("q=zorg&workMode=ONSITE");

    const auditArg = auditMock.mock.calls[0]![0] as { action: string };
    expect(auditArg.action).toBe("JOB_SEARCH_SAVED");
  });

  it("hercanoniseert een niet-canonieke query voor opslag (skillIds gesorteerd)", async () => {
    await saveJobSearch(undefined, form({ name: "Vaardig", query: "skillIds=s2&skillIds=s1" }));
    const args = db.searchUpsert.mock.calls[0]![0] as {
      where: { freelancerProfileId_query: { query: string } };
    };
    expect(args.where.freelancerProfileId_query.query).toBe("skillIds=s1&skillIds=s2");
  });

  it("geeft de limietfout wanneer het maximum is bereikt (nieuwe query)", async () => {
    db.searchFindUnique.mockResolvedValue(null); // telt als nieuw
    db.searchCount.mockResolvedValue(MAX_SAVED_SEARCHES);
    const res = await saveJobSearch(undefined, form({ name: "Nog een", query: "q=zorg" }));
    expect(res?.error).toContain(String(MAX_SAVED_SEARCHES));
    expect(db.searchUpsert).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });
});

describe("deleteJobSearch", () => {
  it("verwijdert eigenaar-scoped (id + eigen profiel) + audit bij count>0", async () => {
    db.searchDeleteMany.mockResolvedValue({ count: 1 });
    await deleteJobSearch("search-1");
    expect(db.searchDeleteMany).toHaveBeenCalledWith({
      where: { id: "search-1", freelancerProfileId: "profile-1" },
    });
    const auditArg = auditMock.mock.calls[0]![0] as { action: string };
    expect(auditArg.action).toBe("JOB_SEARCH_DELETED");
  });

  it("schrijft geen audit wanneer er niets is verwijderd (count:0)", async () => {
    db.searchDeleteMany.mockResolvedValue({ count: 0 });
    await deleteJobSearch("nope");
    expect(db.searchDeleteMany).toHaveBeenCalledOnce();
    expect(auditMock).not.toHaveBeenCalled();
  });
});
