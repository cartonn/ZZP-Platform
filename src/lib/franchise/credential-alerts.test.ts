import { describe, it, expect } from "vitest";
import {
  summarizeExpiryAlert,
  expiryAlertLabel,
  expiryAlertTone,
} from "@/lib/franchise/credential-alerts";
import { type ExpiryCredentialInput } from "@/lib/credential-expiry-overview";

const NOW = new Date("2026-06-16T12:00:00.000Z");

function inDays(n: number): Date {
  return new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);
}

function cred(p: Partial<ExpiryCredentialInput> & { id: string }): ExpiryCredentialInput {
  return {
    title: p.title ?? "Cert",
    type: p.type ?? "CERTIFICATE",
    status: p.status ?? "VERIFIED",
    expiresAt: p.expiresAt ?? null,
    ...p,
  };
}

describe("summarizeExpiryAlert", () => {
  it("returns empty signal when there is nothing to flag", () => {
    expect(summarizeExpiryAlert([], NOW)).toEqual({
      soonestDays: null,
      window: null,
      count: 0,
      soonestType: null,
      renewalUrgent: false,
    });
  });

  it("ignores VERIFIED credentials with expiry beyond the 90-day horizon", () => {
    const alert = summarizeExpiryAlert([cred({ id: "1", expiresAt: inDays(120) })], NOW);
    expect(alert.window).toBeNull();
    expect(alert.count).toBe(0);
  });

  it("classifies a within-30 window", () => {
    const alert = summarizeExpiryAlert(
      [cred({ id: "1", type: "VOG", expiresAt: inDays(12) })],
      NOW,
    );
    expect(alert.window).toBe("WITHIN_30");
    expect(alert.soonestDays).toBe(12);
    expect(alert.count).toBe(1);
    expect(alert.soonestType).toBe("VOG");
  });

  it("classifies a within-60 window", () => {
    const alert = summarizeExpiryAlert([cred({ id: "1", expiresAt: inDays(45) })], NOW);
    expect(alert.window).toBe("WITHIN_60");
    expect(alert.soonestDays).toBe(45);
  });

  it("classifies a within-90 window", () => {
    const alert = summarizeExpiryAlert([cred({ id: "1", expiresAt: inDays(80) })], NOW);
    expect(alert.window).toBe("WITHIN_90");
    expect(alert.soonestDays).toBe(80);
  });

  it("treats a past expiry date as EXPIRED with negative days", () => {
    const alert = summarizeExpiryAlert([cred({ id: "1", expiresAt: inDays(-5) })], NOW);
    expect(alert.window).toBe("EXPIRED");
    expect(alert.soonestDays).toBeLessThan(0);
    expect(alert.count).toBe(1);
  });

  it("treats an EXPIRED-status credential as expired regardless of date", () => {
    const alert = summarizeExpiryAlert(
      [cred({ id: "1", status: "EXPIRED", expiresAt: inDays(10) })],
      NOW,
    );
    expect(alert.window).toBe("EXPIRED");
  });

  it("ignores non-VERIFIED (DRAFT/SUBMITTED/REJECTED) credentials", () => {
    const alert = summarizeExpiryAlert(
      [
        cred({ id: "1", status: "DRAFT", expiresAt: inDays(5) }),
        cred({ id: "2", status: "SUBMITTED", expiresAt: inDays(5) }),
        cred({ id: "3", status: "REJECTED", expiresAt: inDays(5) }),
      ],
      NOW,
    );
    expect(alert).toEqual({
      soonestDays: null,
      window: null,
      count: 0,
      soonestType: null,
      renewalUrgent: false,
    });
  });

  it("ignores VERIFIED credentials without an expiry date", () => {
    const alert = summarizeExpiryAlert([cred({ id: "1", expiresAt: null })], NOW);
    expect(alert.window).toBeNull();
    expect(alert.count).toBe(0);
  });

  it("picks the soonest among several in-horizon credentials and counts all", () => {
    const alert = summarizeExpiryAlert(
      [
        cred({ id: "1", type: "INSURANCE", expiresAt: inDays(80) }),
        cred({ id: "2", type: "VOG", expiresAt: inDays(10) }),
        cred({ id: "3", type: "DIPLOMA", expiresAt: inDays(40) }),
      ],
      NOW,
    );
    expect(alert.soonestType).toBe("VOG");
    expect(alert.soonestDays).toBe(10);
    expect(alert.window).toBe("WITHIN_30");
    expect(alert.count).toBe(3);
  });

  it("ranks an expired credential ahead of an upcoming one", () => {
    const alert = summarizeExpiryAlert(
      [
        cred({ id: "1", type: "VOG", expiresAt: inDays(10) }),
        cred({ id: "2", type: "DIPLOMA", expiresAt: inDays(-2) }),
      ],
      NOW,
    );
    expect(alert.window).toBe("EXPIRED");
    expect(alert.soonestType).toBe("DIPLOMA");
    expect(alert.count).toBe(2);
  });
});

