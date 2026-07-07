// Livecheck-opruiming: routines (de 24/7-auto-build) publiceren tijdens een run soms een
// tijdelijke "livecheck"-opdracht om end-to-end te verifiëren dat publiceren nog werkt. Die
// opdrachten krijgen een titel als `Livecheck publiceren 1781209076945` (het woord "Livecheck",
// een korte omschrijving en een millisecond-timestamp). Zonder opruiming blijven ze als testrestant
// tussen de echte opdrachten op /admin/opdrachten staan.
//
// Dit bestand bevat de PURE match-/guard-logica (unit-getest); de daadwerkelijke database-sweep
// draait in prisma/seed.ts bij elke boot. De guard is bewust defensief: alleen een opdracht die
// zeker een livecheck-artefact is én veilig te verwijderen (geen echte relaties) wordt geruimd.

/** Regel die exact matcht op titels zoals "Livecheck publiceren 1781209076945".
 *  Anchored + timestamp-eis zodat een echte opdracht die toevallig "livecheck" bevat niet matcht. */
const LIVECHECK_TITLE = /^Livecheck\b.*\b\d{10,}\b\s*$/;

/** Statussen waarin een livecheck-artefact veilig te verwijderen is (nooit een gepubliceerde,
 *  actieve opdracht). */
const SWEEPABLE_STATUSES = new Set(["DRAFT", "CLOSED"]);

/** Minimale leeftijd (ms) voordat een livecheck-opdracht wordt geruimd: laat een lopende
 *  livecheck-run met rust en ruim alleen achtergebleven artefacten van eerdere runs. */
export const LIVECHECK_MIN_AGE_MS = 24 * 60 * 60 * 1000; // 1 dag

/** True als de titel het livecheck-artefactpatroon volgt (woord "Livecheck" + timestamp). */
export function isLivecheckTitle(title: string): boolean {
  return LIVECHECK_TITLE.test(title.trim());
}

export interface LivecheckCandidate {
  title: string;
  status: string;
  createdAt: Date;
  /** aantal reacties op de opdracht */
  applicationCount: number;
  /** aantal samenwerkingen op de opdracht */
  collaborationCount: number;
}

/**
 * Guard: mag deze opdracht als livecheck-artefact geruimd worden? Alleen als álle voorwaarden
 * kloppen — titelpatroon, veilige status, ouder dan de drempel, en géén reacties/samenwerkingen.
 * Zo raakt de sweeper nooit echte data.
 */
export function isSweepableLivecheck(job: LivecheckCandidate, now: Date = new Date()): boolean {
  if (!isLivecheckTitle(job.title)) return false;
  if (!SWEEPABLE_STATUSES.has(job.status)) return false;
  if (job.applicationCount > 0 || job.collaborationCount > 0) return false;
  return now.getTime() - job.createdAt.getTime() >= LIVECHECK_MIN_AGE_MS;
}
