import { describe, it, expect } from "vitest";
import {
  SUBMITTED_EXPIRY_SOON_DAYS,
  classifySubmittedExpiry,
  submittedExpiryLabel,
  summarizeSubmittedExpiry,
} from "./verification-expiry";

const NOW = new Date("2026-08-29T12:00:00.000Z");

function daysFromNow(days: number, extraMs = 0): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000 + extraMs);
}

describe("classifySubmittedExpiry", () => {
  it("geen vervaldatum → valid", () => {
    expect(classifySubmittedExpiry(null, NOW)).toBe("valid");
    expect(classifySubmittedExpiry(undefined, NOW)).toBe("valid");
  });

  it("exact op nu → expired (zelfde grens als isExpired: <= now)", () => {
    expect(classifySubmittedExpiry(new Date(NOW.getTime()), NOW)).toBe("expired");
  });

  it("kort in het verleden → expired", () => {
    expect(classifySubmittedExpiry(daysFromNow(0, -1000), NOW)).toBe("expired");
    expect(classifySubmittedExpiry(daysFromNow(-10), NOW)).toBe("expired");
  });

  it("binnen het venster → expiring-soon", () => {
    expect(classifySubmittedExpiry(daysFromNow(1), NOW)).toBe("expiring-soon");
    expect(classifySubmittedExpiry(daysFromNow(SUBMITTED_EXPIRY_SOON_DAYS), NOW)).toBe(
      "expiring-soon",
    );
  });

  it("net na het venster → valid", () => {
    // 30 volle dagen + wat extra uren telt nog als 30 hele dagen (floor) → nog binnen het venster.
    expect(classifySubmittedExpiry(daysFromNow(SUBMITTED_EXPIRY_SOON_DAYS, 3_600_000), NOW)).toBe(
      "expiring-soon",
    );
    // 31 volle dagen valt buiten het venster.
    expect(classifySubmittedExpiry(daysFromNow(SUBMITTED_EXPIRY_SOON_DAYS + 1), NOW)).toBe("valid");
  });
});

describe("submittedExpiryLabel", () => {
  it("valid → null", () => {
    expect(submittedExpiryLabel(daysFromNow(90), NOW)).toBeNull();
    expect(submittedExpiryLabel(null, NOW)).toBeNull();
  });

  it("verlopen → 'Reeds verlopen'", () => {
    expect(submittedExpiryLabel(daysFromNow(-3), NOW)).toBe("Reeds verlopen");
  });

  it("bijna verlopen → dag-bewuste tekst", () => {
    // expiresAt over minder dan een hele dag → floor 0 → vandaag.
    expect(submittedExpiryLabel(daysFromNow(0, 3_600_000), NOW)).toBe("Verloopt vandaag");
    expect(submittedExpiryLabel(daysFromNow(1), NOW)).toBe("Verloopt morgen");
    expect(submittedExpiryLabel(daysFromNow(14), NOW)).toBe("Verloopt over 14 dagen");
  });
});

describe("summarizeSubmittedExpiry", () => {
  it("telt verlopen en bijna-verlopen apart; valid telt niet mee", () => {
    const summary = summarizeSubmittedExpiry(
      [
        { expiresAt: daysFromNow(-1) }, // expired
        { expiresAt: daysFromNow(-40) }, // expired
        { expiresAt: daysFromNow(5) }, // expiring-soon
        { expiresAt: daysFromNow(29) }, // expiring-soon
        { expiresAt: daysFromNow(120) }, // valid
        { expiresAt: null }, // valid
      ],
      NOW,
    );
    expect(summary).toEqual({ expiredCount: 2, expiringSoonCount: 2 });
  });

  it("lege wachtrij → nul", () => {
    expect(summarizeSubmittedExpiry([], NOW)).toEqual({ expiredCount: 0, expiringSoonCount: 0 });
  });
});
