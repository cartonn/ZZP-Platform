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

describe("aanmaning — wettelijke rente + incassokosten", () => {
  it("berekent en toont rente + incassokosten voor een verlopen factuur", () => {
    // € 3.500 hoofdsom, 16 dagen te laat
    const d = buildAanmaningData(BASE);
    expect(d.hasCharges).toBe(true);
    // 15% × 2.500 (375) + 10% × 1.000 (100) = € 475
    expect(d.collectionCostsFormatted).toContain("475");
    expect(d.interestFormatted).not.toBe("");
    expect(d.totalWithChargesFormatted).not.toBe(d.totalFormatted);
    expect(d.interestRatePctFormatted).toBe("8");
  });

  it("neemt de verzuim-alinea op in de brief bij een verlopen factuur", () => {
    const d = buildAanmaningData(BASE);
    const letter = buildAanmaningLetter(d);
    expect(letter).toContain("wettelijke handelsrente");
    expect(letter).toContain("incassokosten");
    expect(letter).toContain("totaal verschuldigde");
  });

  it("laat rente/incassokosten weg wanneer de factuur nog niet verlopen is", () => {
    const d = buildAanmaningData({ ...BASE, now: new Date("2026-04-10") });
    expect(d.hasCharges).toBe(false);
    const letter = buildAanmaningLetter(d);
    expect(letter).not.toContain("wettelijke handelsrente");
  });

  it("respecteert een afwijkend rentepercentage", () => {
    const d = buildAanmaningData({ ...BASE, interestRateBps: 1200 });
    expect(d.interestRatePctFormatted).toBe("12");
  });
});

// De brief volgt de aanmaningsladder (DUNNING_STAGES): REMINDER@0 → FIRST_NOTICE@14 →
// SECOND_NOTICE@30 → FINAL_NOTICE@45 dagen na de vervaldag. Due = 2026-04-15.
describe("aanmaning — stage-bewust (volgt DUNNING_STAGES)", () => {
  it("REMINDER (<14 dagen te laat): vriendelijke betalingsherinnering, GEEN kosten", () => {
    // 5 dagen te laat → REMINDER, ook al is de factuur technisch verlopen.
    const d = buildAanmaningData({ ...BASE, now: new Date("2026-04-20") });
    expect(d.level).toBe("REMINDER");
    expect(d.stageLabel).toBe("Betalingsherinnering");
    // Cruciale gedragsverandering: een eerste vriendelijke herinnering dreigt nog niet met kosten.
    expect(d.hasCharges).toBe(false);
    const letter = buildAanmaningLetter(d);
    expect(letter).toContain("Betreft: Betalingsherinnering");
    expect(letter).toContain("herinneren wij u vriendelijk");
    expect(letter).not.toContain("wettelijke handelsrente");
    expect(letter).not.toContain("in gebreke");
    expect(letter).not.toContain("ter incasso uit handen");
    // Dagen-te-laat blijft feitelijk vermeld.
    expect(letter).toContain("5 dagen");
  });

  it("FIRST_NOTICE (14–29 dagen): eerste aanmaning met kosten-alinea", () => {
    // BASE = 16 dagen te laat.
    const d = buildAanmaningData(BASE);
    expect(d.level).toBe("FIRST_NOTICE");
    expect(d.stageLabel).toBe("Eerste aanmaning");
    expect(d.hasCharges).toBe(true);
    const letter = buildAanmaningLetter(d);
    expect(letter).toContain("Betreft: Eerste aanmaning");
    expect(letter).toContain("Ondanks onze eerdere betalingsherinnering");
    expect(letter).toContain("wettelijke handelsrente");
    expect(letter).not.toContain("ter incasso uit handen");
  });

  it("SECOND_NOTICE (30–44 dagen): tweede aanmaning, sommatie", () => {
    // 31 dagen te laat.
    const d = buildAanmaningData({ ...BASE, now: new Date("2026-05-16") });
    expect(d.level).toBe("SECOND_NOTICE");
    expect(d.stageLabel).toBe("Tweede aanmaning");
    expect(d.hasCharges).toBe(true);
    const letter = buildAanmaningLetter(d);
    expect(letter).toContain("Betreft: Tweede aanmaning");
    expect(letter).toContain("meermaals verzocht");
    expect(letter).toContain("sommeren u");
    expect(letter).not.toContain("ter incasso uit handen");
  });

  it("FINAL_NOTICE (≥45 dagen): laatste aanmaning, ingebrekestelling + incasso-waarschuwing", () => {
    // 46 dagen te laat.
    const d = buildAanmaningData({ ...BASE, now: new Date("2026-05-31") });
    expect(d.level).toBe("FINAL_NOTICE");
    expect(d.stageLabel).toBe("Laatste aanmaning");
    expect(d.hasCharges).toBe(true);
    const letter = buildAanmaningLetter(d);
    expect(letter).toContain("Betreft: Laatste aanmaning");
    expect(letter).toContain("laatste aanmaning");
    expect(letter).toContain("formeel in gebreke");
    expect(letter).toContain("ter incasso uit handen");
  });

  it("niet verlopen factuur → REMINDER-niveau, geen kosten", () => {
    const d = buildAanmaningData({ ...BASE, now: new Date("2026-04-10") });
    expect(d.level).toBe("REMINDER");
    expect(d.hasCharges).toBe(false);
  });

  it("null dueAt → REMINDER-niveau (niets te manen), geen kosten", () => {
    const d = buildAanmaningData({ ...BASE, dueAt: null });
    expect(d.level).toBe("REMINDER");
    expect(d.stageLabel).toBe("Betalingsherinnering");
    expect(d.hasCharges).toBe(false);
  });
});
