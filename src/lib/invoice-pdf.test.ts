import { describe, expect, it } from "vitest";
import { buildInvoicePdf, invoicePaymentRows, type InvoicePdfData } from "@/lib/invoice-pdf";

const base: InvoicePdfData = {
  number: "2026-001",
  issuedAt: "2026-06-01",
  dueAt: "2026-07-01",
  fromName: "Jan de Vries",
  fromKvk: "12345678",
  fromBtw: "NL001234567B01",
  toName: "Acme BV",
  jobTitle: "Senior Developer",
  vatRegime: "STANDARD_HIGH",
  subtotalCents: 100000,
  vatCents: 21000,
  totalCents: 121000,
  lines: [
    { description: "Ontwikkeling week 1", quantity: 40, unitCents: 2500, amountCents: 100000 },
  ],
};

const pdfHeader = (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 5));

describe("buildInvoicePdf", () => {
  it("levert geldige PDF-bytes op", async () => {
    const bytes = await buildInvoicePdf(base);
    expect(pdfHeader(bytes)).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(800);
  });

  it("verwerkt tekens buiten WinAnsi zonder te crashen (sanitize)", async () => {
    const bytes = await buildInvoicePdf({
      ...base,
      fromName: "Jän 😀 北京 — Ünïcödé",
      toName: "Œœ ✓ €™",
      lines: [
        { description: "Emoji 🚀 en 漢字", quantity: 1, unitCents: 100000, amountCents: 100000 },
      ],
    });
    expect(pdfHeader(bytes)).toBe("%PDF-");
  });

  it("toont totalen ook zonder factuurregels (cascade-factuur)", async () => {
    const bytes = await buildInvoicePdf({
      ...base,
      vatRegime: "REVERSE_CHARGE",
      vatCents: 0,
      totalCents: 100000,
      lines: [],
    });
    expect(pdfHeader(bytes)).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(800);
  });

  it("blijft een geldige PDF met betaalgegevens (IBAN aanwezig)", async () => {
    const bytes = await buildInvoicePdf({ ...base, iban: "NL91ABNA0417164300" });
    expect(pdfHeader(bytes)).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(800);
  });
});

describe("invoicePaymentRows", () => {
  it("geeft null zonder IBAN (geen betaalinstructie op de factuur)", () => {
    expect(invoicePaymentRows(base)).toBeNull();
    expect(invoicePaymentRows({ ...base, iban: null })).toBeNull();
    expect(invoicePaymentRows({ ...base, iban: "   " })).toBeNull();
  });

  it("spiegelt de PaymentDetailsCard: IBAN (opgemaakt), t.n.v., betaalkenmerk, bedrag", () => {
    const rows = invoicePaymentRows({ ...base, iban: "nl91abna0417164300" });
    expect(rows).toEqual([
      { label: "IBAN", value: "NL91 ABNA 0417 1643 00" },
      { label: "T.n.v.", value: "Jan de Vries" },
      { label: "Betaalkenmerk", value: "Factuur 2026-001" },
      { label: "Bedrag", value: "EUR 1.210,00" },
      { label: "Uiterlijk betalen", value: "2026-07-01" },
    ]);
  });

  it("laat 'Uiterlijk betalen' weg als er geen vervaldatum is", () => {
    const rows = invoicePaymentRows({ ...base, iban: "NL91ABNA0417164300", dueAt: "" });
    expect(rows?.some((r) => r.label === "Uiterlijk betalen")).toBe(false);
  });

  it("gebruikt het totaal incl. btw als bedrag — ook bij verlegde btw (btw = 0)", () => {
    const rows = invoicePaymentRows({
      ...base,
      iban: "NL91ABNA0417164300",
      vatRegime: "REVERSE_CHARGE",
      vatCents: 0,
      totalCents: 100000,
    });
    expect(rows?.find((r) => r.label === "Bedrag")?.value).toBe("EUR 1.000,00");
  });
});
