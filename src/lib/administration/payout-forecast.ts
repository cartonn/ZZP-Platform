import { computePaymentBehavior, type PaymentBehavior } from "@/lib/payment-behavior";
import { forecastInvoicePayout, type PayoutForecast } from "@/lib/invoice-payment-forecast";

// Verwachte-betaaldatum voor de openstaande-postenpagina (`/openstaand`, ZZP'er). De aging-view
// toont per openstaande factuur de contractuele vervaldatum, maar de #1 cashflow-vraag van een
// ZZP'er is "wanneer krijg ik mijn geld?". Deze module leidt — per opdrachtgever — de realistische
// betaaldatum af uit het gemeten betaalgedrag (`computePaymentBehavior` → `forecastInvoicePayout`),
// dezelfde motor die `/facturen` en `/prognose` al gebruiken. Server-side waarheid: alleen tonen,
// nooit beslissen; geen status-/geldstroommutatie.
//
// Privacy: het betaalgedrag komt uitsluitend uit de eigen betaalde facturen van deze ZZP'er
// (nooit factuurdata van andere ZZP'ers).

export interface OpenInvoiceForForecast {
  /** Stabiele factuur-id — de sleutel van de resultaat-map. */
  id: string;
  /** Opdrachtgever (Company) — groepeer-sleutel voor het betaalgedrag. */
  companyId: string | null;
  /** Factuurdatum (Invoice.issuedAt) — anker voor de historie-projectie. */
  issuedAt: Date | null;
  /** Contractuele vervaldatum (Invoice.dueAt). */
  dueAt: Date | null;
}

export interface PaidInvoiceForForecast {
  /** Opdrachtgever (Company) van de betaalde factuur. */
  companyId: string | null;
  issuedAt: Date | null;
  dueAt: Date | null;
  /** Betaalmoment — Invoice.updatedAt bij status PAID (zie payment-behavior.ts). */
  paidAt: Date | null;
}

/**
 * Bouwt per openstaande factuur de betrouwbare verwachte-betaaldatum, gegroepeerd per opdrachtgever
 * uit diens betaalhistorie. Alleen **betrouwbare** (`confident`) forecasts die **later** vallen dan
 * de contractuele vervaldatum worden opgenomen: de openstaand-view mag nooit een optimistischer datum
 * tonen dan de contractuele vervaldag (spiegelt `data/income-forecast.ts`). Ontbreekt de historie of
 * betaalt de opdrachtgever gemiddeld op tijd, dan valt de UI terug op de vervaldatum.
 *
 * Puur en deterministisch — geschikt voor unit-tests zonder DB.
 */
export function buildPayoutForecastMap(
  open: readonly OpenInvoiceForForecast[],
  paid: readonly PaidInvoiceForForecast[],
): Map<string, PayoutForecast> {
  const rowsByCompany = new Map<string, PaidInvoiceForForecast[]>();
  for (const row of paid) {
    if (!row.companyId) continue;
    const rows = rowsByCompany.get(row.companyId) ?? [];
    rows.push(row);
    rowsByCompany.set(row.companyId, rows);
  }

  const behaviorByCompany = new Map<string, PaymentBehavior>();
  for (const [companyId, rows] of rowsByCompany) {
    behaviorByCompany.set(companyId, computePaymentBehavior(rows));
  }

  const result = new Map<string, PayoutForecast>();
  for (const inv of open) {
    if (!inv.companyId) continue;
    const behavior = behaviorByCompany.get(inv.companyId);
    if (!behavior) continue;

    const forecast = forecastInvoicePayout({
      issuedAt: inv.issuedAt,
      dueAt: inv.dueAt,
      avgDaysToPay: behavior.avgDaysToPay,
      sampleSize: behavior.sampleSize,
    });

    // Alleen betrouwbaar (op gemeten historie) én conservatiever dan de vervaldag: nooit vroeger
    // verwachten dan de contractuele datum.
    if (
      forecast?.confident &&
      inv.dueAt != null &&
      forecast.expectedAt.getTime() > inv.dueAt.getTime()
    ) {
      result.set(inv.id, forecast);
    }
  }
  return result;
}

/**
 * Effectieve verwachte-binnendatum voor een openstaande factuur: de betrouwbare betaalgedrag-forecast
 * indien aanwezig, anders de contractuele vervaldatum. Bron van waarheid voor zowel de per-rij-regel
 * als de "binnenkomend deze week"-samenvatting, zodat beide nooit uiteenlopen.
 */
export function effectivePayoutDate(
  invoiceId: string,
  dueAt: Date | null,
  forecasts: ReadonlyMap<string, PayoutForecast>,
): Date | null {
  return forecasts.get(invoiceId)?.expectedAt ?? dueAt;
}
