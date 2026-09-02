// Overdue-onbezette opdrachten van een opdrachtgever: gepubliceerde opdrachten waarvan de startdatum
// al is verstreken terwijl er nog niemand is vastgelegd (geen ACCEPTED-reactie én geen niet-geannuleerde
// samenwerking). Dit signaal stond al op het opdracht-detail (`JobStaffingRiskCard`,
// `summarizeStaffingRisk` → phase "overdue") en als lijstbadge (`jobFillUrgency`), maar ontbrak in het
// next-action-model — precies het "signaal op één oppervlak"-anti-patroon dat de codebase herhaaldelijk
// dicht. Deze helper is de bron van waarheid voor de /acties-taak, en leunt op exact hetzelfde pure
// `summarizeStaffingRisk` als het detailscherm zodat de twee oppervlakken niet kunnen driften.
//
// Onderscheid van `getClientColdJobs`: dat is het vacaturetempo (respons-momentum, "weinig respons/traag
// tempo"); dit is de verstreken planning-deadline. Een opdracht kan prima reacties krijgen en tóch met een
// verstreken startdatum leeg staan. Server-side is de waarheid; read-only, geen mutatie.

import { prisma } from "@/lib/db";
import { startOfUtcDay } from "@/lib/signals";
import { summarizeStaffingRisk, type StaffingRiskAction } from "@/lib/job-staffing-risk";

export interface ClientOverdueJob {
  jobId: string;
  title: string;
  /** Hele dagen dat de startdatum verstreken is (negatief; -1 = gisteren). */
  daysUntilStart: number;
  /** Meest gerichte volgende stap (shortlist → reacties → bereik vergroten). */
  action: StaffingRiskAction;
}

/**
 * Harde bovengrens op de scan (gepubliceerde, ongevulde, over-tijd opdrachten). Gelijk aan de `MAX`/
 * `CASCADE_SCAN_LIMIT`-conventie elders; overdue opdrachten zijn zeldzaam en de oudst-startende zit
 * zeker binnen de cap.
 */
export const OVERDUE_JOB_SCAN_LIMIT = 50;

/**
 * De overdue-onbezette gepubliceerde opdrachten van deze opdrachtgever, meest-verstreken eerst.
 * DB-side gefilterd op exact de overdue-onbezette voorwaarde (PUBLISHED, startdatum vóór vandaag, géén
 * ACCEPTED-reactie, géén niet-geannuleerde samenwerking), daarna per opdracht door het canonieke
 * `summarizeStaffingRisk` gehaald zodat de fase en de aanbevolen actie identiek zijn aan het detailscherm.
 *
 * Efficiënt + begrensd: één begrensde jobs-query + één begrensde reactie-query over de kandidaat-set
 * (voor de `action`-afleiding: heeft de opdracht een shortlist of losse reacties?) — geen N+1.
 */
export async function getClientOverdueJobs(
  userId: string,
  now: Date,
  limit: number = OVERDUE_JOB_SCAN_LIMIT,
): Promise<ClientOverdueJob[]> {
  const jobs = await prisma.job.findMany({
    where: {
      company: { userId },
      status: "PUBLISHED",
      // Startdatum al verstreken: strikt vóór de UTC-dag van vandaag (dezelfde grens die
      // `summarizeStaffingRisk` als daysUntilStart < 0 leest). `lt` sluit null-startdata uit.
      startDate: { lt: startOfUtcDay(now) },
      // Onbezet: geen vastgelegde kandidaat. `lockedIn` = ACCEPTED-reactie óf een niet-geannuleerde
      // samenwerking; beide sluiten de opdracht als "iemand vastgelegd".
      applications: { none: { status: "ACCEPTED" } },
      collaborations: { none: { status: { not: "CANCELLED" } } },
    },
    select: { id: true, title: true, startDate: true },
    // Meest-verstreken eerst (oudste startdatum), zeker binnen de scan-cap.
    orderBy: { startDate: "asc" },
    take: limit,
  });
  if (jobs.length === 0) return [];

  // Reactie-standen voor de `action`-afleiding (shortlist vs. losse reacties): de database telt per
  // (opdracht, status). Een `groupBy` raakt geen enkele reactierij aan — een opdracht met duizend
  // reacties kost hier evenveel als een opdracht met tien.
  const appGroups = await prisma.application.groupBy({
    by: ["jobId", "status"],
    where: { jobId: { in: jobs.map((j) => j.id) }, status: { not: "WITHDRAWN" } },
    _count: { _all: true },
  });
  const applicantByJob = new Map<string, number>();
  const shortlistByJob = new Map<string, number>();
  for (const g of appGroups) {
    applicantByJob.set(g.jobId, (applicantByJob.get(g.jobId) ?? 0) + g._count._all);
    if (g.status === "SHORTLIST") {
      shortlistByJob.set(g.jobId, (shortlistByJob.get(g.jobId) ?? 0) + g._count._all);
    }
  }

  const overdue: ClientOverdueJob[] = [];
  for (const job of jobs) {
    const risk = summarizeStaffingRisk({
      status: "PUBLISHED",
      startDate: job.startDate,
      lockedIn: false, // door de DB-poort gegarandeerd
      applicantCount: applicantByJob.get(job.id) ?? 0,
      shortlistCount: shortlistByJob.get(job.id) ?? 0,
      now,
    });
    // Canonieke fase-poort: alleen echt-verstreken opdrachten (geen drift met het detailscherm).
    if (risk.phase !== "overdue" || risk.daysUntilStart == null) continue;
    overdue.push({
      jobId: job.id,
      title: job.title,
      daysUntilStart: risk.daysUntilStart,
      action: risk.action,
    });
  }
  return overdue;
}
