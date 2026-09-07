import { describe, expect, it } from "vitest";
import { assessDbaRisk, dbaAdvice, dbaMitigations, type DbaInput, type DbaRisk } from "@/lib/dba";

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
    const r = assessDbaRisk({
      ...base,
      directSupervision: true,
      fixedSchedule: true,
      durationMonths: 24,
    });
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
    const r = assessDbaRisk({
      ...base,
      directSupervision: true,
      embedded: true,
      fixedSchedule: true,
      noSubstitution: true,
      durationMonths: 4,
    });
    expect(r.level).toBe("HOOG");
  });
  it("DBA-004 zwak ondernemerschap (laag tarief) → MIDDEN (review)", () => {
    expect(assessDbaRisk({ ...base, weakEntrepreneurship: true }).level).toBe("MIDDEN");
  });
});

describe("dbaMitigations", () => {
  const RANK: Record<DbaRisk, number> = { LAAG: 0, MIDDEN: 1, HOOG: 2 };
  // Past de voorgestelde wijzigingen toe (zet de indicatoren uit) en geeft het nieuwe niveau.
  const applied = (input: DbaInput): DbaRisk | null => {
    const plan = dbaMitigations(input);
    if (!plan) return null;
    const next = { ...input };
    for (const c of plan.changes) next[c.factor] = false;
    return assessDbaRisk(next).level;
  };

  it("geeft null bij een LAAG-inschatting (niets te verlagen)", () => {
    expect(dbaMitigations(base)).toBeNull();
    expect(dbaMitigations({ ...base, exclusive: true })).toBeNull();
  });

  it("HOOG → MIDDEN met de minste, meest-fundamentele wijziging", () => {
    const plan = dbaMitigations({ ...base, directSupervision: true, embedded: true });
    expect(plan).not.toBeNull();
    expect(plan!.targetLevel).toBe("MIDDEN");
    expect(plan!.changes.map((c) => c.factor)).toEqual(["directSupervision"]);
    expect((plan!.changes[0]?.action.length ?? 0) > 0).toBe(true);
    expect(applied({ ...base, directSupervision: true, embedded: true })).toBe("MIDDEN");
  });

  it("MIDDEN → LAAG", () => {
    const input = { ...base, noSubstitution: true };
    const plan = dbaMitigations(input);
    expect(plan!.targetLevel).toBe("LAAG");
    expect(plan!.changes.map((c) => c.factor)).toEqual(["noSubstitution"]);
    expect(applied(input)).toBe("LAAG");
  });

  it("kiest de minst-verstorende enkele hefboom als die volstaat", () => {
    // fixedSchedule(2)+weakEntrepreneurship(2)+exclusive(1) = 5 (HOOG); één punt eraf volstaat.
    const input = {
      ...base,
      fixedSchedule: true,
      weakEntrepreneurship: true,
      exclusive: true,
    };
    const plan = dbaMitigations(input);
    expect(plan!.changes.map((c) => c.factor)).toEqual(["exclusive"]);
    expect(applied(input)).toBe("MIDDEN");
  });

  it("combineert hefbomen wanneer één niet genoeg is (minste totale verlaging)", () => {
    // noSubstitution+fixedSchedule+weakEntrepreneurship(elk 2)+exclusive(1) = 7 (HOOG); -3 nodig.
    const input = {
      ...base,
      noSubstitution: true,
      fixedSchedule: true,
      weakEntrepreneurship: true,
      exclusive: true,
    };
    const plan = dbaMitigations(input);
    expect(plan!.changes).toHaveLength(2);
    expect(plan!.changes.map((c) => c.factor)).toEqual(["noSubstitution", "exclusive"]);
    expect(applied(input)).toBe("MIDDEN");
  });

  it("null wanneer de indicatoren de vereiste verlaging niet dekken (duur-gedreven)", () => {
    // durationMonths 13 = score 2 (MIDDEN) zonder actieve indicator-hefboom.
    expect(dbaMitigations({ ...base, durationMonths: 13 })).toBeNull();
  });

  it("laat het niveau altijd dalen wanneer een plan bestaat", () => {
    const cases: DbaInput[] = [
      { ...base, directSupervision: true, embedded: true, fixedSchedule: true },
      { ...base, embedded: true, noSubstitution: true, durationMonths: 8 },
      { ...base, directSupervision: true, weakEntrepreneurship: true, exclusive: true },
    ];
    for (const c of cases) {
      const before = assessDbaRisk(c).level;
      const after = applied(c);
      if (after !== null) expect(RANK[after]).toBeLessThan(RANK[before]);
    }
  });
});

describe("dbaAdvice", () => {
  it("geeft per niveau een passende tekst", () => {
    expect(dbaAdvice("HOOG")).toMatch(/modelovereenkomst|Herzie/);
    expect(dbaAdvice("MIDDEN")).toMatch(/Aandachtspunten/);
    expect(dbaAdvice("LAAG")).toMatch(/Lage indicatie/);
  });
});
