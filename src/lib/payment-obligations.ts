// Pure, deterministic helper for the opdrachtgever (CLIENT) cashflow-out view:
// the payment obligations a client owes on the cascade invoices addressed to
// them. Mirror of `income-forecast.ts` (the freelancer's incoming side), but
// with client semantics: a DRAFT invoice is not yet sent to the client and is
// never an obligation, so only SUBMITTED / APPROVED / OVERDUE count.
//
// No I/O. Only the CSV-kern (puur) wordt geïmporteerd voor de export.

import { toCsv } from "./csv";

export type ObligationStage = "SUBMITTED" | "APPROVED" | "OVERDUE";

export interface ObligationItem {
  invoiceId: string;
  stage: ObligationStage;
  netCents: number; // excl. VAT (subtotal)
  vatCents: number; // VAT
  grossCents: number; // incl. VAT (total)
  dueDate: Date | null; // dueAt; null while still awaiting approval (SUBMITTED)
  counterpartyId: string | null; // freelancer (issuer) profile id — stable grouping key; null if unknown
  counterpartyName: string; // freelancer (issuer) name
  number: string | null; // invoice number within the issuer's sequence, or null
  jobTitle: string | null;
}

export type ObligationBucketKey = "OVERDUE" | "THIS_MONTH" | "NEXT_MONTH" | "LATER" | "UNSCHEDULED";

export interface ObligationBucket {
  key: ObligationBucketKey;
  label: string; // NL label
  items: ObligationItem[]; // stably sorted
  netCents: number;
  vatCents: number;
  grossCents: number;
}

export interface PaymentObligations {
  // Only non-empty buckets, in fixed order: OVERDUE, THIS_MONTH, NEXT_MONTH, LATER, UNSCHEDULED
  buckets: ObligationBucket[];
  totalNetCents: number;
  totalVatCents: number;
  totalGrossCents: number;
  awaitingApprovalGrossCents: number; // gross of SUBMITTED items (still to approve)
  scheduledGrossCents: number; // gross of APPROVED items due today or later
  overdueGrossCents: number; // gross of items past due (stage OVERDUE or dueDate < start of today)
}

const BUCKET_LABELS: Record<ObligationBucketKey, string> = {
  OVERDUE: "Te laat",
  THIS_MONTH: "Deze maand",
  NEXT_MONTH: "Volgende maand",
  LATER: "Later",
  UNSCHEDULED: "Nog goed te keuren",
};

