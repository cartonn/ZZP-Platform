// Matching & compliance. Server-berekend (CLAUDE.md regel 1): de client toont een
// snapshot, maar berekent nooit zelf. Pure functies op platte objecten zodat ze
// los van Prisma te unit-testen en te hergebruiken zijn (Sessie 3 reactie-snapshot).

import { isExpired } from "@/lib/credentials";
import { type CredentialStatus, type CredentialType, type WorkMode } from "@/lib/enums";

export type ComplianceStatus = "COMPLIANT" | "WARNING" | "NON_COMPLIANT";

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
  if (missing.length > 0) {
    status = "NON_COMPLIANT";
  } else if (expired.length > 0 || inReview.length > 0) {
    status = "WARNING";
  }

  return { status, satisfied, inReview, expired, missing };
}

export interface MatchInput {
  requiredSkillIds: readonly string[];
  optionalSkillIds: readonly string[];
  freelancerSkillIds: readonly string[];
  requiredCredentialTypes: readonly CredentialType[];
  credentials: readonly FreelancerCredential[];
  job: { rateMin?: number | null; rateMax?: number | null; workMode: WorkMode; location?: string | null };
  freelancer: { hourlyRate?: number | null; workMode: WorkMode; location?: string | null };
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
}

const WEIGHTS = { requiredSkills: 35, optionalSkills: 15, compliance: 25, rate: 15, workMode: 5, location: 5 };

/** Server-berekende matchscore (0-100) + onderverdeling + compliance-snapshot. */
export function computeMatchScore(input: MatchInput, now: Date = new Date()): MatchResult {
  const freelancerSkills = new Set(input.freelancerSkillIds);

  const required = dedupe(input.requiredSkillIds);
  const optional = dedupe(input.optionalSkillIds);
  const requiredCoverage =
    required.length === 0 ? 1 : required.filter((s) => freelancerSkills.has(s)).length / required.length;
  const optionalCoverage =
    optional.length === 0 ? 1 : optional.filter((s) => freelancerSkills.has(s)).length / optional.length;
  const skills = requiredCoverage * WEIGHTS.requiredSkills + optionalCoverage * WEIGHTS.optionalSkills;

  const compliance = computeCompliance(input.requiredCredentialTypes, input.credentials, now);
  const reqCredCount = dedupe(input.requiredCredentialTypes).length;
  const compliancePoints =
    reqCredCount === 0 ? WEIGHTS.compliance : (compliance.satisfied.length / reqCredCount) * WEIGHTS.compliance;

  const rate = rateFit(input.job.rateMin, input.job.rateMax, input.freelancer.hourlyRate);
  const workMode = workModeFit(input.job.workMode, input.freelancer.workMode);
  const location = locationFit(input.job.workMode, input.freelancer.workMode, input.job.location, input.freelancer.location);

  const breakdown = {
    skills: round(skills),
    compliance: round(compliancePoints),
    rate: round(rate),
    workMode: round(workMode),
    location: round(location),
  };
  const score = clamp(
    Math.round(breakdown.skills + breakdown.compliance + breakdown.rate + breakdown.workMode + breakdown.location),
    0,
    100,
  );

  return { score, breakdown, compliance };
}

function rateFit(min: number | null | undefined, max: number | null | undefined, rate: number | null | undefined): number {
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
): number {
  if (jobMode === "REMOTE" || freelancerMode === "REMOTE") return WEIGHTS.location;
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
function round(n: number): number {
  return Math.round(n * 10) / 10;
}
