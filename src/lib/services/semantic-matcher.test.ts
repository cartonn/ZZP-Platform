import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  LocalSemanticMatcher,
  PgVectorSemanticMatcher,
  getSemanticMatcher,
  safeRelatedness,
} from "@/lib/services/semantic-matcher";

describe("LocalSemanticMatcher", () => {
  const matcher = new LocalSemanticMatcher();

  it("identieke tekst geeft score dicht bij 1", () => {
    const score = matcher.relatedness("software engineer backend", "software engineer backend");
    expect(score).toBeCloseTo(1, 5);
  });

  it("score ligt altijd in [0, 1]", () => {
    const score = matcher.relatedness("projectmanagement agile scrum", "boekhouding fiscaal btw");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("gerelateerde tekst scoort hoger dan ongerelateerde tekst", () => {
    const base = "frontend developer React TypeScript";
    const related = "frontend engineer React JavaScript";
    const unrelated = "vrachtwagenchauffeur logistiek transport";
    const scoreRelated = matcher.relatedness(base, related);
    const scoreUnrelated = matcher.relatedness(base, unrelated);
    expect(scoreRelated).toBeGreaterThan(scoreUnrelated);
  });
});

describe("PgVectorSemanticMatcher", () => {
  it("gooit een heldere fout zonder configuratie", () => {
    const matcher = new PgVectorSemanticMatcher();
    expect(() => matcher.relatedness("tekst a", "tekst b")).toThrow(/niet geconfigureerd/);
  });
});

describe("safeRelatedness", () => {
  it("geeft 0 terug bij een niet-geconfigureerde pgvector-matcher (geen throw)", () => {
    const matcher = new PgVectorSemanticMatcher();
    expect(safeRelatedness(matcher, "tekst a", "tekst b")).toBe(0);
  });

  it("geeft een positieve score voor identieke tekst via LocalSemanticMatcher", () => {
    const matcher = new LocalSemanticMatcher();
    expect(
      safeRelatedness(matcher, "accountant belastingaangifte", "accountant belastingaangifte"),
    ).toBeGreaterThan(0);
  });
});

describe("getSemanticMatcher", () => {
  const originalEnv = process.env.SEMANTIC_MATCHER;

  beforeEach(() => {
    delete process.env.SEMANTIC_MATCHER;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.SEMANTIC_MATCHER;
    } else {
      process.env.SEMANTIC_MATCHER = originalEnv;
    }
  });

  it("kiest LocalSemanticMatcher als standaard (env niet gezet)", () => {
    expect(getSemanticMatcher()).toBeInstanceOf(LocalSemanticMatcher);
  });

  it("kiest PgVectorSemanticMatcher bij SEMANTIC_MATCHER=pgvector", () => {
    process.env.SEMANTIC_MATCHER = "pgvector";
    expect(getSemanticMatcher()).toBeInstanceOf(PgVectorSemanticMatcher);
  });
});
