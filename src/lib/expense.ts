/**
 * Zakelijke uitgaven (aftrekbare kosten) van de ZZP'er — pure domeinlogica.
 *
 * Geen I/O, geen imports uit prisma/next. Alle bedragen in centen (integers). Een uitgave voedt het
 * grootboek als KOSTEN (netto) + BTW_VOORBELASTING (btw), gebalanceerd tegen de registratie-
 * tegenrekening BETAALD — precies zoals de cascade-boekingen in `administration/ledger.ts`, maar dan
 * voor een zelf-geboekte kostenpost. Zo tellen winst, IB-schatting en belastingreservering met de
 * werkelijke kosten i.p.v. bruto-omzet.
 */

import { z } from "zod";
import { type Posting, type LedgerAccount } from "@/lib/administration/ledger";

/** Aftrekbare-kosten-categorieën (string-enum, portable — geen native db-enum). */
export const EXPENSE_CATEGORIES = [
  "REISKOSTEN",
  "MATERIAAL",
  "GEREEDSCHAP",
  "OPLEIDING",
  "VERZEKERING",
  "SOFTWARE",
  "KANTOOR",
  "TELEFOON_INTERNET",
  "MARKETING",
  "ADMINISTRATIE",
  "OVERIG",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Nederlandse labels per categorie (UI). */
export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  REISKOSTEN: "Reiskosten",
  MATERIAAL: "Materiaal",
  GEREEDSCHAP: "Gereedschap",
  OPLEIDING: "Opleiding & studie",
  VERZEKERING: "Verzekering",
  SOFTWARE: "Software & abonnementen",
  KANTOOR: "Kantoor & werkruimte",
  TELEFOON_INTERNET: "Telefoon & internet",
  MARKETING: "Marketing & acquisitie",
  ADMINISTRATIE: "Administratie & advies",
  OVERIG: "Overig",
};

export const EXPENSE_DESCRIPTION_MAX = 200;

/** Plafond per bedrag (int4-veilig, ruim boven elke realistische enkele kostenpost). */
export const EXPENSE_MAX_CENTS = 2_000_000_000; // ≈ € 20 miljoen

const cents = z
  .number({ invalid_type_error: "Vul een geldig bedrag in." })
  .finite("Vul een geldig bedrag in.")
  .int("Bedrag in hele centen.")
  .min(0, "Bedrag mag niet negatief zijn.")
  .max(EXPENSE_MAX_CENTS, "Bedrag is te hoog.");

/**
 * Server-side validatieschema voor een uitgave. `occurredAt` is een echte datum; toekomstige data
 * en de nul-uitgave worden geweigerd (een uitgave van € 0 heeft geen administratieve waarde).
 */
export const expenseSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, "Omschrijving is verplicht.")
      .max(EXPENSE_DESCRIPTION_MAX, `Maximaal ${EXPENSE_DESCRIPTION_MAX} tekens.`),
    category: z.enum(EXPENSE_CATEGORIES),
    netCents: cents,
    vatCents: cents,
    occurredAt: z.date({ invalid_type_error: "Kies een geldige datum." }),
  })
  .refine((v) => v.netCents + v.vatCents > 0, {
    message: "Vul een bedrag groter dan € 0 in.",
    path: ["netCents"],
  });

export type ExpenseInput = z.infer<typeof expenseSchema>;

/**
 * Parse een NL-euro-invoer ("1.234,56", "1234.56", "50") naar hele centen. Duizendtal-punten en
 * spaties worden genegeerd; zowel komma als punt gelden als decimaalteken (maximaal 2 decimalen).
 * Leeg → 0. Ongeldige invoer → null zodat de caller een nette fout kan tonen.
 */
export function parseEurosToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  // Verwijder duizendtal-scheiders (spaties) en normaliseer de komma naar een punt.
  let normalized = trimmed.replace(/\s/g, "");
  // Als er zowel punten als een komma zijn, zijn de punten duizendtallen → weghalen.
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "");
  }
  normalized = normalized.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const euros = Number.parseFloat(normalized);
  if (!Number.isFinite(euros) || euros < 0) return null;
  return Math.round(euros * 100);
}

/**
 * Grootboekregels voor één uitgave, vanuit het perspectief van de ZZP'er (FREELANCER). Debet KOSTEN
 * (netto) + debet BTW_VOORBELASTING (btw) tegenover credit BETAALD (totaal) — de boeking sluit
 * (debet = credit). De btw-regel wordt alleen toegevoegd als er btw is. Bedragen ≤ 0 worden
 * overgeslagen zodat er geen lege of negatieve regels ontstaan.
 */
export function planExpensePostings(input: { netCents: number; vatCents: number }): Posting[] {
  const net = Math.max(0, Math.round(input.netCents));
  const vat = Math.max(0, Math.round(input.vatCents));
  const total = net + vat;
  const postings: Posting[] = [];
  const debit = (account: LedgerAccount, amount: number): Posting => ({
    party: "FREELANCER",
    account,
    debitCents: amount,
    creditCents: 0,
  });
  if (net > 0) postings.push(debit("KOSTEN", net));
  if (vat > 0) postings.push(debit("BTW_VOORBELASTING", vat));
  if (total > 0) {
    postings.push({ party: "FREELANCER", account: "BETAALD", debitCents: 0, creditCents: total });
  }
  return postings;
}

export interface ExpenseLike {
  category: string;
  netCents: number;
  vatCents: number;
  occurredAt: Date;
}

export interface ExpenseSummary {
  count: number;
  netCents: number;
  vatCents: number;
  /** netto + btw. */
  totalCents: number;
  /** Aftrekbare voorbelasting (= vatCents), apart benoemd voor de UI. */
  deductibleVatCents: number;
  /** Nettobedrag per categorie, aflopend gesorteerd; alleen categorieën met > 0. */
  byCategory: { category: ExpenseCategory; netCents: number }[];
}

function sanitize(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/** Vat een lijst uitgaven samen (optioneel gefilterd op kalenderjaar). */
export function summarizeExpenses(
  expenses: readonly ExpenseLike[],
  opts: { year?: number } = {},
): ExpenseSummary {
  const inScope =
    opts.year === undefined
      ? expenses
      : expenses.filter((e) => e.occurredAt.getUTCFullYear() === opts.year);

  const perCategory = new Map<ExpenseCategory, number>();
  let netCents = 0;
  let vatCents = 0;
  for (const e of inScope) {
    const net = sanitize(e.netCents);
    const vat = sanitize(e.vatCents);
    netCents += net;
    vatCents += vat;
    const category = (EXPENSE_CATEGORIES as readonly string[]).includes(e.category)
      ? (e.category as ExpenseCategory)
      : "OVERIG";
    perCategory.set(category, (perCategory.get(category) ?? 0) + net);
  }

  const byCategory = [...perCategory.entries()]
    .filter(([, n]) => n > 0)
    .map(([category, n]) => ({ category, netCents: n }))
    .sort((a, b) => b.netCents - a.netCents || a.category.localeCompare(b.category));

  return {
    count: inScope.length,
    netCents,
    vatCents,
    totalCents: netCents + vatCents,
    deductibleVatCents: vatCents,
    byCategory,
  };
}
