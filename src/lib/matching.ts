// Matching & compliance. Server-berekend (CLAUDE.md regel 1): de client toont een
// snapshot, maar berekent nooit zelf. Pure functies op platte objecten zodat ze
// los van Prisma te unit-testen en te hergebruiken zijn (Sessie 3 reactie-snapshot).

import { currentOrNextAvailable } from "@/lib/availability";
import { isExpired } from "@/lib/credentials";
import { estimateTravelMinutes } from "@/lib/services/travel-distance";
import {
  type Availability,
  type AvailabilityWindowType,
  type CredentialStatus,
  type CredentialType,
  type WorkMode,
} from "@/lib/enums";

export type ComplianceStatus = "COMPLIANT" | "WARNING" | "NON_COMPLIANT";

export type MatchReasonKind = "positive" | "gap";
export interface MatchReason {
  kind: MatchReasonKind;
  label: string;
}

/**
 * De sterkste positieve reden voor een compacte uitleg (bv. op een dashboard-matchkaart). De reasons
 * worden in volgorde van componentgewicht gepusht (skills eerst), dus de eerste positieve is de
 * zwaarst wegende troef. Geeft `null` als er geen positieve reden is.
 */
export function topPositiveReason(reasons: readonly MatchReason[]): string | null {
  return reasons.find((r) => r.kind === "positive")?.label ?? null;
}

export interface FreelancerCredential {
  type: CredentialType;
  status: CredentialStatus;
  expiresAt?: Date | null;
}

export interface ComplianceResult {
  status: ComplianceStatus;
  satisfied: CredentialType[];
  inReview: CredentialType[];
  expired: CredentialType[];
  missing: CredentialType[];
}

/**
 * Bepaalt of een freelancer voldoet aan de vereiste credential-types van een opdracht.
 * - satisfied: VERIFIED én niet verlopen
 * - inReview:  SUBMITTED (in beoordeling)
 * - expired:   VERIFIED-maar-verlopen, of status EXPIRED
 * - missing:   geen bruikbaar credential van dat type
 */
export function computeCompliance(
  requiredTypes: readonly CredentialType[],
  credentials: readonly FreelancerCredential[],
  now: Date = new Date(),
): ComplianceResult {
  const satisfied: CredentialType[] = [];
  const inReview: CredentialType[] = [];
  const expired: CredentialType[] = [];
  const missing: CredentialType[] = [];

  for (const type of dedupe(requiredTypes)) {
    const ofType = credentials.filter((c) => c.type === type);
    const isValidVerified = (c: FreelancerCredential) =>
      c.status === "VERIFIED" && !isExpired(c, now);
    const isExpiredCred = (c: FreelancerCredential) =>
      c.status === "EXPIRED" || (c.status === "VERIFIED" && isExpired(c, now));

    if (ofType.some(isValidVerified)) {
      satisfied.push(type);
    } else if (ofType.some((c) => c.status === "SUBMITTED")) {
      inReview.push(type);
    } else if (ofType.some(isExpiredCred)) {
      expired.push(type);
    } else {
      missing.push(type);
    }
  }

  let status: ComplianceStatus = "COMPLIANT";
  if (missing.length > 0 || expired.length > 0) {
    // Een verlopen vereist certificaat betekent dat de ZZP'er nú niet aan de eis voldoet — net als een
    // ontbrekend certificaat (gelijk aan collaboration-alerts.ts). WARNING is voor "nog in beoordeling".
    status = "NON_COMPLIANT";
  } else if (inReview.length > 0) {
    status = "WARNING";
  }

  return { status, satisfied, inReview, expired, missing };
}

/**
 * Live compliance-status voor weergave bij reactie/kandidaat: berekent de actuele compliance uit de
 * huidige certificaten i.p.v. een bevroren snapshot van het reactiemoment (een VOG kan intussen
 * verlopen zijn). Geeft `null` als de opdracht geen vereiste certificaten heeft — dan is er niets
 * om aan te voldoen en tonen we geen badge.
 */
export function liveComplianceStatus(
  requiredTypes: readonly CredentialType[],
  credentials: readonly FreelancerCredential[],
  now: Date = new Date(),
): ComplianceStatus | null {
  if (requiredTypes.length === 0) return null;
  return computeCompliance(requiredTypes, credentials, now).status;
}

