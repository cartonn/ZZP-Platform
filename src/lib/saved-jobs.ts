import { type JobStatus } from "@/lib/enums";

/**
 * Bewaarde opdrachten — pure presentatielogica.
 *
 * Een ZZP'er bewaart opdrachten om er later op terug te komen. Op het overzicht maakt het
 * verschil of een bewaarde opdracht nog **open** is (PUBLISHED, je kunt nog reageren) of niet
 * meer beschikbaar is (CLOSED/DRAFT — gesloten of teruggetrokken). De server is de waarheid:
 * de status komt uit de Job-rij, niet uit de bookmark.
 */

export type SavedJobItem = {
  jobId: string;
  title: string;
  companyName: string;
  status: JobStatus;
  savedAt: Date;
};

export type PartitionedSavedJobs<T extends SavedJobItem> = {
  open: T[];
  unavailable: T[];
};

/** Een bewaarde opdracht is "open" zolang hij gepubliceerd staat. */
export function isSavedJobOpen(status: JobStatus): boolean {
  return status === "PUBLISHED";
}

/**
 * Splitst bewaarde opdrachten in open vs. niet-meer-beschikbaar en sorteert beide het meest
 * recent bewaard eerst. Muteert de invoer niet; deterministische tiebreaker op jobId zodat
 * dezelfde invoer altijd dezelfde volgorde geeft.
 */
export function partitionSavedJobs<T extends SavedJobItem>(items: T[]): PartitionedSavedJobs<T> {
  const byRecency = (a: T, b: T) => {
    const diff = b.savedAt.getTime() - a.savedAt.getTime();
    return diff !== 0 ? diff : a.jobId.localeCompare(b.jobId);
  };
  const open: T[] = [];
  const unavailable: T[] = [];
  for (const item of items) {
    (isSavedJobOpen(item.status) ? open : unavailable).push(item);
  }
  open.sort(byRecency);
  unavailable.sort(byRecency);
  return { open, unavailable };
}
