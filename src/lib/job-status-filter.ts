import { JOB_STATUSES, type JobStatus } from "@/lib/enums";

/**
 * Statusfilter voor het opdrachtgever-overzicht "Mijn opdrachten" (`/opdrachten`). Een opdracht heeft
 * één `status` (DRAFT/PUBLISHED/CLOSED), dus het filter is een dunne, cascade-vrije variant van het
 * facturen-statusfilter: elke opdracht valt op zijn `status` in precies één groep. Pure functies →
 * unit-testbaar zonder database. Spiegelt het pill-patroon van /facturen, /reacties en /kandidaten.
 */

export const JOB_STATUS_FILTER_GROUPS = ["all", ...JOB_STATUSES] as const;
export type JobStatusFilterGroup = (typeof JOB_STATUS_FILTER_GROUPS)[number];

/** Labels gelijk aan de JobStatusBadge zodat pill en badge dezelfde taal spreken. */
export const JOB_STATUS_FILTER_LABEL: Record<JobStatusFilterGroup, string> = {
  all: "Alle",
  DRAFT: "Concept",
  PUBLISHED: "Gepubliceerd",
  CLOSED: "Gesloten",
};

/** Volgorde van de filter-pills (levensloop: concept → gepubliceerd → gesloten). */
export const JOB_STATUS_FILTER_ORDER: JobStatusFilterGroup[] = [
  "all",
  "DRAFT",
  "PUBLISHED",
  "CLOSED",
];

type JobLike = { status: string };

/** Onbekende/lege waarde → "all". Eén bron voor het inlezen van de `status`-searchParam. */
export function parseJobStatusFilter(value: string | undefined): JobStatusFilterGroup {
  return (JOB_STATUS_FILTER_GROUPS as readonly string[]).includes(value ?? "")
    ? (value as JobStatusFilterGroup)
    : "all";
}

/**
 * Filtert op groep met behoud van de invoervolgorde; "all" geeft de lijst ongewijzigd terug.
 * Muteert de invoer niet.
 */
export function filterJobsByStatus<T extends JobLike>(jobs: T[], group: JobStatusFilterGroup): T[] {
  if (group === "all") return jobs.slice();
  return jobs.filter((job) => job.status === group);
}

/** Telling per groep over de volledige lijst (voor de pill-labels). `all` = totaal. */
export function summarizeJobStatusGroups(jobs: JobLike[]): Record<JobStatusFilterGroup, number> {
  const counts: Record<JobStatusFilterGroup, number> = {
    all: jobs.length,
    DRAFT: 0,
    PUBLISHED: 0,
    CLOSED: 0,
  };
  for (const job of jobs) {
    if ((JOB_STATUSES as readonly string[]).includes(job.status)) {
      counts[job.status as JobStatus] += 1;
    }
  }
  return counts;
}