export interface MatchInput {
  requiredSkillIds: readonly string[];
  optionalSkillIds: readonly string[];
  freelancerSkillIds: readonly string[];
  requiredCredentialTypes: readonly CredentialType[];
  credentials: readonly FreelancerCredential[];
  job: {
    rateMin?: number | null;
    rateMax?: number | null;
    workMode: WorkMode;
    location?: string | null;
  };
  freelancer: {
    hourlyRate?: number | null;
    workMode: WorkMode;
    location?: string | null;
    /** Max. reistijd (minuten) die de ZZP'er accepteert; null/undefined = geen limiet → stad-vergelijking. */
    maxTravelMinutes?: number | null;
    availability: Availability;
    availabilityWindows?: readonly {
      startDate: Date;
      endDate: Date;
      type: AvailabilityWindowType;
    }[];
  };
}

export interface MatchResult {
  score: number; // 0-100
  breakdown: {
    skills: number;
    compliance: number;
    rate: number;
    workMode: number;
    location: number;
  };
  compliance: ComplianceResult;
  reasons: MatchReason[];
  availability: { status: Availability; reason: MatchReason | null };
}

/**
 * Vertaalt een beschikbaarheidsstatus naar een verklarende reason (of `null` bij UNKNOWN).
 * Pure functie: geen invloed op `score` of `breakdown`, alleen op de uitleg.
 */
export function availabilityReason(status: Availability): MatchReason | null {
  switch (status) {
    case "AVAILABLE":
      return { kind: "positive", label: "Direct beschikbaar" };
    case "LIMITED":
      return { kind: "positive", label: "Beperkt beschikbaar" };
    case "UNAVAILABLE":
      return { kind: "gap", label: "Momenteel niet beschikbaar" };
    case "UNKNOWN":
    default:
      return null;
  }
}

const WEIGHTS = {
  requiredSkills: 35,
  optionalSkills: 15,
  compliance: 25,
  rate: 15,
  workMode: 5,
  location: 5,
};

/** Maximale punten per match-component (som = 100). Afgeleid van WEIGHTS zodat het in sync blijft;
 *  gebruikt door de breakdown-weergave om elke component als aandeel van zijn maximum te tonen. */
export const MATCH_COMPONENT_MAX = {
  skills: WEIGHTS.requiredSkills + WEIGHTS.optionalSkills,
  compliance: WEIGHTS.compliance,
  rate: WEIGHTS.rate,
  workMode: WEIGHTS.workMode,
  location: WEIGHTS.location,
} as const;

