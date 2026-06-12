// Dispuut-overzicht voor beheerders: laad alle samenwerkingen met een open dispuut,
// bereken urgentie op basis van openstaande dagen, en bied helpers voor sortering
// en samenvatting. Zolang een dispuut openstaat ligt de betalingscascade stil.

import { prisma } from "@/lib/db";

export const DISPUTE_URGENCY_LEVELS = ["URGENT", "VERHOOGD", "NORMAAL"] as const;
export type DisputeUrgency = (typeof DISPUTE_URGENCY_LEVELS)[number];

// Drempels in dagen-openstaand (configureerbaar via constanten). Hoe langer een dispuut
// bevroren blijft, hoe urgenter — de cascade (en dus betaling) staat stil tot bemiddeling.
export const DISPUTE_URGENCY_THRESHOLDS = {
  raisedDays: 3, // vanaf 3 dagen open → VERHOOGD
  urgentDays: 7, // vanaf 7 dagen open → URGENT
} as const;

export interface DisputeRow {
  collaborationId: string;
  jobTitle: string;
  companyName: string;
  freelancerName: string;
  disputedAt: Date;
  disputeReason: string | null;
  ageDays: number;
  urgency: DisputeUrgency;
}

export interface DisputeSummary {
  total: number;
  byUrgency: Record<DisputeUrgency, number>; // alle drie niveaus altijd aanwezig (ook 0)
  oldestAgeDays: number; // 0 als de lijst leeg is
}

/**
 * Hele dagen dat het dispuut openstaat: nooit negatief (toekomstige/now → 0); floor.
 * Standaard vergelijkt met de huidige systeemtijd.
 */
export function disputeAgeDays(disputedAt: Date, now?: Date): number {
  const reference = now ?? new Date();
  const diffMs = reference.getTime() - disputedAt.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Bepaal urgentie op basis van het aantal openstaande dagen:
 * ageDays >= urgentDays → URGENT; >= raisedDays → VERHOOGD; anders NORMAAL.
 */
export function disputeUrgency(ageDays: number): DisputeUrgency {
  if (ageDays >= DISPUTE_URGENCY_THRESHOLDS.urgentDays) return "URGENT";
  if (ageDays >= DISPUTE_URGENCY_THRESHOLDS.raisedDays) return "VERHOOGD";
  return "NORMAAL";
}

/** Numerieke rangorde: URGENT=0, VERHOOGD=1, NORMAAL=2 (lager = hogere prioriteit). */
export function rankDisputeUrgency(level: DisputeUrgency): number {
  switch (level) {
    case "URGENT":
      return 0;
    case "VERHOOGD":
      return 1;
    case "NORMAAL":
      return 2;
  }
}

/**
 * Sorteer: urgentste eerst; bij gelijk niveau de oudste eerst (ageDays desc).
 * Pure — muteert de invoer-array niet.
 */
export function sortDisputeRows(rows: readonly DisputeRow[]): DisputeRow[] {
  return [...rows].sort((a, b) => {
    const rankDiff = rankDisputeUrgency(a.urgency) - rankDisputeUrgency(b.urgency);
    if (rankDiff !== 0) return rankDiff;
    return b.ageDays - a.ageDays; // oudste (hoogste ageDays) eerst
  });
}

/**
 * Tel totalen en aantal per urgentieniveau. Alle drie niveaus zijn altijd aanwezig
 * (ook als 0), zodat de UI altijd een volledig overzicht heeft.
 * oldestAgeDays is 0 als de lijst leeg is.
 */
export function summarizeDisputes(rows: readonly DisputeRow[]): DisputeSummary {
  const byUrgency: Record<DisputeUrgency, number> = {
    URGENT: 0,
    VERHOOGD: 0,
    NORMAAL: 0,
  };
  let oldestAgeDays = 0;
  for (const row of rows) {
    byUrgency[row.urgency] += 1;
    if (row.ageDays > oldestAgeDays) oldestAgeDays = row.ageDays;
  }
  return { total: rows.length, byUrgency, oldestAgeDays };
}

/**
 * Bouw een DisputeRow uit ruwe velden + now (berekent ageDays + urgency). Pure.
 */
export function buildDisputeRow(
  input: {
    collaborationId: string;
    jobTitle: string;
    companyName: string;
    freelancerName: string;
    disputedAt: Date;
    disputeReason: string | null;
  },
  now?: Date,
): DisputeRow {
  const ageDays = disputeAgeDays(input.disputedAt, now);
  return {
    ...input,
    ageDays,
    urgency: disputeUrgency(ageDays),
  };
}

/**
 * DB I/O (dunne laag, niet unit-getest): laad alle samenwerkingen met een open dispuut
 * en geef gesorteerde rows terug (urgentste eerst).
 */
export async function loadDisputeOverview(now?: Date): Promise<DisputeRow[]> {
  const disputed = await prisma.collaboration.findMany({
    where: { disputedAt: { not: null } },
    select: {
      id: true,
      disputedAt: true,
      disputeReason: true,
      job: { select: { title: true } },
      company: { select: { name: true } },
      freelancer: { select: { user: { select: { name: true } } } },
    },
  });

  const rows: DisputeRow[] = disputed.map((c) =>
    buildDisputeRow(
      {
        collaborationId: c.id,
        jobTitle: c.job.title,
        companyName: c.company.name,
        freelancerName: c.freelancer.user.name ?? "ZZP'er",
        disputedAt: c.disputedAt!,
        disputeReason: c.disputeReason,
      },
      now,
    ),
  );

  return sortDisputeRows(rows);
}
