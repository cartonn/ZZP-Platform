import { describe, expect, it } from "vitest";
import {
  EXPIRY_HORIZON_DAYS,
  summarizeExpiry,
  type ExpiryCredentialInput,
} from "@/lib/credential-expiry-overview";

const NOW = new Date("2026-06-15T12:00:00.000Z");

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

function cred(overrides: Partial<ExpiryCredentialInput> = {}): ExpiryCredentialInput {
  return {
    id: "c1",
    title: "VOG",
    type: "VOG",
    status: "VERIFIED",
    expiresAt: daysFromNow(10),
    ...overrides,
  };
}

describe("summarizeExpiry", () => {
  it("geeft een lege kalender bij geen certificaten", () => {
    const o = summarizeExpiry([], NOW);
    expect(o.total).toBe(0);
    expect(o.items).toEqual([]);
    expect([o.expired, o.within30, o.within60, o.within90]).toEqual([0, 0, 0, 0]);
  });

  it("plaatst een VERIFIED-certificaat in het juiste venster", () => {
    const o = summarizeExpiry(
      [
        cred({ id: "a", expiresAt: daysFromNow(15) }),
        cred({ id: "b", expiresAt: daysFromNow(45) }),
        cred({ id: "c", expiresAt: daysFromNow(75) }),
      ],
      NOW,
    );
    expect(o.within30).toBe(1);
    expect(o.within60).toBe(1);
    expect(o.within90).toBe(1);
    expect(o.total).toBe(3);
  });

  it("negeert certificaten ver buiten de horizon", () => {
    const o = summarizeExpiry([cred({ expiresAt: daysFromNow(EXPIRY_HORIZON_DAYS + 1) })], NOW);
    expect(o.total).toBe(0);
  });

  it("neemt een certificaat exact op de horizon nog mee", () => {
    const o = summarizeExpiry([cred({ expiresAt: daysFromNow(EXPIRY_HORIZON_DAYS) })], NOW);
    expect(o.within90).toBe(1);
    expect(o.total).toBe(1);
  });

  it("behandelt een VERIFIED maar al verstreken vervaldatum als verlopen", () => {
    const o = summarizeExpiry([cred({ status: "VERIFIED", expiresAt: daysFromNow(-2) })], NOW);
    expect(o.expired).toBe(1);
    expect(o.items[0]?.window).toBe("EXPIRED");
    expect(o.items[0]?.days).toBe(-2);
  });

  it("behandelt een EXPIRED-status altijd als verlopen, ook met een datum in de toekomst", () => {
    const o = summarizeExpiry([cred({ status: "EXPIRED", expiresAt: daysFromNow(5) })], NOW);
    expect(o.expired).toBe(1);
    expect(o.items[0]?.window).toBe("EXPIRED");
  });

  it("negeert statussen die niet kunnen verlopen", () => {
    const statuses = ["DRAFT", "SUBMITTED", "REJECTED"] as const;
    for (const status of statuses) {
      const o = summarizeExpiry([cred({ status, expiresAt: daysFromNow(5) })], NOW);
      expect(o.total).toBe(0);
    }
  });

  it("negeert certificaten zonder vervaldatum", () => {
    const o = summarizeExpiry([cred({ expiresAt: null })], NOW);
    expect(o.total).toBe(0);
  });

  it("sorteert meest urgent eerst en breekt gelijke dagen op titel", () => {
    const o = summarizeExpiry(
      [
        cred({ id: "later", title: "Zeta", expiresAt: daysFromNow(40) }),
        cred({ id: "expired", title: "Alpha", expiresAt: daysFromNow(-5) }),
        cred({ id: "tieB", title: "Bravo", expiresAt: daysFromNow(20) }),
        cred({ id: "tieA", title: "Alfa", expiresAt: daysFromNow(20) }),
      ],
      NOW,
    );
    expect(o.items.map((i) => i.id)).toEqual(["expired", "tieA", "tieB", "later"]);
  });

  it("muteert de invoer niet", () => {
    const input = Object.freeze([cred({ expiresAt: daysFromNow(10) })]);
    expect(() => summarizeExpiry(input, NOW)).not.toThrow();
  });
});
