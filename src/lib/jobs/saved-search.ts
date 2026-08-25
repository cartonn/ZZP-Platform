// Opgeslagen zoekopdrachten op de opdrachten-marktplaats (`/opdrachten`).
//
// Pure helpers rond het bewaren en hertoepassen van een set filters. De server is de waarheid:
// een bewaarde zoekopdracht wordt opgeslagen als een **canonieke** query-string die uit een reeds
// via `normalizeJobFilters` gevalideerd `JobFilters`-object volgt. Zo kan er nooit ongeldige of
// onbekende input in de opslag belanden en levert dezelfde filterset altijd exact dezelfde string
// op (deterministisch → `@@unique([freelancerProfileId, query])` dedupliceert vanzelf).

import { z } from "zod";
import type { JobFilters } from "@/lib/jobs";

/** Maximaal aantal bewaarde zoekopdrachten per ZZP'er (voorkomt onbegrensde groei). */
export const MAX_SAVED_SEARCHES = 20;

/** Maximale lengte van de door de gebruiker gekozen naam. */
export const MAX_SAVED_SEARCH_NAME_LEN = 60;

/**
 * Canonieke query-string voor een filterset. Deterministisch: vaste sleutelvolgorde, gesorteerde
 * `skillIds`, en `page`/default-`sort` worden weggelaten (die bepalen geen resultaatset). Twee
 * filtersets die dezelfde opdrachten opleveren geven zo bit-voor-bit dezelfde string.
 */
export function jobFiltersToQueryString(filters: JobFilters): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.industryId) params.set("industryId", filters.industryId);
  for (const id of [...filters.skillIds].sort()) params.append("skillIds", id);
  if (filters.mine) params.set("mine", "1");
  if (filters.hideApplied) params.set("hideApplied", "1");
  if (filters.onlyEligible) params.set("onlyEligible", "1");
  if (filters.location) params.set("location", filters.location);
  if (filters.workMode) params.set("workMode", filters.workMode);
  if (filters.rateMin !== undefined) params.set("rateMin", String(filters.rateMin));
  if (filters.rateMax !== undefined) params.set("rateMax", String(filters.rateMax));
  if (filters.requiredCredential) params.set("requiredCredential", filters.requiredCredential);
  // `sort` telt als onderdeel van de zoekopdracht (volgorde-voorkeur), maar de default niet —
  // die zou anders "geen filters" toch een niet-lege query geven.
  if (filters.sort !== "match") params.set("sort", filters.sort);

  return params.toString();
}

/**
 * Href waarmee een bewaarde zoekopdracht opnieuw wordt toegepast op de marktplaats. Een lege query
 * (geen actieve filters) geeft de kale `/opdrachten`.
 */
export function savedSearchHref(query: string): string {
  return query ? `/opdrachten?${query}` : "/opdrachten";
}

/** Zod-schema voor de gekozen naam: getrimd, niet leeg, begrensd. */
export const savedSearchNameSchema = z
  .string()
  .trim()
  .min(1, "Geef je zoekopdracht een naam.")
  .max(MAX_SAVED_SEARCH_NAME_LEN, "Naam is te lang.");
