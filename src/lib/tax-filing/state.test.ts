import { describe, it, expect } from "vitest";
import {
  canTaxFilingTransition,
  assertTaxFilingTransition,
  TaxFilingTransitionError,
} from "./state";
import { TAX_FILING_STATUSES, TAX_FILING_TRANSITIONS } from "@/lib/enums";

describe("aangifte-delegatie state machine", () => {
  it("staat gedefinieerde overgangen toe", () => {
    expect(canTaxFilingTransition("AKKOORD", "IN_BEHANDELING")).toBe(true);
    expect(canTaxFilingTransition("IN_BEHANDELING", "CONCEPT_KLAAR")).toBe(true);
    expect(canTaxFilingTransition("VRAGEN", "IN_BEHANDELING")).toBe(true);
    expect(canTaxFilingTransition("CONCEPT_KLAAR", "INGEDIEND")).toBe(true);
    expect(canTaxFilingTransition("INGEDIEND", "AANSLAG_ONTVANGEN")).toBe(true);
  });

  it("weigert overgangen die een stap overslaan", () => {
    expect(canTaxFilingTransition("AKKOORD", "INGEDIEND")).toBe(false);
    expect(canTaxFilingTransition("AKKOORD", "CONCEPT_KLAAR")).toBe(false);
    expect(canTaxFilingTransition("INGEDIEND", "CONCEPT_KLAAR")).toBe(false);
  });

  it("terminale toestanden hebben geen uitgaande overgangen", () => {
    for (const to of TAX_FILING_STATUSES) {
      expect(canTaxFilingTransition("AANSLAG_ONTVANGEN", to)).toBe(false);
      expect(canTaxFilingTransition("INGETROKKEN", to)).toBe(false);
    }
  });

  it("intrekken kan vóór indienen, niet erna", () => {
    expect(canTaxFilingTransition("AKKOORD", "INGETROKKEN")).toBe(true);
    expect(canTaxFilingTransition("IN_BEHANDELING", "INGETROKKEN")).toBe(true);
    expect(canTaxFilingTransition("CONCEPT_KLAAR", "INGETROKKEN")).toBe(true);
    expect(canTaxFilingTransition("INGEDIEND", "INGETROKKEN")).toBe(false);
    expect(canTaxFilingTransition("AANSLAG_ONTVANGEN", "INGETROKKEN")).toBe(false);
  });

  it("assert gooit TaxFilingTransitionError met from -> to in de boodschap", () => {
    expect(() => assertTaxFilingTransition("AKKOORD", "INGEDIEND")).toThrow(
      TaxFilingTransitionError,
    );
    expect(() => assertTaxFilingTransition("AKKOORD", "INGEDIEND")).toThrow("AKKOORD -> INGEDIEND");
  });

  it("assert is stil bij een geldige overgang", () => {
    expect(() => assertTaxFilingTransition("CONCEPT_KLAAR", "INGEDIEND")).not.toThrow();
  });

  it("canTaxFilingTransition komt voor elke (from, to) overeen met de map (drift-bewaking)", () => {
    for (const from of TAX_FILING_STATUSES) {
      for (const to of TAX_FILING_STATUSES) {
        expect(canTaxFilingTransition(from, to)).toBe(TAX_FILING_TRANSITIONS[from].includes(to));
      }
    }
  });
});
