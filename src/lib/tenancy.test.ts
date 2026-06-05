import { describe, expect, it } from "vitest";
import { AuthorizationError, type Actor } from "@/lib/authz";
import {
  hasTenant,
  tenantScopeWhere,
  assertSameTenant,
  ownsViaTenant,
  visibleJobsWhere,
  visibleFreelancersWhere,
} from "@/lib/tenancy";

const franchiser: Actor = { id: "f1", role: "ADMIN", status: "ACTIVE", tenantId: "t1" };
// Let op: FRANCHISER-rol bestaat nog niet in de enum (Inc 1); de helpers zijn rol-agnostisch en
// leunen op tenantId. We modelleren een tenant-admin als een actor mét tenantId (rol CLIENT volstaat
// voor de pure helper-tests, want alleen ADMIN heeft een bypass).
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

describe("visibleJobsWhere (gesloten per tenant)", () => {
  it("tenant-ZZP'er ziet alleen de eigen tenant-diensten", () => {
    expect(visibleJobsWhere(tenantMember)).toEqual({ tenantId: "t1" });
  });
  it("directe ZZP'er ziet alleen platform-opdrachten (tenantId null)", () => {
    expect(visibleJobsWhere(directUser)).toEqual({ tenantId: null });
  });
  it("ADMIN ziet alles", () => {
    expect(visibleJobsWhere(admin)).toEqual({});
  });
  // Een tenant-dienst is dus niet zichtbaar voor een directe ZZP'er, en omgekeerd.
  it("scheidt tenants strikt: t1 vs t2", () => {
    expect(visibleJobsWhere(otherTenant)).toEqual({ tenantId: "t2" });
    expect(visibleJobsWhere(franchiser)).toEqual({}); // franchiser is hier ADMIN-rol → alles
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
