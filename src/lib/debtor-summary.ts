// Debiteuren-overzicht: openstaand saldo per opdrachtgever voor de ZZP'er. Beantwoordt de #1
// cashflow-vraag "wie moet mij nog hoeveel betalen, en hoe lang staat het al open?" — een
// aggregatie bovenop de bestaande openstaand-regel (`isInvoiceOutstanding`). Puur en testbaar
// zonder database; de facturen zijn al geladen door het facturen-paneel (geen extra query).

import { isInvoiceOutstanding } from "@/lib/administration/outstanding";
import { daysSince, isPastDue, startOfDayUTC } from "@/lib/date-boundary";
import { currentDunningStage } from "@/lib/payment-reminders";
import { type DunningLevel } from "@/lib/config";

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
  /** Deel daarvan dat de vervaldatum is gepasseerd (dueAt < UTC-middernacht van vandaag). */
  overdueCents: number;
  /** Aantal openstaande facturen. */
  invoiceCount: number;
  /** Aantal openstaande facturen waarvan de vervaldatum is gepasseerd. */
  overdueCount: number;
  /** Uitgiftedatum van de langst openstaande factuur (voor "N dagen open"). */
  oldestIssuedAt: Date | null;
  /** Hele dagen sinds de langst openstaande factuur is uitgereikt (>= 0), null zonder issuedAt. */
  oldestDaysOutstanding: number | null;
  /**
   * Het meest-geëscaleerde aanmaningsniveau over de te late facturen van deze debiteur
   * (Betalingsherinnering → Eerste/Tweede/Laatste aanmaning), of null als niets te laat is.
   * Zelfde bron als het factuurdetail (`currentDunningStage`), zodat lijst en detail nooit
   * uiteenlopen. De stap is monotoon in dagen-te-laat → de factuur met de meeste dagen bepaalt hem.
   */
  dunningLevel: DunningLevel | null;
  /** Nederlands label van `dunningLevel` (config-data, geen los te vertalen UI-string). */
  dunningLabel: string | null;
  /** Dagen-te-laat van de factuur die het niveau bepaalt (voor secundaire tekst/sortering). */
  worstOverdueDays: number | null;
}

export interface DebtorSummary {
  debtors: DebtorRow[];
  totalOutstandingCents: number;
  totalOverdueCents: number;
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
  // Dag-grens gelijk aan de crediteuren-kaart (`summarizeCreditors`): een factuur telt pas als te
  // laat wanneer haar vervaldatum vóór UTC-middernacht van vandaag ligt — op de vervaldag zelf nog
  // niet. Zo geven de debiteuren- en crediteuren-kaart voor dezelfde factuur hetzelfde oordeel.
  const startOfToday = startOfDayUTC(nowMs);
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
      dunningLevel: null,
      dunningLabel: null,
      worstOverdueDays: null,
    };

    row.outstandingCents += inv.totalCents;
    row.invoiceCount += 1;

    const isOverdue = isPastDue(inv.dueAt, startOfToday);
    if (isOverdue) {
      row.overdueCents += inv.totalCents;
      row.overdueCount += 1;

      // Aanmaningsniveau van deze factuur (zelfde pure logica als het factuurdetail). Voor een
      // isPastDue-factuur is de vervaldag altijd vóór nu → `currentDunningStage` is nooit null.
      const stage = currentDunningStage(inv.dueAt, new Date(nowMs));
      if (stage && (row.worstOverdueDays == null || stage.daysOverdue > row.worstOverdueDays)) {
        row.dunningLevel = stage.level;
        row.dunningLabel = stage.label;
        row.worstOverdueDays = stage.daysOverdue;
      }
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
