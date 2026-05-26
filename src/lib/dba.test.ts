import { describe, expect, it } from "vitest";
import { assessDbaRisk, dbaAdvice, type DbaInput } from "@/lib/dba";

const base: DbaInput = {
  directSupervision: false,
  embedded: false,
  fixedSchedule: false,
  noSubstitution: false,
  exclusive: false,
  weakEntrepreneurship: false,
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

// Golden cases uit de DBA-reviewlog (representatieve pilotcases), als regressie-anker.
describe("DBA golden cases", () => {
  it("DBA-001 losse nachtdiensten, kort → LAAG (pass)", () => {
    expect(assessDbaRisk({ ...base, durationMonths: 1 }).level).toBe("LAAG");
  });
  it("DBA-002 wekelijkse inzet, teaminbedding, ~2,5 maand → MIDDEN (review)", () => {
    expect(assessDbaRisk({ ...base, embedded: true, durationMonths: 2 }).level).toBe("MIDDEN");
  });
  it("DBA-003 16 weken, dagelijkse aansturing, structureel rooster → HOOG (blocked)", () => {
    const r = assessDbaRisk({ ...base, directSupervision: true, embedded: true, fixedSchedule: true, noSubstitution: true, durationMonths: 4 });
    expect(r.level).toBe("HOOG");
  });
  it("DBA-004 zwak ondernemerschap (laag tarief) → MIDDEN (review)", () => {
    expect(assessDbaRisk({ ...base, weakEntrepreneurship: true }).level).toBe("MIDDEN");
  });
});

describe("dbaAdvice", () => {
  it("geeft per niveau een passende tekst", () => {
    expect(dbaAdvice("HOOG")).toMatch(/modelovereenkomst|Herzie/);
    expect(dbaAdvice("MIDDEN")).toMatch(/Aandachtspunten/);
    expect(dbaAdvice("LAAG")).toMatch(/Lage indicatie/);
  });
});
