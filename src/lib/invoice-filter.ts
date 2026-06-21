import { isInvoiceOutstanding } from "@/lib/administration/outstanding";

/**
 * Statusfilter voor de facturenlijst van de ZZP'er/opdrachtgever (`/facturen`). De lijst mengt
 * cascade-facturen (bewegen via `lifecycleStatus`, `status` blijft 'DRAFT') en losse legacy-facturen
 * (bewegen via `status`). Een puur, cascade-bewust filter mapt elke factuur — ongeacht herkomst —
 * naar één gebruikersgerichte groep, zodat de UI niet over beide assen hoeft te redeneren.
 *
 * Pure functies → unit-testbaar zonder database. Spiegelt het patroon van de admin-facturatie-tabs,
 * maar dan cascade-bewust (de admin-lijst kent alleen platform-facturen met een enkele `status`).
 */

export const INVOICE_FILTER_GROUPS = ["all", "concept", "open", "paid", "afgehandeld"] as const;
export type InvoiceFilterGroup = (typeof INVOICE_FILTER_GROUPS)[number];

/** Concrete groepen (zonder de "all"-verzamelwaarde) waar één factuur in valt. */
export type ConcreteInvoiceGroup = Exclude<InvoiceFilterGroup, "all">;

export const INVOICE_FILTER_LABEL: Record<InvoiceFilterGroup, string> = {
  all: "Alle",
  concept: "Concept",
  open: "Openstaand",
  paid: "Betaald",
  afgehandeld: "Afgehandeld",
};

/** Volgorde van de filter-pills (werkstroom: concept → open → betaald → afgehandeld). */
export const INVOICE_FILTER_ORDER: InvoiceFilterGroup[] = [
  "all",
  "concept",
  "open",
  "paid",
  "afgehandeld",
];

type InvoiceLike = { lifecycleStatus: string | null; status: string };

/**
 * Mapt één factuur naar zijn concrete groep. Openstaand wordt eerst bepaald (cascade-bewust via
 * `isInvoiceOutstanding`), daarna vallen de resterende toestanden in concept/betaald/afgehandeld.
 * Exhaustief: elke (lifecycle-)status valt in precies één groep.
 */
export function invoiceGroup(inv: InvoiceLike): ConcreteInvoiceGroup {
  if (isInvoiceOutstanding(inv)) return "open";

  if (inv.lifecycleStatus != null) {
    switch (inv.lifecycleStatus) {
      case "DRAFT":
        return "concept";
      case "PAID":
      case "PROCESSED":
        return "paid";
      // REJECTED / CREDITED (SUBMITTED/APPROVED/OVERDUE zijn al "open").
      default:
        return "afgehandeld";
    }
  }

  switch (inv.status) {
    case "DRAFT":
      return "concept";
    case "PAID":
      return "paid";
    // CANCELLED (SENT/OVERDUE zijn al "open").
    default:
      return "afgehandeld";
  }
}

/** Onbekende/lege waarde → "all". Eén bron voor het inlezen van de `status`-searchParam. */
export function parseInvoiceFilter(value: string | undefined): InvoiceFilterGroup {
  return (INVOICE_FILTER_GROUPS as readonly string[]).includes(value ?? "")
    ? (value as InvoiceFilterGroup)
    : "all";
}

/**
 * Filtert op groep met behoud van de invoervolgorde; "all" geeft de lijst ongewijzigd terug.
 * Muteert de invoer niet.
 */
export function filterInvoices<T extends InvoiceLike>(
  invoices: T[],
  group: InvoiceFilterGroup,
): T[] {
  if (group === "all") return invoices.slice();
  return invoices.filter((inv) => invoiceGroup(inv) === group);
}

/** Telling per groep over de volledige lijst (voor de pill-labels). `all` = totaal. */
export function summarizeInvoiceGroups(
  invoices: InvoiceLike[],
): Record<InvoiceFilterGroup, number> {
  const counts: Record<InvoiceFilterGroup, number> = {
    all: invoices.length,
    concept: 0,
    open: 0,
    paid: 0,
    afgehandeld: 0,
  };
  for (const inv of invoices) {
    counts[invoiceGroup(inv)] += 1;
  }
  return counts;
}
