// Leveringsbetrouwbaarheidssignaal voor een ZZP'er — afgeleid van goedgekeurde prestaties en
// afgeronde samenwerkingen. Pure helpers (los testbaar) + één DB-functie. Geen mutaties.

import { prisma } from "@/lib/db";
import { ratePercent } from "@/lib/freelancer-stats";

export const DELIVERY_MIN_SAMPLE = 3;

export type DeliveryTone = "EXCELLENT" | "RELIABLE" | "DEVELOPING" | "INSUFFICIENT";

export const DELIVERY_TONE_LABEL: Record<DeliveryTone, string> = {
  EXCELLENT: "Uitstekend",
  RELIABLE: "Betrouwbaar",
  DEVELOPING: "In ontwikkeling",
  INSUFFICIENT: "Te weinig gegevens",
};

export interface ApprovedPerfRow {
  submittedAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
}

export interface DeliveryQuality {
  /** Afgeronde samenwerkingen — de ervaringsbasis. */
  completedCollaborations: number;
  /** Goedgekeurde prestaties = de steekproef voor het signaal. */
  approvedPerformances: number;
  /** % goedgekeurd zonder eerdere afkeuring (0–100; 0 bij lege steekproef). */
  firstTimeRightRate: number;
  /** Aantal goedgekeurde prestaties die eerst zijn afgekeurd. */
  correctedPerformances: number;
  /** Gem. doorlooptijd indienen→goedkeuren in dagen (1 decimaal), of null. */
  avgApprovalDays: number | null;
  tone: DeliveryTone;
}

/** Hele/fractionele dagen tussen indienen en goedkeuren; null als een van beide ontbreekt of approve < submit. */
export function approvalDays(submittedAt: Date | null, approvedAt: Date | null): number | null {
  if (submittedAt === null || approvedAt === null) return null;
  const diffMs = approvedAt.getTime() - submittedAt.getTime();
  if (diffMs < 0) return null;
  return Math.round((diffMs / 86_400_000) * 10) / 10;
}

/** Tone-grenzen: te weinig steekproef → INSUFFICIENT; anders op first-time-right %. */
export function deliveryTone(
  approvedPerformances: number,
  firstTimeRightRate: number,
): DeliveryTone {
  if (approvedPerformances < DELIVERY_MIN_SAMPLE) return "INSUFFICIENT";
  if (firstTimeRightRate >= 90) return "EXCELLENT";
  if (firstTimeRightRate >= 70) return "RELIABLE";
  return "DEVELOPING";
}

/** Pure aggregator over de goedgekeurde prestaties + het aantal afgeronde samenwerkingen. */
export function computeDeliveryQuality(
  approvedRows: ApprovedPerfRow[],
  completedCollaborations: number,
): DeliveryQuality {
  const approvedPerformances = approvedRows.length;
  const correctedPerformances = approvedRows.filter((r) => r.rejectedAt !== null).length;
  const firstTimeRight = approvedRows.filter((r) => r.rejectedAt === null).length;
  const firstTimeRightRate = ratePercent(firstTimeRight, approvedPerformances);

  const dayValues = approvedRows
    .map((r) => approvalDays(r.submittedAt, r.approvedAt))
    .filter((d): d is number => d !== null);

  const avgApprovalDays =
    dayValues.length > 0
      ? Math.round((dayValues.reduce((sum, d) => sum + d, 0) / dayValues.length) * 10) / 10
      : null;

  const tone = deliveryTone(approvedPerformances, firstTimeRightRate);

  return {
    completedCollaborations,
    approvedPerformances,
    firstTimeRightRate,
    correctedPerformances,
    avgApprovalDays,
    tone,
  };
}

/** DB: signaal voor de ingelogde ZZP'er, of null als er geen freelancer-profiel is. */
export async function getDeliveryQuality(userId: string): Promise<DeliveryQuality | null> {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return null;

  const [completedCount, rows] = await Promise.all([
    prisma.collaboration.count({
      where: { freelancerId: profile.id, status: "COMPLETED" },
    }),
    prisma.performance.findMany({
      where: { collaboration: { freelancerId: profile.id }, status: "APPROVED" },
      select: { submittedAt: true, approvedAt: true, rejectedAt: true },
      // Ruime cap: het leverbetrouwbaarheid-signaal is een aggregaat; een drukke ZZP'er mag
      // de server-memory niet onbegrensd belasten (geen take = potentieel duizenden rijen).
      take: 1000,
    }),
  ]);

  return computeDeliveryQuality(rows, completedCount);
}
