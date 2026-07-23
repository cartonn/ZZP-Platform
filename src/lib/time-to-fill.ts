// Tijd-tot-plaatsing (time-to-fill) voor de OPDRACHTGEVER: hoe lang duurt het gemiddeld van
// publicatie van een opdracht tot de eerste échte plaatsing? Waar `client-stats.ts` de
// vervullingsgraad geeft (wélk deel van de opdrachten een plaatsing kreeg — de uitkomst) en
// `job-vacancy-performance.ts` het reactietempo per losse opdracht toont (hoe snel er gereageerd
// wordt), vat dit de doorlooptijd over de portefeuille samen: de klassieke ATS-metriek time-to-fill
// (benchmark Temper/Malt/recruitmentdashboards). Zo ziet de opdrachtgever niet alleen óf zijn
// opdrachten vervuld raken, maar hoe snel — een signaal om tarief/eisen bij te sturen.
//
// Pure, deterministische afleiding uit reeds-aanwezige timestamps (`Job.publishedAt`/`createdAt` en
// het aanmaakmoment van de eerste ACTIVE/COMPLETED samenwerking). Server-side is de waarheid
// (CLAUDE.md regel 1): de client toont het getal, berekent het nooit zelf. Toont uitsluitend een
// geaggregeerd portefeuillegetal — nooit identiteit van kandidaten of individuele opdrachtdetails.

import { prisma } from "@/lib/db";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Minimale steekproef vóór een gemiddelde wordt getoond. Eén plaatsing zou een misleidend "gemiddelde"
 * uit één datapunt opleveren; vanaf twee vervulde opdrachten is de mediaan betekenisvol.
 */
export const TIME_TO_FILL_MIN_SAMPLE = 2;

/** Maximaal aantal opdrachten dat de loader meeneemt — begrenst de query (grote portefeuilles). */
export const TIME_TO_FILL_MAX_JOBS = 500;

export interface FilledJobTiming {
  /** Moment waarop de opdracht open ging (publicatie; de loader valt terug op createdAt). */
  openedAt: Date;
  /** Aanmaakmoment van de eerste ACTIVE/COMPLETED samenwerking op de opdracht (de plaatsing). */
  placedAt: Date;
}

export interface TimeToFillSummary {
  /** Mediane doorlooptijd in hele dagen (robuuster dan het gemiddelde tegen uitschieters). */
  medianDays: number;
  /** Aantal vervulde opdrachten in de berekening. */
  sampleSize: number;
  /** Snelste doorlooptijd in hele dagen. */
  fastestDays: number;
}

/** Mediaan van een oplopend-gesorteerde, niet-lege lijst gehele getallen (even lengte → afgerond gemiddelde). */
function medianOfSorted(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Vat de doorlooptijd van open naar plaatsing samen. Negatieve doorlooptijden (inconsistente
 * timestamps: plaatsing vóór publicatie) worden defensief genegeerd. Onder `minSample` vervulde
 * opdrachten → `null` (geen misleidend gemiddelde uit te weinig historie).
 */
export function summarizeTimeToFill(
  rows: FilledJobTiming[],
  minSample: number = TIME_TO_FILL_MIN_SAMPLE,
): TimeToFillSummary | null {
  const days = rows
    .map((r) => Math.floor((r.placedAt.getTime() - r.openedAt.getTime()) / MS_PER_DAY))
    .filter((d) => Number.isFinite(d) && d >= 0)
    .sort((a, b) => a - b);
  if (days.length < minSample) return null;
  return {
    medianDays: medianOfSorted(days),
    sampleSize: days.length,
    fastestDays: days[0],
  };
}

/**
 * Laadt de time-to-fill voor de ingelogde opdrachtgever, of `null` bij geen bedrijfsprofiel of te
 * weinig vervulde opdrachten. Scoping op de eigen company (geen cijfers van andere opdrachtgevers).
 * Eén begrensde query: per opdracht de vroegste ACTIVE/COMPLETED-samenwerking als plaatsingsmoment.
 */
export async function getClientTimeToFill(userId: string): Promise<TimeToFillSummary | null> {
  const company = await prisma.company.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!company) return null;

  const jobs = await prisma.job.findMany({
    where: {
      companyId: company.id,
      status: { in: ["PUBLISHED", "CLOSED"] },
      collaborations: { some: { status: { in: ["ACTIVE", "COMPLETED"] } } },
    },
    select: {
      createdAt: true,
      publishedAt: true,
      collaborations: {
        where: { status: { in: ["ACTIVE", "COMPLETED"] } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    take: TIME_TO_FILL_MAX_JOBS,
  });

  const rows: FilledJobTiming[] = jobs.flatMap((job) => {
    const placedAt = job.collaborations[0]?.createdAt;
    if (!placedAt) return [];
    return [{ openedAt: job.publishedAt ?? job.createdAt, placedAt }];
  });

  return summarizeTimeToFill(rows);
}
