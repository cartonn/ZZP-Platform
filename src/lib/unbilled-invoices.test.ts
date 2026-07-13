import { describe, expect, it } from "vitest";
import {
  summarizeUnbilledInvoices,
  UNBILLED_AGING_DAYS,
  type UnbilledInvoiceRow,
} from "@/lib/unbilled-invoices";

const NOW = Date.parse("2026-07-13T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000);

function row(overrides: Partial<UnbilledInvoiceRow> = {}): UnbilledInvoiceRow {
  return {
    lifecycleStatus: "DRAFT",
    status: "DRAFT",
    totalCents: 10_000,
    createdAt: daysAgo(1),
    ...overrides,
  };
}

describe("summarizeUnbilledInvoices", () => {
  it("geeft null zonder concept-facturen", () => {
    expect(summarizeUnbilledInvoices([], NOW)).toBeNull();
  });

  it("telt cascade-DRAFT-facturen als concept en sommeert het brutobedrag", () => {
    const result = summarizeUnbilledInvoices(
      [
        row({ totalCents: 12_100, createdAt: daysAgo(2) }),
        row({ totalCents: 7_900, createdAt: daysAgo(1) }),
      ],
      NOW,
    );
    expect(result).not.toBeNull();
    expect(result!.count).toBe(2);
    expect(result!.grossCents).toBe(20_000);
  });

  it("telt ook losse legacy-DRAFT-facturen (nog niet verzonden) mee", () => {
    const result = summarizeUnbilledInvoices(
      [row({ lifecycleStatus: null, status: "DRAFT", totalCents: 5_000 })],
      NOW,
    );
    expect(result!.count).toBe(1);
    expect(result!.grossCents).toBe(5_000);
  });

  it("sluit openstaande cascade-facturen (SUBMITTED/APPROVED/OVERDUE) uit — die zijn al ingediend", () => {
    const result = summarizeUnbilledInvoices(
      [
        row({ lifecycleStatus: "SUBMITTED" }),
        row({ lifecycleStatus: "APPROVED" }),
        row({ lifecycleStatus: "OVERDUE" }),
        row({ lifecycleStatus: "PAID", status: "PAID" }),
      ],
      NOW,
    );
    expect(result).toBeNull();
  });

  it("neemt de oudste concept-factuur voor de ouderdom en markeert aging vanaf de drempel", () => {
    const result = summarizeUnbilledInvoices(
      [
        row({ createdAt: daysAgo(3) }),
        row({ createdAt: daysAgo(UNBILLED_AGING_DAYS + 2) }),
        row({ createdAt: daysAgo(1) }),
      ],
      NOW,
    );
    expect(result!.oldestAgeDays).toBe(UNBILLED_AGING_DAYS + 2);
    expect(result!.aging).toBe(true);
  });

  it("markeert niet-aging wanneer de oudste onder de drempel valt", () => {
    const result = summarizeUnbilledInvoices([row({ createdAt: daysAgo(2) })], NOW);
    expect(result!.aging).toBe(false);
    expect(result!.oldestAgeDays).toBe(2);
  });

  it("klemt de ouderdom nooit onder nul bij een toekomstige createdAt (kloksmear)", () => {
    const result = summarizeUnbilledInvoices([row({ createdAt: new Date(NOW + 3_600_000) })], NOW);
    expect(result!.oldestAgeDays).toBe(0);
    expect(result!.aging).toBe(false);
  });
});