describe("expiryAlertLabel", () => {
  it("returns null when nothing is flagged", () => {
    expect(expiryAlertLabel(summarizeExpiryAlert([], NOW))).toBeNull();
  });

  it("labels a single upcoming expiry by type and days (no lead-time type stays plain)", () => {
    // Diploma kent geen vernieuwings-doorlooptijd → geen "vraag nu aan"-escalatie.
    const alert = summarizeExpiryAlert(
      [cred({ id: "1", type: "DIPLOMA", expiresAt: inDays(12) })],
      NOW,
    );
    expect(expiryAlertLabel(alert)).toBe("Diploma verloopt over 12 d");
  });

  it("appends 'vraag nu aan' when the soonest is within its renewal lead-time", () => {
    // VOG-doorlooptijd loopt tot 56 d; 50 d valt er binnen → nu aanvragen.
    const alert = summarizeExpiryAlert(
      [cred({ id: "1", type: "VOG", expiresAt: inDays(50) })],
      NOW,
    );
    expect(expiryAlertLabel(alert)).toBe("VOG verloopt over 50 d · vraag nu aan");
  });

  it("labels a single expired credential by type", () => {
    const alert = summarizeExpiryAlert(
      [cred({ id: "1", type: "VOG", expiresAt: inDays(-3) })],
      NOW,
    );
    expect(expiryAlertLabel(alert)).toBe("VOG verlopen");
  });

  it("labels multiple expired credentials by count", () => {
    const alert = summarizeExpiryAlert(
      [cred({ id: "1", expiresAt: inDays(-3) }), cred({ id: "2", expiresAt: inDays(-1) })],
      NOW,
    );
    expect(expiryAlertLabel(alert)).toBe("2 certificaten verlopen");
  });

  it("adds a +n suffix when more upcoming credentials follow the soonest", () => {
    // Diploma soonest (geen doorlooptijd) → plain label mét +n-suffix.
    const alert = summarizeExpiryAlert(
      [
        cred({ id: "1", type: "DIPLOMA", expiresAt: inDays(10) }),
        cred({ id: "2", type: "INSURANCE", expiresAt: inDays(40) }),
      ],
      NOW,
    );
    expect(expiryAlertLabel(alert)).toBe("Diploma verloopt over 10 d +1");
  });

  it("keeps the 'vraag nu aan' escalation before the +n suffix", () => {
    const alert = summarizeExpiryAlert(
      [
        cred({ id: "1", type: "VOG", expiresAt: inDays(10) }),
        cred({ id: "2", type: "DIPLOMA", expiresAt: inDays(40) }),
      ],
      NOW,
    );
    expect(expiryAlertLabel(alert)).toBe("VOG verloopt over 10 d · vraag nu aan +1");
  });
});

describe("expiryAlertTone", () => {
  it("is null when nothing is flagged", () => {
    expect(expiryAlertTone(summarizeExpiryAlert([], NOW))).toBeNull();
  });

  it("is danger for expired", () => {
    const alert = summarizeExpiryAlert([cred({ id: "1", expiresAt: inDays(-1) })], NOW);
    expect(expiryAlertTone(alert)).toBe("danger");
  });

  it("is warning for an upcoming expiry outside the renewal lead-time", () => {
    // Diploma kent geen doorlooptijd → nooit escalatie, blijft warning.
    const alert = summarizeExpiryAlert(
      [cred({ id: "1", type: "DIPLOMA", expiresAt: inDays(20) })],
      NOW,
    );
    expect(expiryAlertTone(alert)).toBe("warning");
  });

  it("is danger when the soonest is within its renewal lead-time", () => {
    const alert = summarizeExpiryAlert(
      [cred({ id: "1", type: "VOG", expiresAt: inDays(50) })],
      NOW,
    );
    expect(expiryAlertTone(alert)).toBe("danger");
  });
});

describe("renewalUrgent (lead-time escalation)", () => {
  it("flags a VOG within its 56-day lead-time as urgent", () => {
    const alert = summarizeExpiryAlert(
      [cred({ id: "1", type: "VOG", expiresAt: inDays(50) })],
      NOW,
    );
    expect(alert.renewalUrgent).toBe(true);
    expect(alert.window).toBe("WITHIN_60");
  });

  it("does not flag a VOG comfortably beyond its lead-time", () => {
    // 80 d > 56 d bovengrens → nog geen escalatie (rustig plannen kan later).
    const alert = summarizeExpiryAlert(
      [cred({ id: "1", type: "VOG", expiresAt: inDays(80) })],
      NOW,
    );
    expect(alert.renewalUrgent).toBe(false);
    expect(expiryAlertTone(alert)).toBe("warning");
  });

  it("does not flag a type without a known lead-time (diploma at the same days)", () => {
    const alert = summarizeExpiryAlert(
      [cred({ id: "1", type: "DIPLOMA", expiresAt: inDays(30) })],
      NOW,
    );
    expect(alert.renewalUrgent).toBe(false);
  });

  it("flags a certificate within its 42-day lead-time but not just outside it", () => {
    const inside = summarizeExpiryAlert(
      [cred({ id: "1", type: "CERTIFICATE", expiresAt: inDays(30) })],
      NOW,
    );
    expect(inside.renewalUrgent).toBe(true);
    const outside = summarizeExpiryAlert(
      [cred({ id: "1", type: "CERTIFICATE", expiresAt: inDays(50) })],
      NOW,
    );
    expect(outside.renewalUrgent).toBe(false);
  });

  it("leaves renewalUrgent false for an already-expired soonest (already danger)", () => {
    const alert = summarizeExpiryAlert(
      [cred({ id: "1", type: "VOG", expiresAt: inDays(-2) })],
      NOW,
    );
    expect(alert.window).toBe("EXPIRED");
    expect(alert.renewalUrgent).toBe(false);
    expect(expiryAlertTone(alert)).toBe("danger");
  });
});
