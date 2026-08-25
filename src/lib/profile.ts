// Profiel-logica: server-berekende compleetheid en zichtbaarheidsregels.
// Server-side is de waarheid (CLAUDE.md regel 1): de client toont compleetheid en
// verbergt nooit zelf privéprofielen — dat doet de server. Pure functies, getest.

import { type Actor } from "@/lib/authz";
import { type Availability, type Visibility } from "@/lib/enums";

export interface CompletenessInput {
  headline?: string | null;
  bio?: string | null;
  hourlyRate?: number | null;
  location?: string | null;
  availability: Availability;
  languages: readonly string[];
  skillCount: number;
  industryCount: number;
}

interface Criterion {
  key: string;
  label: string;
  weight: number;
  done: (i: CompletenessInput) => boolean;
}

const CRITERIA: readonly Criterion[] = [
  { key: "headline", label: "Functietitel", weight: 20, done: (i) => !!i.headline?.trim() },
  { key: "bio", label: "Korte bio", weight: 15, done: (i) => !!i.bio?.trim() },
  {
    key: "hourlyRate",
    label: "Uurtarief",
    weight: 15,
    done: (i) => i.hourlyRate != null && i.hourlyRate > 0,
  },
  { key: "location", label: "Locatie", weight: 10, done: (i) => !!i.location?.trim() },
  {
    key: "availability",
    label: "Beschikbaarheid",
    weight: 10,
    done: (i) => i.availability !== "UNKNOWN",
  },
  { key: "languages", label: "Talen", weight: 10, done: (i) => i.languages.length > 0 },
  { key: "skills", label: "Minstens één skill", weight: 15, done: (i) => i.skillCount > 0 },
  { key: "industries", label: "Minstens één branche", weight: 5, done: (i) => i.industryCount > 0 },
];

export interface CompletenessMissingItem {
  key: string;
  label: string;
  /** Puntenwinst (0-100) die dit onderdeel oplevert wanneer het wordt ingevuld. */
  points: number;
}

export interface CompletenessResult {
  score: number; // 0-100
  missing: CompletenessMissingItem[];
}

/** Server-berekende profiel-compleetheid (0-100) + lijst ontbrekende onderdelen. */
export function computeFreelancerCompleteness(input: CompletenessInput): CompletenessResult {
  let score = 0;
  const missing: CompletenessMissingItem[] = [];
  for (const c of CRITERIA) {
    if (c.done(input)) {
      score += c.weight;
    } else {
      missing.push({ key: c.key, label: c.label, points: c.weight });
    }
  }
  return { score: Math.min(100, score), missing };
}

/**
 * Deep-link-ankers naar het edit-formulier per compleetheids-onderdeel. Eén bron van waarheid,
 * gekoppeld aan de veld-`id`s in `profiel/profile-form.tsx`, zodat een verbeterstap de eigenaar
 * rechtstreeks naar het juiste veld brengt (geen dode knop). Ontbreekt een sleutel → geen anker
 * (val terug op de kale bewerk-pagina).
 */
export const PROFILE_COMPLETENESS_ANCHORS: Readonly<Record<string, string>> = {
  headline: "headline",
  bio: "bio",
  hourlyRate: "hourlyRate",
  location: "location",
  availability: "availability",
  languages: "languages",
  skills: "vaardigheden",
  industries: "branches",
};

export interface CompletenessStep {
  key: string;
  label: string;
  points: number;
  /** Deep-link naar het edit-formulier; het anker (indien bekend) scrollt naar het veld. */
  href: string;
}

/**
 * Rangschikt de ontbrekende onderdelen op puntenwinst (hoogste eerst → grootste sprong voor de
 * minste moeite), met de labelnaam als deterministische tie-break. Puur, geen I/O — de eigenaar ziet
 * zo exact welke stap zijn profiel het snelst sterker maakt (benchmark: profielsterkte-flows).
 */
export function rankCompletenessSteps(
  result: CompletenessResult,
  editHref = "/profiel/bewerken",
): CompletenessStep[] {
  return [...result.missing]
    .sort((a, b) => b.points - a.points || a.label.localeCompare(b.label, "nl"))
    .map((m) => {
      const anchor = PROFILE_COMPLETENESS_ANCHORS[m.key];
      return {
        key: m.key,
        label: m.label,
        points: m.points,
        href: anchor ? `${editHref}#${anchor}` : editHref,
      };
    });
}

export interface CompanyCompletenessInput {
  description?: string | null;
  location?: string | null;
  website?: string | null;
  hasIndustry: boolean;
  hasLogo: boolean;
}

const COMPANY_CRITERIA: readonly {
  key: string;
  label: string;
  weight: number;
  done: (i: CompanyCompletenessInput) => boolean;
}[] = [
  { key: "description", label: "Omschrijving", weight: 35, done: (i) => !!i.description?.trim() },
  { key: "location", label: "Locatie", weight: 20, done: (i) => !!i.location?.trim() },
  { key: "industry", label: "Branche", weight: 20, done: (i) => i.hasIndustry },
  { key: "website", label: "Website", weight: 15, done: (i) => !!i.website?.trim() },
  { key: "logo", label: "Logo", weight: 10, done: (i) => i.hasLogo },
];

/** Server-berekende bedrijfsprofiel-compleetheid (0-100) + lijst ontbrekende onderdelen. */
export function computeCompanyCompleteness(input: CompanyCompletenessInput): CompletenessResult {
  let score = 0;
  const missing: CompletenessMissingItem[] = [];
  for (const c of COMPANY_CRITERIA) {
    if (c.done(input)) score += c.weight;
    else missing.push({ key: c.key, label: c.label, points: c.weight });
  }
  return { score: Math.min(100, score), missing };
}

/**
 * Mag `viewer` dit (freelancer)profiel zien?
 * - Eigenaar en admin: altijd.
 * - Anders: alleen als het profiel PUBLIC is.
 * Server-side afgedwongen; de client verbergt nooit zelf (CLAUDE.md regel 1).
 */
export function profileVisibleTo(
  viewer: Actor | null | undefined,
  ownerUserId: string,
  visibility: Visibility,
): boolean {
  if (viewer && (viewer.id === ownerUserId || viewer.role === "ADMIN")) return true;
  return visibility === "PUBLIC";
}
