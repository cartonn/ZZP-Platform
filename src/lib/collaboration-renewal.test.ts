import { describe, expect, it } from "vitest";
import {
  countAttentionRenewals,
  RENEWAL_WINDOW_DAYS,
  RENEWAL_OVERDUE_GRACE_DAYS,
  renewalHeadline,
  renewalRowBadge,
  summarizeCollaborationRenewal,
} from "./collaboration-renewal";

const NOW = new Date("2026-07-09T12:00:00.000Z");

function endInDays(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

describe("summarizeCollaborationRenewal", () => {
  it("geeft geen signaal zonder einddatum", () => {
    const r = summarizeCollaborationRenewal({ status: "ACTIVE", endDate: null, now: NOW });
    expect(r).toEqual({ phase: "none", daysRemaining: null, attention: false });
  });

  it("geeft geen signaal voor een niet-actieve samenwerking", () => {
    for (const status of ["PROPOSED", "COMPLETED", "CANCELLED"]) {
      const r = summarizeCollaborationRenewal({ status, endDate: endInDays(5), now: NOW });
      expect(r.phase).toBe("none");
      expect(r.attention).toBe(false);
    }
  });

  it("geeft geen signaal bij een lopend dispuut (cascade bevroren)", () => {
    const r = summarizeCollaborationRenewal({
      status: "ACTIVE",
      endDate: endInDays(5),
      disputed: true,
      now: NOW,
    });
    expect(r.phase).toBe("none");
  });

  it("markeert een einddatum ver weg als on_track (geen aandacht)", () => {
    const r = summarizeCollaborationRenewal({ status: "ACTIVE", endDate: endInDays(60), now: NOW });
    expect(r.phase).toBe("on_track");
    expect(r.attention).toBe(false);
    expect(r.daysRemaining).toBe(60);
  });

  it("markeert binnen het venster als ending_soon", () => {
    const r = summarizeCollaborationRenewal({ status: "ACTIVE", endDate: endInDays(10), now: NOW });
    expect(r.phase).toBe("ending_soon");
    expect(r.attention).toBe(true);
    expect(r.daysRemaining).toBe(10);
  });

  it("de venstergrens (precies RENEWAL_WINDOW_DAYS) telt nog als ending_soon", () => {
    const r = summarizeCollaborationRenewal({
      status: "ACTIVE",
      endDate: endInDays(RENEWAL_WINDOW_DAYS),
      now: NOW,
    });
    expect(r.phase).toBe("ending_soon");
  });

  it("net buiten het venster is on_track", () => {
    const r = summarizeCollaborationRenewal({
      status: "ACTIVE",
      endDate: endInDays(RENEWAL_WINDOW_DAYS + 1),
      now: NOW,
    });
    expect(r.phase).toBe("on_track");
    expect(r.attention).toBe(false);
  });

  it("een verstreken einddatum op een nog-actieve inzet is overdue", () => {
    const r = summarizeCollaborationRenewal({ status: "ACTIVE", endDate: endInDays(-3), now: NOW });
    expect(r.phase).toBe("overdue");
    expect(r.attention).toBe(true);
    expect(r.daysRemaining).toBe(-3);
  });

  it("binnen het grace-venster ná de einddatum blijft het overdue met aandacht", () => {
    const r = summarizeCollaborationRenewal({
      status: "ACTIVE",
      endDate: endInDays(-RENEWAL_OVERDUE_GRACE_DAYS),
      now: NOW,
    });
    expect(r.phase).toBe("overdue");
    expect(r.attention).toBe(true);
    expect(r.daysRemaining).toBe(-RENEWAL_OVERDUE_GRACE_DAYS);
  });

  it("voorbij het grace-venster dempt de onafhandelbare nudge naar lapsed (geen aandacht)", () => {
    const r = summarizeCollaborationRenewal({
      status: "ACTIVE",
      endDate: endInDays(-(RENEWAL_OVERDUE_GRACE_DAYS + 1)),
      now: NOW,
    });
    expect(r.phase).toBe("lapsed");
    expect(r.attention).toBe(false);
    expect(r.daysRemaining).toBe(-(RENEWAL_OVERDUE_GRACE_DAYS + 1));
  });

  it("respecteert een eigen grace-venster", () => {
    const short = summarizeCollaborationRenewal({
      status: "ACTIVE",
      endDate: endInDays(-4),
      overdueGraceDays: 3,
      now: NOW,
    });
    expect(short.phase).toBe("lapsed");
    expect(short.attention).toBe(false);
  });

  it("respecteert een eigen venster", () => {
    const r = summarizeCollaborationRenewal({
      status: "ACTIVE",
      endDate: endInDays(5),
      windowDays: 3,
      now: NOW,
    });
    expect(r.phase).toBe("on_track");
  });

  it("rekent in hele UTC-dagen, ongevoelig voor het tijdstip binnen de dag", () => {
    // Einddatum eind van vandaag, now vroeg op de dag → 0 dagen resterend, ending_soon.
    const r = summarizeCollaborationRenewal({
      status: "ACTIVE",
      endDate: new Date("2026-07-09T23:00:00.000Z"),
      now: new Date("2026-07-09T01:00:00.000Z"),
    });
    expect(r.daysRemaining).toBe(0);
    expect(r.phase).toBe("ending_soon");
  });
});

describe("countAttentionRenewals", () => {
  it("telt niets bij een lege lijst", () => {
    expect(countAttentionRenewals([], NOW)).toBe(0);
  });

  it("telt ending_soon en overdue (attention), maar niet on_track/lapsed/geen-datum", () => {
    const rows = [
      { endDate: endInDays(10) }, // ending_soon → telt
      { endDate: endInDays(-3) }, // overdue binnen grace → telt
      { endDate: endInDays(RENEWAL_WINDOW_DAYS + 5) }, // on_track → telt niet
      { endDate: endInDays(-(RENEWAL_OVERDUE_GRACE_DAYS + 2)) }, // voorbij grace → lapsed → telt niet
      { endDate: null }, // geen datum → telt niet
    ];
    expect(countAttentionRenewals(rows, NOW)).toBe(2);
  });

  it("gebruikt exact dezelfde attention-grens als summarizeCollaborationRenewal", () => {
    const rows = [{ endDate: endInDays(0) }, { endDate: endInDays(RENEWAL_WINDOW_DAYS) }];
    const expected = rows.filter(
      (r) =>
        summarizeCollaborationRenewal({ status: "ACTIVE", endDate: r.endDate, now: NOW }).attention,
    ).length;
    expect(countAttentionRenewals(rows, NOW)).toBe(expected);
    expect(expected).toBe(2);
  });
});

describe("renewalHeadline", () => {
  it("varieert per fase en resterende dagen", () => {
    expect(renewalHeadline("overdue", -2)).toMatch(/voorbij de einddatum/i);
    expect(renewalHeadline("ending_soon", 0)).toMatch(/vandaag/i);
    expect(renewalHeadline("ending_soon", 1)).toMatch(/morgen/i);
    expect(renewalHeadline("ending_soon", 7)).toMatch(/7 dagen/);
    expect(renewalHeadline("on_track", 40)).toMatch(/loopt nog/i);
  });
});

describe("renewalRowBadge", () => {
  it("geeft geen chip voor rustige fases", () => {
    expect(renewalRowBadge("on_track", 40)).toBeNull();
    expect(renewalRowBadge("lapsed", -50)).toBeNull();
    expect(renewalRowBadge("none", null)).toBeNull();
  });

  it("labelt ending_soon met resterende dagen (warning-toon)", () => {
    expect(renewalRowBadge("ending_soon", 0)).toEqual({
      label: "Loopt vandaag af",
      tone: "warning",
    });
    expect(renewalRowBadge("ending_soon", 1)).toEqual({
      label: "Loopt morgen af",
      tone: "warning",
    });
    expect(renewalRowBadge("ending_soon", 5)).toEqual({
      label: "Loopt af over 5 dagen",
      tone: "warning",
    });
  });

  it("labelt overdue met dagen-over-tijd (danger-toon), enkelvoud vs meervoud", () => {
    expect(renewalRowBadge("overdue", 0)).toEqual({ label: "Voorbij einddatum", tone: "danger" });
    expect(renewalRowBadge("overdue", -1)).toEqual({ label: "1 dag over tijd", tone: "danger" });
    expect(renewalRowBadge("overdue", -4)).toEqual({ label: "4 dagen over tijd", tone: "danger" });
  });

  it("spiegelt de fase van summarizeCollaborationRenewal (geen drift)", () => {
    const summary = summarizeCollaborationRenewal({
      status: "ACTIVE",
      endDate: endInDays(3),
      now: NOW,
    });
    const badge = renewalRowBadge(summary.phase, summary.daysRemaining);
    expect(summary.attention).toBe(true);
    expect(badge).toEqual({ label: "Loopt af over 3 dagen", tone: "warning" });
  });
});
