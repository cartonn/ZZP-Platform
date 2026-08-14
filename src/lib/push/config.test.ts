import { describe, expect, it } from "vitest";
import {
  isValidVapidSubject,
  isWebPushConfigured,
  resolveWebPushConfigState,
} from "@/lib/push/config";

describe("resolveWebPushConfigState", () => {
  it("is 'configured' zodra beide sleutels gezet zijn", () => {
    expect(resolveWebPushConfigState("pub", "priv")).toBe("configured");
  });

  it("is 'off' zonder sleutels (pilot-default)", () => {
    expect(resolveWebPushConfigState(undefined, undefined)).toBe("off");
    expect(resolveWebPushConfigState("", "")).toBe("off");
    expect(resolveWebPushConfigState("   ", undefined)).toBe("off");
  });

  it("is 'partial' bij precies één sleutel (gevaarlijke halve activering)", () => {
    expect(resolveWebPushConfigState("pub", undefined)).toBe("partial");
    expect(resolveWebPushConfigState(undefined, "priv")).toBe("partial");
    expect(resolveWebPushConfigState("pub", "  ")).toBe("partial");
  });
});

describe("isWebPushConfigured", () => {
  it("vereist beide sleutels", () => {
    expect(isWebPushConfigured("pub", "priv")).toBe(true);
    expect(isWebPushConfigured("pub", undefined)).toBe(false);
    expect(isWebPushConfigured(undefined, "priv")).toBe(false);
    expect(isWebPushConfigured(undefined, undefined)).toBe(false);
  });
});

describe("isValidVapidSubject", () => {
  it("accepteert een lege/ongezette waarde (valt terug op default)", () => {
    expect(isValidVapidSubject(undefined)).toBe(true);
    expect(isValidVapidSubject("")).toBe(true);
    expect(isValidVapidSubject("   ")).toBe(true);
  });

  it("accepteert mailto:- en https:-contacten (RFC 8292)", () => {
    expect(isValidVapidSubject("mailto:support@zzp-platform.nl")).toBe(true);
    expect(isValidVapidSubject("https://zzp-platform.nl/contact")).toBe(true);
    expect(isValidVapidSubject("  mailto:x@y.nl  ")).toBe(true);
  });

  it("weigert een ongeldig contact", () => {
    expect(isValidVapidSubject("support@zzp-platform.nl")).toBe(false);
    expect(isValidVapidSubject("http://insecure.nl")).toBe(false);
    expect(isValidVapidSubject("tel:+31000")).toBe(false);
  });
});
