import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canTransition,
  daysUntilExpiry,
  expiryTransition,
  isExpired,
  isExpiringSoon,
  statusForDecision,
  TransitionError,
} from "@/lib/credentials";

describe("canTransition / assertTransition", () => {
  it("staat geldige overgangen toe", () => {
    expect(canTransition("DRAFT", "SUBMITTED")).toBe(true);
    expect(canTransition("SUBMITTED", "VERIFIED")).toBe(true);
    expect(canTransition("SUBMITTED", "REJECTED")).toBe(true);
    expect(canTransition("VERIFIED", "EXPIRED")).toBe(true);
    expect(canTransition("REJECTED", "SUBMITTED")).toBe(true);
    expect(canTransition("EXPIRED", "SUBMITTED")).toBe(true);
  });

  it("weigert de verboden DRAFT->VERIFIED sprong", () => {
    expect(canTransition("DRAFT", "VERIFIED")).toBe(false);
    expect(() => assertTransition("DRAFT", "VERIFIED")).toThrow(TransitionError);
  });

  it("weigert overige ongeldige overgangen", () => {
    expect(canTransition("DRAFT", "REJECTED")).toBe(false);
    expect(canTransition("VERIFIED", "VERIFIED")).toBe(false);
    expect(canTransition("EXPIRED", "VERIFIED")).toBe(false);
  });

  it("assertTransition werpt niets bij geldige overgang", () => {
    expect(() => assertTransition("SUBMITTED", "VERIFIED")).not.toThrow();
  });
});

describe("statusForDecision", () => {
  it("zet VERIFIED bij goedkeuring", () => {
    expect(statusForDecision("SUBMITTED", "VERIFIED")).toBe("VERIFIED");
  });

  it("zet REJECTED bij afwijzing mét reden", () => {
    expect(statusForDecision("SUBMITTED", "REJECTED", "Onleesbaar document")).toBe("REJECTED");
  });

  it("dwingt een reden af bij afwijzing", () => {
    expect(() => statusForDecision("SUBMITTED", "REJECTED")).toThrow(/reden/i);
    expect(() => statusForDecision("SUBMITTED", "REJECTED", "   ")).toThrow(/reden/i);
  });

  it("weigert beslissen vanuit een ongeldige status", () => {
    expect(() => statusForDecision("DRAFT", "VERIFIED")).toThrow(TransitionError);
  });
});

describe("expiry", () => {
  const now = new Date("2026-05-25T12:00:00Z");
  const past = new Date("2026-01-01T00:00:00Z");
  const future = new Date("2026-12-31T00:00:00Z");

  it("alleen VERIFIED kan verlopen", () => {
    expect(isExpired({ status: "VERIFIED", expiresAt: past }, now)).toBe(true);
    expect(isExpired({ status: "SUBMITTED", expiresAt: past }, now)).toBe(false);
    expect(isExpired({ status: "DRAFT", expiresAt: past }, now)).toBe(false);
  });

  it("zonder vervaldatum verloopt nooit", () => {
    expect(isExpired({ status: "VERIFIED", expiresAt: null }, now)).toBe(false);
  });

  it("toekomstige vervaldatum is niet verlopen", () => {
    expect(isExpired({ status: "VERIFIED", expiresAt: future }, now)).toBe(false);
  });

  it("daysUntilExpiry rekent in hele dagen", () => {
    expect(daysUntilExpiry(null, now)).toBeNull();
    expect(daysUntilExpiry(new Date("2026-05-30T12:00:00Z"), now)).toBe(5);
    expect(daysUntilExpiry(past, now)).toBeLessThan(0);
  });

  it("isExpiringSoon detecteert bijna-verlopen VERIFIED credentials", () => {
    const soon = new Date("2026-06-10T12:00:00Z"); // 16 dagen
    expect(isExpiringSoon({ status: "VERIFIED", expiresAt: soon }, 30, now)).toBe(true);
    expect(isExpiringSoon({ status: "VERIFIED", expiresAt: future }, 30, now)).toBe(false);
    expect(isExpiringSoon({ status: "VERIFIED", expiresAt: past }, 30, now)).toBe(false);
    expect(isExpiringSoon({ status: "SUBMITTED", expiresAt: soon }, 30, now)).toBe(false);
  });

  it("expiryTransition geeft EXPIRED voor een verlopen VERIFIED credential", () => {
    expect(expiryTransition({ status: "VERIFIED", expiresAt: past }, now)).toBe("EXPIRED");
    expect(expiryTransition({ status: "VERIFIED", expiresAt: future }, now)).toBeNull();
    expect(expiryTransition({ status: "SUBMITTED", expiresAt: past }, now)).toBeNull();
  });
});
