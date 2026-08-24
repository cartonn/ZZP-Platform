// Listing-kwaliteit voor een gepubliceerde opdracht (eigenaar-blik). Projecteert de bestaande
// `assessJobQuality` op alléén de listing-dimensies (titel/omschrijving/branche/skills/startdatum/
// locatie) — de tarief-dimensies blijven bewust buiten beschouwing omdat het opdracht-detail die al
// via de vacaturetempo-/tarief-diagnose toont (geen dubbele tarief-tip). Eén bron van waarheid: de
// checks komen uit `assessJobQuality`, deze helper filtert en herordent alleen. Puur en getest.

import { assessJobQuality, type JobQualityInput } from "@/lib/job-quality";

/** De niet-tarief checks uit `assessJobQuality` die de kwaliteit van de plaatsing zelf beschrijven. */
export const LISTING_QUALITY_CHECK_CODES = [
  "title",
  "description",
  "industry",
  "skills",
  "startDate",
  "location",
] as const;

/** Minimale opdracht-vorm die nodig is om de listing-kwaliteit te beoordelen. */
export interface JobListingForQuality {
  title: string;
  description: string;
  industryId: string | null;
  location: string | null;
  /** ONSITE | HYBRID | REMOTE. */
  workMode: string;
  /** Is er een startdatum gezet? */
  hasStartDate: boolean;
  /** Aantal als vereist gemarkeerde skills. */
  requiredSkillCount: number;
}

export interface ListingQualityTip {
  /** Stabiele code (spiegelt `assessJobQuality`) voor tests/telemetrie. */
  code: string;
  /** Korte omschrijving van het onderdeel. */
  label: string;
  /** Concrete verbeter-tip. */
  tip: string;
}

export interface JobListingQuality {
  /** Openstaande listing-tips, sterkste (zwaarst wegend) eerst. */
  openTips: ListingQualityTip[];
  /** Aantal voldane listing-onderdelen. */
  doneCount: number;
  /** Totaal aantal listing-onderdelen. */
  total: number;
  /** Alle listing-onderdelen ingevuld? Dan is er niets te tonen. */
  complete: boolean;
}

/**
 * Beoordeel de listing-kwaliteit van een opdracht. Deterministisch: dezelfde invoer levert altijd
 * hetzelfde resultaat. De tarief-checks worden buiten beschouwing gelaten (`rateMinEuro`/
 * `marketMedianEuro` op null → niet-van-toepassing), zodat de tarief-advisering exclusief bij de
 * vacaturetempo-/tarief-diagnose blijft.
 */
export function assessJobListingQuality(job: JobListingForQuality): JobListingQuality {
  const input: JobQualityInput = {
    title: job.title,
    description: job.description,
    rateMinEuro: null,
    industryId: job.industryId ?? "",
    location: job.location ?? "",
    workMode: job.workMode,
    startDate: job.hasStartDate ? "set" : "",
    requiredSkillCount: job.requiredSkillCount,
    marketMedianEuro: null,
  };

  const codes: readonly string[] = LISTING_QUALITY_CHECK_CODES;
  const listingChecks = assessJobQuality(input).checks.filter((c) => codes.includes(c.code));

  const openTips: ListingQualityTip[] = listingChecks
    .filter((c) => !c.done && c.tip !== null)
    .sort((a, b) => b.weight - a.weight)
    .map((c) => ({ code: c.code, label: c.label, tip: c.tip as string }));

  const doneCount = listingChecks.filter((c) => c.done).length;

  return {
    openTips,
    doneCount,
    total: listingChecks.length,
    complete: openTips.length === 0,
  };
}
