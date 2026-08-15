import { describe, it, expect } from "vitest";
import { clampMs, resolveDrainMs, resolveForceKillMs } from "./shutdown-config.mjs";

describe("clampMs", () => {
  it("valt terug op de default bij een ontbrekende/niet-numerieke waarde", () => {
    expect(clampMs(undefined, 5000, 0, 60000)).toBe(5000);
    expect(clampMs("", 5000, 0, 60000)).toBe(5000);
    expect(clampMs("nope", 5000, 0, 60000)).toBe(5000);
  });

  it("klemt binnen [min, max]", () => {
    expect(clampMs("-100", 5000, 0, 60000)).toBe(0);
    expect(clampMs("999999", 5000, 0, 60000)).toBe(60000);
    expect(clampMs("3000", 5000, 0, 60000)).toBe(3000);
  });

  it("parset een geldige waarde binnen de grenzen", () => {
    expect(clampMs("12000", 5000, 1000, 120000)).toBe(12000);
  });
});

describe("resolveDrainMs", () => {
  it("default 5000 ms in productie", () => {
    expect(resolveDrainMs({ NODE_ENV: "production" })).toBe(5000);
  });

  it("default 0 ms buiten productie (geen vertraging lokaal/in tests)", () => {
    expect(resolveDrainMs({ NODE_ENV: "development" })).toBe(0);
    expect(resolveDrainMs({})).toBe(0);
  });

  it("respecteert SHUTDOWN_DRAIN_MS, geklemd op [0, 60000]", () => {
    expect(resolveDrainMs({ NODE_ENV: "production", SHUTDOWN_DRAIN_MS: "8000" })).toBe(8000);
    expect(resolveDrainMs({ NODE_ENV: "production", SHUTDOWN_DRAIN_MS: "0" })).toBe(0);
    expect(resolveDrainMs({ NODE_ENV: "production", SHUTDOWN_DRAIN_MS: "-1" })).toBe(0);
    expect(resolveDrainMs({ NODE_ENV: "production", SHUTDOWN_DRAIN_MS: "999999" })).toBe(60000);
  });

  it("een override werkt ook buiten productie", () => {
    expect(resolveDrainMs({ NODE_ENV: "development", SHUTDOWN_DRAIN_MS: "2000" })).toBe(2000);
  });
});

describe("resolveForceKillMs", () => {
  it("default 25000 ms", () => {
    expect(resolveForceKillMs({})).toBe(25000);
  });

  it("respecteert SHUTDOWN_FORCE_KILL_MS, geklemd op [1000, 120000]", () => {
    expect(resolveForceKillMs({ SHUTDOWN_FORCE_KILL_MS: "10000" })).toBe(10000);
    expect(resolveForceKillMs({ SHUTDOWN_FORCE_KILL_MS: "10" })).toBe(1000);
    expect(resolveForceKillMs({ SHUTDOWN_FORCE_KILL_MS: "999999" })).toBe(120000);
  });
});
