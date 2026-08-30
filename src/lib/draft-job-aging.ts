// Leeftijd-bewuste concept-opdracht-nudge (opdrachtgever). Een opdrachtgever start soms een opdracht
// als concept (DRAFT) — de behoefte is er, maar de vacature wordt nooit gepubliceerd en verdwijnt uit
// beeld. Tot nu toe zag de opdrachtgever alleen één platte telling ("N concept-opdrachten — publiceren?",
// `draftJobsTask`, prioriteit `drafts`), ongeacht of een concept vandaag of drie weken geleden werd
// aangeraakt. Deze pure helper splitst de concepten op leeftijd: een concept dat lang stilstaat wordt een
// specifieke, deep-linkbare next-action ("Concept 'X' — N dagen ongepubliceerd") die de opdrachtgever
// naar de bewerkpagina leidt, terwijl verse concepten in de rustige aggregaat-telling blijven. Zo mist de
// opdrachtgever nooit meer een half-afgemaakte vacature — precies het "signaal verdwijnt in een telling"-
// anti-patroon dat de codebase elders al dicht (first-look/stale-applications, koud/overdue-opdracht).
//
// Puur en deterministisch: geen DB, geen I/O. Server-side is de waarheid; de loader
// (`src/lib/data/client-draft-jobs.ts`) levert de concepten, deze functie beslist welke stil staan.

/**
 * Drempel (hele dagen sinds de laatste aanpassing) waarboven een concept-opdracht "stil" heet en als
 * eigen next-action wordt opgevoerd. 14 dagen: kort genoeg om een vergeten vacature op tijd te redden,
 * lang genoeg om een concept dat de opdrachtgever deze/afgelopen week nog bewerkte niet te overvragen.
 */
export const STALE_DRAFT_JOB_DAYS = 14;

/** Ruwe concept-opdracht zoals de loader hem aanlevert. */
export interface DraftJobInput {
  jobId: string;
  title: string;
  /** Laatste aanpassing (`Job.updatedAt`) — de klok voor "hoe lang staat dit al stil?". */
  updatedAt: Date;
}

/** Een stilstaand concept met zijn leeftijd, klaar voor de next-action-builder. */
export interface StaleDraftJob {
  jobId: string;
  title: string;
  /** Hele dagen sinds de laatste aanpassing (≥ `STALE_DRAFT_JOB_DAYS`). */
  ageDays: number;
}

export interface DraftJobAging {
  /** Stilstaande concepten, oudste eerst — elk een eigen next-action. */
  stale: StaleDraftJob[];
  /** Aantal verse concepten (jonger dan de drempel) — samen de rustige aggregaat-telling. */
  freshCount: number;
}

/** Hele dagen sinds `updatedAt`. Een `updatedAt` in de toekomst (data-ruis) levert 0, nooit negatief. */
export function draftAgeDays(updatedAt: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Splits de concept-opdrachten in stilstaand (≥ `STALE_DRAFT_JOB_DAYS` dagen niet aangeraakt) en vers.
 * De stilstaande worden oudste-eerst gesorteerd (grootste `ageDays` bovenaan; bij gelijke leeftijd blijft
 * de invoervolgorde behouden, stabiel). De verse concepten leveren alleen een telling — samen de bestaande
 * aggregaat-nudge. Een lege invoer geeft `{ stale: [], freshCount: 0 }`.
 */
export function summarizeDraftJobAging(drafts: DraftJobInput[], now: Date): DraftJobAging {
  const stale: StaleDraftJob[] = [];
  let freshCount = 0;
  for (const draft of drafts) {
    const ageDays = draftAgeDays(draft.updatedAt, now);
    if (ageDays >= STALE_DRAFT_JOB_DAYS) {
      stale.push({ jobId: draft.jobId, title: draft.title, ageDays });
    } else {
      freshCount += 1;
    }
  }
  // Stabiel oudste-eerst: alleen op leeftijd sorteren, gelijke leeftijd houdt invoervolgorde.
  stale.sort((a, b) => b.ageDays - a.ageDays);
  return { stale, freshCount };
}
