import { lockedInJobIds } from "@/lib/data/job-locked-in";
import { jobFillUrgency, type JobFillUrgencyChip } from "@/lib/jobs/fill-urgency";
import { type JobStatus } from "@/lib/enums";

export interface FillUrgencyJob {
  id: string;
  status: JobStatus;
  startDate: Date | null;
}

/**
 * Bepaalt per opdracht het acuut-onbezet-signaal voor de opdrachtgever op "Mijn opdrachten"
 * (`jobFillUrgency`). "Vervuld" gebruikt exact dezelfde server-side locked-in-poort als de
 * opdrachtdetail-staffing-card en de opdrachtgever-next-actions (`lockedInJobIds`): een vastgelegde
 * kandidaat (een ACCEPTED-reactie in de propose-limbo) óf een niet-geannuleerde samenwerking.
 * Zo spoort de lijst-chip niet langer aan op een opdracht waarvan de rol al bezet is terwijl het
 * detail en de next-actions al zwijgen — één bron van waarheid, geen cross-surface drift.
 *
 * Alleen gepubliceerde opdrachten met een startdatum kunnen een chip opleveren (`jobFillUrgency`
 * geeft anders `null`); de poort-query wordt tot die kandidaten beperkt en overgeslagen als er
 * geen zijn. Begrensd op de (zichtbare) job-ids die de caller aanlevert; geen N+1.
 */
export async function getJobFillUrgency(
  jobs: FillUrgencyJob[],
  now: Date = new Date(),
): Promise<Map<string, JobFillUrgencyChip>> {
  const result = new Map<string, JobFillUrgencyChip>();
  const candidates = jobs.filter((job) => job.status === "PUBLISHED" && job.startDate != null);
  if (candidates.length === 0) return result;
  const filled = await lockedInJobIds(candidates.map((job) => job.id));
  for (const job of candidates) {
    const chip = jobFillUrgency(
      { status: job.status, startDate: job.startDate, filled: filled.has(job.id) },
      now,
    );
    if (chip) result.set(job.id, chip);
  }
  return result;
}
