import { describe, expect, it } from "vitest";

import {
  buildMaintenancePage,
  escapeHtml,
  isMaintenanceEnabled,
  isMaintenanceExemptPath,
  loginBlockedByMaintenance,
  maintenanceAllowsAdmin,
  maintenanceMessage,
  maintenanceRetryAfterSeconds,
  shouldServeMaintenance,
} from "@/lib/maintenance";

describe("isMaintenanceEnabled", () => {
  it("is uit by default en bij lege/onbekende waarde", () => {
    expect(isMaintenanceEnabled(undefined)).toBe(false);
    expect(isMaintenanceEnabled("")).toBe(false);
    expect(isMaintenanceEnabled("nee")).toBe(false);
    expect(isMaintenanceEnabled("maybe")).toBe(false);
  });

  it("accepteert de truthy-conventie (case-/spatie-ongevoelig)", () => {
    for (const v of ["true", "TRUE", " 1 ", "on", "yes", "Yes"]) {
      expect(isMaintenanceEnabled(v)).toBe(true);
    }
  });
});

describe("maintenanceAllowsAdmin", () => {
  it("staat admins standaard door (undefined)", () => {
    expect(maintenanceAllowsAdmin(undefined)).toBe(true);
  });

  it("sluit admins alleen bij een expliciete falsy-waarde uit", () => {
    for (const v of ["false", "0", "off", "no", "NO"]) {
      expect(maintenanceAllowsAdmin(v)).toBe(false);
    }
    expect(maintenanceAllowsAdmin("true")).toBe(true);
    expect(maintenanceAllowsAdmin("iets")).toBe(true);
  });
});

describe("maintenanceRetryAfterSeconds", () => {
  it("valt terug op 300 bij ontbrekend/ongeldig", () => {
    expect(maintenanceRetryAfterSeconds(undefined)).toBe(300);
    expect(maintenanceRetryAfterSeconds("")).toBe(300);
    expect(maintenanceRetryAfterSeconds("abc")).toBe(300);
  });

  it("klemt op [30, 86400]", () => {
    expect(maintenanceRetryAfterSeconds("5")).toBe(30);
    expect(maintenanceRetryAfterSeconds("999999")).toBe(86_400);
    expect(maintenanceRetryAfterSeconds("120")).toBe(120);
  });
});

describe("maintenanceMessage", () => {
  it("geeft een standaardtekst bij ontbrekend/leeg", () => {
    expect(maintenanceMessage(undefined)).toMatch(/gepland onderhoud/i);
    expect(maintenanceMessage("   ")).toMatch(/gepland onderhoud/i);
  });

  it("gebruikt een eigen tekst, met control-tekens en witruimte genormaliseerd", () => {
    expect(maintenanceMessage("We\tzijn\n\nzo   terug")).toBe("We zijn zo terug");
  });

  it("kapt af op 300 tekens", () => {
    expect(maintenanceMessage("x".repeat(500))).toHaveLength(300);
  });
});

describe("isMaintenanceExemptPath", () => {
  it("laat alleen de gezondheids-probes door", () => {
    expect(isMaintenanceExemptPath("/api/health")).toBe(true);
    expect(isMaintenanceExemptPath("/api/readiness")).toBe(true);
    expect(isMaintenanceExemptPath("/dashboard")).toBe(false);
    expect(isMaintenanceExemptPath("/login")).toBe(false);
    expect(isMaintenanceExemptPath("/api/health/extra")).toBe(false);
  });

  it("normaliseert een trailing slash zodat de probe vrijgesteld blijft", () => {
    expect(isMaintenanceExemptPath("/api/health/")).toBe(true);
    expect(isMaintenanceExemptPath("/api/readiness/")).toBe(true);
    // Een niet-vrijgesteld pad blijft niet-vrijgesteld, ook met slash.
    expect(isMaintenanceExemptPath("/dashboard/")).toBe(false);
  });
});

describe("loginBlockedByMaintenance", () => {
  it("blokkeert login alleen bij volledige afsluiting (onderhoud aan + admin-bypass uit)", () => {
    // Volledige afsluiting: onderhoud aan én MAINTENANCE_ALLOW_ADMIN=false → login geblokkeerd.
    expect(loginBlockedByMaintenance("true", "false")).toBe(true);
    expect(loginBlockedByMaintenance("1", "off")).toBe(true);
  });

  it("laat login door in de standaard-onderhoudsmodus (admins mogen erdoor)", () => {
    // Onderhoud aan, maar admin-bypass staat default AAN → login blijft werken (deploy verifiëren).
    expect(loginBlockedByMaintenance("true", undefined)).toBe(false);
    expect(loginBlockedByMaintenance("true", "true")).toBe(false);
  });

  it("laat login door wanneer onderhoud uit staat, ongeacht de admin-vlag", () => {
    expect(loginBlockedByMaintenance(undefined, "false")).toBe(false);
    expect(loginBlockedByMaintenance("false", "false")).toBe(false);
  });
});

describe("shouldServeMaintenance", () => {
  const base = { pathname: "/dashboard", isAdmin: false, allowAdmin: true };

  it("doet niets wanneer onderhoud uit staat", () => {
    expect(shouldServeMaintenance({ ...base, enabled: false })).toBe(false);
  });

  it("serveert 503 voor een gewone bezoeker wanneer aan", () => {
    expect(shouldServeMaintenance({ ...base, enabled: true })).toBe(true);
  });

  it("laat de gezondheids-probes altijd door", () => {
    expect(shouldServeMaintenance({ ...base, enabled: true, pathname: "/api/health" })).toBe(false);
    expect(shouldServeMaintenance({ ...base, enabled: true, pathname: "/api/readiness" })).toBe(
      false,
    );
  });

  it("laat admins door zolang admin-bypass aan staat", () => {
    expect(
      shouldServeMaintenance({ ...base, enabled: true, isAdmin: true, allowAdmin: true }),
    ).toBe(false);
  });

  it("sluit admins uit bij een volledige afsluiting", () => {
    expect(
      shouldServeMaintenance({ ...base, enabled: true, isAdmin: true, allowAdmin: false }),
    ).toBe(true);
  });
});

describe("escapeHtml", () => {
  it("escaped alle gevaarlijke tekens", () => {
    expect(escapeHtml(`<script>"&'`)).toBe("&lt;script&gt;&quot;&amp;&#39;");
  });
});

describe("buildMaintenancePage", () => {
  it("bevat de (ge-escapete) boodschap en is een geldige 503-HTML-pagina", () => {
    const html = buildMaintenancePage({ message: "We zijn zo terug" });
    expect(html).toContain("<!doctype html>");
    expect(html).toContain('lang="nl"');
    expect(html).toContain("We zijn zo terug");
    expect(html).toContain("noindex, nofollow");
    // Geen scripts (CSP-vriendelijk).
    expect(html).not.toContain("<script");
  });

  it("injecteert geen markup vanuit de boodschap", () => {
    const html = buildMaintenancePage({ message: "<img src=x onerror=alert(1)>" });
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
  });
});
