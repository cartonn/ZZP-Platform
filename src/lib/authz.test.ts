import { describe, expect, it } from "vitest";
import {
  assertAuthenticated,
  assertOwnership,
  assertRole,
  AuthorizationError,
  hasRole,
  isAdmin,
  owns,
  type Actor,
} from "@/lib/authz";

const freelancer: Actor = { id: "u_free", role: "FREELANCER", status: "ACTIVE" };
const client: Actor = { id: "u_client", role: "CLIENT", status: "ACTIVE" };
const admin: Actor = { id: "u_admin", role: "ADMIN", status: "ACTIVE" };
const suspended: Actor = { id: "u_susp", role: "FREELANCER", status: "SUSPENDED" };

describe("predicaten", () => {
  it("isAdmin", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(freelancer)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it("hasRole", () => {
    expect(hasRole(freelancer, "FREELANCER")).toBe(true);
    expect(hasRole(client, "FREELANCER", "ADMIN")).toBe(false);
    expect(hasRole(null, "FREELANCER")).toBe(false);
  });

  it("owns: eigenaar of admin", () => {
    expect(owns(freelancer, "u_free")).toBe(true);
    expect(owns(freelancer, "u_other")).toBe(false);
    expect(owns(admin, "u_other")).toBe(true); // admin overrulet ownership
    expect(owns(null, "u_free")).toBe(false);
  });
});

describe("assertAuthenticated", () => {
  it("werpt 401 zonder actor", () => {
    try {
      assertAuthenticated(null);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(AuthorizationError);
      expect((e as AuthorizationError).status).toBe(401);
    }
  });

  it("werpt 403 bij niet-actief account", () => {
    try {
      assertAuthenticated(suspended);
      expect.unreachable();
    } catch (e) {
      expect((e as AuthorizationError).status).toBe(403);
    }
  });

  it("slaagt voor actieve actor", () => {
    expect(() => assertAuthenticated(freelancer)).not.toThrow();
  });
});

describe("assertRole", () => {
  it("slaagt bij juiste rol", () => {
    expect(() => assertRole(admin, "ADMIN")).not.toThrow();
    expect(() => assertRole(client, "FREELANCER", "CLIENT")).not.toThrow();
  });

  it("werpt 403 bij verkeerde rol", () => {
    try {
      assertRole(freelancer, "ADMIN");
      expect.unreachable();
    } catch (e) {
      expect((e as AuthorizationError).status).toBe(403);
    }
  });

  it("werpt 401 zonder actor", () => {
    expect(() => assertRole(null, "ADMIN")).toThrow(AuthorizationError);
  });
});

describe("assertOwnership", () => {
  it("slaagt voor eigenaar", () => {
    expect(() => assertOwnership(freelancer, "u_free")).not.toThrow();
  });

  it("slaagt voor admin op andermans resource", () => {
    expect(() => assertOwnership(admin, "u_free")).not.toThrow();
  });

  it("werpt 403 voor niet-eigenaar", () => {
    try {
      assertOwnership(client, "u_free");
      expect.unreachable();
    } catch (e) {
      expect((e as AuthorizationError).status).toBe(403);
    }
  });
});
