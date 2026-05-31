// Ouderdomsanalyse (aging) van openstaande facturen: debiteuren-/crediteurenbeheer.
// Pure read-model: geeft per factuur de bucket (notDue / 1-30 / 31-60 / 61-90 / 90+),
// aggregeert totalen per bucket, en biedt een CSV-export voor de boekhouder.
// Integer-centen, geen floats, geen DB, geen React.

import { toCsv, centsToEuroPlain } from "@/lib/administration/csv";

export const AGING_BUCKETS = [
  { key: "notDue", label: "Nog niet vervallen" },
  { key: "d0_30", label: "1–30 dagen te laat" },
  { key: "d31_60", label: "31–60 dagen te laat" },
  { key: "d61_90", label: "61–90 dagen te laat" },
  { key: "d90plus", label: "Meer dan 90 dagen te laat" },
] as const;

export type AgingBucketKey = (typeof AGING_BUCKETS)[number]["key"];

export interface OpenInvoice {
  id: string;
  number: string; // weergavenummer
  counterpartyName: string; // tegenpartij (debiteur of crediteur)
  jobTitle: string | null;
  dueAt: Date | null;
  amountCents: number;
  collaborationId: string | null;
  isCascade: boolean; // true = cascade-factuur (link naar werkproces), false = legacy
}

/** Hele dagen dat een factuur over de vervaldatum is; 0 als niet vervallen of geen datum. */
export function daysOverdue(dueAt: Date | null, now: Date): number {
  if (dueAt === null) return 0;
  const days = Math.floor((now.getTime() - dueAt.getTime()) / 86400000);
  return days <= 0 ? 0 : days;
}

/** Aging-bucket op basis van dagen te laat. */
export function agingBucketKey(dueAt: Date | null, now: Date): AgingBucketKey {
  const days = daysOverdue(dueAt, now);
  if (days === 0) return "notDue";
  if (days <= 30) return "d0_30";
  if (days <= 60) return "d31_60";
  if (days <= 90) return "d61_90";
  return "d90plus";
}

export interface AgingRow extends OpenInvoice {
  bucket: AgingBucketKey;
  daysOverdue: number;
}

export interface AgingBucketTotal {
  key: AgingBucketKey;
  label: string;
  totalCents: number;
  count: number;
}

export interface AgingReport {
  rows: AgingRow[]; // gesorteerd op daysOverdue aflopend (meest te laat eerst), dan amountCents aflopend
  buckets: AgingBucketTotal[]; // altijd alle 5 in AGING_BUCKETS-volgorde
  totalOpenCents: number; // som van alle amountCents
  overdueCents: number; // som van amountCents waar bucket !== "notDue"
  overdueCount: number; // aantal rijen waar bucket !== "notDue"
}

/** Bouwt een ouderdomsanalyse over een lijst openstaande facturen. */
export function buildAgingReport(invoices: readonly OpenInvoice[], now: Date): AgingReport {
  const rows: AgingRow[] = invoices.map((inv) => ({
    ...inv,
    bucket: agingBucketKey(inv.dueAt, now),
    daysOverdue: daysOverdue(inv.dueAt, now),
  }));

  // Sorteren: daysOverdue aflopend, dan amountCents aflopend.
  rows.sort((a, b) => {
    if (b.daysOverdue !== a.daysOverdue) return b.daysOverdue - a.daysOverdue;
    return b.amountCents - a.amountCents;
  });

  // Alle 5 buckets opbouwen (ook lege).
  const bucketMap = new Map<AgingBucketKey, AgingBucketTotal>();
  for (const { key, label } of AGING_BUCKETS) {
    bucketMap.set(key, { key, label, totalCents: 0, count: 0 });
  }
  for (const row of rows) {
    const bucket = bucketMap.get(row.bucket)!;
    bucket.totalCents += row.amountCents;
    bucket.count += 1;
  }
  const buckets = AGING_BUCKETS.map(({ key }) => bucketMap.get(key)!);

  const totalOpenCents = rows.reduce((sum, r) => sum + r.amountCents, 0);
  const overdueRows = rows.filter((r) => r.bucket !== "notDue");
  const overdueCents = overdueRows.reduce((sum, r) => sum + r.amountCents, 0);
  const overdueCount = overdueRows.length;

  return { rows, buckets, totalOpenCents, overdueCents, overdueCount };
}

/** CSV-export van de openstaande posten. Kop: nummer;tegenpartij;opdracht;vervaldatum;dagen_te_laat;bucket;bedrag */
export function agingCsv(report: AgingReport): string {
  const header = [
    "nummer",
    "tegenpartij",
    "opdracht",
    "vervaldatum",
    "dagen_te_laat",
    "bucket",
    "bedrag",
  ];
  const body = report.rows.map((r) => {
    const bucketLabel = AGING_BUCKETS.find((b) => b.key === r.bucket)!.label;
    return [
      r.number,
      r.counterpartyName,
      r.jobTitle ?? "",
      r.dueAt ? r.dueAt.toISOString().slice(0, 10) : "",
      r.daysOverdue,
      bucketLabel,
      centsToEuroPlain(r.amountCents),
    ];
  });
  return toCsv([header, ...body]);
}
