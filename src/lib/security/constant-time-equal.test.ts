import { describe, it, expect } from "vitest";
import { constantTimeEqual } from "./constant-time-equal";

describe("constantTimeEqual", () => {
  it("is true for byte-identieke strings", () => {
    expect(constantTimeEqual("", "")).toBe(true);
    expect(constantTimeEqual("a", "a")).toBe(true);
    expect(constantTimeEqual("hunter2", "hunter2")).toBe(true);
    const long = "x".repeat(1000);
    expect(constantTimeEqual(long, long)).toBe(true);
  });

  it("is false bij verschillende inhoud van gelijke lengte", () => {
    expect(constantTimeEqual("a", "b")).toBe(false);
    expect(constantTimeEqual("hunter2", "hunter3")).toBe(false);
    // verschil pas in het laatste teken
    expect(constantTimeEqual("secret-value-1", "secret-value-2")).toBe(false);
  });

  it("is false bij verschillende lengte, zonder te werpen (geen length-oracle-return)", () => {
    expect(constantTimeEqual("", "a")).toBe(false);
    expect(constantTimeEqual("a", "")).toBe(false);
    expect(constantTimeEqual("short", "short-but-longer")).toBe(false);
    expect(constantTimeEqual("x".repeat(31), "x".repeat(32))).toBe(false);
  });

  it("behandelt niet-ASCII/multibyte correct", () => {
    expect(constantTimeEqual("café", "café")).toBe(true);
    expect(constantTimeEqual("café", "cafe")).toBe(false);
    expect(constantTimeEqual("🔐", "🔐")).toBe(true);
    expect(constantTimeEqual("🔐", "🔑")).toBe(false);
  });

  it("is gelijkwaardig aan === over een reeks paren", () => {
    const samples = [
      "",
      "a",
      "ab",
      "abc",
      "abc ",
      "ABC",
      "0",
      "00",
      "token-32-charssssssssssssssssss",
    ];
    for (const a of samples) {
      for (const b of samples) {
        expect(constantTimeEqual(a, b)).toBe(a === b);
      }
    }
  });

  it("is deterministisch ondanks de willekeurige per-aanroep-sleutel", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(constantTimeEqual("stabiel-geheim", "stabiel-geheim")).toBe(true);
      expect(constantTimeEqual("stabiel-geheim", "stabiel-gehei_")).toBe(false);
    }
  });
});
