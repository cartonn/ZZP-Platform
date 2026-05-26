import { describe, expect, it } from "vitest";
import { assessDbaRisk, dbaAdvice, type DbaInput } from "@/lib/dba";

const base: DbaInput = {
  directSupervision: false,
  embedded: false,
  fixedSchedule: false,
  noSubstitution: false,
  exclusive: false,
  durationMonths: null,
};

describe("assessDbaRisk", () => {
  it("LAAG zonder risicokenmerken", () => {
    const r = assessDbaRisk(base);
    expect(r.level).toBe("LAAG");
    expect(r.score).toBe(0);
    expect(r.reasons).toEqual([]);
  });

  it("twee kernindicatoren samen = HOOG", () => {
    const r = assessDbaRisk({ ...base, directSupervision: true, embedded: true });
    expect(r.score).toBe(6);
    expect(r.level).toBe("HOOG");
    expect(r.reasons.map((x) => x.factor)).toEqual(["directSupervision", "embedded"]);
  });

  it("één medium-indicator = MIDDEN", () => {
    const r = assessDbaRisk({ ...base, noSubstitution: true });
    expect(r.score).toBe(2);
    expect(r.level).toBe("MIDDEN");
  });

  it("exclusiviteit alleen = LAAG (zwak signaal)", () => {
    expect(assessDbaRisk({ ...base, exclusive: true }).level).toBe("LAAG");
  });

  it("lange duur telt mee", () => {
    expect(assessDbaRisk({ ...base, durationMonths: 13 }).score).toBe(2);
    expect(assessDbaRisk({ ...base, durationMonths: 8 }).score).toBe(1);
    expect(assessDbaRisk({ ...base, durationMonths: 3 }).score).toBe(0);
  });

  it("elke getriggerde indicator levert een uitleg", () => {
    const r = assessDbaRisk({ ...base, directSupervision: true, fixedSchedule: true, durationMonths: 24 });
    expect(r.reasons).toHaveLength(3);
    expect(r.reasons.every((x) => x.message.length > 0)).toBe(true);
  });
});

describe("dbaAdvice", () => {
  it("geeft per niveau een passende tekst", () => {
    expect(dbaAdvice("HOOG")).toMatch(/modelovereenkomst|Herzie/);
    expect(dbaAdvice("MIDDEN")).toMatch(/Aandachtspunten/);
    expect(dbaAdvice("LAAG")).toMatch(/Lage indicatie/);
  });
});
