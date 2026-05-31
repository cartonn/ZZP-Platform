// Opdracht-logica: statusovergangen (expliciete map, vgl. CREDENTIAL_TRANSITIONS) en
// het normaliseren/valideren van zoek- & filterparameters. Server-side is de waarheid.
// Pure functies, getest.

import {
  type JobStatus,
  type WorkMode,
  WORK_MODES,
  type CredentialType,
  CREDENTIAL_TYPES,
} from "@/lib/enums";

export class JobTransitionError extends Error {
  constructor(from: JobStatus, to: JobStatus) {
    super(`Ongeldige opdracht-statusovergang: ${from} -> ${to}`);
    this.name = "JobTransitionError";
  }
}

export const JOB_TRANSITIONS: Record<JobStatus, readonly JobStatus[]> = {
  DRAFT: ["PUBLISHED", "CLOSED"],
  PUBLISHED: ["CLOSED", "DRAFT"], // DRAFT = terug naar concept (depubliceren)
  CLOSED: ["PUBLISHED"], //          heropenen
};

export function canTransitionJob(from: JobStatus, to: JobStatus): boolean {
  return JOB_TRANSITIONS[from].includes(to);
}

export function assertJobTransition(from: JobStatus, to: JobStatus): void {
  if (!canTransitionJob(from, to)) throw new JobTransitionError(from, to);
}

/** Een opdracht mag pas PUBLISHED worden met een titel én omschrijving. */
export function canPublish(job: { title?: string | null; description?: string | null }): boolean {
  return !!job.title?.trim() && !!job.description?.trim();
}

// ---------------------------------------------------------------------------
// Zoeken & filteren (ZZP-kant). De parser normaliseert ruwe query-params naar een
// veilig, getypeerd filterobject; de pagina bouwt hieruit de Prisma-query.
// ---------------------------------------------------------------------------

export const JOB_SORTS = ["recent", "rate_desc", "rate_asc"] as const;
export type JobSort = (typeof JOB_SORTS)[number];

export const JOBS_PER_PAGE = 10;

export interface JobFilters {
  q: string;
  skillIds: string[];
  industryId?: string;
  workMode?: WorkMode;
  rateMin?: number;
  rateMax?: number;
  requiredCredential?: CredentialType;
  sort: JobSort;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function all(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}
function toPositiveInt(v: string | undefined): number | undefined {
  if (v === undefined || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

/** Parse + valideer ruwe searchParams naar veilige filters. Onbekende waarden vallen weg. */
export function normalizeJobFilters(params: RawParams): JobFilters {
  const workModeRaw = first(params.workMode);
  const workMode = WORK_MODES.includes(workModeRaw as WorkMode)
    ? (workModeRaw as WorkMode)
    : undefined;

  const credRaw = first(params.requiredCredential);
  const requiredCredential = CREDENTIAL_TYPES.includes(credRaw as CredentialType)
    ? (credRaw as CredentialType)
    : undefined;

  const sortRaw = first(params.sort);
  const sort: JobSort = JOB_SORTS.includes(sortRaw as JobSort) ? (sortRaw as JobSort) : "recent";

  let rateMin = toPositiveInt(first(params.rateMin));
  let rateMax = toPositiveInt(first(params.rateMax));
  if (rateMin !== undefined && rateMax !== undefined && rateMin > rateMax) {
    [rateMin, rateMax] = [rateMax, rateMin]; // verwissel ongeldige range
  }

  const page = Math.max(1, toPositiveInt(first(params.page)) ?? 1);
  const industryId = first(params.industryId)?.trim() || undefined;

  return {
    q: (first(params.q) ?? "").trim().slice(0, 100),
    skillIds: [
      ...new Set(
        all(params.skillIds)
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ],
    industryId,
    workMode,
    rateMin,
    rateMax,
    requiredCredential,
    sort,
    page,
  };
}
