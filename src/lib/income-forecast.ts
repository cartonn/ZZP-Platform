// Pure, deterministic helper for computing an income forecast from a list of
// cascade invoice items. No I/O.

import { toCsv } from "./csv";

export type ForecastStage = "DRAFT" | "SUBMITTED" | "APPROVED" | "OVERDUE";

export interface ForecastItem {
  invoiceId: string;
  stage: ForecastStage;
  netCents: number; // excl. VAT (subtotal)
  vatCents: number; // VAT
  grossCents: number; // incl. VAT (total)
  expectedDate: Date | null; // dueAt; null for DRAFT/SUBMITTED
  // Betaalgedrag-gecorrigeerde verwachte betaaldatum voor deze factuur. Wanneer we genoeg
  // betaalhistorie van déze opdrachtgever hebben (zie invoice-payment-forecast.ts), valt het geld
  // realistisch later binnen dan de contractuele vervaldag. Is deze gezet, dan bepaalt hij in welke
  // maand-bucket het item valt — zodat de cashflow-tijdlijn niet te optimistisch is. `undefined`/`null`
  // → val terug op `expectedDate` (identiek aan het oude gedrag). Altijd ≥ `expectedDate`.
  realisticDate?: Date | null;
  counterpartyName: string; // client name
  number: string | null; // invoice number within party sequence, or null for drafts
  jobTitle: string | null;
}

export type ForecastBucketKey = "OVERDUE" | "THIS_MONTH" | "NEXT_MONTH" | "LATER" | "UNSCHEDULED";

export interface ForecastBucket {
  key: ForecastBucketKey;
  label: string; // NL label
  items: ForecastItem[]; // stably sorted
  netCents: number; // sum of items
  vatCents: number;
  grossCents: number;
}

export interface IncomeForecast {
  // Only non-empty buckets, in fixed order: OVERDUE, THIS_MONTH, NEXT_MONTH, LATER, UNSCHEDULED
  buckets: ForecastBucket[];
  totalNetCents: number; // sum over all items
  totalVatCents: number;
  totalGrossCents: number;
  unbilledGrossCents: number; // gross of DRAFT items
  inFlightGrossCents: number; // gross of items in transit: SUBMITTED + APPROVED-future (not overdue, not DRAFT)
  overdueGrossCents: number; // gross of overdue items (stage OVERDUE or expectedDate < start of today)
  // Aantal items waarvan de verwachte betaaldatum op grond van het betaalgedrag van de opdrachtgever
  // ná de contractuele vervaldag is verschoven (realisticDate later dan expectedDate). Voedt de
  // uitleg-notitie in het paneel; 0 → geen correctie toegepast.
  behaviorAdjustedCount: number;
}

// NL labels for each bucket key.
const BUCKET_LABELS: Record<ForecastBucketKey, string> = {
  OVERDUE: "Te laat",
  THIS_MONTH: "Deze maand",
  NEXT_MONTH: "Volgende maand",
  LATER: "Later",
  UNSCHEDULED: "Nog te plannen",
};

// Fixed bucket display order.
const BUCKET_ORDER: ForecastBucketKey[] = [
  "OVERDUE",
  "THIS_MONTH",
  "NEXT_MONTH",
  "LATER",
  "UNSCHEDULED",
];

/** Returns UTC midnight (00:00:00.000 UTC) for the given Date. */
function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * De datum waarop een item in de tijdlijn wordt geplaatst: de betaalgedrag-gecorrigeerde verwachte
 * betaaldatum als die bekend is, anders de contractuele vervaldag. OVERDUE-detectie leunt bewust
 * NIET op deze datum (zie resolveBucketKey) maar op de contractuele vervaldag, zodat een realistisch-
 * latere verwachting nooit een reeds-verlopen factuur maskeert.
 */
