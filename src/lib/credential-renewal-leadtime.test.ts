import { describe, it, expect } from "vitest";
import {
  renewalNudge,
  RENEWAL_LEAD_TIMES,
  RENEWAL_PLAN_AHEAD_BUFFER_DAYS,
} from "@/lib/credential-renewal-leadtime";

describe("renewalNudge", () => {
  it("geen doorlooptijd bekend → null (verzekering, diploma, overig)", () => {
    for (const type of ["INSURANCE", "DIPLOMA", "OTHER"] as const) {
      expect(renewalNudge({ type, status: "VERIFIED", daysUntilExpiry: 10 })).toBeNull();
    }
  });

  it("VOG VERIFIED binnen de ondergrens → start_now, danger", () => {
    const n = renewalNudge({ type: "VOG", status: "VERIFIED", daysUntilExpiry: 10 });
    expect(n?.urgency).toBe("start_now");
    expect(n?.tone).toBe("danger");
    expect(n?.message).toContain("2 tot 8 weken");
    expect(n?.message).toContain("nu aan");
  });

  it("VOG VERIFIED tussen onder- en bovengrens → start_now, warning", () => {
    const n = renewalNudge({ type: "VOG", status: "VERIFIED", daysUntilExpiry: 40 });
    expect(n?.urgency).toBe("start_now");
    expect(n?.tone).toBe("warning");
  });

  it("VOG VERIFIED net buiten de doorlooptijd maar binnen de buffer → plan_ahead, info", () => {
    const n = renewalNudge({ type: "VOG", status: "VERIFIED", daysUntilExpiry: 70 });
    expect(n?.urgency).toBe("plan_ahead");
    expect(n?.tone).toBe("info");
    expect(n?.message).toContain("Houd rekening");
  });

  it("VOG VERIFIED voorbij de horizon → null", () => {
    expect(renewalNudge({ type: "VOG", status: "VERIFIED", daysUntilExpiry: 200 })).toBeNull();
  });

  it("VOG EXPIRED → altijd start_now, danger (ook zonder dagen)", () => {
    const n = renewalNudge({ type: "VOG", status: "EXPIRED", daysUntilExpiry: null });
    expect(n?.urgency).toBe("start_now");
    expect(n?.tone).toBe("danger");
    expect(n?.message).toContain("zo snel mogelijk");
  });

  it("VOG EXPIRED met negatieve dagen → start_now, danger", () => {
    const n = renewalNudge({ type: "VOG", status: "EXPIRED", daysUntilExpiry: -5 });
    expect(n?.urgency).toBe("start_now");
    expect(n?.tone).toBe("danger");
  });

  it("niet-geldige/niet-verlopen statussen → null", () => {
    for (const status of ["DRAFT", "SUBMITTED", "REJECTED"] as const) {
      expect(renewalNudge({ type: "VOG", status, daysUntilExpiry: 10 })).toBeNull();
    }
  });

  it("VERIFIED zonder vervaldatum → null", () => {
    expect(renewalNudge({ type: "VOG", status: "VERIFIED", daysUntilExpiry: null })).toBeNull();
  });

  it("VERIFIED al verlopen (negatieve dagen) → null (EXPIRED-status dekt dat)", () => {
    expect(renewalNudge({ type: "VOG", status: "VERIFIED", daysUntilExpiry: -1 })).toBeNull();
  });

  it("grenswaarden VOG: minDays=danger, minDays+1=warning, maxDays=warning, maxDays+1=plan_ahead", () => {
    const lt = RENEWAL_LEAD_TIMES.VOG!;
    expect(
      renewalNudge({ type: "VOG", status: "VERIFIED", daysUntilExpiry: lt.minDays })?.tone,
    ).toBe("danger");
    expect(
      renewalNudge({ type: "VOG", status: "VERIFIED", daysUntilExpiry: lt.minDays + 1 })?.tone,
    ).toBe("warning");
    expect(
      renewalNudge({ type: "VOG", status: "VERIFIED", daysUntilExpiry: lt.maxDays })?.tone,
    ).toBe("warning");
    const justPast = renewalNudge({
      type: "VOG",
      status: "VERIFIED",
      daysUntilExpiry: lt.maxDays + 1,
    });
    expect(justPast?.urgency).toBe("plan_ahead");
  });

  it("horizon-grens: exact maxDays+buffer → plan_ahead, +1 → null", () => {
    const lt = RENEWAL_LEAD_TIMES.VOG!;
    const horizon = lt.maxDays + RENEWAL_PLAN_AHEAD_BUFFER_DAYS;
    expect(
      renewalNudge({ type: "VOG", status: "VERIFIED", daysUntilExpiry: horizon })?.urgency,
    ).toBe("plan_ahead");
    expect(
      renewalNudge({ type: "VOG", status: "VERIFIED", daysUntilExpiry: horizon + 1 }),
    ).toBeNull();
  });

  it("CERTIFICATE en LICENSE dragen de hedged omschrijving 'enkele weken'", () => {
    for (const type of ["CERTIFICATE", "LICENSE"] as const) {
      const n = renewalNudge({ type, status: "VERIFIED", daysUntilExpiry: 5 });
      expect(n?.urgency).toBe("start_now");
      expect(n?.message).toContain("enkele weken");
    }
  });

  it("VOG draagt de officiële aanvraagbron (Justis, absolute https-URL) mee in de nudge", () => {
    const n = renewalNudge({ type: "VOG", status: "VERIFIED", daysUntilExpiry: 10 });
    expect(n?.leadTime.source?.label).toBe("Justis");
    expect(n?.leadTime.source?.url).toMatch(/^https:\/\//);
    expect(n?.leadTime.source?.url).toContain("justis.nl");
  });

  it("CERTIFICATE en LICENSE hebben geen canonieke bron (traject varieert te sterk)", () => {
    for (const type of ["CERTIFICATE", "LICENSE"] as const) {
      expect(RENEWAL_LEAD_TIMES[type]?.source).toBeUndefined();
    }
  });
});
