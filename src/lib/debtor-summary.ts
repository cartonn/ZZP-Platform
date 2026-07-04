// Debiteuren-overzicht: openstaand saldo per opdrachtgever voor de ZZP'er. Beantwoordt de #1
// cashflow-vraag "wie moet mij nog hoeveel betalen, en hoe lang staat het al open?" — een
// aggregatie bovenop de bestaande openstaand-regel (`isInvoiceOutstanding`). Puur en testbaar
// zonder database; de facturen zijn al geladen door het facturen-paneel (geen extra query).

import { isInvoiceOutstanding } from "@/lib/administration/outstanding";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Minimale factuurvorm die de aggregator nodig heeft (subset van Prisma.Invoice + company). */
export interface DebtorInvoiceInput {
  lifecycleStatus: string | null;
  status: string;
  totalCents: number;
  issuedAt: Date | null;
  dueAt: Date | null;
  companyId: string | null;
  companyName: string | null;
}

/** Openstaand saldo van één opdrachtgever (debiteur). */
export interface DebtorRow {
  companyId: string;
  companyName: string;
  /** Totaal openstaand (verzonden/goedgekeurd/te laat, nog niet betaald) in centen. */
  outstandingCents: number;
  /** Deel daarvan dat de vervaldatum is gepasseerd (dueAt < now). */
  overdueCents: number;
  /** Aantal openstaande facturen. */
  invoiceCount: number;
  /** Aantal openstaande facturen waarvan de vervaldatum is gepasseerd. */
  overdueCount: number;
  /** Uitgiftedatum van de langst openstaande factuur (voor "N dagen open"). */
  oldestIssuedAt: Date | null;
  /** Hele dagen sinds de langst openstaande factuur is uitgereikt (>= 0), null zonder issuedAt. */
  oldestDaysOutstanding: number | null;
}

export interface DebtorSummary {
  debtors: DebtorRow[];
  totalOutstandingCents: number;
  totalOverdueCents: number;
}

/** Hele dagen tussen `since` en `now` (>= 0). */
function daysSince(since: Date, now: Date | number): number {
  const nowMs = typeof now === "number" ? now : now.getTime();
  return Math.max(0, Math.floor((nowMs - since.getTime()) / DAY_MS));
}

/**
 * Groepeer de openstaande facturen per opdrachtgever en bereken per debiteur het totaal, het
 * te-late deel, de aantallen en de ouderdom van de langst openstaande factuur. Facturen zonder
 * opdrachtgever (losstaand) tellen niet mee — een debiteur is per definitie een opdrachtgever.
 *
 * Sortering: eerst het grootste te-late bedrag (meest urgent), dan het grootste openstaande
 * bedrag, dan alfabetisch op naam (deterministisch, ook zonder te-laat/openstaand-verschil).
 */
export function summarizeDebtors(
  invoices: readonly DebtorInvoiceInput[],
  now: Date | number,
): DebtorSummary {
  const nowMs = typeof now === "number" ? now : now.getTime();
  const byCompany = new Map<string, DebtorRow>();

  for (const inv of invoices) {
    if (!isInvoiceOutstanding(inv)) continue;
    if (!inv.companyId) continue;

    const existing = byCompany.get(inv.companyId);
    const row: DebtorRow = existing ?? {
      companyId: inv.companyId,
      companyName: inv.companyName ?? "Onbekende opdrachtgever",
      outstandingCents: 0,
      overdueCents: 0,
      invoiceCount: 0,
      overdueCount: 0,
      oldestIssuedAt: null,
      oldestDaysOutstanding: null,
    };

    row.outstandingCents += inv.totalCents;
    row.invoiceCount += 1;

    const isOverdue = inv.dueAt != null && inv.dueAt.getTime() < nowMs;
    if (isOverdue) {
      row.overdueCents += inv.totalCents;
      row.overdueCount += 1;
    }

    if (inv.issuedAt != null) {
      if (row.oldestIssuedAt == null || inv.issuedAt.getTime() < row.oldestIssuedAt.getTime()) {
        row.oldestIssuedAt = inv.issuedAt;
        row.oldestDaysOutstanding = daysSince(inv.issuedAt, nowMs);
      }
    }

    byCompany.set(inv.companyId, row);
  }

  const debtors = [...byCompany.values()].sort(
    (a, b) =>
      b.overdueCents - a.overdueCents ||
      b.outstandingCents - a.outstandingCents ||
      a.companyName.localeCompare(b.companyName, "nl"),
  );

  const totalOutstandingCents = debtors.reduce((sum, d) => sum + d.outstandingCents, 0);
  const totalOverdueCents = debtors.reduce((sum, d) => sum + d.overdueCents, 0);

  return { debtors, totalOutstandingCents, totalOverdueCents };
}

/**
 * Wanneer het debiteuren-overzicht meerwaarde heeft boven de enkele "Openstaand"-totaalkaart:
 * meerdere debiteuren óf minstens één te-laat bedrag (dan telt de urgentie/ouderdom). Bij één
 * debiteur zonder te-laat voegt de kaart niets toe aan het totaal en tonen we haar niet.
 */
export function shouldShowDebtorSummary(summary: DebtorSummary): boolean {
  return summary.debtors.length >= 2 || summary.totalOverdueCents > 0;
}