/** Server-berekende matchscore (0-100) + onderverdeling + compliance-snapshot. */
export function computeMatchScore(input: MatchInput, now: Date = new Date()): MatchResult {
  const freelancerSkills = new Set(input.freelancerSkillIds);

  const required = dedupe(input.requiredSkillIds);
  const optional = dedupe(input.optionalSkillIds);
  const requiredCoverage =
    required.length === 0
      ? 1
      : required.filter((s) => freelancerSkills.has(s)).length / required.length;
  const optionalCoverage =
    optional.length === 0
      ? 1
      : optional.filter((s) => freelancerSkills.has(s)).length / optional.length;
  const skills =
    requiredCoverage * WEIGHTS.requiredSkills + optionalCoverage * WEIGHTS.optionalSkills;

  const compliance = computeCompliance(input.requiredCredentialTypes, input.credentials, now);
  const reqCredCount = dedupe(input.requiredCredentialTypes).length;
  const compliancePoints =
    reqCredCount === 0
      ? WEIGHTS.compliance
      : (compliance.satisfied.length / reqCredCount) * WEIGHTS.compliance;

  const rate = rateFit(input.job.rateMin, input.job.rateMax, input.freelancer.hourlyRate);
  const workMode = workModeFit(input.job.workMode, input.freelancer.workMode);
  const location = locationFit(
    input.job.workMode,
    input.freelancer.workMode,
    input.job.location,
    input.freelancer.location,
    input.freelancer.maxTravelMinutes,
  );

  const breakdown = {
    skills: round(skills),
    compliance: round(compliancePoints),
    rate: round(rate),
    workMode: round(workMode),
    location: round(location),
  };
  // Exact de som van de (op hele punten afgeronde) componenten — zo telt de zichtbare breakdown
  // altijd op tot de getoonde score (de belofte "geen black box" in MatchBreakdown).
  const score = clamp(
    breakdown.skills +
      breakdown.compliance +
      breakdown.rate +
      breakdown.workMode +
      breakdown.location,
    0,
    100,
  );

  const positives: MatchReason[] = [];
  const gaps: MatchReason[] = [];

  // Skills reasons
  if (required.length > 0) {
    if (requiredCoverage === 1) {
      positives.push({ kind: "positive", label: "Alle vereiste skills aanwezig" });
    } else {
      const matched = required.filter((s) => freelancerSkills.has(s)).length;
      const missing = required.length - matched;
      gaps.push({ kind: "gap", label: `Mist ${missing} van ${required.length} vereiste skills` });
    }
  }

  // Compliance reasons
  if (reqCredCount > 0) {
    if (compliance.status === "COMPLIANT") {
      positives.push({ kind: "positive", label: "Voldoet aan de certificaateisen" });
    } else if (compliance.status === "WARNING") {
      gaps.push({ kind: "gap", label: "Certificaat in beoordeling" });
    } else {
      if (compliance.missing.length > 0) {
        gaps.push({ kind: "gap", label: "Mist vereist certificaat" });
      } else if (compliance.expired.length > 0) {
        gaps.push({ kind: "gap", label: "Vereist certificaat is verlopen" });
      }
    }
  }

  // Rate reasons
  const { hourlyRate } = input.freelancer;
  const { rateMin, rateMax } = input.job;
  if (hourlyRate != null && (rateMin != null || rateMax != null)) {
    if (rateMax != null && hourlyRate > rateMax) {
      gaps.push({ kind: "gap", label: "Tarief ligt boven het budget" });
    } else {
      positives.push({ kind: "positive", label: "Tarief past binnen het budget" });
    }
  }

  // WorkMode reasons
  const wmFit = workModeFit(input.job.workMode, input.freelancer.workMode);
  if (wmFit === WEIGHTS.workMode) {
    positives.push({ kind: "positive", label: "Werkmodus komt overeen" });
  } else if (wmFit === 0) {
    gaps.push({ kind: "gap", label: "Werkmodus sluit niet aan" });
  }

  // Reistijd: alleen tonen als de ZZP'er een max. reistijd heeft opgegeven én de opdracht op locatie
  // is. Maakt de locatie-score navolgbaar door de geschatte reistijd te tonen (Pidz-pariteit, ADR-0006 A).
  const maxTravel = input.freelancer.maxTravelMinutes;
  if (
    maxTravel != null &&
    maxTravel > 0 &&
    input.job.workMode !== "REMOTE" &&
    input.freelancer.workMode !== "REMOTE" &&
    input.job.location &&
    input.freelancer.location
  ) {
    const minutes = estimateTravelMinutes(input.freelancer.location, input.job.location);
    if (minutes != null) {
      if (minutes <= maxTravel) {
        positives.push({ kind: "positive", label: `Binnen je max. reistijd (ca. ${minutes} min)` });
      } else {
        gaps.push({ kind: "gap", label: `Verder dan je max. reistijd (ca. ${minutes} min)` });
      }
    }
  }

  // Beschikbaarheid: een venster dat nu of als eerstvolgende inzetbaar is, overschrijft
  // de losse status. Dit beïnvloedt alleen de uitleg, niet de score of breakdown.
  const windows = input.freelancer.availabilityWindows;
  const activeWindow = windows && windows.length > 0 ? currentOrNextAvailable(windows, now) : null;
  const effectiveStatus: Availability = activeWindow
    ? activeWindow.type
    : (input.freelancer.availability ?? "UNKNOWN");
  const availReason = availabilityReason(effectiveStatus);
  if (availReason) {
    if (availReason.kind === "positive") {
      positives.push(availReason);
    } else {
      gaps.push(availReason);
    }
  }

  const reasons: MatchReason[] = [...positives, ...gaps];

  return {
    score,
    breakdown,
    compliance,
    reasons,
    availability: { status: effectiveStatus, reason: availReason },
  };
}

// Brontypes die direct overeenkomen met de Prisma-includes op de aanroepplekken, zodat
// alle schermen dezelfde mapping naar MatchInput delen (één bron van waarheid).
export interface JobMatchSource {
  skills: readonly { skillId: string; required: boolean }[];
  credentialRequirements: readonly { credentialType: string; required: boolean }[];
  rateMin: number | null;
  rateMax: number | null;
  workMode: string;
  location: string | null;
}
export interface FreelancerMatchSource {
  skills: readonly { skillId: string }[];
  credentials: readonly { type: string; status: string; expiresAt: Date | null }[];
  hourlyRate: number | null;
  workMode: string;
  location: string | null;
  maxTravelMinutes?: number | null;
  availability: string;
  availabilityWindows?: readonly { startDate: Date; endDate: Date; type: string }[];
}

