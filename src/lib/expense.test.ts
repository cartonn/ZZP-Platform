import { describe, it, expect } from "vitest";
import {
  expenseSchema,
  planExpensePostings,
  summarizeExpenses,
  parseEurosToCents,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_MAX_CENTS,
  EXPENSE_DESCRIPTION_MAX,
} from "./expense";

describe("EXPENSE_CATEGORY_LABEL", () => {
  it("heeft een NL label voor elke categorie", () => {
    for (const c of EXPENSE_CATEGORIES) {
      expect(EXPENSE_CATEGORY_LABEL[c]).toBeTruthy();
    }
  });
});

describe("parseEurosToCents", () => {
  it("parset NL-komma naar centen", () => {
    expect(parseEurosToCents("125,50")).toBe(12550);
  });
  it("parset punt-decimaal", () => {
    expect(parseEurosToCents("125.5")).toBe(12550);
  });
  it("negeert duizendtal-punten bij een komma-decimaal", () => {
    expect(parseEurosToCents("1.234,56")).toBe(123456);
  });
  it("negeert spaties", () => {
    expect(parseEurosToCents(" 1 000,00 ")).toBe(100000);
  });
  it("leeg → 0", () => {
    expect(parseEurosToCents("")).toBe(0);
    expect(parseEurosToCents("   ")).toBe(0);
  });
  it("heel getal zonder decimalen", () => {
    expect(parseEurosToCents("50")).toBe(5000);
  });
  it("rondt af op hele centen", () => {
    expect(parseEurosToCents("0,015")).toBe(null); // >2 decimalen → ongeldig
    expect(parseEurosToCents("0,99")).toBe(99);
  });
  it("weigert onzin en negatief", () => {
    expect(parseEurosToCents("abc")).toBeNull();
    expect(parseEurosToCents("-5")).toBeNull();
    expect(parseEurosToCents("1,2,3")).toBeNull();
  });
});

describe("expenseSchema", () => {
  const base = {
    description: "Treinkaartje",
    category: "REISKOSTEN" as const,
    netCents: 2500,
    vatCents: 525,
    occurredAt: new Date("2026-03-10T00:00:00Z"),
  };

  it("accepteert een geldige uitgave", () => {
    expect(expenseSchema.safeParse(base).success).toBe(true);
  });

  it("weigert een lege omschrijving", () => {
    expect(expenseSchema.safeParse({ ...base, description: "  " }).success).toBe(false);
  });

  it("weigert een te lange omschrijving", () => {
    const long = "x".repeat(EXPENSE_DESCRIPTION_MAX + 1);
    expect(expenseSchema.safeParse({ ...base, description: long }).success).toBe(false);
  });

  it("weigert een onbekende categorie", () => {
    expect(expenseSchema.safeParse({ ...base, category: "VAKANTIE" }).success).toBe(false);
  });

  it("weigert een negatief bedrag", () => {
    expect(expenseSchema.safeParse({ ...base, netCents: -1 }).success).toBe(false);
  });

  it("weigert een bedrag boven het plafond", () => {
    expect(expenseSchema.safeParse({ ...base, netCents: EXPENSE_MAX_CENTS + 1 }).success).toBe(
      false,
    );
  });

  it("weigert een nul-uitgave (net + btw = 0)", () => {
    const res = expenseSchema.safeParse({ ...base, netCents: 0, vatCents: 0 });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.issues[0]?.path).toContain("netCents");
  });

  it("accepteert netto 0 met alleen btw", () => {
    expect(expenseSchema.safeParse({ ...base, netCents: 0, vatCents: 100 }).success).toBe(true);
  });
});

