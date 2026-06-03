import { describe, expect, it } from "vitest";
import { buildInvoicePdf, type InvoicePdfData } from "@/lib/invoice-pdf";

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
});
