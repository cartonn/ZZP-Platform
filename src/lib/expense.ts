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
import { fiscalYearOf } from "@/lib/administration/fiscal-calendar";
import { type Posting, type LedgerAccount } from "@/lib/administration/ledger";
import { MILEAGE_MAX_KM, mileageExpenseNetCents } from "@/lib/expense-mileage";

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
    // Optionele rittenregistratie: gereden zakelijke kilometers bij een reiskosten-uitgave. Alleen
    // een positief geheel getal binnen de grens; null/afwezig = geen km vastgelegd.
    kilometers: z
      .number()
      .int("Kilometers in hele getallen.")
      .positive("Aantal kilometers moet groter dan 0 zijn.")
      .max(MILEAGE_MAX_KM, "Aantal kilometers is te hoog.")
      .nullish(),
  })
  // Wederzijds uitsluiten: bij een reiskosten-rit met vastgelegde km ís de vaste kilometervergoeding
  // (€ 0,23/km, 0% btw) de aftrekpost — die vervangt de werkelijke autokosten, ze stapelen niet. Zo
  // kan een handmatig ingevuld netto/btw nooit náást de km-aftrek blijven staan en de rittenregistratie
  // (`summarizeMileage`, canoniek uit km afgeleid) tegenspreken; het geboekte bedrag en de km-aftrek
  // lopen per constructie samen. Dit hoort in het schema (de bron van waarheid), niet alleen bij één
  // call site — zo normaliseert elk pad (formulier, toekomstige import/API) dezelfde uitgave. De
  // transform staat vóór de "> € 0"-refine, zodat een km-rit met een leeg nettoveld het afgeleide
  // bedrag krijgt en de refine haalt.
  .transform((v) =>
    v.category === "REISKOSTEN" && v.kilometers != null
      ? { ...v, netCents: mileageExpenseNetCents(v.kilometers), vatCents: 0 }
      : v,
  )
  .refine((v) => v.netCents + v.vatCents > 0, {
    message: "Vul een bedrag groter dan € 0 in.",
    path: ["netCents"],
  })
  // Toekomstige uitgaven horen niet in de administratie: een kostenpost is pas een feit als hij is
  // gemaakt. Deze check hoort in het schema (de bron van waarheid), niet alleen bij één call site —
  // zo kan geen enkel toekomstig call-punt (bulk-import, admin-correctie, API) hem overslaan.
  .refine((v) => v.occurredAt.getTime() <= Date.now(), {
    message: "De datum ligt in de toekomst.",
    path: ["occurredAt"],
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
 * Standaard Nederlandse btw-tarieven voor de uitgave-invoer (voorbelasting), in basispunten zodat
 * alles integer blijft rekenen. `custom` (handmatig) staat de ZZP'er toe het btw-deel zelf te typen
 * — bv. een bon met gemengde tarieven of buitenlandse btw. Sluit aan op `VAT_RATE_BPS` (config).
 */
export const EXPENSE_VAT_RATES = [
  { key: "21", bps: 2100, label: "21%" },
  { key: "9", bps: 900, label: "9%" },
  { key: "0", bps: 0, label: "0% / vrijgesteld" },
] as const;
export type ExpenseVatRateKey = (typeof EXPENSE_VAT_RATES)[number]["key"] | "custom";

/**
 * Btw-bedrag (voorbelasting) in centen bij een nettobedrag en een tarief in basispunten.
 * Deterministisch afgerond (`Math.round`, spiegelt `administration/vat.ts`). Niet-eindige of
 * niet-positieve invoer → 0, zodat een leeg of ongeldig nettobedrag nooit een btw-bedrag suggereert.
 */
export function vatCentsForRate(netCents: number, bps: number): number {
  if (!Number.isFinite(netCents) || netCents <= 0) return 0;
  if (!Number.isFinite(bps) || bps <= 0) return 0;
  return Math.round((netCents * bps) / 10000);
}

/**
 * Formatteert een centenbedrag als euro-invoerwaarde met NL-komma-decimaal (bv. 2100 → "21,00").
 * Nul of ongeldig → "" (leeg veld) i.p.v. "0,00", zodat de UI geen valse nul toont vóór invoer.
 */
export function centsToEuroInput(cents: number): string {
  if (!Number.isFinite(cents) || cents <= 0) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
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
      : expenses.filter((e) => fiscalYearOf(e.occurredAt) === opts.year);

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

/** Nettobedrag per categorie met het aandeel van het netto kostentotaal, aflopend gesorteerd. */
export interface ExpenseCategoryShare {
  category: ExpenseCategory;
  netCents: number;
  /** Aandeel van het netto kostentotaal, 0–100, afgerond op hele procenten. */
  sharePct: number;
}

/**
 * Leidt uit een samenvatting het kosten-per-categorie-overzicht af (aandeel% t.o.v. het netto
 * kostentotaal). Pure afleiding op `summarizeExpenses` — één bron van waarheid, geen eigen telling.
 * Lege lijst zonder netto kosten (deling door nul → geen misleidend aandeel).
 */
export function expenseCategoryShares(summary: ExpenseSummary): ExpenseCategoryShare[] {
  const total = summary.netCents;
  if (total <= 0) return [];
  return summary.byCategory.map((c) => ({
    category: c.category,
    netCents: c.netCents,
    sharePct: Math.round((c.netCents / total) * 100),
  }));
}
