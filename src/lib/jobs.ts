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

// "match" = beste persoonlijke match eerst (kern-differentiator; alleen zinvol voor een ZZP'er mét
// profiel — de pagina valt terug op DB-sortering wanneer er geen profiel is). Standaardsortering.
// "start_soon" = eerstvolgende startdatum eerst (aankomend vóór voorbij vóór ongedateerd); in het
// geheugen gerangschikt over de gescande set, net als "match" (zie job-start-sort.ts).
export const JOB_SORTS = ["match", "recent", "rate_desc", "rate_asc", "start_soon"] as const;
export type JobSort = (typeof JOB_SORTS)[number];

export const JOBS_PER_PAGE = 10;

// Bovengrens op het aantal opdrachten dat we bij match-sortering in het geheugen scoren+rangschikken.
// Match wordt per ZZP'er berekend en kan dus niet DB-side gesorteerd worden; we scannen de meest
// recente opdrachten binnen deze grens. Ruim boven realistische live-volumes (geen extra query).
export const MATCH_SORT_SCAN_CAP = 200;

export interface JobFilters {
  q: string;
  skillIds: string[];
  industryId?: string;
  /**
   * ZZP-quickfilter: beperk tot de eigen profielbranches. Een expliciete `industryId` wint. Staat
   * standaard AAN zodra de ZZP'er branches op zijn profiel heeft (zie `JobFilterDefaults.mine`);
   * `mine=0` in de URL is de bewaarde "uit"-keuze van de gebruiker.
   */
  mine: boolean;
  /** ZZP-quickfilter: verberg opdrachten waarop de ZZP'er al (niet-ingetrokken) heeft gereageerd. */
  hideApplied: boolean;
  /**
   * ZZP-quickfilter: verberg opdrachten waarvoor de ZZP'er nú niet inzetbaar is (een vereist
   * certificaat ontbreekt of is verlopen → server-side `NON_COMPLIANT`). Alleen zinvol met een
   * profiel om compliance tegen te berekenen; de pagina negeert de vlag zonder profiel.
   */
  onlyEligible: boolean;
  location?: string;
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

/**
 * Tri-state van de "Mijn vakgebied"-quickfilter in de URL: `"1"` = expliciet aan, `"0"` = expliciet
 * uit, alles anders (incl. afwezig) = geen keuze gemaakt. Zo kan de pagina een standaardstand kiezen
 * zonder de bewuste keuze van de ZZP'er te overschrijven.
 */
export function parseMineParam(raw: string | string[] | undefined): boolean | undefined {
  const value = first(raw);
  if (value === "1") return true;
  if (value === "0") return false;
  return undefined;
}

export interface JobFilterDefaults {
  /**
   * Stand van "Mijn vakgebied" zonder expliciete keuze in de URL. De marktplaats zet dit op `true`
   * zodra de ZZP'er branches op zijn profiel heeft: dan opent de lijst meteen op zijn eigen
   * vakgebied in plaats van op alles.
   */
  mine?: boolean;
}

/** Parse + valideer ruwe searchParams naar veilige filters. Onbekende waarden vallen weg. */
export function normalizeJobFilters(
  params: RawParams,
  defaults: JobFilterDefaults = {},
): JobFilters {
  const workModeRaw = first(params.workMode);
  const workMode = WORK_MODES.includes(workModeRaw as WorkMode)
    ? (workModeRaw as WorkMode)
    : undefined;

  const credRaw = first(params.requiredCredential);
  const requiredCredential = CREDENTIAL_TYPES.includes(credRaw as CredentialType)
    ? (credRaw as CredentialType)
    : undefined;

  const sortRaw = first(params.sort);
  const sort: JobSort = JOB_SORTS.includes(sortRaw as JobSort) ? (sortRaw as JobSort) : "match";

  let rateMin = toPositiveInt(first(params.rateMin));
  let rateMax = toPositiveInt(first(params.rateMax));
  if (rateMin !== undefined && rateMax !== undefined && rateMin > rateMax) {
    [rateMin, rateMax] = [rateMax, rateMin]; // verwissel ongeldige range
  }

  const page = Math.max(1, toPositiveInt(first(params.page)) ?? 1);
  const industryId = first(params.industryId)?.trim() || undefined;
  const location = first(params.location)?.trim().slice(0, 80) || undefined;

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
    mine: parseMineParam(params.mine) ?? defaults.mine ?? false,
    hideApplied: first(params.hideApplied) === "1",
    onlyEligible: first(params.onlyEligible) === "1",
    location,
    workMode,
    rateMin,
    rateMax,
    requiredCredential,
    sort,
    page,
  };
}
