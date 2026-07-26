import { describe, expect, it } from "vitest";
import { assessJobRateFit } from "./job-rate-fit-detail";

describe("assessJobRateFit", () => {
  it("geeft null zonder (positief) eigen richttarief", () => {
    expect(assessJobRateFit(null, 40, 80)).toBeNull();
    expect(assessJobRateFit(undefined, 40, 80)).toBeNull();
    expect(assessJobRateFit(0, 40, 80)).toBeNull();
    expect(assessJobRateFit(-10, 40, 80)).toBeNull();
  });

  it("geeft null wanneer de opdracht geen enkele budgetgrens heeft", () => {
    expect(assessJobRateFit(50, null, null)).toBeNull();
    expect(assessJobRateFit(50, undefined, undefined)).toBeNull();
  });

  it("markeert 'onder je richttarief' wanneer het plafond lager is dan je tarief", () => {
    const a = assessJobRateFit(90, 40, 80);
    expect(a?.position).toBe("below");
    expect(a?.tone).toBe("warning");
    expect(a?.deltaEuros).toBe(10);
    expect(a?.detail).toContain("€ 10 boven het budget");
    expect(a?.detail).toContain("€ 40–€ 80");
  });

  it("markeert 'boven je richttarief' wanneer de bodem hoger is dan je tarief", () => {
    const a = assessJobRateFit(40, 50, 80);
    expect(a?.position).toBe("above");
    expect(a?.tone).toBe("good");
    expect(a?.deltaEuros).toBe(10);
    expect(a?.detail).toContain("€ 10 per uur méér");
  });

  it("markeert 'past bij je richttarief' wanneer je tarief binnen de band valt", () => {
    const a = assessJobRateFit(60, 40, 80);
    expect(a?.position).toBe("within");
    expect(a?.tone).toBe("neutral");
    expect(a?.deltaEuros).toBe(0);
  });

  it("behandelt de grenswaarden inclusief (op rateMax = binnen, niet onder)", () => {
    expect(assessJobRateFit(80, 40, 80)?.position).toBe("within");
    expect(assessJobRateFit(40, 40, 80)?.position).toBe("within");
    expect(assessJobRateFit(81, 40, 80)?.position).toBe("below");
    expect(assessJobRateFit(39, 40, 80)?.position).toBe("above");
  });

  it("werkt met alleen een ondergrens (vanaf)", () => {
    expect(assessJobRateFit(30, 50, null)?.position).toBe("above");
    expect(assessJobRateFit(60, 50, null)?.position).toBe("within");
    const above = assessJobRateFit(30, 50, null);
    expect(above?.detail).toContain("vanaf € 50");
  });

  it("werkt met alleen een bovengrens (tot)", () => {
    expect(assessJobRateFit(90, null, 80)?.position).toBe("below");
    expect(assessJobRateFit(60, null, 80)?.position).toBe("within");
    const below = assessJobRateFit(90, null, 80);
    expect(below?.detail).toContain("tot € 80");
  });

  it("toont één bedrag zonder streepje wanneer min en max gelijk zijn", () => {
    const a = assessJobRateFit(90, 70, 70);
    expect(a?.position).toBe("below");
    expect(a?.detail).toContain("€ 70");
    expect(a?.detail).not.toContain("€ 70–");
  });

  it("laat het plafond vóór de bodem gaan bij een omgekeerde/defensieve grensvolgorde", () => {
    // rateMin > rateMax: "betaalt minder" is het veiligste signaal.
    const a = assessJobRateFit(100, 90, 80);
    expect(a?.position).toBe("below");
    expect(a?.tone).toBe("warning");
  });
});
