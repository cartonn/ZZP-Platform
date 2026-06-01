import { describe, expect, it } from "vitest";
import {
  canTaxFilingTransition,
  assertTaxFilingTransition,
  TaxFilingTransitionError,
} from "@/lib/tax-filing/state";
import { NoopTaxFilingPartner, type TaxDossier } from "@/lib/tax-filing/partner";

describe("tax-filing state machine", () => {
  it("staat de happy-path-keten toe", () => {
    expect(canTaxFilingTransition("AKKOORD", "IN_BEHANDELING")).toBe(true);
    expect(canTaxFilingTransition("IN_BEHANDELING", "CONCEPT_KLAAR")).toBe(true);
    expect(canTaxFilingTransition("CONCEPT_KLAAR", "INGEDIEND")).toBe(true);
    expect(canTaxFilingTransition("INGEDIEND", "AANSLAG_ONTVANGEN")).toBe(true);
  });

  it("staat intrekken toe vanuit elke niet-terminale status, niet daarna", () => {
    expect(canTaxFilingTransition("AKKOORD", "INGETROKKEN")).toBe(true);
    expect(canTaxFilingTransition("CONCEPT_KLAAR", "INGETROKKEN")).toBe(true);
    expect(canTaxFilingTransition("INGEDIEND", "INGETROKKEN")).toBe(false); // al ingediend
    expect(canTaxFilingTransition("AANSLAG_ONTVANGEN", "INGETROKKEN")).toBe(false);
  });

  it("weigert verboden sprongen", () => {
    expect(canTaxFilingTransition("AKKOORD", "INGEDIEND")).toBe(false); // niet zonder concept+akkoord
    expect(canTaxFilingTransition("AANSLAG_ONTVANGEN", "INGEDIEND")).toBe(false);
    expect(() => assertTaxFilingTransition("AKKOORD", "INGEDIEND")).toThrow(
      TaxFilingTransitionError,
    );
  });

  it("round-trip: kantoor kan vragen stellen en terug naar behandeling", () => {
    expect(canTaxFilingTransition("IN_BEHANDELING", "VRAGEN")).toBe(true);
    expect(canTaxFilingTransition("VRAGEN", "IN_BEHANDELING")).toBe(true);
  });
});

describe("NoopTaxFilingPartner", () => {
  const dossier: TaxDossier = {
    taxYear: 2026,
    kind: "IB",
    estimateCents: 450000,
    payload: { winst: 5000000 },
  };

  it("neemt het voorbereide bedrag over als concept", async () => {
    const p = new NoopTaxFilingPartner();
    const concept = await p.prepareConcept(dossier);
    expect(concept.conceptAmountCents).toBe(450000);
    expect(concept.partnerName).toBeTruthy();
  });

  it("geeft een ontvangstreferentie bij indienen", async () => {
    const p = new NoopTaxFilingPartner();
    const sub = await p.submit(dossier);
    expect(sub.submissionRef).toContain("IB");
    expect(sub.submissionRef).toContain("2026");
  });

  it("BTW-referentie bevat het kwartaal", async () => {
    const p = new NoopTaxFilingPartner();
    const sub = await p.submit({ ...dossier, kind: "BTW", quarter: 2 });
    expect(sub.submissionRef).toContain("Q2");
  });
});
