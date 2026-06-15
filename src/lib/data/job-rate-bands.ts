import "server-only";
import { prisma } from "@/lib/db";
import { MARKET_RATE_MIN_SAMPLE, MARKET_RATE_SAMPLE_CAP } from "@/lib/config";
import { computeMarketBand, type MarketBand } from "@/lib/market-rate";

/**
 * Marktbanden voor het opdracht-formulier: per branche één band plus een
 * platformbrede band als terugval (bijv. wanneer nog geen branche is gekozen).
 *
 * De banden zijn server-side berekend en geanonimiseerd (k-anonimiteitsdrempel
 * `MARKET_RATE_MIN_SAMPLE`); de client toont ze alleen. De band per branche valt
 * intern al terug op het platform wanneer er te weinig branche-peers zijn — zie
 * `computeMarketBand`.
 */
export interface JobRateBands {
  /** Band per branche-id (met platform-terugval ingebakken). */
  byIndustry: Record<string, MarketBand>;
  /** Platformbrede band (terugval wanneer geen branche is gekozen). */
  platform: MarketBand;
}

/**
 * Laadt de uurtarieven van ZZP'ers (in euro) en bouwt per branche een marktband.
 *
 * Eén begrensde query (`take: MARKET_RATE_SAMPLE_CAP`); tarieven worden in JS per
 * branche gebucket. Alleen geaggregeerde statistieken verlaten de functie — geen
 * individueel tarief is herleidbaar.
 */
export async function getJobRateBands(industryIds: string[]): Promise<JobRateBands> {
  const profiles = await prisma.freelancerProfile.findMany({
    where: { hourlyRate: { not: null } },
    select: { hourlyRate: true, industries: { select: { industryId: true } } },
    take: MARKET_RATE_SAMPLE_CAP,
  });

  const platformRates: number[] = [];
  const ratesByIndustry = new Map<string, number[]>();

  for (const profile of profiles) {
    const rate = profile.hourlyRate;
    if (rate === null) continue;
    platformRates.push(rate);
    for (const { industryId } of profile.industries) {
      const bucket = ratesByIndustry.get(industryId);
      if (bucket) bucket.push(rate);
      else ratesByIndustry.set(industryId, [rate]);
    }
  }

  const byIndustry: Record<string, MarketBand> = {};
  for (const id of industryIds) {
    byIndustry[id] = computeMarketBand({
      industryPeerRates: ratesByIndustry.get(id) ?? [],
      platformPeerRates: platformRates,
      minSample: MARKET_RATE_MIN_SAMPLE,
    });
  }

  const platform = computeMarketBand({
    industryPeerRates: [],
    platformPeerRates: platformRates,
    minSample: MARKET_RATE_MIN_SAMPLE,
  });

  return { byIndustry, platform };
}
