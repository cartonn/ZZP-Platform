import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isOverbroadOriginPattern,
  normalizeOrigin,
  resolveAllowedOrigins,
} from "./server-actions-origins.mjs";

describe("normalizeOrigin", () => {
  it("pelt scheme en pad van een volledige URL tot een kale host", () => {
    expect(normalizeOrigin("https://app.example.com/dashboard")).toBe("app.example.com");
    expect(normalizeOrigin("http://localhost:3000")).toBe("localhost:3000");
  });

  it("behoudt de poort en lowercased de host", () => {
    expect(normalizeOrigin("https://App.Example.com:8443")).toBe("app.example.com:8443");
  });

  it("accepteert een kale host en een wildcard-host", () => {
    expect(normalizeOrigin("app.example.com")).toBe("app.example.com");
    expect(normalizeOrigin("*.example.com")).toBe("*.example.com");
  });

  it("strippt een pad van een kale host", () => {
    expect(normalizeOrigin("app.example.com/foo")).toBe("app.example.com");
  });

  it("levert null bij leeg/whitespace/onparseerbaar", () => {
    expect(normalizeOrigin(undefined)).toBeNull();
    expect(normalizeOrigin(null)).toBeNull();
    expect(normalizeOrigin("   ")).toBeNull();
    expect(normalizeOrigin("https://")).toBeNull();
  });
});

describe("resolveAllowedOrigins", () => {
  it("is leeg wanneer niets is geconfigureerd (inert default)", () => {
    expect(resolveAllowedOrigins({})).toEqual([]);
  });

  it("leidt de host af uit AUTH_URL", () => {
    expect(resolveAllowedOrigins({ AUTH_URL: "https://zzp.example.com" })).toEqual([
      "zzp.example.com",
    ]);
  });

  it("valt terug op NEXTAUTH_URL als AUTH_URL ontbreekt", () => {
    expect(resolveAllowedOrigins({ NEXTAUTH_URL: "https://zzp.example.com" })).toEqual([
      "zzp.example.com",
    ]);
  });

  it("combineert de expliciete komma-lijst met AUTH_URL, ontdubbeld en gesorteerd", () => {
    expect(
      resolveAllowedOrigins({
        AUTH_URL: "https://app.example.com",
        SERVER_ACTIONS_ALLOWED_ORIGINS:
          "www.example.com, https://app.example.com , cdn.example.com",
      }),
    ).toEqual(["app.example.com", "cdn.example.com", "www.example.com"]);
  });

  it("negeert lege segmenten in de komma-lijst", () => {
    expect(
      resolveAllowedOrigins({ SERVER_ACTIONS_ALLOWED_ORIGINS: " , app.example.com ,, " }),
    ).toEqual(["app.example.com"]);
  });

  it("ontdubbelt hoofdletter-varianten van dezelfde host", () => {
    expect(
      resolveAllowedOrigins({
        AUTH_URL: "https://App.Example.com",
        SERVER_ACTIONS_ALLOWED_ORIGINS: "app.example.com",
      }),
    ).toEqual(["app.example.com"]);
  });

  it("weigert een kale wildcard `*` (zou de CSRF-origin-check volledig uitschakelen)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Zonder de guard normaliseert "*" naar "*" en zou het als vertrouwde origin doorlekken.
    expect(resolveAllowedOrigins({ SERVER_ACTIONS_ALLOWED_ORIGINS: "*" })).toEqual([]);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("weigert een heel-TLD-wildcard maar behoudt een begrensde `*.domein.tld`", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      resolveAllowedOrigins({
        AUTH_URL: "https://app.example.com",
        SERVER_ACTIONS_ALLOWED_ORIGINS: "*, *.com, *.example.com",
      }),
    ).toEqual(["*.example.com", "app.example.com"]);
  });
});

describe("isOverbroadOriginPattern", () => {
  afterEach(() => vi.restoreAllMocks());

  it("markeert een kale catch-all", () => {
    expect(isOverbroadOriginPattern("*")).toBe(true);
    expect(isOverbroadOriginPattern("*:443")).toBe(true);
  });

  it("markeert een wildcard op een heel TLD of enkel label", () => {
    expect(isOverbroadOriginPattern("*.com")).toBe(true);
    expect(isOverbroadOriginPattern("*.local")).toBe(true);
    expect(isOverbroadOriginPattern("*.")).toBe(true);
  });

  it("markeert een misvormd of niet-leidend wildcard-patroon", () => {
    expect(isOverbroadOriginPattern("foo.*.com")).toBe(true);
    expect(isOverbroadOriginPattern("*foo.com")).toBe(true);
    expect(isOverbroadOriginPattern("*.a.*.com")).toBe(true);
  });

  it("laat een concrete host en een begrensde wildcard passeren", () => {
    expect(isOverbroadOriginPattern("app.example.com")).toBe(false);
    expect(isOverbroadOriginPattern("*.example.com")).toBe(false);
    expect(isOverbroadOriginPattern("localhost:3000")).toBe(false);
    expect(isOverbroadOriginPattern(null)).toBe(false);
  });
});
