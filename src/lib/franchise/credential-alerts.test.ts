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
    expect(alert).toEqual({ soonestDays: null, window: null, count: 0, soonestType: null });
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

  it("labels a single upcoming expiry by type and days", () => {
    const alert = summarizeExpiryAlert(
      [cred({ id: "1", type: "VOG", expiresAt: inDays(12) })],
      NOW,
    );
    expect(expiryAlertLabel(alert)).toBe("VOG verloopt over 12 d");
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
    const alert = summarizeExpiryAlert(
      [
        cred({ id: "1", type: "VOG", expiresAt: inDays(10) }),
        cred({ id: "2", type: "DIPLOMA", expiresAt: inDays(40) }),
      ],
      NOW,
    );
    expect(expiryAlertLabel(alert)).toBe("VOG verloopt over 10 d +1");
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

  it("is warning for upcoming", () => {
    const alert = summarizeExpiryAlert([cred({ id: "1", expiresAt: inDays(20) })], NOW);
    expect(expiryAlertTone(alert)).toBe("warning");
  });
});
