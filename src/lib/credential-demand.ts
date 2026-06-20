// Certificaat-vraagsignaal voor de ZZP'er. Voedt de sectie "Gevraagde certificaten die je nog mist"
// op `/certificaten`: welke vereiste certificaattypes vragen de open opdrachten die deze ZZP'er ziet,
// maar heeft hij nog niet (geldig) verifieerbaar in huis? Puur en deterministisch; geen server-only
// imports (geen db/auth) — de aanroeper levert de geaggregeerde rijen aan.
//
// --- Bron ---
// `requirements` zijn de certificaateisen (`JobCredentialRequirement`) over de open opdrachten die de
// ZZP'er mag zien; één rij per (opdracht, certificaattype). `credentials` zijn de eigen certificaten
// van de ZZP'er (`Credential`). We bepalen per vereist type of de ZZP'er het kan vervullen:
//
//   - "satisfied": minstens één eigen certificaat van dat type is VERIFIED én niet verlopen
//     (expiresAt === null OF expiresAt in de toekomst t.o.v. `now`). Zo'n type telt niet als gat.
//   - "pending": niet satisfied, maar wel minstens één certificaat van dat type in DRAFT of SUBMITTED
//     (het loopt — geen actie nodig behalve afwachten/indienen). Een type waarvan álle certificaten
//     REJECTED/EXPIRED zijn telt als "missing": de ZZP'er moet zelf actie ondernemen.
//
// `now` wordt geïnjecteerd zodat de verloop-grens reproduceerbaar is in unit-tests. Een certificaat
// met `expiresAt` exact gelijk aan `now` geldt als verlopen (strikte `>`).

import { type CredentialStatus, type CredentialType } from "@/lib/enums";

export interface JobRequirementRow {
  jobId: string;
  credentialType: CredentialType;
}

export interface FreelancerCredentialRow {
  type: CredentialType;
  status: CredentialStatus;
  expiresAt: Date | null;
}

export type CredentialDemandState = "missing" | "pending";

export interface CredentialDemandGap {
  type: CredentialType;
  /** Aantal distinct open opdrachten dat dit certificaattype vereist (en dat de ZZP'er nog niet kan vervullen). */
  opportunityCount: number;
  /** "missing" = geen enkel certificaat van dit type; "pending" = wel aanwezig maar nog niet (geldig) geverifieerd. */
  state: CredentialDemandState;
}

export interface CredentialDemand {
  /** Onvervulde vereiste types, gesorteerd op opportunityCount desc, daarna type asc. */
  gaps: CredentialDemandGap[];
  /** Aantal distinct open opdrachten dat minstens één onvervuld vereist type vraagt. */
  blockedOpportunities: number;
}

/**
 * Bepaalt of een certificaattype "satisfied" is: minstens één eigen certificaat is VERIFIED én niet
 * verlopen. Een verlopen VERIFIED-certificaat telt niet — de ZZP'er kan de eis dan niet vervullen.
 */
function isSatisfied(rows: readonly FreelancerCredentialRow[], now: Date): boolean {
  const nowMs = now.getTime();
  return rows.some(
    (c) => c.status === "VERIFIED" && (c.expiresAt === null || c.expiresAt.getTime() > nowMs),
  );
}

/**
 * Bepaalt of een (niet-satisfied) certificaattype "pending" is: er loopt al iets (DRAFT/SUBMITTED).
 * Anders is het type "missing" en moet de ZZP'er zelf actie ondernemen.
 */
function isPending(rows: readonly FreelancerCredentialRow[]): boolean {
  return rows.some((c) => c.status === "DRAFT" || c.status === "SUBMITTED");
}

/**
 * Berekent het certificaat-vraagsignaal: welke vereiste certificaattypes de ZZP'er nog niet (geldig)
 * kan vervullen, gerangschikt op hoeveel distinct open opdrachten elk ontbrekend type zou ontsluiten.
 * Puur en deterministisch; geschikt voor unit-tests zonder DB.
 *
 * `now` wordt geïnjecteerd zodat de verloop-grens reproduceerbaar is.
 */
export function computeCredentialDemand(
  requirements: readonly JobRequirementRow[],
  credentials: readonly FreelancerCredentialRow[],
  now: Date = new Date(),
): CredentialDemand {
  if (requirements.length === 0) {
    return { gaps: [], blockedOpportunities: 0 };
  }

  // Eigen certificaten groeperen per type, zodat we per vereist type snel kunnen toetsen.
  const credentialsByType = new Map<CredentialType, FreelancerCredentialRow[]>();
  for (const c of credentials) {
    const list = credentialsByType.get(c.type);
    if (list) {
      list.push(c);
    } else {
      credentialsByType.set(c.type, [c]);
    }
  }

  // Per vereist type de set distinct jobId's bijhouden. Een Set per type dedupliceert tegelijk de
  // (jobId, credentialType)-rijen defensief (de DB heeft hier een unique constraint, maar wees veilig).
  const jobsByType = new Map<CredentialType, Set<string>>();
  for (const r of requirements) {
    const set = jobsByType.get(r.credentialType);
    if (set) {
      set.add(r.jobId);
    } else {
      jobsByType.set(r.credentialType, new Set([r.jobId]));
    }
  }

  // Verzamel de gaten (niet-satisfied vereiste types) en de geblokkeerde opdrachten.
  const gaps: CredentialDemandGap[] = [];
  const blockedJobs = new Set<string>();

  for (const [type, jobIds] of jobsByType) {
    const ownRows = credentialsByType.get(type) ?? [];
    if (isSatisfied(ownRows, now)) {
      continue; // type vervuld → geen gat, niet geblokkeerd
    }

    const state: CredentialDemandState = isPending(ownRows) ? "pending" : "missing";
    gaps.push({ type, opportunityCount: jobIds.size, state });
    for (const jobId of jobIds) {
      blockedJobs.add(jobId);
    }
  }

  // Sorteren: meest-ontsluitende type eerst, bij gelijke telling alfabetisch op type (deterministisch).
  gaps.sort((a, b) => {
    if (b.opportunityCount !== a.opportunityCount) {
      return b.opportunityCount - a.opportunityCount;
    }
    return a.type < b.type ? -1 : a.type > b.type ? 1 : 0;
  });

  return { gaps, blockedOpportunities: blockedJobs.size };
}
