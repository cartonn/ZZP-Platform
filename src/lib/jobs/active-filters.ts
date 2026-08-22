// Actieve filter-chips voor de opdrachten-marktplaats (`/opdrachten`).
//
// Deze pure helper leidt uit een reeds-genormaliseerd `JobFilters`-object af welke
// filters actief zijn en levert per actieve filter een dismissible chip. Bron voor de
// filter-pills die de gebruiker één voor één kan wissen.
//
// Regels:
// - `sort` en `page` zijn GEEN filters: ze bepalen volgorde/paginering, niet de resultaatset,
//   en leveren dus nooit een chip op (en tellen niet mee voor `hasActiveJobFilters`).
// - Een expliciete `industryId` overkoepelt de `mine`-quickfilter (identiek aan de where-clause:
//   industryId wint). Er is dus nooit tegelijk een "Branche"- én "Mijn vakgebied"-chip.
// - `lookups` beïnvloeden alleen de LABELS (branche-/vaardigheidsnamen), nooit of een chip bestaat.
//   Zonder lookups levert elke actieve filter nog steeds een chip op (met een generiek label).

import type { JobFilters } from "@/lib/jobs";
import type { WorkMode, CredentialType } from "@/lib/enums";

export interface ActiveJobFilterChip {
  /** Stabiel id voor React-keys en tests, bv. "industry", "skill:<id>", "rateMin". */
  id: string;
  /** Getoonde Nederlandse label in de pill, bv. "Branche: Zorg" of "Min. € 45/uur". */
  label: string;
  /** URL-param die bij verwijderen wordt aangepast. */
  param: string;
  /** Voor multi-value params (skillIds): de specifieke waarde die verwijderd moet worden. Undefined = verwijder de hele param. */
  value?: string;
}

export interface JobFilterLookups {
  industries: { id: string; name: string }[];
  skills: { id: string; name: string }[];
}

const WORK_MODE_LABELS: Record<WorkMode, string> = {
  REMOTE: "Remote",
  ONSITE: "Op locatie",
  HYBRID: "Hybride",
};

const CREDENTIAL_LABELS: Record<CredentialType, string> = {
  VOG: "VOG",
  DIPLOMA: "Diploma",
  CERTIFICATE: "Certificaat",
  INSURANCE: "Verzekering",
  LICENSE: "Licentie",
  OTHER: "Overig",
};

/**
 * Leid uit de genormaliseerde filters de actieve filter-chips af, in vaste (deterministische)
 * volgorde. `sort` en `page` tellen nooit als actieve filter. `lookups` bepalen alleen de labels.
 */
export function describeActiveJobFilters(
  filters: JobFilters,
  lookups: JobFilterLookups,
): ActiveJobFilterChip[] {
  const chips: ActiveJobFilterChip[] = [];

  // 1. Vrije zoekterm.
  if (filters.q.trim() !== "") {
    chips.push({ id: "q", label: `Zoekterm: "${filters.q}"`, param: "q" });
  }

  // 2. Branche/vakgebied — een expliciete industryId overkoepelt de mine-quickfilter.
  if (filters.industryId) {
    const name = lookups.industries.find((i) => i.id === filters.industryId)?.name;
    chips.push({
      id: "industry",
      label: name ? `Branche: ${name}` : "Branche",
      param: "industryId",
    });
  } else if (filters.mine) {
    chips.push({ id: "mine", label: "Mijn vakgebied", param: "mine" });
  }

  // 2b. "Verberg opdrachten waarop ik al reageerde"-quickfilter.
  if (filters.hideApplied) {
    chips.push({ id: "hideApplied", label: "Zonder mijn reacties", param: "hideApplied" });
  }

  // 2c. "Alleen waar ik aan voldoe"-quickfilter (verberg niet-inzetbare opdrachten).
  if (filters.onlyEligible) {
    chips.push({ id: "onlyEligible", label: "Alleen waar ik aan voldoe", param: "onlyEligible" });
  }

  // 3. Vaardigheden (multi-value): één chip per id, in volgorde.
  for (const skillId of filters.skillIds) {
    const name = lookups.skills.find((s) => s.id === skillId)?.name;
    chips.push({
      id: `skill:${skillId}`,
      label: name ?? "Vaardigheid",
      param: "skillIds",
      value: skillId,
    });
  }

  // 4. Werkvorm.
  if (filters.workMode) {
    chips.push({ id: "workMode", label: WORK_MODE_LABELS[filters.workMode], param: "workMode" });
  }

  // 5. Locatie.
  if (filters.location) {
    chips.push({ id: "location", label: `Locatie: ${filters.location}`, param: "location" });
  }

  // 6. Minimumtarief.
  if (filters.rateMin != null) {
    chips.push({ id: "rateMin", label: `Min. € ${filters.rateMin}/uur`, param: "rateMin" });
  }

  // 7. Maximumtarief.
  if (filters.rateMax != null) {
    chips.push({ id: "rateMax", label: `Max. € ${filters.rateMax}/uur`, param: "rateMax" });
  }

  // 8. Vereist certificaat.
  if (filters.requiredCredential) {
    const label = CREDENTIAL_LABELS[filters.requiredCredential] ?? filters.requiredCredential;
    chips.push({
      id: "requiredCredential",
      label: `Certificaat: ${label}`,
      param: "requiredCredential",
    });
  }

  return chips;
}

/**
 * True zodra er minstens één actieve filter is (zelfde criterium als `describeActiveJobFilters`:
 * alles behalve sort/page). Lookups zijn niet nodig — die beïnvloeden alleen labels, niet of een
 * chip bestaat.
 */
export function hasActiveJobFilters(filters: JobFilters): boolean {
  return describeActiveJobFilters(filters, { industries: [], skills: [] }).length > 0;
}
