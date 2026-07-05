// Crediteuren-overzicht: te betalen saldo per leverancier (ZZP'er) voor de opdrachtgever. Spiegel
// van het debiteuren-overzicht (`debtor-summary.ts`) maar vanuit de betaal-kant: het beantwoordt de
// #1 cashflow-uit-vraag "aan wie moet ik betalen, hoeveel, en wat staat al te laat?". Puur en
// testbaar zonder database; de verplichtingen (`ObligationItem[]`) zijn al geladen door het
// verplichtingen-paneel (geen extra query).

import { type ObligationItem } from "@/lib/payment-obligations";

const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC-middernacht van een tijdstip — dezelfde dag-grens als het verplichtingen-paneel. */
function startOfDayUTC(ms: number): number {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Te betalen saldo aan één leverancier (crediteur). */
export interface CreditorRow {
  supplierId: string;
  supplierName: string;
  /** Totaal openstaand aan deze leverancier (goed te keuren + te betalen + te laat) in centen. */
  outstandingCents: number;
  /** Deel daarvan waarvan de vervaldatum is gepasseerd (te laat). */
  overdueCents: number;
  /** Deel dat nog moet worden goedgekeurd (stage SUBMITTED, nog geen vervaldatum). */
  awaitingApprovalCents: number;
  /** Aantal openstaande verplichtingen (facturen) aan deze leverancier. */
  invoiceCount: number;
  /** Aantal daarvan dat te laat is. */
  overdueCount: number;
  /** Vroegste vervaldatum onder de openstaande, nog niet te-late verplichtingen. */
  earliestDueDate: Date | null;
  /** Hele dagen tot `earliestDueDate` (>= 0), negatief zou te-laat zijn; null zonder vervaldatum. */
  daysUntilEarliestDue: number | null;
}

export interface CreditorSummary {
  creditors: CreditorRow[];
  totalOutstandingCents: number;
  totalOverdueCents: number;
}

/** Hele dagen tussen `now` en `due` (kan negatief zijn wanneer de vervaldag is gepasseerd). */
function daysUntil(due: Date, nowMs: number): number {
  return Math.floor((due.getTime() - nowMs) / DAY_MS);
}

/**
 * Groepeer de openstaande betaalverplichtingen per leverancier en bereken per crediteur het totaal,
 * het te-late deel, het nog-goed-te-keuren deel, de aantallen en de eerstvolgende vervaldatum.
 * Verplichtingen zonder leverancier-id (`counterpartyId === null`, bv. een losgekoppelde factuur)
 * tellen niet mee — een crediteur is per definitie een leverancier.
 *
 * Sortering: eerst het grootste te-late bedrag (meest urgent), dan het grootste openstaande bedrag,
 * dan alfabetisch op naam (deterministisch, ook zonder te-laat/openstaand-verschil).
 */
export function summarizeCreditors(
  items: readonly ObligationItem[],
  now: Date | number,
): CreditorSummary {
  const nowMs = typeof now === "number" ? now : now.getTime();
  // Dag-grens gelijk aan `buildPaymentObligations` (dueDate < startOfToday = te laat), zodat de
  // crediteuren-kaart en de bucket-lijst op dezelfde pagina op de vervaldag niet uiteenlopen.
  const startOfToday = startOfDayUTC(nowMs);
  const bySupplier = new Map<string, CreditorRow>();

  for (const item of items) {
    if (!item.counterpartyId) continue;

    const existing = bySupplier.get(item.counterpartyId);
    const row: CreditorRow = existing ?? {
      supplierId: item.counterpartyId,
      supplierName: item.counterpartyName || "Onbekende leverancier",
      outstandingCents: 0,
      overdueCents: 0,
      awaitingApprovalCents: 0,
      invoiceCount: 0,
      overdueCount: 0,
      earliestDueDate: null,
      daysUntilEarliestDue: null,
    };

    row.outstandingCents += item.grossCents;
    row.invoiceCount += 1;

    const isOverdue =
      item.stage === "OVERDUE" || (item.dueDate != null && item.dueDate.getTime() < startOfToday);

    if (isOverdue) {
      row.overdueCents += item.grossCents;
      row.overdueCount += 1;
    } else if (item.stage === "SUBMITTED") {
      row.awaitingApprovalCents += item.grossCents;
    }

    // Eerstvolgende vervaldatum: alleen niet-te-late verplichtingen mét vervaldatum tellen mee.
    if (!isOverdue && item.dueDate != null) {
      if (row.earliestDueDate == null || item.dueDate.getTime() < row.earliestDueDate.getTime()) {
        row.earliestDueDate = item.dueDate;
        row.daysUntilEarliestDue = daysUntil(item.dueDate, startOfToday);
      }
    }

    bySupplier.set(item.counterpartyId, row);
  }

  const creditors = [...bySupplier.values()].sort(
    (a, b) =>
      b.overdueCents - a.overdueCents ||
      b.outstandingCents - a.outstandingCents ||
      a.supplierName.localeCompare(b.supplierName, "nl"),
  );

  const totalOutstandingCents = creditors.reduce((sum, c) => sum + c.outstandingCents, 0);
  const totalOverdueCents = creditors.reduce((sum, c) => sum + c.overdueCents, 0);

  return { creditors, totalOutstandingCents, totalOverdueCents };
}

/**
 * Wanneer het crediteuren-overzicht meerwaarde heeft boven de enkele "Totaal openstaand"-kaart:
 * meerdere leveranciers óf minstens één te-laat bedrag (dan telt de urgentie). Bij één leverancier
 * zonder te-laat voegt de uitsplitsing niets toe aan het totaal en tonen we haar niet.
 */
export function shouldShowCreditorSummary(summary: CreditorSummary): boolean {
  return summary.creditors.length >= 2 || summary.totalOverdueCents > 0;
}
