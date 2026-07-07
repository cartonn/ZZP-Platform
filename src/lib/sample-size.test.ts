import { describe, expect, it } from "vitest";
import { hasReliableSample, insufficientSampleNotice } from "@/lib/sample-size";

describe("hasReliableSample", () => {
  it("is false onder het minimum", () => {
    expect(hasReliableSample(0, 3)).toBe(false);
    expect(hasReliableSample(2, 3)).toBe(false);
  });
  it("is true op of boven het minimum", () => {
    expect(hasReliableSample(3, 3)).toBe(true);
    expect(hasReliableSample(10, 3)).toBe(true);
  });
});

const PRESTATIE = { singular: "goedgekeurde prestatie", plural: "goedgekeurde prestaties" };
const BETALING = { singular: "betaling", plural: "betalingen" };

describe("insufficientSampleNotice", () => {
  it("geeft een enkelvoudige regel bij één ontbrekende waarneming", () => {
    expect(insufficientSampleNotice(2, 3, PRESTATIE)).toBe(
      "Nog 1 goedgekeurde prestatie nodig voor een betrouwbaar beeld",
    );
  });

  it("geeft een meervoudige regel bij meerdere ontbrekende waarnemingen", () => {
    expect(insufficientSampleNotice(0, 3, PRESTATIE)).toBe(
      "Nog 3 goedgekeurde prestaties nodig voor een betrouwbaar beeld",
    );
    expect(insufficientSampleNotice(1, 3, BETALING)).toBe(
      "Nog 2 betalingen nodig voor een betrouwbaar beeld",
    );
  });

  it("geeft null zodra de steekproef groot genoeg is", () => {
    expect(insufficientSampleNotice(3, 3, PRESTATIE)).toBeNull();
    expect(insufficientSampleNotice(9, 3, BETALING)).toBeNull();
  });
});
