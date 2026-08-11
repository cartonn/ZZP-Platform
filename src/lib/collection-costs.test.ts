import { describe, it, expect } from "vitest";
import {
  calculateCollectionCostsCents,
  calculateStatutoryInterestCents,
  summarizeOverdueCharges,
  WIK_MIN_CENTS,
  WIK_MAX_CENTS,
  WETTELIJKE_HANDELSRENTE_BPS,
} from "./collection-costs";

describe("calculateCollectionCostsCents (WIK-staffel)", () => {
  it("hanteert het wettelijke minimum van € 40 bij kleine bedragen", () => {
    // 15% van € 100 = € 15 → onder het minimum → € 40
    expect(calculateCollectionCostsCents(10000)).toBe(WIK_MIN_CENTS);
    // 15% van € 250 = € 37,50 → nog onder het minimum
    expect(calculateCollectionCostsCents(25000)).toBe(WIK_MIN_CENTS);
  });

  it("rekent 15% over de eerste schijf zodra dat boven het minimum uitkomt", () => {
    // 15% van € 2.500 = € 375
    expect(calculateCollectionCostsCents(250000)).toBe(37500);
  });

  it("stapelt de schijven correct (15% + 10%)", () => {
    // € 5.000: 15% × 2.500 (375) + 10% × 2.500 (250) = € 625
    expect(calculateCollectionCostsCents(500000)).toBe(62500);
  });

  it("stapelt door de derde schijf (15% + 10% + 5%)", () => {
    // € 10.000: 375 + 250 + 5% × 5.000 (250) = € 875
    expect(calculateCollectionCostsCents(1000000)).toBe(87500);
  });

  it("klemt op het wettelijke maximum van € 6.775", () => {
    // Zeer grote hoofdsom → boven het maximum
    expect(calculateCollectionCostsCents(100000000)).toBe(WIK_MAX_CENTS);
  });

  it("levert € 0 voor een niet-positieve of ongeldige hoofdsom", () => {
    expect(calculateCollectionCostsCents(0)).toBe(0);
    expect(calculateCollectionCostsCents(-500)).toBe(0);
    expect(calculateCollectionCostsCents(Number.NaN)).toBe(0);
    expect(calculateCollectionCostsCents(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("calculateStatutoryInterestCents (wettelijke handelsrente)", () => {
  const due = new Date("2026-04-15T00:00:00Z");

  it("berekent enkelvoudige rente over de verstreken dagen", () => {
    // € 10.000, 8%/jaar, 365 dagen = € 800
    const oneYearLater = new Date("2027-04-15T00:00:00Z");
    expect(
      calculateStatutoryInterestCents({
        principalCents: 1000000,
        dueAt: due,
        now: oneYearLater,
        annualRateBps: 800,
      }),
    ).toBe(80000);
  });

  it("gebruikt de standaard-rente wanneer geen tarief is meegegeven", () => {
    const oneYearLater = new Date("2027-04-15T00:00:00Z");
    const expected = Math.round((1000000 * (WETTELIJKE_HANDELSRENTE_BPS / 10000) * 365) / 365);
    expect(
      calculateStatutoryInterestCents({ principalCents: 1000000, dueAt: due, now: oneYearLater }),
    ).toBe(expected);
  });

  it("levert € 0 wanneer de factuur nog niet is verlopen", () => {
    expect(
      calculateStatutoryInterestCents({
        principalCents: 1000000,
        dueAt: due,
        now: new Date("2026-04-10T00:00:00Z"),
      }),
    ).toBe(0);
  });

  it("levert € 0 zonder vervaldag of bij een ongeldige/niet-positieve hoofdsom", () => {
    const now = new Date("2027-04-15T00:00:00Z");
    expect(calculateStatutoryInterestCents({ principalCents: 1000000, dueAt: null, now })).toBe(0);
    expect(calculateStatutoryInterestCents({ principalCents: 0, dueAt: due, now })).toBe(0);
    expect(calculateStatutoryInterestCents({ principalCents: Number.NaN, dueAt: due, now })).toBe(
      0,
    );
  });
});

describe("summarizeOverdueCharges", () => {
  const due = new Date("2026-04-15T00:00:00Z");

  it("combineert rente en incassokosten voor een verlopen factuur", () => {
    const now = new Date("2026-05-15T00:00:00Z"); // 30 dagen te laat
    const s = summarizeOverdueCharges({
      principalCents: 500000,
      dueAt: due,
      now,
      annualRateBps: 800,
    });
    expect(s.daysOverdue).toBe(30);
    expect(s.collectionCostsCents).toBe(62500); // € 5.000 → € 625
    // 8% × € 5.000 × 30/365 = € 32,88 (afgerond op centen)
    expect(s.interestCents).toBe(Math.round((500000 * 0.08 * 30) / 365));
    expect(s.totalWithChargesCents).toBe(500000 + s.interestCents + s.collectionCostsCents);
    expect(s.hasCharges).toBe(true);
    expect(s.interestRateBps).toBe(800);
  });

  it("rekent geen incassokosten wanneer de factuur nog niet verlopen is", () => {
    const now = new Date("2026-04-10T00:00:00Z");
    const s = summarizeOverdueCharges({ principalCents: 500000, dueAt: due, now });
    expect(s.daysOverdue).toBe(0);
    expect(s.collectionCostsCents).toBe(0);
    expect(s.interestCents).toBe(0);
    expect(s.hasCharges).toBe(false);
    expect(s.totalWithChargesCents).toBe(500000);
  });

  it("is robuust zonder vervaldag", () => {
    const now = new Date("2026-05-15T00:00:00Z");
    const s = summarizeOverdueCharges({ principalCents: 500000, dueAt: null, now });
    expect(s.daysOverdue).toBe(0);
    expect(s.hasCharges).toBe(false);
    expect(s.totalWithChargesCents).toBe(500000);
  });

  it("negeert een ongeldige hoofdsom in het totaal", () => {
    const now = new Date("2026-05-15T00:00:00Z");
    const s = summarizeOverdueCharges({ principalCents: Number.NaN, dueAt: due, now });
    expect(s.totalWithChargesCents).toBe(0);
    expect(s.hasCharges).toBe(false);
  });
});
