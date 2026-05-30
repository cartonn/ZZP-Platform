import { describe, it, expect } from "vitest";
import {
  EMBEDDING_DIM,
  tokenize,
  embed,
  cosineSimilarity,
  textRelatedness,
} from "./semantic";

// ─── tokenize ────────────────────────────────────────────────────────────────

describe("tokenize", () => {
  it("geeft een lege array voor een lege string", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("geeft een lege array voor een string met alleen witruimte", () => {
    expect(tokenize("   \t\n  ")).toEqual([]);
  });

  it("converteert naar lowercase", () => {
    const tokens = tokenize("React TypeScript NextJS");
    expect(tokens).toContain("react");
    expect(tokens).toContain("typescript");
    expect(tokens).toContain("nextjs");
  });

  it("verwijdert Nederlandse stopwoorden", () => {
    const tokens = tokenize("de verpleegkundige en het ziekenhuis");
    expect(tokens).not.toContain("de");
    expect(tokens).not.toContain("en");
    expect(tokens).not.toContain("het");
    expect(tokens).toContain("verpleegkundige");
    expect(tokens).toContain("ziekenhuis");
  });

  it("verwijdert tokens korter dan 2 tekens", () => {
    const tokens = tokenize("a bb ccc d ee");
    expect(tokens).not.toContain("a");
    expect(tokens).not.toContain("d");
    expect(tokens).toContain("bb");
    expect(tokens).toContain("ccc");
    expect(tokens).toContain("ee");
  });

  it("normaliseert diacritieken: café → cafe", () => {
    const tokens = tokenize("café");
    expect(tokens).toContain("cafe");
    expect(tokens).not.toContain("café");
  });

  it("normaliseert diacritieken in meerdere woorden", () => {
    const tokens = tokenize("naïef résumé München");
    expect(tokens).toContain("naief");
    expect(tokens).toContain("resume");
    expect(tokens).toContain("munchen");
  });

  it("splitst op niet-alfanumerieke tekens", () => {
    const tokens = tokenize("node.js, react/vue & angular");
    expect(tokens).toContain("node");
    expect(tokens).toContain("react");
    expect(tokens).toContain("vue");
    expect(tokens).toContain("angular");
  });

  it("filtert interpunctie en geeft alleen relevante tokens", () => {
    // "er" is een stopwoord en wordt weggefilterd; "zzp" en "freelancer" niet.
    const tokens = tokenize("freelancer - ZZP'er, opdracht!");
    expect(tokens).toContain("freelancer");
    expect(tokens).toContain("zzp");
    expect(tokens).not.toContain("er"); // stopwoord
    expect(tokens).toContain("opdracht");
  });
});

// ─── embed ────────────────────────────────────────────────────────────────────

describe("embed", () => {
  it("geeft een vector van standaard lengte EMBEDDING_DIM", () => {
    const v = embed("frontend ontwikkelaar javascript");
    expect(v).toHaveLength(EMBEDDING_DIM);
  });

  it("respecteert een aangepaste dim", () => {
    const v = embed("software engineer", 32);
    expect(v).toHaveLength(32);
  });

  it("is deterministisch: zelfde input geeft identieke output", () => {
    const tekst = "verpleegkundige zorg ziekenhuis";
    const v1 = embed(tekst);
    const v2 = embed(tekst);
    expect(v1).toEqual(v2);
  });

  it("niet-lege input levert een genormaliseerde vector (norm ≈ 1)", () => {
    const v = embed("softwareontwikkelaar typescript react");
    const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it("lege input levert een nul-vector (norm = 0)", () => {
    const v = embed("");
    const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    expect(norm).toBeCloseTo(0, 10);
    expect(v).toHaveLength(EMBEDDING_DIM);
  });

  it("whitespace-only input levert een nul-vector", () => {
    const v = embed("   ");
    const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    expect(norm).toBeCloseTo(0, 10);
  });

  it("alleen-stopwoorden input levert een nul-vector", () => {
    const v = embed("de het een en van voor met op in te");
    const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    expect(norm).toBeCloseTo(0, 10);
  });

  it("custom dim wordt correct toegepast bij normalisatie", () => {
    const v = embed("backend python django", 16);
    expect(v).toHaveLength(16);
    const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    expect(norm).toBeCloseTo(1, 5);
  });
});

// ─── cosineSimilarity ─────────────────────────────────────────────────────────

describe("cosineSimilarity", () => {
  it("identieke vectoren geven 1", () => {
    const v = embed("frontend developer react");
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
  });

  it("geeft 0 bij vectoren van ongelijke lengte", () => {
    const a = [1, 0, 0];
    const b = [1, 0];
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it("geeft 0 bij lege vectoren", () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it("geeft 0 bij een nulvector", () => {
    const a = [0, 0, 0];
    const b = [1, 0, 0];
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it("resultaat is altijd binnen [0, 1]", () => {
    // Genereer een aantal paren en controleer de grens.
    const testParen: [string, string][] = [
      ["loodgieter", "verpleegkundige"],
      ["javascript", "python"],
      ["", "frontend"],
      ["zorg", "ziekenhuis"],
    ];
    for (const [a, b] of testParen) {
      const score = cosineSimilarity(embed(a), embed(b));
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it("is symmetrisch", () => {
    const a = embed("verpleegkundige zorg");
    const b = embed("ziekenhuis patient");
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 10);
  });

  it("geeft 1 voor handmatig geconstrueerde identieke vectoren", () => {
    const v = [0.6, 0.8, 0];
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
  });

  it("loodrecht staat geeft 0 (negatieve cosinus wordt geklemd)", () => {
    // Twee vectoren met tegengestelde tekens: negatieve dot-product → 0.
    const a = [1, 0];
    const b = [-1, 0];
    const result = cosineSimilarity(a, b);
    expect(result).toBe(0);
  });
});

// ─── textRelatedness ─────────────────────────────────────────────────────────

describe("textRelatedness", () => {
  it("identieke tekst geeft 1", () => {
    const tekst = "verpleegkundige zorg ziekenhuis";
    expect(textRelatedness(tekst, tekst)).toBeCloseTo(1, 5);
  });

  it("lege string aan de linkerkant geeft 0", () => {
    expect(textRelatedness("", "zorg ziekenhuis")).toBe(0);
  });

  it("lege string aan de rechterkant geeft 0", () => {
    expect(textRelatedness("zorg ziekenhuis", "")).toBe(0);
  });

  it("beide leeg geeft 0", () => {
    expect(textRelatedness("", "")).toBe(0);
  });

  it("whitespace-only aan een kant geeft 0", () => {
    expect(textRelatedness("   ", "zorg")).toBe(0);
  });

  it("is symmetrisch", () => {
    const a = "verpleegkundige ziekenhuis zorg";
    const b = "loodgieter sanitair badkamer";
    expect(textRelatedness(a, b)).toBeCloseTo(textRelatedness(b, a), 10);
  });

  it("gerelateerde teksten scoren hoger dan ongerelateerde teksten", () => {
    // Duidelijke woordoverlap: verpleegkundige-domein vs. loodgieter-domein.
    const verwant = textRelatedness(
      "verpleegkundige zorg ziekenhuis patient",
      "verpleegkundige zorg patient verpleging",
    );
    const onverwant = textRelatedness(
      "verpleegkundige zorg ziekenhuis patient",
      "loodgieter sanitair badkamer installatie",
    );
    expect(verwant).toBeGreaterThan(onverwant);
  });

  it("hoge overlap in technisch domein scoort hoger dan kruisdomein", () => {
    const verwant = textRelatedness(
      "frontend javascript react typescript",
      "frontend developer react javascript",
    );
    const onverwant = textRelatedness(
      "frontend javascript react typescript",
      "boekhouding factuur btw belasting",
    );
    expect(verwant).toBeGreaterThan(onverwant);
  });

  it("resultaat valt altijd binnen [0, 1]", () => {
    const paren: [string, string][] = [
      ["loodgieter sanitair", "verpleegkundige zorg"],
      ["javascript developer", "python backend"],
      ["freelancer opdracht", ""],
      ["zorg patient", "zorg patient"],
    ];
    for (const [a, b] of paren) {
      const score = textRelatedness(a, b);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});
