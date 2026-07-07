import { describe, expect, it } from "vitest";
import {
  assertInvoiceTransition,
  canTransitionInvoice,
  eurosToCents,
  formatInvoiceNumber,
  InvoiceTransitionError,
  invoiceCentsWithinInt4,
  invoiceTotalCents,
  isOverdue,
  lineAmountCents,
  MAX_INVOICE_CENTS,
} from "@/lib/invoices";

describe("factuur-statusovergangen", () => {
  it("staat geldige overgangen toe", () => {
    expect(canTransitionInvoice("DRAFT", "SENT")).toBe(true);
    expect(canTransitionInvoice("SENT", "PAID")).toBe(true);
    expect(canTransitionInvoice("SENT", "OVERDUE")).toBe(true);
    expect(canTransitionInvoice("OVERDUE", "PAID")).toBe(true);
  });

  it("weigert ongeldige en terminale overgangen", () => {
    expect(canTransitionInvoice("DRAFT", "PAID")).toBe(false);
    expect(canTransitionInvoice("PAID", "SENT")).toBe(false);
    expect(canTransitionInvoice("CANCELLED", "SENT")).toBe(false);
    expect(() => assertInvoiceTransition("PAID", "SENT")).toThrow(InvoiceTransitionError);
  });
});

describe("bedrag-berekening (centen)", () => {
  it("berekent regel- en factuurtotaal", () => {
    expect(lineAmountCents({ quantity: 3, unitCents: 8500 })).toBe(25500);
    expect(
      invoiceTotalCents([
        { quantity: 2, unitCents: 5000 },
        { quantity: 1, unitCents: 2500 },
      ]),
    ).toBe(12500);
    expect(invoiceTotalCents([])).toBe(0);
  });

  it("converteert euro's naar hele centen (afronding)", () => {
    expect(eurosToCents(85)).toBe(8500);
    expect(eurosToCents(85.5)).toBe(8550);
    expect(eurosToCents(0.1 + 0.2)).toBe(30); // floating point safe via round
  });
});

describe("isOverdue", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  it("alleen SENT met gepasseerde vervaldatum", () => {
    expect(isOverdue({ status: "SENT", dueAt: new Date("2026-05-01") }, now)).toBe(true);
    expect(isOverdue({ status: "SENT", dueAt: new Date("2026-07-01") }, now)).toBe(false);
    expect(isOverdue({ status: "SENT", dueAt: null }, now)).toBe(false);
    expect(isOverdue({ status: "PAID", dueAt: new Date("2026-05-01") }, now)).toBe(false);
  });
});

describe("formatInvoiceNumber", () => {
  it("pad sequentie naar 4 cijfers", () => {
    expect(formatInvoiceNumber(2026, 7)).toBe("2026-0007");
    expect(formatInvoiceNumber(2026, 1234)).toBe("2026-1234");
  });
});

describe("invoiceCentsWithinInt4", () => {
  it("MAX_INVOICE_CENTS is het int4-plafond", () => {
    expect(MAX_INVOICE_CENTS).toBe(2_147_483_647);
  });

  it("accepteert 0, een normaal bedrag en exact het plafond", () => {
    expect(invoiceCentsWithinInt4(0)).toBe(true);
    expect(invoiceCentsWithinInt4(123_45)).toBe(true);
    expect(invoiceCentsWithinInt4(MAX_INVOICE_CENTS)).toBe(true);
  });

  it("weigert een bedrag boven het plafond, negatief of niet-heel", () => {
    expect(invoiceCentsWithinInt4(MAX_INVOICE_CENTS + 1)).toBe(false);
    // De schema-toegestane maximale regel (100000 × 100_000_000 = 1e13) valt ruim buiten int4.
    expect(invoiceCentsWithinInt4(100_000 * 100_000_000)).toBe(false);
    expect(invoiceCentsWithinInt4(-1)).toBe(false);
    expect(invoiceCentsWithinInt4(1.5)).toBe(false);
  });
});
