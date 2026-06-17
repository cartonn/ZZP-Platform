// Leverbetrouwbaarheid van de ZZP'ers van een opdrachtgever — geaggregeerd over alle
// samenwerkingen van de opdrachtgever. Spiegel van het FREELANCER-signaal in
// `collaboration-quality.ts`: daar ziet de ZZP'er zíjn eigen betrouwbaarheid, hier ziet de
// opdrachtgever hoe betrouwbaar zíjn ZZP'ers leveren. Hergebruikt dezelfde geteste, pure
// aggregator (`computeDeliveryQuality`) zodat beide kanten exact dezelfde maatstaf gebruiken.
// Read-only, deterministisch, geen mutaties.

import { prisma } from "@/lib/db";
import {
  type DeliveryQuality,
  DELIVERY_MIN_SAMPLE,
  computeDeliveryQuality,
} from "@/lib/collaboration-quality";

/** Ruime cap, gelijk aan `getDeliveryQuality`: het signaal is een aggregaat; voorkom onbegrensde load. */
const CLIENT_RELIABILITY_PERF_CAP = 1000;

/**
 * Korte NL-toelichting bij het signaal voor de opdrachtgever. Pure functie (los testbaar):
 * bij te kleine steekproef een eerlijke "nog te weinig"-tekst, anders het first-time-right-cijfer
 * met — indien van toepassing — een noot over gecorrigeerde prestaties.
 */
export function clientReliabilityCaption(quality: DeliveryQuality): string {
  if (quality.approvedPerformances < DELIVERY_MIN_SAMPLE) {
    return `Nog te weinig goedgekeurde prestaties (minimaal ${DELIVERY_MIN_SAMPLE}) voor een betrouwbaar beeld.`;
  }
  const base = `${quality.firstTimeRightRate}% van de goedgekeurde prestaties was in één keer akkoord`;
  if (quality.correctedPerformances === 0) {
    return `${base} — geen enkele hoefde te worden gecorrigeerd.`;
  }
  const noun = quality.correctedPerformances === 1 ? "prestatie werd" : "prestaties werden";
  return `${base}; ${quality.correctedPerformances} ${noun} eerst afgekeurd en daarna hersteld.`;
}

/**
 * DB: leverbetrouwbaarheid-signaal voor de ingelogde opdrachtgever, geaggregeerd over álle
 * goedgekeurde prestaties en afgeronde samenwerkingen onder zijn bedrijf. Scope leunt op de
 * `collaboration.company.userId`-keten (gelijk aan `getPrestatiesForClient`). Geen company →
 * geen samenwerkingen → een leeg (INSUFFICIENT) signaal.
 */
export async function getClientDeliveryReliability(userId: string): Promise<DeliveryQuality> {
  const [completedCount, rows] = await Promise.all([
    prisma.collaboration.count({
      where: { company: { userId }, status: "COMPLETED" },
    }),
    prisma.performance.findMany({
      where: { collaboration: { company: { userId } }, status: "APPROVED" },
      select: { submittedAt: true, approvedAt: true, rejectedAt: true },
      take: CLIENT_RELIABILITY_PERF_CAP,
    }),
  ]);

  return computeDeliveryQuality(rows, completedCount);
}
