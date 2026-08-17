import { describe, it, expect } from "vitest";
import {
  monthKey,
  monthRange,
  performanceMonthKey,
  activeMembershipUserIds,
  calculateMembershipCharge,
  planMembershipCharges,
  type MembershipPerformance,
} from "@/lib/zzp-membership";
import { type ZzpMembershipConfig } from "@/lib/config";

const on: ZzpMembershipConfig = {
  enabled: true,
  monthlyPriceCents: 4000,
  vatRegime: "STANDARD_HIGH",
};
const off: ZzpMembershipConfig = { ...on, enabled: false };
const zero: ZzpMembershipConfig = { ...on, monthlyPriceCents: 0 };

describe("monthKey / monthRange", () => {
  it("geeft de UTC-maand als YYYY-MM", () => {
    expect(monthKey(new Date("2026-06-09T12:00:00Z"))).toBe("2026-06");
    expect(monthKey(new Date("2026-01-01T00:00:00Z"))).toBe("2026-01");
  });

  it("geeft een halfopen [start,end)-maandbereik", () => {
    const { start, end } = monthRange(new Date("2026-06-15T10:00:00Z"));
    expect(start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });
});

describe("performanceMonthKey", () => {
  it("gebruikt periodStart, anders approvedAt, anders createdAt", () => {
    const d = (s: string) => new Date(s);
    expect(
      performanceMonthKey({
        periodStart: d("2026-05-20T00:00:00Z"),
        approvedAt: d("2026-06-02T00:00:00Z"),
        createdAt: d("2026-06-02T00:00:00Z"),
      }),
    ).toBe("2026-05");
    expect(
      performanceMonthKey({
        periodStart: null,
        approvedAt: d("2026-06-02T00:00:00Z"),
        createdAt: d("2026-07-01T00:00:00Z"),
      }),
    ).toBe("2026-06");
    expect(
      performanceMonthKey({
        periodStart: null,
        approvedAt: null,
        createdAt: d("2026-07-01T00:00:00Z"),
      }),
    ).toBe("2026-07");
  });
});

describe("calculateMembershipCharge", () => {
  it("rekent € 40 + 21% btw", () => {
    const c = calculateMembershipCharge(on);
    expect(c.applicable).toBe(true);
    expect(c.subtotalCents).toBe(4000);
    expect(c.vatCents).toBe(840);
    expect(c.totalCents).toBe(4840);
  });

  it("is niet van toepassing als uit of 0", () => {
    expect(calculateMembershipCharge(off).applicable).toBe(false);
    expect(calculateMembershipCharge(zero).applicable).toBe(false);
  });
});

describe("planMembershipCharges", () => {
  it("maakt één bijdrage per (gededupliceerde) gebruiker", () => {
    const charges = planMembershipCharges(["u1", "u2", "u1"], "2026-06", on);
    expect(charges).toHaveLength(2);
    expect(charges.map((c) => c.userId).sort()).toEqual(["u1", "u2"]);
    expect(charges[0]!.period).toBe("2026-06");
    expect(charges[0]!.priceCents).toBe(4000);
    expect(charges[0]!.vatCents).toBe(840);
  });

  it("is leeg als het abonnement uit staat", () => {
    expect(planMembershipCharges(["u1"], "2026-06", off)).toEqual([]);
  });
});

describe("activeMembershipUserIds", () => {
  const perf = (
    userId: string | null,
    fields: Partial<Pick<MembershipPerformance, "periodStart" | "approvedAt" | "createdAt">>,
  ): MembershipPerformance => ({
    periodStart: fields.periodStart ?? null,
    approvedAt: fields.approvedAt ?? null,
    createdAt: fields.createdAt ?? new Date(Date.UTC(2000, 0, 1)),
    collaboration: userId ? { freelancer: { userId } } : null,
  });

  it("verzamelt de unieke ZZP'ers wier prestatie op de periode valt (periode-begin leidend)", () => {
    const ids = activeMembershipUserIds(
      [
        perf("u1", { periodStart: new Date(Date.UTC(2026, 5, 10)) }),
        perf("u1", { approvedAt: new Date(Date.UTC(2026, 5, 20)) }), // dedup: zelfde gebruiker
        perf("u2", { approvedAt: new Date(Date.UTC(2026, 5, 2)) }),
      ],
      "2026-06",
    );
    expect([...ids].sort()).toEqual(["u1", "u2"]);
  });

  it("negeert prestaties wier maand-toewijzing NIET op de periode valt", () => {
    // periodStart (mei) is leidend, ook al valt approvedAt in juni → telt voor mei, niet juni.
    const ids = activeMembershipUserIds(
      [
        perf("u1", {
          periodStart: new Date(Date.UTC(2026, 4, 30)),
          approvedAt: new Date(Date.UTC(2026, 5, 1)),
        }),
      ],
      "2026-06",
    );
    expect(ids.size).toBe(0);
  });

  it("slaat prestaties zonder gekoppelde ZZP'er over", () => {
    const ids = activeMembershipUserIds(
      [perf(null, { periodStart: new Date(Date.UTC(2026, 5, 5)) })],
      "2026-06",
    );
    expect(ids.size).toBe(0);
  });
});