function effectiveDate(item: ForecastItem): Date | null {
  const { realisticDate, expectedDate } = item;
  if (realisticDate == null) return expectedDate;
  if (expectedDate == null) return realisticDate;
  // Invariant afgedwongen: de betaalgedrag-correctie schuift een item alleen naar LATER, nooit naar
  // voren. `forecastInvoicePayout` clamt niet naar de vervaldag, dus een snel-betalende opdrachtgever
  // met een lange betaaltermijn kan een verwachting vóór de vervaldag geven — die negeren we hier
  // (val terug op de vervaldag), zodat de prognose nooit optimistischer wordt dan de contractuele
  // datum en een niet-verlopen factuur niet in een verleden-maand-bucket belandt.
  return realisticDate.getTime() > expectedDate.getTime() ? realisticDate : expectedDate;
}

/** Returns a {year, month} tuple in UTC for the given Date. */
function utcYearMonth(d: Date): { year: number; month: number } {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

/** Returns the next calendar month in UTC, handling December → January wrap. */
function nextUTCMonth(ym: { year: number; month: number }): {
  year: number;
  month: number;
} {
  if (ym.month === 11) {
    return { year: ym.year + 1, month: 0 };
  }
  return { year: ym.year, month: ym.month + 1 };
}

/** Determines the bucket key for an item given today's start and current year/month. */
function resolveBucketKey(
  item: ForecastItem,
  startOfToday: Date,
  nowYM: { year: number; month: number },
): ForecastBucketKey {
  // Overdue: stage OVERDUE, or has a contractual due date that is before start of today. Bewust op de
  // contractuele vervaldag (niet de realistische verwachting) — een latere verwachting mag een reeds
  // verlopen factuur niet uit "Te laat" wegduwen.
  if (
    item.stage === "OVERDUE" ||
    (item.expectedDate !== null && item.expectedDate < startOfToday)
  ) {
    return "OVERDUE";
  }

  // Items without a scheduled date.
  const eff = effectiveDate(item);
  if (eff === null) {
    return "UNSCHEDULED";
  }

  const itemYM = utcYearMonth(eff);
  const nextYM = nextUTCMonth(nowYM);

  if (itemYM.year === nowYM.year && itemYM.month === nowYM.month) {
    return "THIS_MONTH";
  }
  if (itemYM.year === nextYM.year && itemYM.month === nextYM.month) {
    return "NEXT_MONTH";
  }
  return "LATER";
}

/** Stage sort rank for UNSCHEDULED bucket: DRAFT before SUBMITTED. */
function stageSortRank(stage: ForecastStage): number {
  if (stage === "DRAFT") return 0;
  if (stage === "SUBMITTED") return 1;
  return 2;
}

/**
 * Comparator for items within a bucket.
 *
 * Items with expectedDate:
 *   1. expectedDate ascending
 *   2. grossCents descending
 *   3. invoiceId ascending (tiebreak)
 *
 * Items without expectedDate (DRAFT/SUBMITTED → UNSCHEDULED):
 *   1. DRAFT before SUBMITTED (by stage rank ascending)
 *   2. grossCents descending
 *   3. invoiceId ascending (tiebreak)
 */
function compareItems(a: ForecastItem, b: ForecastItem): number {
  const aEff = effectiveDate(a);
  const bEff = effectiveDate(b);
  if (aEff !== null && bEff !== null) {
    const dateDiff = aEff.getTime() - bEff.getTime();
    if (dateDiff !== 0) return dateDiff;
    const grossDiff = b.grossCents - a.grossCents;
    if (grossDiff !== 0) return grossDiff;
    return a.invoiceId < b.invoiceId ? -1 : a.invoiceId > b.invoiceId ? 1 : 0;
  }

  // No expectedDate: sort by stage rank, then grossCents desc, then invoiceId asc.
  const rankDiff = stageSortRank(a.stage) - stageSortRank(b.stage);
  if (rankDiff !== 0) return rankDiff;
  const grossDiff = b.grossCents - a.grossCents;
  if (grossDiff !== 0) return grossDiff;
  return a.invoiceId < b.invoiceId ? -1 : a.invoiceId > b.invoiceId ? 1 : 0;
}

function sumField(items: ForecastItem[], field: keyof ForecastItem): number {
  return items.reduce((acc, item) => acc + (item[field] as number), 0);
}

export function buildIncomeForecast(items: ForecastItem[], now: Date): IncomeForecast {
  const startOfToday = startOfDayUTC(now);
  const nowYM = utcYearMonth(now);

  // Classify each item into a bucket.
  const grouped: Record<ForecastBucketKey, ForecastItem[]> = {
    OVERDUE: [],
    THIS_MONTH: [],
    NEXT_MONTH: [],
    LATER: [],
    UNSCHEDULED: [],
  };

  for (const item of items) {
    const key = resolveBucketKey(item, startOfToday, nowYM);
    grouped[key].push(item);
  }

  // Sort each bucket.
  for (const key of BUCKET_ORDER) {
    grouped[key].sort(compareItems);
  }

  // Build non-empty buckets in fixed order.
  const buckets: ForecastBucket[] = [];
  for (const key of BUCKET_ORDER) {
    const bucketItems = grouped[key];
    if (bucketItems.length === 0) continue;
    buckets.push({
      key,
      label: BUCKET_LABELS[key],
      items: bucketItems,
      netCents: sumField(bucketItems, "netCents"),
      vatCents: sumField(bucketItems, "vatCents"),
      grossCents: sumField(bucketItems, "grossCents"),
    });
  }

  // Global totals over all items.
  const totalNetCents = sumField(items, "netCents");
  const totalVatCents = sumField(items, "vatCents");
  const totalGrossCents = sumField(items, "grossCents");

  // Partition: unbilled (DRAFT), overdue, in-flight (everything else).
  let unbilledGrossCents = 0;
  let overdueGrossCents = 0;
  let inFlightGrossCents = 0;

  let behaviorAdjustedCount = 0;

  for (const item of items) {
    if (item.stage === "DRAFT") {
      unbilledGrossCents += item.grossCents;
    } else if (
      item.stage === "OVERDUE" ||
      (item.expectedDate !== null && item.expectedDate < startOfToday)
    ) {
      overdueGrossCents += item.grossCents;
    } else {
      inFlightGrossCents += item.grossCents;
    }

    if (
      item.realisticDate != null &&
      item.expectedDate != null &&
      item.realisticDate.getTime() > item.expectedDate.getTime()
    ) {
      behaviorAdjustedCount += 1;
    }
  }

  return {
    buckets,
    totalNetCents,
    totalVatCents,
    totalGrossCents,
    unbilledGrossCents,
    inFlightGrossCents,
    overdueGrossCents,
    behaviorAdjustedCount,
  };
}

// --- CSV-export ------------------------------------------------------------

// NL stage-labels voor de export (los van de UI-componenten zodat de export puur blijft).
const STAGE_EXPORT_LABELS: Record<ForecastStage, string> = {
  DRAFT: "Concept",
  SUBMITTED: "In beoordeling",
  APPROVED: "Goedgekeurd",
  OVERDUE: "Te laat",
};

/** Formatteert centen als bedrag met komma-decimaal (bv. 1210 → "12,10"). */
function formatEuroAmount(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/**
 * Pure CSV-export van de inkomstenprognose. Bouwt eerst de prognose (zodat de
 * bucket-indeling en sortering identiek zijn aan de UI) en emit per item één rij,
 * gegroepeerd per bucket. Gebruikt de canonieke `toCsv` (escaping + formule-guard).
 */
export function exportForecastCsv(items: ForecastItem[], now: Date): string {
  const report = buildIncomeForecast(items, now);

  const header = [
    "Categorie",
    "Status",
    "Tegenpartij",
    "Opdracht",
    "Factuurnummer",
    "Verwachte datum",
    "Netto (EUR)",
    "BTW (EUR)",
    "Bruto (EUR)",
  ];

  const rows: string[][] = [];
  for (const bucket of report.buckets) {
    for (const item of bucket.items) {
      rows.push([
        bucket.label,
        STAGE_EXPORT_LABELS[item.stage],
        item.counterpartyName,
        item.jobTitle ?? "",
        item.number ?? "",
        // Verwachte datum = de betaalgedrag-gecorrigeerde datum als die bekend is (consistent met de
        // bucket-indeling), anders de contractuele vervaldag.
        effectiveDate(item) ? effectiveDate(item)!.toISOString().slice(0, 10) : "",
        formatEuroAmount(item.netCents),
        formatEuroAmount(item.vatCents),
        formatEuroAmount(item.grossCents),
      ]);
    }
  }

  return toCsv([header, ...rows]);
}
