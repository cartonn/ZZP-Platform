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
  counterpartyId?: string | null; // stabiele id van de tegenpartij (Company/Freelancer) — groepeer-sleutel
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

/** Openstaand samengevat per tegenpartij (debiteur/crediteur) — relatiegericht overzicht. */
export interface RelationSummary {
  counterpartyId: string | null; // stabiele id indien bekend, anders null (op naam gegroepeerd)
  counterpartyName: string;
  totalOpenCents: number; // som van alle openstaande facturen van deze relatie
  overdueCents: number; // waarvan te laat (bucket !== "notDue")
  count: number; // aantal openstaande facturen
  overdueCount: number; // aantal te late facturen
  maxDaysOverdue: number; // langst openstaande factuur van deze relatie (0 = niets te laat)
  worstBucket: AgingBucketKey; // zwaarste bucket die deze relatie raakt
}

export interface AgingReport {
  rows: AgingRow[]; // gesorteerd op daysOverdue aflopend (meest te laat eerst), dan amountCents aflopend
  buckets: AgingBucketTotal[]; // altijd alle 5 in AGING_BUCKETS-volgorde
  relations: RelationSummary[]; // per tegenpartij, gesorteerd op te-laat-bedrag dan openstaand bedrag (aflopend)
  totalOpenCents: number; // som van alle amountCents
  overdueCents: number; // som van amountCents waar bucket !== "notDue"
  overdueCount: number; // aantal rijen waar bucket !== "notDue"
}

// Rang van een bucket voor "zwaarste bucket" (hoger = erger).
const BUCKET_RANK: Record<AgingBucketKey, number> = {
  notDue: 0,
  d0_30: 1,
  d31_60: 2,
  d61_90: 3,
  d90plus: 4,
};

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

  // Per-relatie-rollup: groepeer op stabiele id indien bekend, anders op naam (voorkomt dat twee
  // relaties met dezelfde naam samenvallen). De naam is puur weergave; de sleutel bepaalt de groep.
  const relationMap = new Map<string, RelationSummary>();
  for (const row of rows) {
    const key = row.counterpartyId ? `id:${row.counterpartyId}` : `name:${row.counterpartyName}`;
    const isOverdue = row.bucket !== "notDue";
    let relation = relationMap.get(key);
    if (!relation) {
      relation = {
        counterpartyId: row.counterpartyId ?? null,
        counterpartyName: row.counterpartyName,
        totalOpenCents: 0,
        overdueCents: 0,
        count: 0,
        overdueCount: 0,
        maxDaysOverdue: 0,
        worstBucket: "notDue",
      };
      relationMap.set(key, relation);
    }
    relation.totalOpenCents += row.amountCents;
    relation.count += 1;
    if (isOverdue) {
      relation.overdueCents += row.amountCents;
      relation.overdueCount += 1;
    }
    if (row.daysOverdue > relation.maxDaysOverdue) relation.maxDaysOverdue = row.daysOverdue;
    if (BUCKET_RANK[row.bucket] > BUCKET_RANK[relation.worstBucket]) {
      relation.worstBucket = row.bucket;
    }
  }
  // Meest te laat eerst, dan grootste openstaande bedrag, dan naam (stabiel/deterministisch).
  const relations = [...relationMap.values()].sort((a, b) => {
    if (b.overdueCents !== a.overdueCents) return b.overdueCents - a.overdueCents;
    if (b.totalOpenCents !== a.totalOpenCents) return b.totalOpenCents - a.totalOpenCents;
    return a.counterpartyName.localeCompare(b.counterpartyName, "nl");
  });

  return { rows, buckets, relations, totalOpenCents, overdueCents, overdueCount };
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
