import { describe, expect, it } from "vitest";
import { normalizeOrigin, resolveAllowedOrigins } from "./server-actions-origins.mjs";

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
});
