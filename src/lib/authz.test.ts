import { describe, expect, it } from "vitest";
import {
  assertAuthenticated,
  assertOwnership,
  assertRole,
  AuthorizationError,
  hasRole,
  isAdmin,
  owns,
  sessionPredatesPasswordChange,
  tenantAccessBlocked,
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

describe("sessionPredatesPasswordChange (sessie-invalidatie bij wachtwoordwijziging, OWASP A07)", () => {
  const login = new Date("2026-07-25T10:00:00Z").getTime();

  it("wijst een sessie af die is aangemaakt vóór de laatste wachtwoordwijziging", () => {
    // Kern van de fix: de aanvaller logde in op t=10:00; het slachtoffer reset om 11:00 → de DB-stempel
    // schuift voorbij de bevroren JWT-stempel → de oude sessie moet vervallen (true = uitloggen).
    const afterReset = new Date("2026-07-25T11:00:00Z");
    expect(sessionPredatesPasswordChange(login, afterReset)).toBe(true);
  });

  it("laat een sessie toe die ná of exact op de wachtwoordwijziging is gemunt", () => {
    // Bij inloggen is de JWT-stempel gelijk aan de DB-waarde → geldig; een latere login idem.
    expect(sessionPredatesPasswordChange(login, new Date(login))).toBe(false);
    const beforeLogin = new Date("2026-07-25T09:00:00Z");
    expect(sessionPredatesPasswordChange(login, beforeLogin)).toBe(false);
  });

  it("faalt open (geldig) wanneer de sessie geen stempel draagt (pre-feature token)", () => {
    // Oude tokens van vóór deze feature dragen geen stempel; die cyclen binnen maxAge (8u) vanzelf om.
    expect(sessionPredatesPasswordChange(undefined, new Date())).toBe(false);
    expect(sessionPredatesPasswordChange(null, new Date())).toBe(false);
  });

  it("faalt open wanneer de DB-waarde ontbreekt", () => {
    expect(sessionPredatesPasswordChange(login, null)).toBe(false);
    expect(sessionPredatesPasswordChange(login, undefined)).toBe(false);
  });
});

describe("tenantAccessBlocked (fail-closed tenant-suspend, OWASP A01)", () => {
  it("blokkeert een lid van een GESCHORSTE tenant", () => {
    // Kern van de fix: Tenant.status bestond in het schema (ACTIVE | SUSPENDED) maar werd nergens
    // afgedwongen. Zet een admin de franchise op SUSPENDED, dan moet elk tenant-lid live de toegang
    // verliezen. Zonder deze poort bleef een geschorste franchise gewoon draaien (dead schema).
    expect(tenantAccessBlocked("tenant_1", "SUSPENDED")).toBe(true);
  });

  it("laat een lid van een ACTIEVE tenant door", () => {
    expect(tenantAccessBlocked("tenant_1", "ACTIVE")).toBe(false);
  });

  it("raakt een platformgebruiker zónder tenant nooit", () => {
    expect(tenantAccessBlocked(null, null)).toBe(false);
    expect(tenantAccessBlocked(undefined, undefined)).toBe(false);
    // Zelfs met een (irrelevante) statuswaarde: geen tenantId → nooit geblokkeerd hierdoor.
    expect(tenantAccessBlocked(null, "SUSPENDED")).toBe(false);
  });

  it("blokkeert fail-closed bij een tenant met onbekende status (niet-geladen relatie)", () => {
    // tenantId gezet maar status null/undefined → de veilige keuze is weigeren, niet doorlaten.
    expect(tenantAccessBlocked("tenant_1", null)).toBe(true);
    expect(tenantAccessBlocked("tenant_1", undefined)).toBe(true);
  });

  it("blokkeert elke niet-ACTIVE statuswaarde (geen allowlist-omzeiling)", () => {
    expect(tenantAccessBlocked("tenant_1", "active")).toBe(true); // hoofdlettergevoelig: alleen exact "ACTIVE"
    expect(tenantAccessBlocked("tenant_1", "PENDING")).toBe(true);
    expect(tenantAccessBlocked("tenant_1", "")).toBe(true);
  });
});