const BUCKET_ORDER: ObligationBucketKey[] = [
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

/** True when the item is past due: stage OVERDUE, or a dueDate before start of today. */
function isOverdue(item: ObligationItem, startOfToday: Date): boolean {
  return item.stage === "OVERDUE" || (item.dueDate !== null && item.dueDate < startOfToday);
}

/** Determines the bucket key for an item given today's start and current year/month. */
function resolveBucketKey(
  item: ObligationItem,
  startOfToday: Date,
  nowYM: { year: number; month: number },
): ObligationBucketKey {
  if (isOverdue(item, startOfToday)) {
    return "OVERDUE";
  }

  // No due date yet (SUBMITTED, awaiting approval).
  if (item.dueDate === null) {
    return "UNSCHEDULED";
  }

  const itemYM = utcYearMonth(item.dueDate);
  const nextYM = nextUTCMonth(nowYM);

  if (itemYM.year === nowYM.year && itemYM.month === nowYM.month) {
    return "THIS_MONTH";
  }
  if (itemYM.year === nextYM.year && itemYM.month === nextYM.month) {
    return "NEXT_MONTH";
  }
  return "LATER";
}

/**
 * Comparator for items within a bucket.
 *
 * Items with dueDate:
 *   1. dueDate ascending (most urgent first)
 *   2. grossCents descending
 *   3. invoiceId ascending (tiebreak)
 *
 * Items without dueDate (SUBMITTED → UNSCHEDULED):
 *   1. grossCents descending
 *   2. invoiceId ascending (tiebreak)
 */
function compareItems(a: ObligationItem, b: ObligationItem): number {
  if (a.dueDate !== null && b.dueDate !== null) {
    const dateDiff = a.dueDate.getTime() - b.dueDate.getTime();
    if (dateDiff !== 0) return dateDiff;
  }
  const grossDiff = b.grossCents - a.grossCents;
  if (grossDiff !== 0) return grossDiff;
  return a.invoiceId < b.invoiceId ? -1 : a.invoiceId > b.invoiceId ? 1 : 0;
}

function sumGross(items: ObligationItem[]): number {
  return items.reduce((acc, item) => acc + item.grossCents, 0);
}

function sumNet(items: ObligationItem[]): number {
  return items.reduce((acc, item) => acc + item.netCents, 0);
}

function sumVat(items: ObligationItem[]): number {
  return items.reduce((acc, item) => acc + item.vatCents, 0);
}

export function buildPaymentObligations(items: ObligationItem[], now: Date): PaymentObligations {
  const startOfToday = startOfDayUTC(now);
  const nowYM = utcYearMonth(now);

  const grouped: Record<ObligationBucketKey, ObligationItem[]> = {
    OVERDUE: [],
    THIS_MONTH: [],
    NEXT_MONTH: [],
    LATER: [],
    UNSCHEDULED: [],
  };

  for (const item of items) {
    grouped[resolveBucketKey(item, startOfToday, nowYM)].push(item);
  }

  for (const key of BUCKET_ORDER) {
    grouped[key].sort(compareItems);
  }

  const buckets: ObligationBucket[] = [];
  for (const key of BUCKET_ORDER) {
    const bucketItems = grouped[key];
    if (bucketItems.length === 0) continue;
    buckets.push({
      key,
      label: BUCKET_LABELS[key],
      items: bucketItems,
      netCents: sumNet(bucketItems),
      vatCents: sumVat(bucketItems),
      grossCents: sumGross(bucketItems),
    });
  }

  let awaitingApprovalGrossCents = 0;
  let scheduledGrossCents = 0;
  let overdueGrossCents = 0;

  for (const item of items) {
    if (isOverdue(item, startOfToday)) {
      overdueGrossCents += item.grossCents;
    } else if (item.stage === "SUBMITTED") {
      awaitingApprovalGrossCents += item.grossCents;
    } else {
      // APPROVED, due today or later.
      scheduledGrossCents += item.grossCents;
    }
  }

  return {
    buckets,
    totalNetCents: sumNet(items),
    totalVatCents: sumVat(items),
    totalGrossCents: sumGross(items),
    awaitingApprovalGrossCents,
    scheduledGrossCents,
    overdueGrossCents,
  };
}

/** Aantal dagen dat het "deze week"-venster vooruitkijkt vanaf vandaag (00:00 UTC). */
export const OBLIGATION_WEEK_AHEAD_DAYS = 7;

export interface DueThisWeekObligations {
  grossCents: number;
  count: number;
}

/**
 * Verplichtingen die binnen de eerstvolgende {@link OBLIGATION_WEEK_AHEAD_DAYS} dagen vervallen —
 * het concrete cashflow-venster waarin de opdrachtgever nog op tijd kan betalen. Dit is een
 * urgentere, actiegerichte slice dan `scheduledGrossCents` (alles vanaf vandaag) en distinct van
 * `overdueGrossCents` (al te laat).
 *
 * In het venster valt een item met een vervaldag `d` waarvoor geldt: `startOfToday <= d < startOfToday
 * + 7d` én het item is **niet** al te laat (`isOverdue` false). SUBMITTED-items (nog goed te keuren,
 * geen vervaldag) tellen niet mee: die zijn nog geen ingeplande betaling. Zo kan een item nooit
 * dubbel in "Te laat" én "Deze week" verschijnen.
 */
export function summarizeDueThisWeek(items: ObligationItem[], now: Date): DueThisWeekObligations {
  const startOfToday = startOfDayUTC(now);
  const windowEnd = new Date(
    startOfToday.getTime() + OBLIGATION_WEEK_AHEAD_DAYS * 24 * 60 * 60 * 1000,
  );

  let grossCents = 0;
  let count = 0;
  for (const item of items) {
    if (item.dueDate === null) continue;
    if (isOverdue(item, startOfToday)) continue;
    if (item.dueDate >= startOfToday && item.dueDate < windowEnd) {
      grossCents += item.grossCents;
      count += 1;
    }
  }
  return { grossCents, count };
}

// --- CSV-export ------------------------------------------------------------

const STAGE_CSV_LABELS: Record<ObligationStage, string> = {
  SUBMITTED: "Goed te keuren",
  APPROVED: "Te betalen",
  OVERDUE: "Te laat",
};

/** Formatteert een centenbedrag als euro met komma-decimaal (bv. 12100 → "121,00"); null → "". */
function eurosFromCents(cents: number | null): string {
  if (cents === null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Vervaldatum als ISO yyyy-mm-dd in UTC, of "" wanneer er nog geen vervaldag is. */
function isoDate(date: Date | null): string {
  if (date === null) return "";
  return date.toISOString().slice(0, 10);
}

/**
 * Pure CSV-export van de betaalverplichtingen, gegroepeerd in dezelfde bucket-volgorde als het
 * scherm (`buildPaymentObligations`). Eén rij per factuur; bedragen met komma-decimaal voor Excel-NL.
 */
export function exportObligationsCsv(items: ObligationItem[], now: Date): string {
  const report = buildPaymentObligations(items, now);

  const header = [
    "Categorie",
    "Status",
    "Tegenpartij",
    "Opdracht",
    "Factuurnummer",
    "Vervaldatum",
    "Netto (EUR)",
    "BTW (EUR)",
    "Bruto (EUR)",
  ];

  const rows: string[][] = [];
  for (const bucket of report.buckets) {
    for (const item of bucket.items) {
      rows.push([
        bucket.label,
        STAGE_CSV_LABELS[item.stage],
        item.counterpartyName,
        item.jobTitle ?? "",
        item.number ?? "",
        isoDate(item.dueDate),
        eurosFromCents(item.netCents),
        eurosFromCents(item.vatCents),
        eurosFromCents(item.grossCents),
      ]);
    }
  }

  return toCsv([header, ...rows]);
}
