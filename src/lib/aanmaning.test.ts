import { describe, it, expect } from "vitest";
import { buildAanmaningData, buildAanmaningLetter } from "./aanmaning";

const BASE = {
  freelancerName: "Sanne de Vries",
  companyName: "Acme BV",
  invoiceNumber: "2026-0001",
  jobTitle: "Verpleegkundige zorg",
  issuedAt: new Date("2026-04-01"),
  dueAt: new Date("2026-04-15"),
  totalCents: 350000, // €3500,00
  now: new Date("2026-05-01"),
};

describe("buildAanmaningData", () => {
  it("calculates daysPastDue correctly", () => {
    const d = buildAanmaningData(BASE);
    // 2026-05-01 minus 2026-04-15 = 16 days
    expect(d.daysPastDue).toBe(16);
  });

  it("returns 0 daysPastDue when not yet overdue", () => {
    const d = buildAanmaningData({
      ...BASE,
      now: new Date("2026-04-10"),
      dueAt: new Date("2026-04-15"),
    });
    expect(d.daysPastDue).toBe(0);
  });

  it("handles null dueAt gracefully", () => {
    const d = buildAanmaningData({ ...BASE, dueAt: null });
    expect(d.daysPastDue).toBe(0);
    expect(d.dueAtFormatted).toBe("—");
  });

  it("handles null issuedAt gracefully", () => {
    const d = buildAanmaningData({ ...BASE, issuedAt: null });
    expect(d.issuedAtFormatted).toBe("—");
  });

  it("formats totalFormatted as euro", () => {
    const d = buildAanmaningData(BASE);
    expect(d.totalFormatted).toContain("3.500");
  });

  it("sets newDeadline to 14 days after now", () => {
    const d = buildAanmaningData(BASE);
    // now is 2026-05-01; +14 = 2026-05-15
    expect(d.newDeadlineFormatted).toContain("15");
    expect(d.newDeadlineFormatted).toContain("2026");
  });

  it("passes through names and invoice number", () => {
    const d = buildAanmaningData(BASE);
    expect(d.freelancerName).toBe("Sanne de Vries");
    expect(d.companyName).toBe("Acme BV");
    expect(d.invoiceNumber).toBe("2026-0001");
  });
});

describe("buildAanmaningLetter", () => {
  it("includes freelancer name and company name", () => {
    const d = buildAanmaningData(BASE);
    const letter = buildAanmaningLetter(d);
    expect(letter).toContain("Sanne de Vries");
    expect(letter).toContain("Acme BV");
  });

  it("includes invoice number", () => {
    const d = buildAanmaningData(BASE);
    const letter = buildAanmaningLetter(d);
    expect(letter).toContain("2026-0001");
  });

  it("includes total amount", () => {
    const d = buildAanmaningData(BASE);
    const letter = buildAanmaningLetter(d);
    expect(letter).toContain("3.500");
  });

  it("includes job title", () => {
    const d = buildAanmaningData(BASE);
    const letter = buildAanmaningLetter(d);
    expect(letter).toContain("Verpleegkundige zorg");
  });

  it("includes daysPastDue in letter text", () => {
    const d = buildAanmaningData(BASE);
    const letter = buildAanmaningLetter(d);
    expect(letter).toContain("16 dagen");
  });

  it("uses singular dag for 1 day", () => {
    const d = buildAanmaningData({
      ...BASE,
      now: new Date("2026-04-16"),
      dueAt: new Date("2026-04-15"),
    });
    const letter = buildAanmaningLetter(d);
    expect(letter).toContain("1 dag");
    expect(letter).not.toContain("1 dagen");
  });

  it("contains IBAN placeholder when no iban is provided", () => {
    const d = buildAanmaningData(BASE);
    const letter = buildAanmaningLetter(d);
    expect(letter).toContain("[uw IBAN]");
  });

  it("prefills the formatted IBAN when provided", () => {
    const d = buildAanmaningData({ ...BASE, iban: "NL91ABNA0417164300" });
    const letter = buildAanmaningLetter(d);
    expect(d.ibanFormatted).toBe("NL91 ABNA 0417 1643 00");
    expect(letter).toContain("NL91 ABNA 0417 1643 00");
    expect(letter).not.toContain("[uw IBAN]");
  });

  it("falls back to the placeholder for an empty iban string", () => {
    const d = buildAanmaningData({ ...BASE, iban: "" });
    expect(d.ibanFormatted).toBe("[uw IBAN]");
  });
});
