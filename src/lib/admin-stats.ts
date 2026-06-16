// Platform-brede statistieken voor admins. Pure helpers zijn testbaar zonder DB.
// Alle queries zijn lees-only; geen schrijfacties.

import { prisma } from "@/lib/db";
import {
  type VerificationQueueHealth,
  daysWaiting,
  staleThreshold,
} from "@/lib/verification-queue";
import { type DisputeHealth, disputeAgeDays, disputeUrgentThreshold } from "@/lib/disputes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserStats {
  total: number;
  freelancers: number;
  clients: number;
  admins: number;
  suspended: number;
}

export interface CollaborationStats {
  total: number;
  proposed: number;
  active: number;
  completed: number;
  cancelled: number;
  disputed: number;
}

export interface PerformanceStats {
  total: number;
  pending: number; // SUBMITTED — wachten op goedkeuring
  approved: number;
  rejected: number;
}

export interface InvoiceStats {
  total: number;
  cascadeCount: number; // facturen met lifecycleStatus (overhaul)
  pendingApproval: number; // cascade SUBMITTED of APPROVED (nog niet verwerkt)
  processed: number; // lifecycle PROCESSED
  totalProcessedCents: number;
}

export interface PlatformStats {
  users: UserStats;
  collaborations: CollaborationStats;
  performances: PerformanceStats;
  invoices: InvoiceStats;
  verificationQueue: VerificationQueueHealth;
  disputes: DisputeHealth;
}

// ---------------------------------------------------------------------------
// Pure helpers (testbaar zonder DB)
// ---------------------------------------------------------------------------

/**
 * Berekent het goedkeuringspercentage. Geeft 0 terug als total 0 is (geen data).
 */
export function approvalRate(approved: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((approved / total) * 100);
}

/**
 * Aandeel van een deelgroep als percentage van het totaal.
 * Geeft 0 terug als total 0 is.
 */
export function sharePercent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Formatteer cents als EUR-bedrag (bv. 123456 → "€ 1.234,56").
 */
export function formatStatsEuro(cents: number): string {
  const euros = cents / 100;
  return `€ ${euros.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// DB-query
// ---------------------------------------------------------------------------

export async function getPlatformStats(): Promise<PlatformStats> {
  const now = new Date();
  const [
    userRows,
    suspendedCount,
    collabRaw,
    disputedCount,
    perfRaw,
    invoiceTotal,
    cascadeCount,
    invoicePendingApproval,
    invoiceProcessed,
    processedSum,
    pendingVerifications,
    oldestVerification,
    staleVerifications,
    openDisputes,
    oldestDispute,
    urgentDisputes,
  ] = await Promise.all([
    // Gebruikers per rol
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    // Geschorste gebruikers
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    // Samenwerkingen per status
    prisma.collaboration.groupBy({ by: ["status"], _count: { _all: true } }),
    // Samenwerkingen met dispuut (disputedAt is niet null)
    prisma.collaboration.count({ where: { disputedAt: { not: null } } }),
    // Prestaties per status
    prisma.performance.groupBy({ by: ["status"], _count: { _all: true } }),
    // Facturen totaal
    prisma.invoice.count(),
    // Cascade-facturen (hebben lifecycleStatus)
    prisma.invoice.count({ where: { lifecycleStatus: { not: null } } }),
    // Cascade-facturen die nog niet verwerkt zijn (SUBMITTED of APPROVED)
    prisma.invoice.count({
      where: { lifecycleStatus: { in: ["SUBMITTED", "APPROVED"] } },
    }),
    // Verwerkte cascade-facturen
    prisma.invoice.count({ where: { lifecycleStatus: "PROCESSED" } }),
    // Totaalbedrag verwerkte cascade-facturen
    prisma.invoice.aggregate({
      where: { lifecycleStatus: "PROCESSED" },
      _sum: { totalCents: true },
    }),
    // Openstaande certificaat-verificaties
    prisma.credential.count({ where: { status: "SUBMITTED" } }),
    // Langst wachtende aanvraag (alleen het indientijdstip nodig)
    prisma.credential.findFirst({
      where: { status: "SUBMITTED" },
      orderBy: { updatedAt: "asc" },
      select: { updatedAt: true },
    }),
    // Aanvragen die al te lang wachten (>= VERIFICATION_STALE_DAYS) — goedkope count
    prisma.credential.count({
      where: { status: "SUBMITTED", updatedAt: { lte: staleThreshold(now) } },
    }),
    // Open disputen (samenwerking met disputedAt)
    prisma.collaboration.count({ where: { disputedAt: { not: null }, status: "ACTIVE" } }),
    // Langst openstaande dispuut (alleen het anker nodig)
    prisma.collaboration.findFirst({
      where: { disputedAt: { not: null }, status: "ACTIVE" },
      orderBy: { disputedAt: "asc" },
      select: { disputedAt: true },
    }),
    // Disputen die al >= urgentDays openstaan (URGENT) — goedkope count
    prisma.collaboration.count({
      where: {
        status: "ACTIVE",
        disputedAt: { not: null, lte: disputeUrgentThreshold(now) },
      },
    }),
  ]);

  // Rol-verdeling
  const roleMap = Object.fromEntries(userRows.map((r) => [r.role, r._count._all]));
  const userTotal = userRows.reduce((s, r) => s + r._count._all, 0);

  // Samenwerkingen per status
  const collabMap = Object.fromEntries(collabRaw.map((r) => [r.status, r._count._all]));
  const collabTotal = collabRaw.reduce((s, r) => s + r._count._all, 0);

  // Prestaties per status
  const perfMap = Object.fromEntries(perfRaw.map((r) => [r.status, r._count._all]));
  const perfTotal = perfRaw.reduce((s, r) => s + r._count._all, 0);

  return {
    users: {
      total: userTotal,
      freelancers: roleMap["FREELANCER"] ?? 0,
      clients: roleMap["CLIENT"] ?? 0,
      admins: roleMap["ADMIN"] ?? 0,
      suspended: suspendedCount,
    },
    collaborations: {
      total: collabTotal,
      proposed: collabMap["PROPOSED"] ?? 0,
      active: collabMap["ACTIVE"] ?? 0,
      completed: collabMap["COMPLETED"] ?? 0,
      cancelled: collabMap["CANCELLED"] ?? 0,
      disputed: disputedCount,
    },
    performances: {
      total: perfTotal,
      pending: perfMap["SUBMITTED"] ?? 0,
      approved: perfMap["APPROVED"] ?? 0,
      rejected: perfMap["REJECTED"] ?? 0,
    },
    invoices: {
      total: invoiceTotal,
      cascadeCount,
      pendingApproval: invoicePendingApproval,
      processed: invoiceProcessed,
      totalProcessedCents: processedSum._sum.totalCents ?? 0,
    },
    verificationQueue: {
      pending: pendingVerifications,
      oldestDays: oldestVerification ? daysWaiting(oldestVerification.updatedAt, now) : 0,
      staleCount: staleVerifications,
    },
    disputes: {
      open: openDisputes,
      oldestAgeDays: oldestDispute?.disputedAt ? disputeAgeDays(oldestDispute.disputedAt, now) : 0,
      urgentCount: urgentDisputes,
    },
  };
}
