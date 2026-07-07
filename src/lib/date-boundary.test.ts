import { describe, expect, it } from "vitest";
import { summarizeDebtors, type DebtorInvoiceInput } from "@/lib/debtor-summary";
import { summarizeCreditors } from "@/lib/creditor-summary";
import { type ObligationItem, type ObligationStage } from "@/lib/payment-obligations";
import { daysSince, daysUntil, isPastDue, startOfDayUTC } from "@/lib/date-boundary";

describe("date-boundary helpers", () => {
  it("startOfDayUTC snapt naar UTC-middernacht en accepteert Date én ms", () => {
    const noon = new Date("2026-07-04T12:34:56.000Z");
    const midnight = Date.UTC(2026, 6, 4);
    expect(startOfDayUTC(noon)).toBe(midnight);
    expect(startOfDayUTC(noon.getTime())).toBe(midnight);
  });

  it("isPastDue is false op de vervaldag zelf, true de dag ervoor, false voor null", () => {
    const boundary = startOfDayUTC(new Date("2026-07-04T09:00:00.000Z"));
    expect(isPastDue(new Date("2026-07-04T00:00:00.000Z"), boundary)).toBe(false); // vervaldag
    expect(isPastDue(new Date("2026-07-03T23:59:59.000Z"), boundary)).toBe(true); // ervoor
    expect(isPastDue(null, boundary)).toBe(false);
  });

  it("daysUntil is 0 op de vervaldag en negatief erna; daysSince is >= 0", () => {
    const boundary = startOfDayUTC(new Date("2026-07-04T00:00:00.000Z"));
    expect(daysUntil(new Date("2026-07-04T00:00:00.000Z"), boundary)).toBe(0);
    expect(daysUntil(new Date("2026-07-01T00:00:00.000Z"), boundary)).toBe(-3);
    expect(daysSince(new Date("2026-06-04T00:00:00.000Z"), boundary)).toBe(30);
    expect(daysSince(new Date("2026-07-10T00:00:00.000Z"), boundary)).toBe(0); // toekomst → clamp 0
  });
});

// Spiegel-borging: dezelfde factuur mag aan de debiteuren- (ZZP'er) en crediteuren-kant
// (opdrachtgever) op de vervaldag geen uiteenlopend "te laat / open"-oordeel geven.
describe("debtor/creditor mirror: gelijk oordeel op de vervaldag", () => {
  const DUE = new Date("2026-07-04T00:00:00.000Z");
  const GROSS = 12_100;

  function debtorInvoice(dueAt: Date): DebtorInvoiceInput {
    return {
      lifecycleStatus: "APPROVED",
      status: "SENT",
      totalCents: GROSS,
      issuedAt: new Date("2026-06-20T00:00:00.000Z"),
      dueAt,
      companyId: "acme",
      companyName: "Acme Zorg",
    };
  }

  function creditorItem(dueDate: Date): ObligationItem {
    return {
      invoiceId: "inv-1",
      stage: "APPROVED" as ObligationStage,
      netCents: 10_000,
      vatCents: 2_100,
      grossCents: GROSS,
      dueDate,
      counterpartyId: "sanne",
      counterpartyName: "Sanne de Vries",
      number: "2026-0001",
      jobTitle: "Nachtdienst VVT",
    };
  }

  it("op de vervaldag: beide zeggen 'nog niet te laat' (0 te laat)", () => {
    const now = new Date("2026-07-04T12:00:00.000Z");
    const debtor = summarizeDebtors([debtorInvoice(DUE)], now);
    const creditor = summarizeCreditors([creditorItem(DUE)], now);
    expect(debtor.totalOverdueCents).toBe(0);
    expect(creditor.totalOverdueCents).toBe(0);
    expect(debtor.totalOverdueCents).toBe(creditor.totalOverdueCents);
  });

  it("de dag ná de vervaldag: beide zeggen 'te laat' voor het volle bedrag", () => {
    const now = new Date("2026-07-05T12:00:00.000Z");
    const debtor = summarizeDebtors([debtorInvoice(DUE)], now);
    const creditor = summarizeCreditors([creditorItem(DUE)], now);
    expect(debtor.totalOverdueCents).toBe(GROSS);
    expect(creditor.totalOverdueCents).toBe(GROSS);
    expect(debtor.totalOverdueCents).toBe(creditor.totalOverdueCents);
  });
});