describe("planExpensePostings", () => {
  it("boekt KOSTEN + BTW_VOORBELASTING tegen BETAALD en balanceert", () => {
    const postings = planExpensePostings({ netCents: 2500, vatCents: 525 });
    const kosten = postings.find((p) => p.account === "KOSTEN");
    const btw = postings.find((p) => p.account === "BTW_VOORBELASTING");
    const betaald = postings.find((p) => p.account === "BETAALD");
    expect(kosten).toMatchObject({ party: "FREELANCER", debitCents: 2500, creditCents: 0 });
    expect(btw).toMatchObject({ party: "FREELANCER", debitCents: 525, creditCents: 0 });
    expect(betaald).toMatchObject({ party: "FREELANCER", debitCents: 0, creditCents: 3025 });

    const debits = postings.reduce((s, p) => s + p.debitCents, 0);
    const credits = postings.reduce((s, p) => s + p.creditCents, 0);
    expect(debits).toBe(credits);
  });

  it("laat de btw-regel weg zonder btw", () => {
    const postings = planExpensePostings({ netCents: 1000, vatCents: 0 });
    expect(postings.some((p) => p.account === "BTW_VOORBELASTING")).toBe(false);
    const debits = postings.reduce((s, p) => s + p.debitCents, 0);
    const credits = postings.reduce((s, p) => s + p.creditCents, 0);
    expect(debits).toBe(credits);
  });

  it("levert geen regels bij een leeg bedrag", () => {
    expect(planExpensePostings({ netCents: 0, vatCents: 0 })).toEqual([]);
  });

  it("negeert negatieve invoer (clamp naar 0)", () => {
    expect(planExpensePostings({ netCents: -100, vatCents: -5 })).toEqual([]);
  });
});

describe("summarizeExpenses", () => {
  const expenses = [
    { category: "REISKOSTEN", netCents: 2500, vatCents: 525, occurredAt: new Date("2026-01-05") },
    { category: "SOFTWARE", netCents: 1000, vatCents: 210, occurredAt: new Date("2026-02-01") },
    { category: "REISKOSTEN", netCents: 500, vatCents: 105, occurredAt: new Date("2026-02-10") },
    { category: "OVERIG", netCents: 9999, vatCents: 0, occurredAt: new Date("2025-12-31") },
  ];

  it("telt netto/btw/totaal en aantal binnen het jaar", () => {
    const s = summarizeExpenses(expenses, { year: 2026 });
    expect(s.count).toBe(3);
    expect(s.netCents).toBe(4000);
    expect(s.vatCents).toBe(840);
    expect(s.deductibleVatCents).toBe(840);
    expect(s.totalCents).toBe(4840);
  });

  it("groepeert per categorie aflopend op nettobedrag", () => {
    const s = summarizeExpenses(expenses, { year: 2026 });
    expect(s.byCategory[0]).toEqual({ category: "REISKOSTEN", netCents: 3000 });
    expect(s.byCategory[1]).toEqual({ category: "SOFTWARE", netCents: 1000 });
  });

  it("zonder jaar-filter telt alles", () => {
    const s = summarizeExpenses(expenses);
    expect(s.count).toBe(4);
    expect(s.netCents).toBe(13999);
  });

  it("mapt een onbekende categorie naar OVERIG", () => {
    const s = summarizeExpenses(
      [{ category: "GEKKIGHEID", netCents: 100, vatCents: 0, occurredAt: new Date("2026-05-01") }],
      { year: 2026 },
    );
    expect(s.byCategory[0]).toEqual({ category: "OVERIG", netCents: 100 });
  });

  it("negeert negatieve/niet-eindige bedragen", () => {
    const s = summarizeExpenses(
      [
        { category: "OVERIG", netCents: -50, vatCents: 0, occurredAt: new Date("2026-05-01") },
        { category: "OVERIG", netCents: NaN, vatCents: 10, occurredAt: new Date("2026-05-01") },
      ],
      { year: 2026 },
    );
    expect(s.netCents).toBe(0);
    expect(s.vatCents).toBe(10);
    expect(s.byCategory).toEqual([]);
  });

  it("lege lijst → nul-samenvatting", () => {
    const s = summarizeExpenses([], { year: 2026 });
    expect(s).toMatchObject({ count: 0, netCents: 0, vatCents: 0, totalCents: 0, byCategory: [] });
  });
});
