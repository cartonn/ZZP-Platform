import { describe, expect, it } from "vitest";
import { hoursTimesRateCents } from "./hourly-cents";

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
