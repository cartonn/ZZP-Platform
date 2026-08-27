// "Reageerde ook op je andere opdrachten"-signaal voor de opdrachtgever op /kandidaten. Wanneer één
// ZZP'er op meerdere van je open opdrachten reageerde, staan die reacties nu als losse rijen zonder dat
// zichtbaar is dat het één en dezelfde persoon is. Dit signaal maakt die breedte expliciet, zodat de
// opdrachtgever (1) een hoog-intentie, veelzijdige kandidaat herkent en op de best passende rol plaatst,
// (2) dezelfde persoon niet mentaal dubbeltelt bij het inschatten van de pijplijndiepte, en (3) niet per
// ongeluk dezelfde ZZP'er op twee botsende opdrachten accepteert. Benchmark: Malt/Deel/Temper tonen
// "applied to N of your roles"; wij vertalen dat naar onze verklaarbare, server-berekende kandidatenlijst.
//
// Puur en deterministisch; geen extra query (afgeleid uit de reeds geladen reactielijst). Toont alleen
// opdrachten van déze opdrachtgever (de bron is al per opdrachtgever gescoopt) — nooit data van een
// andere opdrachtgever, nooit tarieven of scores van de kandidaat op de andere opdracht.

/** Eén reactie-rij zoals de kandidatenpagina die al heeft geladen. */
export interface MultiApplyRow {
  /** Profiel-id van de reagerende ZZP'er (Application.freelancer.id). */
  freelancerId: string;
  /** Opdracht waarop gereageerd is (Application.job.id). */
  jobId: string;
  /** Titel van die opdracht (Application.job.title). */
  jobTitle: string;
  /** Status van de reactie; afgewezen/ingetrokken tellen niet als "nog in de race". */
  status: string;
}

/** Een opdracht waarop de kandidaat ook (nog actief) reageerde. */
export interface MultiApplyJob {
  id: string;
  title: string;
}

// "Nog in de race" — spiegelt exact de vergelijk-instap op /kandidaten (page.tsx): een afgewezen of
// ingetrokken reactie telt niet mee als een opdracht waarop de kandidaat nog meedingt.
const INACTIVE_STATUSES = new Set(["REJECTED", "WITHDRAWN"]);

/**
 * Pure aggregator: bouwt per freelancer-profiel de set opdrachten waarop nog een actieve reactie
 * staat. Alleen profielen met ≥ 2 distincte opdrachten komen in de Map terug (afwezig = reageerde op
 * hooguit één opdracht → geen breedte-signaal). Dubbele (jobId) tellen éénmaal — het datamodel borgt
 * `@@unique([jobId, freelancerId])`, maar de dedup maakt de functie robuust tegen dubbele invoer. De
 * lijst is deterministisch gesorteerd (titel, dan id) zodat de UI stabiel rendert.
 */
export function summarizeMultiApply(rows: readonly MultiApplyRow[]): Map<string, MultiApplyJob[]> {
  const byFreelancer = new Map<string, Map<string, string>>();
  for (const row of rows) {
    if (INACTIVE_STATUSES.has(row.status)) continue;
    let jobs = byFreelancer.get(row.freelancerId);
    if (!jobs) {
      jobs = new Map();
      byFreelancer.set(row.freelancerId, jobs);
    }
    if (!jobs.has(row.jobId)) jobs.set(row.jobId, row.jobTitle);
  }
  const result = new Map<string, MultiApplyJob[]>();
  for (const [freelancerId, jobs] of byFreelancer) {
    if (jobs.size < 2) continue;
    const list = [...jobs.entries()]
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title, "nl") || a.id.localeCompare(b.id));
    result.set(freelancerId, list);
  }
  return result;
}

/**
 * De andere opdrachten (≠ de opdracht van de huidige rij) waarop deze kandidaat ook actief reageerde.
 * Geeft [] terug wanneer er geen breedte is (kandidaat afwezig in de Map of alleen op deze opdracht).
 */
export function otherAppliedJobs(
  all: readonly MultiApplyJob[] | undefined,
  currentJobId: string,
): MultiApplyJob[] {
  if (!all) return [];
  return all.filter((job) => job.id !== currentJobId);
}

/** NL-chiplabel voor het aantal andere opdrachten. Leeg bij ≤ 0 (component rendert dan niets). */
export function multiApplyLabel(otherCount: number): string {
  if (otherCount <= 0) return "";
  return otherCount === 1 ? "Ook op 1 andere opdracht" : `Ook op ${otherCount} andere opdrachten`;
}
