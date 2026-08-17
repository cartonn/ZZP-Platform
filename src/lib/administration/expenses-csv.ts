// CSV-export van de vastgelegde zakelijke uitgaven van de ZZP'er (het "Uitgaven"-paneel op de
// administratie-hub). Waar de grootboek-CSV (`administrationCsv`) alleen rekening/debet/credit draagt
// — en dus de omschrijving én categorie van een kostenpost laat vallen — levert deze export de
// gecategoriseerde kostenlijst die een boekhouder nodig heeft. Facturen, prognose, grootboek en btw
// hadden al een CSV-export; de uitgaven waren de laatste geld-oppervlakte zonder. Pure leaf (geen
// DB/IO): de route haalt de owner-gescopet rijen op, deze module bouwt puur de CSV-tekst. Server-side
// is de waarheid (CLAUDE.md regel 1). Formule-injectie (CWE-1236) in de vrije omschrijving wordt
// afgevangen door `toCsv`/`escapeCsvField`.

import { toCsv } from "@/lib/csv";
import { centsToEuroPlain } from "@/lib/administration/csv";
import { EXPENSE_CATEGORY_LABEL, type ExpenseCategory } from "@/lib/expense";

/** Kolomkoppen (lowercase Nederlands — parity met de grootboek-/btw-export). Eén bron voor de tests. */
export const EXPENSES_EXPORT_HEADERS = [
  "datum",
  "omschrijving",
  "categorie",
  "netto",
  "btw",
] as const;

/** Minimale rijvorm die de export nodig heeft (owner-gescopet aangeleverd door de route). */
export interface ExpenseCsvRow {
  occurredAt: Date;
  description: string;
  category: string;
  netCents: number;
  vatCents: number;
}

/** Categorie-string → NL-label (schermpariteit); onbekende waarden vallen terug op "Overig". */
function categoryLabel(category: string): string {
  return EXPENSE_CATEGORY_LABEL[category as ExpenseCategory] ?? EXPENSE_CATEGORY_LABEL.OVERIG;
}

/**
 * Bouwt de CSV-tekst uit de uitgaven-rijen. Oplopend op datum gesorteerd (grootboek-conventie voor de
 * boekhouder), zodat de export deterministisch is los van de aanlever-volgorde. Datum als ISO
 * `jjjj-mm-dd` (onveranderlijk sorteerbaar, parity met `administrationCsv`); geld in euro's met
 * punt-decimaal via de canonieke `centsToEuroPlain`.
 */
export function expensesCsv(rows: readonly ExpenseCsvRow[]): string {
  const body = [...rows]
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
    .map((r) => [
      r.occurredAt.toISOString().slice(0, 10),
      r.description,
      categoryLabel(r.category),
      centsToEuroPlain(r.netCents),
      centsToEuroPlain(r.vatCents),
    ]);
  return toCsv([EXPENSES_EXPORT_HEADERS, ...body]);
}
