import { describe, it, expect } from "vitest";
import {
  recommendModelAgreement,
  MODEL_AGREEMENT_TYPES,
  MODEL_AGREEMENT_LABELS,
  type ModelAgreementRecommendation,
} from "./model-agreement";
import type { DbaInput } from "./dba";

const EXPECTED_NOTE =
  "Een modelovereenkomst beschermt alleen als er in de praktijk ook conform wordt gewerkt — stem de werkwijze af op de gekozen overeenkomst.";

const baseInput: DbaInput = {
  directSupervision: false,
  embedded: false,
  fixedSchedule: false,
  noSubstitution: false,
  exclusive: false,
  weakEntrepreneurship: false,
  durationMonths: null,
};

describe("recommendModelAgreement", () => {
  it("LAAG: alle indicatoren false → recommended false, type null, label null, reasons leeg, note aanwezig", () => {
    const result = recommendModelAgreement(baseInput);

    expect(result.recommended).toBe(false);
    expect(result.type).toBeNull();
    expect(result.label).toBeNull();
    expect(result.reasons).toEqual([]);
    expect(result.note).toBe(EXPECTED_NOTE);
  });

  it("gezag: directSupervision true → recommended true, type GEEN_WERKGEVERSGEZAG, reasons niet leeg", () => {
    const result = recommendModelAgreement({
      ...baseInput,
      directSupervision: true,
    });

    expect(result.recommended).toBe(true);
    expect(result.type).toBe("GEEN_WERKGEVERSGEZAG");
    expect(result.label).toBe(MODEL_AGREEMENT_LABELS["GEEN_WERKGEVERSGEZAG"]);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.note).toBe(EXPECTED_NOTE);
  });

  it("HOOG: directSupervision + embedded → recommended true, type GEEN_WERKGEVERSGEZAG, twee reasons", () => {
    const result = recommendModelAgreement({
      ...baseInput,
      directSupervision: true,
      embedded: true,
    });

    expect(result.recommended).toBe(true);
    expect(result.type).toBe("GEEN_WERKGEVERSGEZAG");
    // Beide indicatoren genereren elk een reason
    expect(result.reasons.length).toBeGreaterThanOrEqual(2);
    expect(result.note).toBe(EXPECTED_NOTE);
  });

  it("vrije vervanging: noSubstitution + exclusive (score 3 = MIDDEN, geen gezag/fixedSchedule) → type VRIJE_VERVANGING", () => {
    const result = recommendModelAgreement({
      ...baseInput,
      noSubstitution: true,
      exclusive: true,
    });

    expect(result.recommended).toBe(true);
    expect(result.type).toBe("VRIJE_VERVANGING");
    expect(result.label).toBe(MODEL_AGREEMENT_LABELS["VRIJE_VERVANGING"]);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.note).toBe(EXPECTED_NOTE);
  });

  it("algemeen vangnet: exclusive + weakEntrepreneurship (MIDDEN, geen gezag, geen vervanging) → type GEEN_WERKGEVERSGEZAG, reasons niet leeg (generieke regel)", () => {
    const result = recommendModelAgreement({
      ...baseInput,
      exclusive: true,
      weakEntrepreneurship: true,
    });

    expect(result.recommended).toBe(true);
    expect(result.type).toBe("GEEN_WERKGEVERSGEZAG");
    expect(result.reasons.length).toBeGreaterThan(0);
    // Generieke fallback-tekst aanwezig
    expect(result.reasons[0]).toContain("zelfstandige werkwijze");
    expect(result.note).toBe(EXPECTED_NOTE);
  });

  it("type is altijd een van MODEL_AGREEMENT_TYPES wanneer recommended true", () => {
    const inputs: DbaInput[] = [
      { ...baseInput, directSupervision: true },
      { ...baseInput, noSubstitution: true, exclusive: true },
      { ...baseInput, exclusive: true, weakEntrepreneurship: true },
      { ...baseInput, embedded: true, fixedSchedule: true },
    ];

    for (const input of inputs) {
      const result = recommendModelAgreement(input);
      expect(result.recommended).toBe(true);
      expect(MODEL_AGREEMENT_TYPES).toContain(result.type);
    }
  });

  it("note is altijd aanwezig, ook bij LAAG", () => {
    const cases: DbaInput[] = [
      baseInput,
      { ...baseInput, directSupervision: true },
      { ...baseInput, embedded: true },
      { ...baseInput, noSubstitution: true, exclusive: true },
    ];

    for (const input of cases) {
      const result: ModelAgreementRecommendation = recommendModelAgreement(input);
      expect(result.note).toBe(EXPECTED_NOTE);
    }
  });

  it("fixedSchedule true (score 2 = MIDDEN) → type GEEN_WERKGEVERSGEZAG met reason over uren/rooster", () => {
    const result = recommendModelAgreement({
      ...baseInput,
      fixedSchedule: true,
    });

    expect(result.recommended).toBe(true);
    expect(result.type).toBe("GEEN_WERKGEVERSGEZAG");
    expect(result.reasons.some((r) => r.includes("uren") || r.includes("rooster"))).toBe(true);
  });

  it("label is MODEL_AGREEMENT_LABELS[type] wanneer recommended true", () => {
    const result = recommendModelAgreement({
      ...baseInput,
      directSupervision: true,
    });

    expect(result.label).toBe(
      MODEL_AGREEMENT_LABELS[result.type as keyof typeof MODEL_AGREEMENT_LABELS],
    );
  });
});
