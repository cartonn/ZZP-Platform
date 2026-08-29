// Koud-lopende opdrachten van een opdrachtgever: gepubliceerde, nog-ongevulde opdrachten die om
// bijsturen vragen omdat ze geen of te weinig kandidaten trekken (`summarizeVacancyPerformance.
// attention`). Dit signaal stond al op de opdracht-lijst/-detail en als achtergrondnotificatie
// (`job-engagement.ts`), maar ontbrak in het next-action-model. Deze helper is de ÉNE bron van
// waarheid die zowel de /acties-taak (`jobNeedsAttentionTask`) als de /opdrachten-nav-badge voedt,
// zodat de twee oppervlakken niet kunnen driften (het "signaal op één oppervlak"-anti-patroon dat
// de codebase herhaaldelijk dicht). Server-side is de waarheid; geen mutatie.

import { prisma } from "@/lib/db";
import {
  summarizeVacancyPerformance,
  VACANCY_COLD_MAX_APPLICATIONS,
} from "@/lib/job-vacancy-performance";

export interface ClientColdJob {
  jobId: string;
  title: string;
  /** Pace-kop uit `summarizeVacancyPerformance` ("Weinig respons" / "Traag tempo"). */
  headline: string;
}

/**
 * Harde bovengrens op de scan (gepubliceerde, ongevulde opdrachten). Beide oppervlakken (/acties +
 * badge) delen deze via de default zodat ze op exact dezelfde rijen redeneren — gelijk aan de `MAX`/
 * `CASCADE_SCAN_LIMIT`-conventie elders.
 */
export const COLD_JOB_SCAN_LIMIT = 50;

/**
 * De koud-lopende gepubliceerde opdrachten van deze opdrachtgever, oudst-open eerst (meest urgent).
 * Puur bepaald door het gedeelde `summarizeVacancyPerformance` (zelfde koud-drempels als het scherm en
 * de achtergrondnotificatie), zodat /acties en de badge nooit tegenspreken.
 *
 * Efficiënt + begrensd: béíde attentie-takken van `summarizeVacancyPerformance` vereisen minder dan 3
 * actieve reacties (`VACANCY_COLD_MAX_APPLICATIONS`), dus we pre-filteren DB-side op de
 * niet-ingetrokken-reactie-telling en halen alleen voor die kleine kandidaat-set de reactie-
 * tijdstempels op (max een handvol per opdracht → geen zware query, geen N+1). Deterministische
 * ordering + scan-cap zodat de twee callers identieke rijen zien.
 */
export async function getClientColdJobs(
  userId: string,
  now: Date,
  limit: number = COLD_JOB_SCAN_LIMIT,
): Promise<ClientColdJob[]> {
  const jobs = await prisma.job.findMany({
    where: {
      company: { userId },
      status: "PUBLISHED",
      // Onbezet: geen kandidaat vastgelegd. `lockedIn` = ACCEPTED-reactie óf een niet-geannuleerde
      // samenwerking (PROPOSED/ACTIVE/…) — beide betekenen "iemand vastgelegd", dus de opdracht vraagt
      // niet langer om méér kandidaten. Spiegelt de lockedIn-poort van `getClientOverdueJobs` +
      // `summarizeStaffingRisk`. Voorheen sloot alleen een ACTIVE-samenwerking de opdracht uit, waardoor
      // een reeds-geaccepteerde kandidaat (ACCEPTED-reactie, nog geen samenwerking — de propose-limbo)
      // of een PROPOSED-samenwerking (contract nog te tekenen) tóch als "weinig respons — verruim de
      // zichtbaarheid" verscheen: een next-action die de gelijktijdige "rond de hire af"/"onderteken het
      // contract"-actie voor dezelfde opdracht rechtstreeks tegensprak.
      applications: { none: { status: "ACCEPTED" } },
      collaborations: { none: { status: { not: "CANCELLED" } } },
    },
    select: {
      id: true,
      title: true,
      publishedAt: true,
      createdAt: true,
      _count: { select: { applications: { where: { status: { not: "WITHDRAWN" } } } } },
    },
    // Oudst-open eerst: een langer koud lopende opdracht is urgenter en zit zeker binnen de scan-cap.
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  // Alleen opdrachten onder de koud-drempel kunnen ooit `attention` worden — voor de overige is de
  // reactie-fetch verspilling. Zelfde constante als de pure logica → geen aparte waarheid.
  const candidates = jobs.filter((j) => j._count.applications <= VACANCY_COLD_MAX_APPLICATIONS);
  if (candidates.length === 0) return [];

  // Reactie-tijdstempels voor de kandidaat-set in één query (elk ≤ VACANCY_COLD_MAX_APPLICATIONS rijen).
  const apps = await prisma.application.findMany({
    where: { jobId: { in: candidates.map((j) => j.id) }, status: { not: "WITHDRAWN" } },
    select: { jobId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const datesByJob = new Map<string, Date[]>();
  for (const a of apps) {
    const list = datesByJob.get(a.jobId);
    if (list) list.push(a.createdAt);
    else datesByJob.set(a.jobId, [a.createdAt]);
  }

  const cold: ClientColdJob[] = [];
  for (const j of candidates) {
    const summary = summarizeVacancyPerformance({
      publishedAt: j.publishedAt ?? j.createdAt,
      now,
      applicationDates: datesByJob.get(j.id) ?? [],
    });
    if (summary.attention) {
      cold.push({ jobId: j.id, title: j.title, headline: summary.headline });
    }
  }
  return cold;
}
