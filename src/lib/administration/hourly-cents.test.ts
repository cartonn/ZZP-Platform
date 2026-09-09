import { describe, expect, it } from "vitest";
import { hoursTimesRateCents, isCentAccurateHours, isCentAccurateEuros } from "./hourly-cents";

/**
 * Exacte referentie: round-half-up van `uren × tarief` in centen, berekend in integer-ruimte vanuit de
 * 2-decimale uren (het datamodel-precisieniveau). Onafhankelijk van float-vermenigvuldiging.
 */
function exactCents(hours: number, rateCents: number): number {
  const h = Math.round(hours * 100); // honderdsten-uur
  return Math.floor((h * rateCents + 50) / 100);
}

describe("hoursTimesRateCents", () => {
  it("rondt de halve cent OMHOOG waar Math.round(float) naar beneden dreef (het gemelde defect)", () => {
    // 0,29 × €17,50 = 507,5 cent → commercieel 508. Math.round(0,29*1750) gaf 507 (float 507,4999…994).
    expect(hoursTimesRateCents(0.29, 1750)).toBe(508);
    expect(Math.round(0.29 * 1750)).toBe(507); // documenteert het oude, foute gedrag

    // 4,14 × €0,25 = 103,5 cent → 104. Math.round(4,14*25) gaf 103 (float 103,4999…999).
    expect(hoursTimesRateCents(4.14, 25)).toBe(104);
    expect(Math.round(4.14 * 25)).toBe(103);
  });

  it("blijft identiek aan de oude uitkomst voor kwartier-uren (die exact zijn in float)", () => {
    // Kwartieren (0/.25/.5/.75) zijn exact representeerbaar → geen drift, dus parity met Math.round.
    const cases: Array<[number, number]> = [
      [0.25, 4250], // 1062,5 → 1063 (exact in float; beide 1063)
      [0.5, 3300], // 1650
      [0.75, 2000], // 1500
      [7.25, 4500], // 32625
      [8, 5000], // 40000
      [1.67, 2500], // 2-decimaal (shift-afgeleid): 4175
    ];
    for (const [hours, rate] of cases) {
      expect(hoursTimesRateCents(hours, rate)).toBe(Math.round(hours * rate));
      expect(hoursTimesRateCents(hours, rate)).toBe(exactCents(hours, rate));
    }
  });

  it("geeft 0 bij 0 uren of tarief 0", () => {
    expect(hoursTimesRateCents(0, 5000)).toBe(0);
    expect(hoursTimesRateCents(8, 0)).toBe(0);
  });

  it("komt over een brede sweep van 2-decimale uren × realistische tarieven exact overeen met de referentie, en rondt nooit naar beneden onder de exacte waarde", () => {
    let corrected = 0;
    for (let hh = 0; hh <= 4000; hh++) {
      const hours = hh / 100; // 0,00 … 40,00 uur, elke honderdste
      for (const rate of [25, 1750, 2500, 4250, 8850, 12345]) {
        const got = hoursTimesRateCents(hours, rate);
        const ref = exactCents(hours, rate);
        expect(got).toBe(ref);
        // De helper mag nooit ONDER de exacte round-half-up uitkomen (dat was het onderbetalings-defect).
        if (got !== Math.round(hours * rate)) corrected++;
        expect(got).toBeGreaterThanOrEqual(Math.round(hours * rate));
      }
    }
    // Bewijst dat de sweep daadwerkelijk float-drift-gevallen bevat die de helper corrigeert.
    expect(corrected).toBeGreaterThan(0);
  });

  it("blijft exact binnen de veilige integer-grens bij de maxima (1000 u × €2.000/u)", () => {
    // MAX_PERFORMANCE_HOURS × MAX_PERFORMANCE_RATE_CENTS = 100.000 honderdsten × 200.000 = 2·10¹⁰.
    expect(hoursTimesRateCents(1000, 200_000)).toBe(200_000_000); // €2.000.000
    expect(Number.isSafeInteger(hoursTimesRateCents(1000, 200_000))).toBe(true);
  });
});

describe("isCentAccurateHours", () => {
  it("accepteert waarden op de cent-grid (≤2 decimalen), inclusief float-noisy 2-decimalen", () => {
    for (const v of [0, 0.25, 0.5, 0.75, 1, 4.14, 4.15, 1.67, 8, 999.99, 1000, 0.01, 0.29]) {
      expect(isCentAccurateHours(v)).toBe(true);
    }
    // Enkele 2-decimalen zijn niet exact in float na ×100 (bv. 4,15·100 = 415,0000…0006) — de
    // tolerantie vangt die ruis, zodat geldige invoer niet ten onrechte wordt geweigerd.
    expect(4.15 * 100).not.toBe(415);
    expect(isCentAccurateHours(1.67)).toBe(true);
    expect(isCentAccurateHours(8.85)).toBe(true);
  });

  it("weigert waarden met méér dan twee decimalen (die de factuurmotor stil zou herkwantiseren)", () => {
    for (const v of [4.149, 4.141, 4.145, 0.001, 0.125, 2.333, 7.7777, 1.001]) {
      expect(isCentAccurateHours(v)).toBe(false);
    }
    // 4,149 → factuurmotor rekent met round(4,149·100)=415 → 4,15: precies de getoond↔gefactureerd-drift.
    expect(Math.round(4.149 * 100)).toBe(415);
  });

  it("is consistent met de kwantisatie van hoursTimesRateCents (accepteert ⇔ geen herkwantisatie-verlies)", () => {
    // Een cent-accurate waarde valt op de honderdsten-grid, dus round(v·100) verliest niets.
    for (let hh = 0; hh <= 1000; hh++) {
      const v = hh / 100; // exact een honderdste-stap
      expect(isCentAccurateHours(v)).toBe(true);
      // Een halve-honderdste ertussen (3e decimaal) valt er buiten.
      if (hh < 1000) expect(isCentAccurateHours(v + 0.005)).toBe(false);
    }
  });
});

describe("isCentAccurateEuros", () => {
  it("accepteert bedragen op de cent-grid, inclusief IEEE-754-ruis na ×100", () => {
    for (const v of [0, 0.01, 100.01, 2500, 100.15, 8.85, 1_000_000]) {
      expect(isCentAccurateEuros(v)).toBe(true);
    }
    // 4,15·100 = 414,9999… — een 2-decimaal bedrag dat als IEEE-754 nét naast het gehele getal ligt;
    // de tolerantie vangt die ruis zodat geldige invoer niet ten onrechte wordt geweigerd.
    expect(4.15 * 100).not.toBe(415);
    expect(isCentAccurateEuros(4.15)).toBe(true);
  });

  it("weigert bedragen met méér dan twee decimalen (die eurosToCents stil zou herkwantiseren)", () => {
    for (const v of [100.005, 0.001, 100.011, 2.333, 99.999]) {
      expect(isCentAccurateEuros(v)).toBe(false);
    }
    // 100,005 → round(100,005·100) = 10001 → €100,01: precies de ingevoerd↔gefactureerd-drift.
    expect(Math.round(100.005 * 100)).toBe(10001);
  });

  it("is hetzelfde predikaat als isCentAccurateHours (gedeelde honderdsten-grid)", () => {
    for (const v of [100.005, 100.01, 0.001, 2500, 4.149, 8.85]) {
      expect(isCentAccurateEuros(v)).toBe(isCentAccurateHours(v));
    }
  });
});
