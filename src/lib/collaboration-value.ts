import { isInvoicePaidRevenue } from "@/lib/administration/paid-revenue";
import { isInvoiceOutstanding } from "@/lib/administration/outstanding";

// Waarde-/voortgangsoverzicht van één samenwerking, afgeleid uit de reeds geladen prestaties en
// facturen van het werkproces. Beantwoordt op één blik: wat is geleverd en goedgekeurd, wat is
// binnen, wat staat nog uit, en wat staat nog in concept? Server-side waarheid — leunt op exact
// dezelfde canonieke factuurregels (`isInvoicePaidRevenue`/`isInvoiceOutstanding`) als de rest van
// de administratie, zodat de cijfers hier niet driften van /facturen of het dashboard.
//
// De geldbedragen zijn onderling exclusief (betaald ⊕ openstaand ⊕ concept): een factuur telt in
// precies één emmer. `overdueCents` is een deelverzameling van `outstandingCents` (de te-late
// openstaande facturen), puur als aandacht-signaal — het telt niet dubbel.

export type PerformanceValueInput = {
  type: string; // HOURS | MILESTONE
  status: string; // PerformanceState
  hours: number | null;
};

export type InvoiceValueInput = {
  lifecycleStatus: string | null;
  status: string;
  totalCents: number;
};

export type CollaborationValueSummary = {
  /** Som van de goedgekeurde uren (type HOURS, status APPROVED). Afgerond op kwartieren-precisie. */
  approvedHours: number;
  /** Aantal goedgekeurde opleveringen (type MILESTONE, status APPROVED). */
  approvedDeliverables: number;
  /** Aantal ingediende prestaties die op goedkeuring wachten (status SUBMITTED). */
  pendingPerformances: number;
  /** Betaalde omzet incl. btw (facturen die als betaald tellen). */
  paidCents: number;
  /** Openstaand incl. btw (ingediend/goedgekeurd/te laat, nog niet betaald). */
  outstandingCents: number;
  /** Deel van `outstandingCents` dat over de vervaldag is (lifecycleStatus OVERDUE). */
  overdueCents: number;
  /** Nog in concept incl. btw (lifecycleStatus DRAFT — nog niet ingediend). */
  draftCents: number;
};

/**
 * Vat de waarde/voortgang van één samenwerking samen. Pure functie → unit-testbaar zonder database.
 * Geeft `null` terug als er nog niets te tonen valt (geen goedgekeurd/ingediend werk én geen enkele
 * factuur met waarde) zodat een verse, net-voorgestelde samenwerking rustig blijft.
 */
export function summarizeCollaborationValue(
  performances: readonly PerformanceValueInput[],
  invoices: readonly InvoiceValueInput[],
): CollaborationValueSummary | null {
  let approvedHours = 0;
  let approvedDeliverables = 0;
  let pendingPerformances = 0;

  for (const p of performances) {
    if (p.status === "SUBMITTED") pendingPerformances += 1;
    if (p.status === "APPROVED") {
      if (p.type === "HOURS") {
        approvedHours += typeof p.hours === "number" && Number.isFinite(p.hours) ? p.hours : 0;
      } else if (p.type === "MILESTONE") {
        approvedDeliverables += 1;
      }
    }
  }
  // Float-som van kwartieren afronden zodat 0.25 + 0.1 geen 0.35000000000000003 wordt.
  approvedHours = Math.round(approvedHours * 100) / 100;

  let paidCents = 0;
  let outstandingCents = 0;
  let overdueCents = 0;
  let draftCents = 0;

  for (const inv of invoices) {
    if (isInvoicePaidRevenue(inv)) {
      paidCents += inv.totalCents;
    } else if (isInvoiceOutstanding(inv)) {
      outstandingCents += inv.totalCents;
      if (inv.lifecycleStatus === "OVERDUE") overdueCents += inv.totalCents;
    } else if (inv.lifecycleStatus === "DRAFT") {
      draftCents += inv.totalCents;
    }
  }

  const hasActivity =
    approvedHours > 0 ||
    approvedDeliverables > 0 ||
    pendingPerformances > 0 ||
    paidCents > 0 ||
    outstandingCents > 0 ||
    draftCents > 0;

  if (!hasActivity) return null;

  return {
    approvedHours,
    approvedDeliverables,
    pendingPerformances,
    paidCents,
    outstandingCents,
    overdueCents,
    draftCents,
  };
}
