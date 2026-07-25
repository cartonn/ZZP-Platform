// Impact-/vraagsignaal voor de admin-verificatiewachtrij (`/admin/verificaties`). Waar de wachtrij
// standaard oudste-eerst (FIFO) is — een eerlijkheidsgarantie die we niet aantasten — mist de admin
// een tweede dimensie: welk ingediend certificaattype ontsluit, éénmaal goedgekeurd, de meeste
// openstaande vraag? Een SUBMITTED VOG terwijl 8 open opdrachten een VOG eisen is aantoonbaar
// waardevoller om snel te beoordelen dan een certificaattype dat nergens gevraagd wordt: de ZZP'er
// wordt sneller inzetbaar voor in-demand werk. Spiegelbeeld van het ZZP'er-signaal in
// `credential-demand.ts` (welke gevraagde certificaten mist ík?), nu vanuit de admin-bril
// (welke gevraagde certificaten liggen op mijn bureau?).
//
// Puur en deterministisch; geen server-only imports (geen db/auth). De aanroeper levert de
// geaggregeerde eis-rijen van de open (gepubliceerde) opdrachten aan. Server-side is de waarheid
// (CLAUDE.md regel 1): de client toont het signaal, berekent het nooit zelf.

import { type CredentialType } from "@/lib/enums";

/** Vanaf hoeveel open opdrachten de vraag naar een certificaattype "hoog" is. */
export const CREDENTIAL_DEMAND_HIGH_MIN = 3;

export type DemandLevel = "none" | "some" | "high";

/** Eén verplichte certificaateis van een open opdracht: (opdracht, vereist certificaattype). */
export interface OpenJobRequirementRow {
  jobId: string;
  credentialType: CredentialType;
}

/**
 * Tel per certificaattype het aantal **distinct** open opdrachten dat het (verplicht) vereist.
 * Distinct op `jobId`: twee eisen van dezelfde opdracht tellen als één opdracht. Onbekende typen
 * ontbreken in de map (geen 0-rijen) zodat de aanroeper met `?? 0` kan lezen.
 */
export function credentialTypeDemand(
  rows: OpenJobRequirementRow[],
): Partial<Record<CredentialType, number>> {
  const jobsByType = new Map<CredentialType, Set<string>>();
  for (const row of rows) {
    let jobs = jobsByType.get(row.credentialType);
    if (!jobs) {
      jobs = new Set();
      jobsByType.set(row.credentialType, jobs);
    }
    jobs.add(row.jobId);
  }
  const result: Partial<Record<CredentialType, number>> = {};
  for (const [type, jobs] of jobsByType) {
    result[type] = jobs.size;
  }
  return result;
}

/** Vertaal het aantal vragende open opdrachten naar een impactniveau. */
export function demandLevel(count: number): DemandLevel {
  if (count >= CREDENTIAL_DEMAND_HIGH_MIN) return "high";
  if (count > 0) return "some";
  return "none";
}
