import { describe, expect, it } from "vitest";
import {
  summarizeDebtors,
  shouldShowDebtorSummary,
  type DebtorInvoiceInput,
} from "@/lib/debtor-summary";

const NOW = new Date("2026-07-04T12:00:00Z");

function inv(overrides: Partial<DebtorInvoiceInput>): DebtorInvoiceInput {
  return {
    lifecycleStatus: "SUBMITTED",
    status: "DRAFT",
    totalCents: 10_000,
    issuedAt: new Date("2026-07-01T00:00:00Z"),
    dueAt: new Date("2026-07-31T00:00:00Z"),
    companyId: "c1",
    companyName: "Zorgcentrum Jansen",
    ...overrides,
  };
}

describe("summarizeDebtors", () => {
  it("groepeert openstaande facturen per opdrachtgever met totaal en aantal", () => {
    const summary = summarizeDebtors(
      [
        inv({ companyId: "c1", companyName: "Jansen", totalCents: 10_000 }),
        inv({ companyId: "c1", companyName: "Jansen", totalCents: 5_000 }),
        inv({ companyId: "c2", companyName: "De Vries", totalCents: 7_000 }),
      ],
      NOW,
    );
    expect(summary.debtors).toHaveLength(2);
    const jansen = summary.debtors.find((d) => d.companyId === "c1")!;
    expect(jansen.outstandingCents).toBe(15_000);
    expect(jansen.invoiceCount).toBe(2);
    expect(summary.totalOutstandingCents).toBe(22_000);
  });

  it("negeert betaalde/concept-facturen (niet openstaand)", () => {
    const summary = summarizeDebtors(
      [
        inv({ lifecycleStatus: "PAID", status: "PAID", totalCents: 99_000 }),
        inv({ lifecycleStatus: "DRAFT", status: "DRAFT", totalCents: 88_000 }),
        inv({ lifecycleStatus: "SUBMITTED", totalCents: 10_000 }),
      ],
      NOW,
    );
    expect(summary.totalOutstandingCents).toBe(10_000);
    expect(summary.debtors).toHaveLength(1);
  });

  it("negeert facturen zonder opdrachtgever (losstaand)", () => {
    const summary = summarizeDebtors(
      [inv({ companyId: null, companyName: null, totalCents: 12_000 })],
      NOW,
    );
    expect(summary.debtors).toHaveLength(0);
    expect(summary.totalOutstandingCents).toBe(0);
  });

  it("telt te-late facturen (dueAt < now) apart in overdueCents/overdueCount", () => {
    const summary = summarizeDebtors(
      [
        inv({ dueAt: new Date("2026-06-01T00:00:00Z"), totalCents: 20_000 }), // te laat
        inv({ dueAt: new Date("2026-08-01T00:00:00Z"), totalCents: 5_000 }), // op tijd
        inv({ dueAt: null, totalCents: 3_000 }), // geen vervaldatum → niet te laat
      ],
      NOW,
    );
    const d = summary.debtors[0]!;
    expect(d.overdueCents).toBe(20_000);
    expect(d.overdueCount).toBe(1);
    expect(d.outstandingCents).toBe(28_000);
    expect(summary.totalOverdueCents).toBe(20_000);
  });

  it("bepaalt de langst openstaande factuur (oudste issuedAt) en de ouderdom in dagen", () => {
    const summary = summarizeDebtors(
      [
        inv({ issuedAt: new Date("2026-07-01T00:00:00Z"), totalCents: 1_000 }),
        inv({ issuedAt: new Date("2026-06-04T12:00:00Z"), totalCents: 1_000 }),
      ],
      NOW,
    );
    const d = summary.debtors[0]!;
    expect(d.oldestIssuedAt).toEqual(new Date("2026-06-04T12:00:00Z"));
    expect(d.oldestDaysOutstanding).toBe(30);
  });

  it("houdt oldestDaysOutstanding op null wanneer geen enkele openstaande factuur een issuedAt heeft", () => {
    const summary = summarizeDebtors([inv({ issuedAt: null })], NOW);
    expect(summary.debtors[0]!.oldestIssuedAt).toBeNull();
    expect(summary.debtors[0]!.oldestDaysOutstanding).toBeNull();
  });

  it("sorteert op te-laat bedrag, dan openstaand bedrag, dan naam", () => {
    const summary = summarizeDebtors(
      [
        inv({ companyId: "a", companyName: "Alfa", dueAt: null, totalCents: 5_000 }),
        inv({
          companyId: "b",
          companyName: "Beta",
          dueAt: new Date("2026-06-01T00:00:00Z"),
          totalCents: 4_000,
        }),
        inv({ companyId: "c", companyName: "Gamma", dueAt: null, totalCents: 9_000 }),
      ],
      NOW,
    );
    // Beta heeft te-laat bedrag → eerst; daarna Gamma (9k) vóór Alfa (5k) op openstaand bedrag.
    expect(summary.debtors.map((d) => d.companyId)).toEqual(["b", "c", "a"]);
  });

  it("valt terug op een label bij een ontbrekende bedrijfsnaam", () => {
    const summary = summarizeDebtors([inv({ companyName: null })], NOW);
    expect(summary.debtors[0]!.companyName).toBe("Onbekende opdrachtgever");
  });

  it("accepteert een numerieke now", () => {
    const summary = summarizeDebtors(
      [inv({ dueAt: new Date("2026-06-01T00:00:00Z"), totalCents: 8_000 })],
      NOW.getTime(),
    );
    expect(summary.totalOverdueCents).toBe(8_000);
  });
});

describe("shouldShowDebtorSummary", () => {
  it("toont bij meerdere debiteuren", () => {
    const summary = summarizeDebtors(
      [inv({ companyId: "a", dueAt: null }), inv({ companyId: "b", dueAt: null })],
      NOW,
    );
    expect(shouldShowDebtorSummary(summary)).toBe(true);
  });

  it("toont bij één debiteur met een te-laat bedrag", () => {
    const summary = summarizeDebtors(
      [inv({ companyId: "a", dueAt: new Date("2026-06-01T00:00:00Z") })],
      NOW,
    );
    expect(shouldShowDebtorSummary(summary)).toBe(true);
  });

  it("verbergt bij één debiteur zonder te-laat bedrag (voegt niets toe aan het totaal)", () => {
    const summary = summarizeDebtors([inv({ companyId: "a", dueAt: null })], NOW);
    expect(shouldShowDebtorSummary(summary)).toBe(false);
  });

  it("verbergt bij geen enkele openstaande debiteur", () => {
    const summary = summarizeDebtors([inv({ lifecycleStatus: "PAID", status: "PAID" })], NOW);
    expect(shouldShowDebtorSummary(summary)).toBe(false);
  });
});
