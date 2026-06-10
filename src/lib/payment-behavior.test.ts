import { describe, expect, it } from "vitest";
import { computePaymentBehavior, type PaymentRow } from "./payment-behavior";

function daysAgo(n: number): Date {
  const d = new Date("2026-06-10T12:00:00Z");
  d.setDate(d.getDate() - n);
  return d;
}

// Hulpfunctie: bouw een betaalde rij met een opgegeven betaalvertraging in dagen.
function paidRow(issuedDaysAgo: number, paidDaysAgo: number, dueAt?: Date | null): PaymentRow {
  return {
    issuedAt: daysAgo(issuedDaysAgo),
    dueAt: dueAt !== undefined ? dueAt : daysAgo(issuedDaysAgo - 14), // standaard 14 dagen betalingstermijn
    paidAt: daysAgo(paidDaysAgo),
  };
}

describe("computePaymentBehavior", () => {
  describe("unknown-grens (< 3 betaalde facturen)", () => {
    it("geeft unknown bij lege invoer", () => {
      const result = computePaymentBehavior([]);
      expect(result.tone).toBe("unknown");
      expect(result.sampleSize).toBe(0);
      expect(result.avgDaysToPay).toBeNull();
      expect(result.onTimePct).toBeNull();
    });

    it("geeft unknown bij 1 betaalde factuur", () => {
      const result = computePaymentBehavior([paidRow(30, 20)]);
      expect(result.tone).toBe("unknown");
      expect(result.sampleSize).toBe(1);
    });

    it("geeft unknown bij 2 betaalde facturen", () => {
      const rows = [paidRow(30, 20), paidRow(25, 15)];
      const result = computePaymentBehavior(rows);
      expect(result.tone).toBe("unknown");
      expect(result.sampleSize).toBe(2);
    });

    it("telt alleen betaalde facturen (paidAt != null) mee voor de steekproef", () => {
      const rows: PaymentRow[] = [
        { issuedAt: daysAgo(30), dueAt: daysAgo(16), paidAt: null },
        { issuedAt: daysAgo(25), dueAt: daysAgo(11), paidAt: null },
        { issuedAt: daysAgo(20), dueAt: daysAgo(6), paidAt: null },
      ];
      const result = computePaymentBehavior(rows);
      expect(result.tone).toBe("unknown");
      expect(result.sampleSize).toBe(0);
    });
  });

  describe("good-grens", () => {
    it("geeft good bij gemiddeld ≤ 14 dagen", () => {
      // 3 facturen die allemaal na 14 dagen betaald zijn (exact grens)
      const rows = [paidRow(30, 16), paidRow(28, 14), paidRow(26, 12)];
      const result = computePaymentBehavior(rows);
      expect(result.tone).toBe("good");
    });

    it("geeft good bij gemiddeld minder dan 14 dagen", () => {
      const rows = [paidRow(30, 25), paidRow(28, 23), paidRow(26, 21)];
      // issuedAt is 30,28,26 daysAgo; paidAt is 25,23,21 daysAgo → 5 dagen elk
      const result = computePaymentBehavior(rows);
      expect(result.avgDaysToPay).toBe(5);
      expect(result.tone).toBe("good");
    });

    it("geeft good bij ≥ 90% op tijd ondanks hogere gemiddelde", () => {
      // 10 facturen: 9 op tijd, 1 te laat maar gemiddeld > 14 en <= 30
      const onTime = Array.from({ length: 9 }, (_, i) => ({
        issuedAt: daysAgo(60 + i),
        dueAt: daysAgo(46 + i), // 14 dagen termijn
        paidAt: daysAgo(47 + i), // één dag vóór vervaldatum
      }));
      const late: PaymentRow = {
        issuedAt: daysAgo(40),
        dueAt: daysAgo(26),
        paidAt: daysAgo(10), // 16 dagen over termijn, maar ook >14 dagen na issuedAt
      };
      const result = computePaymentBehavior([...onTime, late]);
      expect(result.onTimePct).toBe(90);
      expect(result.tone).toBe("good");
    });
  });

  describe("warning-grens", () => {
    it("geeft warning bij gemiddeld > 30 dagen", () => {
      const rows = [paidRow(60, 20), paidRow(55, 15), paidRow(50, 10)];
      // issuedAt: 60,55,50; paidAt: 20,15,10 → 40, 40, 40 dagen
      const result = computePaymentBehavior(rows);
      expect(result.avgDaysToPay).toBe(40);
      expect(result.tone).toBe("warning");
    });

    it("geeft warning bij < 60% op tijd", () => {
      // 5 facturen: 2 op tijd, 3 te laat → 40% op tijd
      const onTime: PaymentRow[] = [
        { issuedAt: daysAgo(60), dueAt: daysAgo(46), paidAt: daysAgo(47) },
        { issuedAt: daysAgo(55), dueAt: daysAgo(41), paidAt: daysAgo(42) },
      ];
      const late: PaymentRow[] = [
        { issuedAt: daysAgo(50), dueAt: daysAgo(36), paidAt: daysAgo(30) },
        { issuedAt: daysAgo(45), dueAt: daysAgo(31), paidAt: daysAgo(25) },
        { issuedAt: daysAgo(40), dueAt: daysAgo(26), paidAt: daysAgo(20) },
      ];
      const result = computePaymentBehavior([...onTime, ...late]);
      expect(result.onTimePct).toBe(40);
      expect(result.tone).toBe("warning");
    });
  });

  describe("neutral-grens", () => {
    it("geeft neutral bij 15–30 dagen gemiddeld en 60–89% op tijd", () => {
      // 4 facturen: 3 op tijd (75%), gemiddeld ~20 dagen.
      // "Op tijd" = paidAt.getTime() <= dueAt.getTime(), dus paidAt is eerder in de tijd
      // (hogere daysAgo) dan dueAt (lagere daysAgo).
      const rows: PaymentRow[] = [
        { issuedAt: daysAgo(80), dueAt: daysAgo(58), paidAt: daysAgo(60) }, // op tijd (60 > 58), 20 d
        { issuedAt: daysAgo(70), dueAt: daysAgo(48), paidAt: daysAgo(50) }, // op tijd, 20 d
        { issuedAt: daysAgo(60), dueAt: daysAgo(38), paidAt: daysAgo(40) }, // op tijd, 20 d
        { issuedAt: daysAgo(50), dueAt: daysAgo(30), paidAt: daysAgo(25) }, // te laat (25 < 30), 25 d
      ];
      const result = computePaymentBehavior(rows);
      expect(result.sampleSize).toBe(4);
      expect(result.onTimePct).toBe(75);
      expect(result.tone).toBe("neutral");
    });
  });

  describe("edge cases", () => {
    it("verwerkt rijen zonder dueAt correct (geen bijdrage aan onTimePct)", () => {
      const rows: PaymentRow[] = [
        { issuedAt: daysAgo(30), dueAt: null, paidAt: daysAgo(20) },
        { issuedAt: daysAgo(25), dueAt: null, paidAt: daysAgo(15) },
        { issuedAt: daysAgo(20), dueAt: null, paidAt: daysAgo(10) },
      ];
      const result = computePaymentBehavior(rows);
      expect(result.sampleSize).toBe(3);
      expect(result.avgDaysToPay).toBe(10);
      expect(result.onTimePct).toBeNull(); // geen dueAt aanwezig
      expect(result.tone).toBe("good"); // 10 dagen ≤ 14
    });

    it("verwerkt rijen zonder issuedAt — gebruikt dueAt als anker voor avgDaysToPay", () => {
      // dueAt: daysAgo(20) = 20 dagen geleden; paidAt: daysAgo(15) = 15 dagen geleden.
      // paidAt is 5 dagen NA dueAt → te laat betaald (maar 5 dagen na dueAt).
      // avgDaysToPay = 5 (positief verschil dueAt→paidAt), onTimePct = 0%.
      // tone = "good" want avgDaysToPay ≤ 14.
      const rows: PaymentRow[] = [
        { issuedAt: null, dueAt: daysAgo(20), paidAt: daysAgo(15) }, // 5 d na dueAt
        { issuedAt: null, dueAt: daysAgo(15), paidAt: daysAgo(10) }, // 5 d na dueAt
        { issuedAt: null, dueAt: daysAgo(10), paidAt: daysAgo(5) }, // 5 d na dueAt
      ];
      const result = computePaymentBehavior(rows);
      expect(result.sampleSize).toBe(3);
      expect(result.avgDaysToPay).toBe(5);
      expect(result.onTimePct).toBe(0); // alle drie te laat
      expect(result.tone).toBe("good"); // 5 dagen ≤ 14 → good
    });

    it("verwerkt rijen zonder issuedAt én dueAt — tellen niet mee voor avgDaysToPay", () => {
      const rows: PaymentRow[] = [
        { issuedAt: null, dueAt: null, paidAt: daysAgo(5) },
        { issuedAt: null, dueAt: null, paidAt: daysAgo(10) },
        { issuedAt: null, dueAt: null, paidAt: daysAgo(15) },
      ];
      const result = computePaymentBehavior(rows);
      expect(result.sampleSize).toBe(3);
      expect(result.avgDaysToPay).toBeNull();
      expect(result.onTimePct).toBeNull();
      // Geen gemiddelde EN geen on-time → geen good/warning → neutral
      expect(result.tone).toBe("neutral");
    });

    it("negeert rijen met negatieve betaalvertraging (dataruis)", () => {
      // paidAt vóór issuedAt: onwaarschijnlijk, maar robuust afhandelen
      const rows: PaymentRow[] = [
        {
          issuedAt: daysAgo(5),
          dueAt: daysAgo(0),
          paidAt: daysAgo(10), // paidAt eerder dan issuedAt
        },
        { issuedAt: daysAgo(30), dueAt: daysAgo(16), paidAt: daysAgo(20) }, // 10 d
        { issuedAt: daysAgo(25), dueAt: daysAgo(11), paidAt: daysAgo(15) }, // 10 d
      ];
      const result = computePaymentBehavior(rows);
      expect(result.sampleSize).toBe(3);
      // Eerste rij telt niet mee voor avg (negatief); gemiddelde van 10 + 10 = 10
      expect(result.avgDaysToPay).toBe(10);
      expect(result.tone).toBe("good");
    });
  });
});
