import { describe, expect, it } from "vitest";
import { AuthorizationError, type Actor } from "@/lib/authz";
import {
  hasTenant,
  tenantScopeWhere,
  assertSameTenant,
  ownsViaTenant,
  visibleJobsWhere,
  visibleJobsWhereForTenant,
  visibleFreelancersWhere,
  canViewJob,
} from "@/lib/tenancy";

const OVERFLOW = { tenant: { is: { openOverflow: true } } };

// De helpers zijn rol-agnostisch en leunen op tenantId. We modelleren een tenant-admin als een actor
// mét tenantId (rol CLIENT volstaat voor de pure helper-tests, want alleen ADMIN heeft een bypass).
const tenantAdmin: Actor = { id: "f1", role: "CLIENT", status: "ACTIVE", tenantId: "t1" };
const tenantMember: Actor = { id: "u1", role: "FREELANCER", status: "ACTIVE", tenantId: "t1" };
const otherTenant: Actor = { id: "u2", role: "FREELANCER", status: "ACTIVE", tenantId: "t2" };
const directUser: Actor = { id: "u3", role: "FREELANCER", status: "ACTIVE", tenantId: null };
const admin: Actor = { id: "a1", role: "ADMIN", status: "ACTIVE", tenantId: null };

describe("hasTenant", () => {
  it("herkent een tenant-lid en sluit directe gebruikers uit", () => {
    expect(hasTenant(tenantMember)).toBe(true);
    expect(hasTenant(directUser)).toBe(false);
    expect(hasTenant(null)).toBe(false);
  });
});

describe("tenantScopeWhere", () => {
  it("ADMIN ziet alles (leeg filter)", () => {
    expect(tenantScopeWhere(admin)).toEqual({});
  });
  it("een tenant-admin wordt op de eigen tenant gefilterd", () => {
    expect(tenantScopeWhere(tenantAdmin)).toEqual({ tenantId: "t1" });
  });
  it("een gebruiker zonder franchise mag deze lijsten niet opvragen", () => {
    expect(() => tenantScopeWhere(directUser)).toThrow(AuthorizationError);
  });
});

describe("assertSameTenant", () => {
  it("staat de eigen tenant toe en ADMIN altijd", () => {
    expect(() => assertSameTenant(tenantAdmin, "t1")).not.toThrow();
    expect(() => assertSameTenant(admin, "t9")).not.toThrow();
  });
  it("weigert een andere tenant of geen-tenant (403)", () => {
    expect(() => assertSameTenant(tenantAdmin, "t2")).toThrow(AuthorizationError);
    expect(() => assertSameTenant(directUser, "t1")).toThrow(AuthorizationError);
  });
});

describe("ownsViaTenant", () => {
  it("matcht eigen tenant, ADMIN altijd, en wijst andere af", () => {
    expect(ownsViaTenant(tenantAdmin, "t1")).toBe(true);
    expect(ownsViaTenant(admin, "t9")).toBe(true);
    expect(ownsViaTenant(otherTenant, "t1")).toBe(false);
    expect(ownsViaTenant(directUser, "t1")).toBe(false);
  });
});

describe("visibleJobsWhere (gesloten per tenant + overflow)", () => {
  it("tenant-ZZP'er ziet eigen tenant-diensten + opengestelde diensten", () => {
    expect(visibleJobsWhere(tenantMember)).toEqual({ OR: [{ tenantId: "t1" }, OVERFLOW] });
  });
  it("directe ZZP'er ziet platform-opdrachten + opengestelde diensten", () => {
    expect(visibleJobsWhere(directUser)).toEqual({ OR: [{ tenantId: null }, OVERFLOW] });
  });
  it("ADMIN ziet alles", () => {
    expect(visibleJobsWhere(admin)).toEqual({});
  });
  it("scheidt tenants: t1 vs t2 (los van de overflow-clausule)", () => {
    expect(visibleJobsWhereForTenant("t2")).toEqual({ OR: [{ tenantId: "t2" }, OVERFLOW] });
  });
});

describe("canViewJob (detail-zichtbaarheid)", () => {
  const job = (tenantId: string | null, openOverflow = false) => ({
    tenantId,
    tenant: tenantId ? { openOverflow } : null,
  });
  it("ADMIN ziet elke dienst", () => {
    expect(canViewJob(admin, job("t9", false))).toBe(true);
  });
  it("eigen tenant-match mag", () => {
    expect(canViewJob(tenantMember, job("t1"))).toBe(true);
  });
  it("andere tenant zonder overflow mag niet", () => {
    expect(canViewJob(tenantMember, job("t2", false))).toBe(false);
    expect(canViewJob(directUser, job("t1", false))).toBe(false);
  });
  it("opengestelde (overflow) dienst mag iedereen zien", () => {
    expect(canViewJob(directUser, job("t1", true))).toBe(true);
    expect(canViewJob(otherTenant, job("t1", true))).toBe(true);
  });
  it("directe gebruiker ziet platform-opdracht (tenantId null)", () => {
    expect(canViewJob(directUser, job(null))).toBe(true);
  });
});

describe("visibleFreelancersWhere (gesloten per tenant, omgekeerde richting)", () => {
  it("tenant-opdrachtgever ziet alleen de eigen franchise-roster", () => {
    expect(visibleFreelancersWhere(tenantAdmin)).toEqual({ tenantId: "t1" });
  });
  it("directe opdrachtgever ziet alleen niet-tenant ZZP'ers (tenantId null)", () => {
    expect(visibleFreelancersWhere(directUser)).toEqual({ tenantId: null });
  });
  it("ADMIN ziet alle ZZP'ers", () => {
    expect(visibleFreelancersWhere(admin)).toEqual({});
  });
});
