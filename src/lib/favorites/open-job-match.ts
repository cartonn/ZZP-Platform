// Flexpool → open-opdracht-match (opdrachtgever): de flexpool toont de poule van bewezen ZZP'ers,
// maar niet tegen wélke van je eigen open opdrachten een favoriet nu een sterke match is. Deze pure
// motor scoort de open opdrachten van de opdrachtgever tegen één favoriet met exact dezelfde
// matchmotor als de rest van het platform (`scoreJobForFreelancer`) en levert de sterkste opdracht
// op of boven de drempel — zodat de opdrachtgever de juiste bewezen ZZP'er direct opnieuw inzet.
// Read-only signaal, geen nieuwe rekenlogica, geen geldstroom.

import {
  scoreJobForFreelancer,
  topPositiveReason,
  type FreelancerMatchSource,
  type JobMatchSource,
} from "@/lib/matching";

/**
 * Drempel waaronder een open opdracht niet sterk genoeg aansluit om als flexpool-signaal te tonen.
 * Gelijk aan de suggestie-drempel elders (`SUGGESTION_MIN_SCORE`) zodat de opdrachtgever hetzelfde
 * "sterke match"-begrip ziet op de flexpool als op de kandidatenlijst van een opdracht.
 */
export const FLEXPOOL_MATCH_MIN_SCORE = 70;

/** Eén scoorbare open opdracht van de opdrachtgever, met de identificatie voor de deep-link. */
export interface FlexpoolMatchJob extends JobMatchSource {
  id: string;
  title: string;
}

/** De sterkste open opdracht waarvoor een favoriet nu een match is. */
export interface FlexpoolJobMatch {
  jobId: string;
  jobTitle: string;
  /** Server-berekende matchscore 0-100. */
  score: number;
  /** Belangrijkste positieve reden (uit dezelfde reasons als de kandidatenlijst), of null. */
  reason: string | null;
}

/**
 * Bepaal de sterkste open opdracht van de opdrachtgever waarvoor deze favoriet nu een match is.
 * Puur en deterministisch. Opdrachten in `excludeJobIds` (de favoriet reageerde al of is er al aan
 * verbonden) vallen af — geen dubbel signaal. Retourneert de hoogst-scorende opdracht op of boven
 * `FLEXPOOL_MATCH_MIN_SCORE`, of `null` als geen enkele open opdracht de drempel haalt.
 *
 * Tiebreaker bij exact gelijke score: alfabetisch op opdrachttitel, dan op `jobId` — zodat dezelfde
 * pool altijd identiek rangschikt (geen cross-render drift).
 */
export function bestOpenJobMatch(
  jobs: readonly FlexpoolMatchJob[],
  favorite: FreelancerMatchSource,
  excludeJobIds: ReadonlySet<string>,
  now: Date = new Date(),
): FlexpoolJobMatch | null {
  let best: FlexpoolJobMatch | null = null;
  for (const job of jobs) {
    if (excludeJobIds.has(job.id)) continue;
    const match = scoreJobForFreelancer(job, favorite, now);
    if (match.score < FLEXPOOL_MATCH_MIN_SCORE) continue;
    const beatsBest =
      best === null ||
      match.score > best.score ||
      (match.score === best.score &&
        (job.title.localeCompare(best.jobTitle) < 0 ||
          (job.title === best.jobTitle && job.id < best.jobId)));
    if (beatsBest) {
      best = {
        jobId: job.id,
        jobTitle: job.title,
        score: match.score,
        reason: topPositiveReason(match.reasons),
      };
    }
  }
  return best;
}