/** Scoort een opdracht voor een ZZP'er vanuit de ruwe Prisma-vormen. */
export function scoreJobForFreelancer(
  job: JobMatchSource,
  freelancer: FreelancerMatchSource,
  now: Date = new Date(),
): MatchResult {
  return computeMatchScore(
    {
      requiredSkillIds: job.skills.filter((s) => s.required).map((s) => s.skillId),
      optionalSkillIds: job.skills.filter((s) => !s.required).map((s) => s.skillId),
      freelancerSkillIds: freelancer.skills.map((s) => s.skillId),
      requiredCredentialTypes: job.credentialRequirements
        .filter((c) => c.required)
        .map((c) => c.credentialType as CredentialType),
      credentials: freelancer.credentials.map((c) => ({
        type: c.type as CredentialType,
        status: c.status as CredentialStatus,
        expiresAt: c.expiresAt,
      })),
      job: {
        rateMin: job.rateMin,
        rateMax: job.rateMax,
        workMode: job.workMode as WorkMode,
        location: job.location,
      },
      freelancer: {
        hourlyRate: freelancer.hourlyRate,
        workMode: freelancer.workMode as WorkMode,
        location: freelancer.location,
        maxTravelMinutes: freelancer.maxTravelMinutes ?? null,
        availability: freelancer.availability as Availability,
        availabilityWindows: freelancer.availabilityWindows?.map((w) => ({
          startDate: w.startDate,
          endDate: w.endDate,
          type: w.type as AvailabilityWindowType,
        })),
      },
    },
    now,
  );
}

function rateFit(
  min: number | null | undefined,
  max: number | null | undefined,
  rate: number | null | undefined,
): number {
  if (rate == null || (min == null && max == null)) return WEIGHTS.rate * 0.66; // onbekend -> neutraal
  if (max != null && rate > max) {
    const over = (rate - max) / max;
    return clamp(WEIGHTS.rate * (1 - over), 0, WEIGHTS.rate);
  }
  if (min != null && rate < min) return WEIGHTS.rate; // goedkoper dan budget = prima
  return WEIGHTS.rate; // binnen budget
}

function workModeFit(job: WorkMode, freelancer: WorkMode): number {
  if (job === freelancer) return WEIGHTS.workMode;
  if (job === "HYBRID" || freelancer === "HYBRID" || job === "REMOTE" || freelancer === "REMOTE") {
    return WEIGHTS.workMode * 0.6;
  }
  return 0;
}

function locationFit(
  jobMode: WorkMode,
  freelancerMode: WorkMode,
  jobLoc: string | null | undefined,
  freelancerLoc: string | null | undefined,
  maxTravelMinutes?: number | null,
): number {
  if (jobMode === "REMOTE" || freelancerMode === "REMOTE") return WEIGHTS.location;
  // Reistijd-gebaseerd zodra de ZZP'er een max. reistijd heeft én beide plaatsen bekend zijn:
  // binnen bereik = vol, erbuiten = lineair aflopend (op 2× de limiet → 0). Zonder limiet of bij een
  // onbekende plaats: de bestaande stad-naam-vergelijking (gedrag ongewijzigd voor bestaande data).
  if (maxTravelMinutes != null && maxTravelMinutes > 0 && jobLoc && freelancerLoc) {
    const minutes = estimateTravelMinutes(freelancerLoc, jobLoc);
    if (minutes != null) {
      if (minutes <= maxTravelMinutes) return WEIGHTS.location;
      const over = (minutes - maxTravelMinutes) / maxTravelMinutes;
      return WEIGHTS.location * clamp(1 - over, 0, 1);
    }
  }
  if (!jobLoc || !freelancerLoc) return WEIGHTS.location * 0.6;
  return jobLoc.trim().toLowerCase() === freelancerLoc.trim().toLowerCase()
    ? WEIGHTS.location
    : WEIGHTS.location * 0.4;
}

function dedupe<T>(arr: readonly T[]): T[] {
  return [...new Set(arr)];
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
// Hele punten per component, zodat de getoonde breakdown exact optelt tot de getoonde totaalscore.
function round(n: number): number {
  return Math.round(n);
}
