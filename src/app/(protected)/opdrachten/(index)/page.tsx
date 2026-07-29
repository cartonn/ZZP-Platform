import { type Metadata } from "next";
import Link from "next/link";
import {
  BadgeEuro,
  Briefcase,
  CalendarClock,
  CalendarOff,
  Check,
  ChevronRight,
  Gauge,
  MapPin,
  MessageSquareReply,
  Minus,
  Navigation,
  Plus,
  SearchX,
  Send,
  ShieldAlert,
  ShieldQuestion,
  Users,
  Wallet,
} from "lucide-react";
import type { Prisma } from "@prisma/client";
import { type Actor, requireActor } from "@/lib/authz";
import { visibleJobsWhere } from "@/lib/tenancy";
import { prisma } from "@/lib/db";
import { JOBS_PER_PAGE, MATCH_SORT_SCAN_CAP, normalizeJobFilters } from "@/lib/jobs";
import { scoreJobForFreelancer, topGapReason, topPositiveReason } from "@/lib/matching";
import { sortJobsByMatch } from "@/lib/job-match-sort";
import { jobStartProximity } from "@/lib/job-start-proximity";
import { getTranslator } from "@/lib/i18n/server";
import {
  type ApplicationStatus,
  type AvailabilityWindowType,
  type JobStatus,
  type WorkMode,
} from "@/lib/enums";
import {
  assessJobStartAvailability,
  jobAvailabilityChip,
  type JobAvailabilityChip,
} from "@/lib/job-availability-signal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { JobFilters } from "@/components/jobs/job-filters";
import { ActiveFilterChips } from "@/components/jobs/active-filter-chips";
import { describeActiveJobFilters } from "@/lib/jobs/active-filters";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { JobPipelineStrip } from "@/components/jobs/job-pipeline-strip";
import { ReceivedInvitationsBand } from "@/components/jobs/received-invitations-band";
import { getReceivedInvitations } from "@/lib/data/received-invitations";
import { type ReceivedInvitation } from "@/lib/received-invitations";
import { withParams } from "@/components/admin/base-path";
import { plural } from "@/lib/plural";
import { summarizeJobPipeline } from "@/lib/job-pipeline";
import { competitionChip, summarizeJobCompetition } from "@/lib/job-competition";
import { paymentTrustChip, type PaymentTrustChip } from "@/lib/payment-behavior";
import { jobRateFitChip, type JobRateFitChip } from "@/lib/job-rate-fit";
import { jobComplianceChip, type JobComplianceChip } from "@/lib/jobs/compliance-chip";
import { jobFillUrgency, type JobFillUrgencyChip } from "@/lib/jobs/fill-urgency";
import { JobFillUrgencyBadge } from "@/components/jobs/job-fill-urgency-badge";
import { appliedJobChipFor, type AppliedJobChip } from "@/lib/job-applied-chip";
import { getPaymentBehaviorForCompanies } from "@/lib/data/payment-behavior";
import { responsivenessChip } from "@/lib/client-responsiveness";
import { getClientResponsivenessForCompanies } from "@/lib/data/client-responsiveness";
import {
  summarizeVacancyPerformance,
  type VacancyPerformanceSummary,
} from "@/lib/job-vacancy-performance";
import { summarizeVacancyPortfolio, vacancyPortfolioHeadline } from "@/lib/job-vacancy-overview";
import { VacancyPaceChip } from "@/components/jobs/vacancy-pace-chip";
import { diagnoseVacancyRate, type VacancyRateDiagnosis } from "@/lib/vacancy-rate-diagnosis";
import { VacancyRateDiagnosisNote } from "@/components/jobs/vacancy-rate-diagnosis-note";
import { getJobRateBands } from "@/lib/data/job-rate-bands";
import {
  type CandidateProximity,
  classifyCandidateProximity,
  proximityLabel,
  PROXIMITY_TONE_CLASS,
} from "@/lib/candidate-proximity";
import {
  JOB_STATUS_FILTER_LABEL,
  JOB_STATUS_FILTER_ORDER,
  filterJobsByStatus,
  parseJobStatusFilter,
  summarizeJobStatusGroups,
} from "@/lib/job-status-filter";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export const metadata: Metadata = { title: "Opdrachten · ZZP Platform" };

const WORK_MODE: Record<WorkMode, string> = {
  REMOTE: "Remote",
  ONSITE: "Op locatie",
  HYBRID: "Hybride",
};

// Toon-klassen voor de "gereageerd + status"-chip op de opdrachtenlijst (ZZP'er).
const APPLIED_CHIP_TONE_CLASS: Record<AppliedJobChip["tone"], string> = {
  info: "text-muted-foreground",
  positive: "text-primary",
  success: "text-success",
  muted: "text-muted-foreground",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function OpdrachtenPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireActor();
  const sp = await searchParams;
  if (actor.role === "CLIENT") {
    return <ClientJobs userId={actor.id} searchParams={sp} />;
  }
  return <BrowseJobs searchParams={sp} actor={actor} />;
}

// --- CLIENT: beheeroverzicht van eigen opdrachten als kaartgrid (zelfde stijl als de ZZP'er-kaarten) ---
async function ClientJobs({
  userId,
  searchParams,
}: {
  userId: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // unbounded-allow: eigenaar-scoped kanban van eigen opdrachten; kandidaat toekomstige paginatie
  const jobs = await prisma.job.findMany({
    where: { company: { userId } },
    orderBy: { updatedAt: "desc" },
  });

  // Reactie-pijplijn per opdracht in één query (geen N+1): tel per (opdracht, status). De pure
  // `summarizeJobPipeline` vouwt de statussen samen tot het "wat vraagt actie?"-overzicht per kaart.
  const pipelineGroups = await prisma.application.groupBy({
    by: ["jobId", "status"],
    where: { job: { company: { userId } } },
    _count: { _all: true },
  });
  const statusesByJob = new Map<string, ApplicationStatus[]>();
  for (const g of pipelineGroups) {
    const list = statusesByJob.get(g.jobId) ?? [];
    for (let i = 0; i < g._count._all; i += 1) list.push(g.status as ApplicationStatus);
    statusesByJob.set(g.jobId, list);
  }

  // Vacaturetempo per gepubliceerde opdracht: dezelfde server-side maat als de opdracht-detailpagina
  // (`summarizeVacancyPerformance`), maar hier lijst-breed zodat de opdrachtgever in één oogopslag ziet
  // welke opdracht koud loopt. Eén begrensde query over de actieve reacties van de eigen opdrachten
  // (geen N+1); de reactie-tijdstempels sturen tempo + momentum.
  const now = new Date();
  const activeApplications = await prisma.application.findMany({
    where: { job: { company: { userId } }, status: { not: "WITHDRAWN" } },
    orderBy: { createdAt: "asc" },
    take: 2000,
    select: { jobId: true, createdAt: true },
  });
  const datesByJob = new Map<string, Date[]>();
  for (const a of activeApplications) {
    const list = datesByJob.get(a.jobId) ?? [];
    list.push(a.createdAt);
    datesByJob.set(a.jobId, list);
  }
  const vacancyByJob = new Map<string, VacancyPerformanceSummary>();
  const publishedSummaries: VacancyPerformanceSummary[] = [];
  for (const job of jobs) {
    if (job.status !== "PUBLISHED") continue;
    const summary = summarizeVacancyPerformance({
      publishedAt: job.publishedAt ?? job.createdAt,
      now,
      applicationDates: datesByJob.get(job.id) ?? [],
    });
    vacancyByJob.set(job.id, summary);
    publishedSummaries.push(summary);
  }

  // Acuut-onbezet-signaal per opdracht: een gepubliceerde opdracht waarvan de startdatum nadert of al
  // verstreken is, terwijl er nog niemand geplaatst is (geen niet-geannuleerde samenwerking). Distinct
  // en urgenter dan het vacaturetempo (respons-momentum): een opdracht kan reacties krijgen en tóch
  // morgen ongevuld starten. Eén begrensde groupBy over de eigen niet-geannuleerde samenwerkingen (geen
  // N+1) bepaalt "vervuld"; `jobFillUrgency` beslist server-side of er iets te melden valt.
  const filledGroups = await prisma.collaboration.groupBy({
    by: ["jobId"],
    where: { job: { company: { userId } }, status: { not: "CANCELLED" } },
    _count: { _all: true },
  });
  const filledJobIds = new Set(filledGroups.map((g) => g.jobId));
  const fillUrgencyByJob = new Map<string, JobFillUrgencyChip>();
  for (const job of jobs) {
    const chip = jobFillUrgency(
      {
        status: job.status as JobStatus,
        startDate: job.startDate,
        filled: filledJobIds.has(job.id),
      },
      now,
    );
    if (chip) fillUrgencyByJob.set(job.id, chip);
  }
  const portfolioHeadline = vacancyPortfolioHeadline(summarizeVacancyPortfolio(publishedSummaries));

  // Tarief-diagnose: verbind een koud lopende opdracht met de marktband, zodat de opdrachtgever de
  // meest waarschijnlijke — en direct oplosbare — oorzaak van uitblijvende reacties ziet ("je biedt
  // tot €X/u, markttarief ~€Y/u"). Alleen relevant voor opdrachten die bijsturen vragen (`attention`)
  // én een begrensde bovengrens hebben; de marktband wordt maar één keer geladen (geen N+1) en alleen
  // wanneer er zo'n kandidaat is. `diagnoseVacancyRate` bepaalt server-side of er iets te melden valt.
  const rateDiagByJob = new Map<string, VacancyRateDiagnosis>();
  const rateCandidates = jobs.filter((job) => {
    const summary = vacancyByJob.get(job.id);
    return summary?.attention === true && job.rateMax != null;
  });
  if (rateCandidates.length > 0) {
    const industryIds = [
      ...new Set(
        rateCandidates.map((job) => job.industryId).filter((id): id is string => id != null),
      ),
    ];
    const bands = await getJobRateBands(industryIds);
    for (const job of rateCandidates) {
      const summary = vacancyByJob.get(job.id)!;
      const band = job.industryId ? bands.byIndustry[job.industryId] : bands.platform;
      if (!band) continue;
      const diagnosis = diagnoseVacancyRate({
        attention: summary.attention,
        scope: band.scope,
        median: band.median,
        rateMax: job.rateMax,
      });
      if (diagnosis) rateDiagByJob.set(job.id, diagnosis);
    }
  }

  // Statusfilter (Alle/Concept/Gepubliceerd/Gesloten) — tellingen over de volledige lijst voor de
  // pill-labels, de gefilterde lijst voor de weergave. Spiegelt het pill-patroon van /facturen.
  const activeFilter = parseJobStatusFilter(first(searchParams.status));
  const groupCounts = summarizeJobStatusGroups(jobs);
  const filtered = filterJobsByStatus(jobs, activeFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mijn opdrachten"
        description="Beheer je opdrachten en publiceer ze voor ZZP'ers."
        action={
          <Button asChild>
            <Link href="/opdrachten/nieuw">
              <Plus className="size-4" aria-hidden /> Nieuwe opdracht
            </Link>
          </Button>
        }
      />

      {portfolioHeadline && (
        <div className="flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          <Gauge className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{portfolioHeadline}</span>
        </div>
      )}

      {jobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={Briefcase}
            title="Nog geen opdrachten"
            description="Maak je eerste opdracht aan en vind de juiste ZZP'er."
            action={{ label: "Nieuwe opdracht", href: "/opdrachten/nieuw" }}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {JOB_STATUS_FILTER_ORDER.map((group) => {
              const active = activeFilter === group;
              return (
                <Link
                  key={group}
                  href={
                    group === "all" ? "/opdrachten" : withParams("/opdrachten", { status: group })
                  }
                  aria-current={active ? "page" : undefined}
                  className={[
                    "focus-ring inline-flex items-center rounded-md border px-3 py-1 text-sm transition-colors",
                    active
                      ? "border-accent-foreground/20 bg-accent text-accent-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {JOB_STATUS_FILTER_LABEL[group]} ({groupCounts[group]})
                </Link>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={Briefcase}
                title="Geen opdrachten met deze status"
                description="Pas het filter aan om meer opdrachten te zien."
              />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((job) => (
                <Card key={job.id} className="flex flex-col gap-3 p-4">
                  {/* Kop: icoon + titel + status — zelfde kaartopbouw als de ZZP'er-kaarten */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Briefcase className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{job.title}</p>
                      {job.location && (
                        <p className="truncate text-xs text-muted-foreground">{job.location}</p>
                      )}
                    </div>
                    <span className="shrink-0">
                      <JobStatusBadge status={job.status as JobStatus} />
                    </span>
                  </div>

                  <JobPipelineStrip
                    pipeline={summarizeJobPipeline(statusesByJob.get(job.id) ?? [])}
                  />

                  {fillUrgencyByJob.has(job.id) && (
                    <JobFillUrgencyBadge chip={fillUrgencyByJob.get(job.id)!} />
                  )}

                  {vacancyByJob.has(job.id) && (
                    <VacancyPaceChip summary={vacancyByJob.get(job.id)!} />
                  )}

                  {rateDiagByJob.has(job.id) && (
                    <VacancyRateDiagnosisNote diagnosis={rateDiagByJob.get(job.id)!} />
                  )}

                  <div className="mt-auto pt-1">
                    <Button asChild variant="secondary" size="sm" className="w-full">
                      <Link href={`/opdrachten/${job.id}`}>Bekijk opdracht</Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- FREELANCER/ADMIN: gepubliceerde opdrachten zoeken/filteren ---
async function BrowseJobs({
  searchParams,
  actor,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  actor: Actor;
}) {
  const f = normalizeJobFilters(searchParams);

  // Gesloten per tenant (+ overflow): een tenant-ZZP'er ziet diensten van zijn franchise + opengestelde
  // diensten; een directe ZZP'er platform-opdrachten + opengestelde diensten. ADMIN ziet alles.
  // Tarieffilters als AND-clausules: sluit een opdracht alléén uit als de relevante grens bekend is
  // én buiten bereik valt. Een onbekende grens (nullable rateMin/rateMax) telt niet als uitsluiting —
  // anders verdween een "€80+/uur"-opdracht (rateMax null) stilzwijgend bij een minimumtarief-filter.
  const and: Prisma.JobWhereInput[] = [visibleJobsWhere(actor)];
  if (f.rateMin != null) and.push({ OR: [{ rateMax: { gte: f.rateMin } }, { rateMax: null }] });
  if (f.rateMax != null) and.push({ OR: [{ rateMin: { lte: f.rateMax } }, { rateMin: null }] });
  // AND-clausule zodat de tekstzoek-OR hieronder de zichtbaarheids-OR niet overschrijft.
  const where: Prisma.JobWhereInput = { status: "PUBLISHED", AND: and };
  if (f.q) where.OR = [{ title: { contains: f.q } }, { description: { contains: f.q } }];
  if (f.location) where.location = { contains: f.location };
  if (f.workMode) where.workMode = f.workMode;
  if (f.skillIds.length) where.skills = { some: { skillId: { in: f.skillIds } } };
  if (f.requiredCredential) {
    where.credentialRequirements = {
      some: { credentialType: f.requiredCredential, required: true },
    };
  }

  // "recent" én "match" vallen op publishedAt-desc: bij match-sortering scant dit de nieuwste
  // opdrachten binnen de cap, die daarna in het geheugen op matchscore worden herrangschikt.
  const orderBy: Prisma.JobOrderByWithRelationInput =
    f.sort === "rate_desc"
      ? { rateMax: "desc" }
      : f.sort === "rate_asc"
        ? { rateMin: "asc" }
        : { publishedAt: "desc" };

  // Profiel eerst apart: het is de enige `where`-afhankelijkheid van de bewaarde-opdrachten-query,
  // waardoor die daarna in dezelfde parallelle batch als de opdrachten kan meedraaien i.p.v. een
  // extra seriële roundtrip achteraf.
  const profile =
    actor.role === "FREELANCER"
      ? await prisma.freelancerProfile.findUnique({
          where: { userId: actor.id },
          include: {
            skills: { select: { skillId: true } },
            credentials: { select: { type: true, status: true, expiresAt: true } },
            industries: { select: { industryId: true } },
            availabilityWindows: {
              select: { startDate: true, endDate: true, type: true, note: true },
            },
          },
        })
      : null;

  // Match-sortering is alleen zinvol met een profiel om tegen te scoren (ADMIN heeft er geen). Zonder
  // profiel valt de weergave terug op de DB-sortering (publishedAt-desc) en tonen we geen matchbadges.
  const effectiveMatchSort = f.sort === "match" && profile != null;

  // Branchefilter: een expliciet gekozen branche (`industryId`) is het meest specifiek en wint. Anders,
  // wanneer de ZZP'er de "Mijn vakgebied"-quickfilter aanzet, beperk tot de eigen profielbranches. Zo
  // ziet een zorg-ZZP'er in één klik geen IT-opdrachten meer. Zonder profielbranches doet `mine` niets.
  const myIndustryIds = profile ? profile.industries.map((i) => i.industryId) : [];
  if (f.industryId) {
    where.industryId = f.industryId;
  } else if (f.mine && myIndustryIds.length > 0) {
    where.industryId = { in: myIndustryIds };
  }

  // "Verberg opdrachten waarop ik al reageerde" (alleen ZZP'er): sluit opdrachten uit waarop deze
  // ZZP'er al een niet-ingetrokken reactie heeft. Server-side where-clause vóór count én paginering,
  // zodat de telling én de pagina's kloppen (niet post-fetch). Een ingetrokken (WITHDRAWN) reactie
  // telt niet mee — de opdracht is dan weer een echte, herbruikbare kans. `and`-push muteert de array
  // waar `where.AND` naar verwijst; gebeurt vóór de queries, dus effect is gegarandeerd.
  if (profile && f.hideApplied) {
    and.push({
      NOT: { applications: { some: { freelancerId: profile.id, status: { not: "WITHDRAWN" } } } },
    });
  }

  const [total, jobs, industries, skills, savedRows, invitations] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy,
      // Bij match-sortering halen we de volledige (begrensde) zichtbare set op om in het geheugen te
      // scoren en pagineren; anders laat de database zelf de juiste pagina zien.
      skip: effectiveMatchSort ? 0 : (f.page - 1) * JOBS_PER_PAGE,
      take: effectiveMatchSort ? MATCH_SORT_SCAN_CAP : JOBS_PER_PAGE,
      include: {
        company: { select: { name: true } },
        industry: { select: { name: true } },
        skills: true,
        credentialRequirements: true,
      },
    }),
    // unbounded-allow: branches-referentielijst voor filter
    prisma.industry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    // unbounded-allow: skills-referentielijst voor filter
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    // Bewaarde opdrachten van de ZZP'er (alleen op profiel-id — onafhankelijk van de zichtbare
    // pagina) draaien nu in dezelfde batch. De membership-check per zichtbare opdracht hieronder
    // levert exact dezelfde staat op als de eerdere `jobId in`-begrensde query.
    profile
      ? // unbounded-allow: bewaarde opdrachten, eigenaar-scoped op freelancerProfileId; alleen jobId-referenties, membership in-memory
        prisma.savedJob.findMany({
          where: { freelancerProfileId: profile.id },
          select: { jobId: true },
        })
      : Promise.resolve<{ jobId: string }[]>([]),
    // Ontvangen directe uitnodigingen (alleen ZZP'er): de hoogst-intente leads, afgeleid uit de
    // JOB_INVITED-auditrecords. Draait in dezelfde parallelle batch — geen extra seriële roundtrip.
    profile ? getReceivedInvitations(profile.id) : Promise.resolve<ReceivedInvitation[]>([]),
  ]);

  // Eén klok voor alle start-proximity-signalen in deze render (deterministisch, geen drift per rij).
  const now = new Date();
  const { t } = await getTranslator();

  // Persoonlijke match per opdracht: score plus de zwaarst wegende troef én het zwaarst wegende
  // minpunt — uitlegbaarheid. De ZZP'er ziet niet alleen *of* het matcht, maar *waarom* (en wat niet).
  type JobMatch = {
    score: number;
    reason: string | null;
    gap: string | null;
    // Inzetbaarheids-gating: mist de ZZP'er een vereist certificaat voor deze dienst? De hardste
    // beslisfactor in de zorg, tot nu toe weggegooid op de lijst (`scoreJobForFreelancer` berekent
    // 'm al). `null` bij COMPLIANT of geen harde eisen → geen chip (rustige lijst).
    complianceChip: JobComplianceChip | null;
  };
  const matchByJob = new Map<string, JobMatch>();
  if (profile) {
    for (const job of jobs) {
      const result = scoreJobForFreelancer(job, profile, now);
      const requiredCredCount = job.credentialRequirements.filter((c) => c.required).length;
      matchByJob.set(job.id, {
        score: result.score,
        reason: topPositiveReason(result.reasons),
        gap: topGapReason(result.reasons),
        complianceChip: jobComplianceChip(result.compliance, requiredCredCount),
      });
    }
  }

  // Match-sortering: herrangschik de gescande set op matchscore (bij gelijke score nieuwste eerst) en
  // knip de huidige pagina eruit. Zonder match-sort is de databank-volgorde al de weergave-volgorde.
  const visibleJobs = effectiveMatchSort
    ? sortJobsByMatch(
        jobs.map((job) => ({
          job,
          score: matchByJob.get(job.id)?.score ?? 0,
          publishedAt: job.publishedAt,
        })),
      ).slice((f.page - 1) * JOBS_PER_PAGE, f.page * JOBS_PER_PAGE)
    : jobs;

  // Bewaarde opdrachten (alleen ZZP'er): welke opdrachten al gebookmarkt zijn, zodat de bewaar-knop
  // per zichtbare opdracht direct de juiste staat toont. Rijen komen uit de parallelle batch hierboven.
  const savedJobIds = new Set<string>();
  for (const s of savedRows) savedJobIds.add(s.jobId);

  // Concurrentie-/kanssignaal per zichtbare opdracht (alleen ZZP'er): hoeveel actieve reacties heeft
  // een opdracht al? Zo triageert de ZZP'er op de lijst welke opdracht eerst te pakken — spiegelbeeld
  // van de detailkaart, maar compact. Twee begrensde queries over uitsluitend de zichtbare (gepagineerde)
  // job-ids: het aantal actieve reacties per opdracht én de eigen reacties (om die opdrachten over te
  // slaan — daar is de concurrentie moot). Alleen geaggregeerde tellingen; nooit identiteit van anderen.
  const competitionByJob = new Map<string, ReturnType<typeof competitionChip>>();
  // Eigen-reactie-status per opdracht (alleen ZZP'er): heeft hij al gereageerd, en waar staat die
  // reactie? Zo ziet hij op de lijst welke opdrachten hij al heeft opgepakt (en de stand ervan) zonder
  // elke opdracht te openen — spiegelt de "Applied"-status van Temper/Malt/LinkedIn. De eigen reacties
  // worden hier tóch al opgehaald (om de concurrentie-chip te onderdrukken); we hergebruiken die query.
  const appliedChipByJob = new Map<string, AppliedJobChip>();
  const visibleJobIds = profile ? visibleJobs.map((j) => j.id) : [];
  if (profile && visibleJobIds.length > 0) {
    const [applicantGroups, myApplications] = await Promise.all([
      prisma.application.groupBy({
        by: ["jobId"],
        where: { jobId: { in: visibleJobIds }, status: { not: "WITHDRAWN" } },
        _count: { _all: true },
      }),
      // unbounded-allow: eigenaar-scoped (freelancerId) én begrensd door de zichtbare pagina-ids
      prisma.application.findMany({
        where: {
          freelancerId: profile.id,
          jobId: { in: visibleJobIds },
          status: { not: "WITHDRAWN" },
        },
        select: { jobId: true, status: true },
      }),
    ]);
    const countByJob = new Map<string, number>();
    for (const g of applicantGroups) countByJob.set(g.jobId, g._count._all);
    const myStatusesByJob = new Map<string, ApplicationStatus[]>();
    for (const a of myApplications) {
      const list = myStatusesByJob.get(a.jobId) ?? [];
      list.push(a.status as ApplicationStatus);
      myStatusesByJob.set(a.jobId, list);
    }
    for (const job of visibleJobs) {
      const myStatuses = myStatusesByJob.get(job.id);
      if (myStatuses) {
        // Al gereageerd → toon de eigen reactiestatus i.p.v. de concurrentie-chip (de ZZP'er staat al
        // in de race; de concurrentie is dan moot). Eén van beide chips per opdracht, nooit allebei.
        const chip = appliedJobChipFor(myStatuses);
        if (chip) appliedChipByJob.set(job.id, chip);
        continue;
      }
      const chip = competitionChip(
        summarizeJobCompetition({
          applicantCount: countByJob.get(job.id) ?? 0,
          myScore: matchByJob.get(job.id)?.score ?? null,
        }),
      );
      if (chip) competitionByJob.set(job.id, chip);
    }
  }

  // Reistijdsignaal per zichtbare opdracht (alleen ZZP'er met een bekende eigen plaats): hoe ver reist
  // de ZZP'er naar de opdracht-locatie? Spiegelbeeld van het reistijdsignaal dat de opdrachtgever al op
  // /kandidaten ziet, nu op de eigen triage-lijst — commuteerbare opdrachten in één oogopslag. REMOTE of
  // een onbekende plaats aan één van beide kanten → geen chip (nooit misleidend). Geen extra query:
  // job.location/workMode én de eigen profiel-locatie zijn al geladen.
  const proximityByJob = new Map<string, CandidateProximity>();
  if (profile?.location) {
    for (const job of visibleJobs) {
      const proximity = classifyCandidateProximity({
        jobWorkMode: job.workMode,
        jobLocation: job.location,
        candidateLocation: profile.location,
      });
      if (proximity) proximityByJob.set(job.id, proximity);
    }
  }

  // Betaal-vertrouwenssignaal per zichtbare opdracht (alleen ZZP'er): betaalt deze opdrachtgever zijn
  // ZZP'ers doorgaans op tijd? Het diepste "geruster"-signaal voor de ZZP'er die overweegt zijn tijd in
  // een reactie te steken — tot nu toe alleen op de opdracht-detailpagina (`payment-behavior-block`),
  // niet op de triage-lijst. Hergebruikt exact hetzelfde geaggregeerde betaalgedrag (`computePaymentBehavior`,
  // via de begrensde batch-loader); toont uitsluitend de beslis-relevante uitersten (op tijd / vaak laat)
  // en zwijgt bij een neutrale/onbekende reputatie (`paymentTrustChip` → null) zodat de lijst rustig blijft.
  // Geen individuele factuur/bedrag lekt — alleen het geaggregeerde oordeel per opdrachtgever.
  const paymentTrustByJob = new Map<string, PaymentTrustChip>();
  if (profile && visibleJobs.length > 0) {
    const behaviorByCompany = await getPaymentBehaviorForCompanies(
      visibleJobs.map((job) => job.companyId),
    );
    for (const job of visibleJobs) {
      const behavior = behaviorByCompany.get(job.companyId);
      const chip = behavior ? paymentTrustChip(behavior) : null;
      if (chip) paymentTrustByJob.set(job.id, chip);
    }
  }

  // Beschikbaarheids-conflictsignaal per zichtbare opdracht (alleen ZZP'er met eigen agenda-vensters):
  // valt de startdatum in een periode die de ZZP'er zélf op onbeschikbaar/beperkt heeft gezet? Zo ziet
  // hij dat een opdracht botst met zijn agenda vóór hij zijn tijd in een reactie steekt — spiegelbeeld
  // van het signaal dat de opdracht-detailpagina al toont, nu compact op de triage-lijst. Geen extra
  // query: de eigen vensters zijn met het profiel meegeladen; puur en deterministisch (`now`-geïnjecteerd).
  const availabilityByJob = new Map<string, JobAvailabilityChip>();
  if (profile && profile.availabilityWindows.length > 0) {
    const windows = profile.availabilityWindows.map((w) => ({
      startDate: w.startDate,
      endDate: w.endDate,
      type: w.type as AvailabilityWindowType,
      note: w.note,
    }));
    for (const job of visibleJobs) {
      const chip = jobAvailabilityChip(assessJobStartAvailability(job.startDate, windows, now));
      if (chip) availabilityByJob.set(job.id, chip);
    }
  }

  // Tarief-passendheidssignaal per zichtbare opdracht (alleen ZZP'er met een eigen uurtarief): valt
  // het opdrachtbudget onder ("Onder je tarief") of boven ("Boven je tarief") wat de ZZP'er zelf vraagt?
  // Zo triageert hij op de lijst welke opdracht qua geld past vóór hij zijn tijd in een reactie steekt —
  // de list-tegenhanger van het budget-inzicht dat tot nu toe alleen bij het reageren zichtbaar werd.
  // Geen extra query: het eigen `hourlyRate` is met het profiel geladen en `rateMin/rateMax` staan al op
  // de opdracht. Puur en deterministisch; zwijgt bij een passend budget zodat de lijst rustig blijft.
  const rateFitByJob = new Map<string, JobRateFitChip>();
  if (profile) {
    for (const job of visibleJobs) {
      const chip = jobRateFitChip(profile.hourlyRate, job.rateMin, job.rateMax);
      if (chip) rateFitByJob.set(job.id, chip);
    }
  }

  // Reactiebereidheid-signaal per zichtbare opdracht (alleen ZZP'er): pakt deze opdrachtgever binnengekomen
  // reacties doorgaans op, of laat hij ze liggen? Het "geruster"-tegenhanger van het betaalsignaal — tot nu
  // toe alleen op de opdracht-detailpagina (`ClientResponsivenessBlock`), niet op de triage-lijst. Hergebruikt
  // exact hetzelfde geaggregeerde signaal (`computeClientResponsiveness`, via de begrensde batch-loader); toont
  // uitsluitend de beslis-relevante uitersten (oppakt / laat liggen) en zwijgt bij een neutrale/onbekende
  // reputatie (`responsivenessChip` → null) zodat de lijst rustig blijft. Geen individuele reactie van een
  // andere ZZP'er lekt — alleen het geaggregeerde oordeel per opdrachtgever.
  const responsivenessByJob = new Map<string, ReturnType<typeof responsivenessChip>>();
  if (profile && visibleJobs.length > 0) {
    const responsivenessByCompany = await getClientResponsivenessForCompanies(
      visibleJobs.map((job) => job.companyId),
    );
    for (const job of visibleJobs) {
      const signal = responsivenessByCompany.get(job.companyId);
      const chip = signal ? responsivenessChip(signal) : null;
      if (chip) responsivenessByJob.set(job.id, chip);
    }
  }

  // Bij match-sortering pagineren we de in het geheugen gerangschikte (begrensde) set; anders de
  // volledige databanktelling. `total` blijft de eerlijke "gevonden"-teller in de kop.
  // Actieve-filter-chips: laat zien welke filters de resultaatset beperken (en laat ze los-wisbaar zijn),
  // met een "Wis alles" om in één klik terug naar de volledige lijst te gaan. Labels uit dezelfde
  // industrie-/skill-lookups als het filterpaneel — één bron van waarheid, geen drift.
  const activeChips = describeActiveJobFilters(f, { industries, skills });
  // "Wis alle filters" behoudt — net als de "Wis alles"-knop in ActiveFilterChips — een expliciet
  // gekozen sortering; alleen de filters + paginering verdwijnen.
  const explicitSort = first(searchParams.sort);
  const clearFiltersHref = explicitSort
    ? `/opdrachten?sort=${encodeURIComponent(explicitSort)}`
    : "/opdrachten";

  const paginationTotal = effectiveMatchSort ? jobs.length : total;
  const totalPages = Math.max(1, Math.ceil(paginationTotal / JOBS_PER_PAGE));
  const mkPageHref = (page: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v === undefined) continue;
      for (const item of Array.isArray(v) ? v : [v]) p.append(k, item);
    }
    p.set("page", String(page));
    return `/opdrachten?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">{t("Opdrachten")}</h1>
        <p className="text-sm text-muted-foreground">{t("Vind opdrachten die bij je passen.")}</p>
      </header>

      {/* Uitnodigingen bovenaan: een opdrachtgever koos jóu specifiek — de sterkste lead eerst. */}
      <ReceivedInvitationsBand invitations={invitations} />

      <JobFilters
        industries={industries}
        skills={skills}
        myIndustryCount={myIndustryIds.length}
        canSortByMatch={profile != null}
        canHideApplied={profile != null}
      />

      <ActiveFilterChips chips={activeChips} />

      {visibleJobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title={t("Geen opdrachten gevonden")}
            description={t("Pas je filters aan om meer resultaten te zien.")}
            action={
              activeChips.length > 0
                ? { label: t("Wis alle filters"), href: clearFiltersHref }
                : undefined
            }
          />
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {plural(total, t("opdracht"), t("opdrachten"))} {t("gevonden")}
          </p>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            {visibleJobs.map((job) => {
              const match = matchByJob.get(job.id);
              return (
                <div
                  key={job.id}
                  className="card-interactive relative flex items-center justify-between gap-4 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    {/* Stretched link: de titel-link bedekt de hele rij (before:inset-0), zodat de
                        rij klikbaar blijft én de bewaar-knop er bovenop (z-10) los klikbaar is. */}
                    <Link
                      href={`/opdrachten/${job.id}`}
                      className="truncate font-medium before:absolute before:inset-0 hover:underline"
                    >
                      {job.title}
                    </Link>
                    <p className="metadata-row mt-0.5">
                      <span className="font-medium text-foreground/70">{job.company.name}</span>
                      {job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden /> {job.location}
                        </span>
                      )}
                      <span>{t(WORK_MODE[job.workMode as WorkMode])}</span>
                      {(() => {
                        const proximity = proximityByJob.get(job.id);
                        if (!proximity) return null;
                        return (
                          <span
                            className={[
                              "inline-flex items-center gap-1",
                              PROXIMITY_TONE_CLASS[proximity.level],
                            ].join(" ")}
                          >
                            <Navigation className="size-3" aria-hidden />{" "}
                            {proximityLabel(proximity)}
                          </span>
                        );
                      })()}
                      {job.industry && <span>{job.industry.name}</span>}
                      {(() => {
                        const start = jobStartProximity(job.startDate, now);
                        if (!start) return null;
                        const label =
                          start.days === 0
                            ? t("begint vandaag")
                            : start.days === 1
                              ? t("begint morgen")
                              : t("begint over N dagen").replace("N", String(start.days));
                        return (
                          <span className="inline-flex items-center gap-1 font-medium text-warning">
                            <CalendarClock className="size-3" aria-hidden /> {label}
                          </span>
                        );
                      })()}
                      {(() => {
                        const chip = appliedChipByJob.get(job.id);
                        if (!chip) return null;
                        return (
                          <span
                            className={[
                              "inline-flex items-center gap-1 font-medium",
                              APPLIED_CHIP_TONE_CLASS[chip.tone],
                            ].join(" ")}
                          >
                            <Send className="size-3" aria-hidden /> {chip.label}
                          </span>
                        );
                      })()}
                      {(() => {
                        const chip = competitionByJob.get(job.id);
                        if (!chip) return null;
                        return (
                          <span
                            className={[
                              "inline-flex items-center gap-1",
                              chip.tone === "urgent" ? "font-medium text-warning" : "",
                            ].join(" ")}
                          >
                            <Users className="size-3" aria-hidden /> {chip.label}
                          </span>
                        );
                      })()}
                      {(() => {
                        const chip = paymentTrustByJob.get(job.id);
                        if (!chip) return null;
                        return (
                          <span
                            className={[
                              "inline-flex items-center gap-1",
                              chip.tone === "good" ? "text-success" : "font-medium text-warning",
                            ].join(" ")}
                          >
                            <BadgeEuro className="size-3" aria-hidden /> {chip.label}
                          </span>
                        );
                      })()}
                      {(() => {
                        const chip = availabilityByJob.get(job.id);
                        if (!chip) return null;
                        return (
                          <span
                            className={[
                              "inline-flex items-center gap-1",
                              chip.tone === "block"
                                ? "font-medium text-warning"
                                : "text-muted-foreground",
                            ].join(" ")}
                          >
                            <CalendarOff className="size-3" aria-hidden /> {chip.label}
                          </span>
                        );
                      })()}
                      {(() => {
                        const chip = rateFitByJob.get(job.id);
                        if (!chip) return null;
                        return (
                          <span
                            className={[
                              "inline-flex items-center gap-1",
                              chip.tone === "good" ? "text-success" : "font-medium text-warning",
                            ].join(" ")}
                          >
                            <Wallet className="size-3" aria-hidden /> {chip.label}
                          </span>
                        );
                      })()}
                      {(() => {
                        const chip = responsivenessByJob.get(job.id);
                        if (!chip) return null;
                        return (
                          <span
                            className={[
                              "inline-flex items-center gap-1",
                              chip.tone === "good" ? "text-success" : "font-medium text-warning",
                            ].join(" ")}
                          >
                            <MessageSquareReply className="size-3" aria-hidden /> {chip.label}
                          </span>
                        );
                      })()}
                      {(() => {
                        const chip = match?.complianceChip;
                        if (!chip) return null;
                        const Icon = chip.tone === "warning" ? ShieldAlert : ShieldQuestion;
                        return (
                          <span
                            className={[
                              "inline-flex items-center gap-1",
                              chip.tone === "warning"
                                ? "font-medium text-warning"
                                : "text-muted-foreground",
                            ].join(" ")}
                          >
                            <Icon className="size-3" aria-hidden /> {t(chip.label)}
                          </span>
                        );
                      })()}
                    </p>
                    {match && (match.reason || match.gap) && (
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        {match.reason && (
                          <span className="inline-flex items-center gap-1 text-success">
                            <Check className="size-3 shrink-0" aria-hidden />
                            <span className="truncate">{t(match.reason)}</span>
                          </span>
                        )}
                        {match.gap && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Minus className="size-3 shrink-0" aria-hidden />
                            <span className="truncate">{t(match.gap)}</span>
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {(job.rateMin != null || job.rateMax != null) && (
                      <span className="hidden text-sm tabular-nums text-muted-foreground sm:inline">
                        € {job.rateMin ?? "?"}
                        {job.rateMax != null ? `–${job.rateMax}` : "+"}
                        {t("/uur")}
                      </span>
                    )}
                    {match && (
                      <Badge variant="accent">
                        {t("Match")} {match.score}%
                      </Badge>
                    )}
                    {profile && (
                      <span className="relative z-10">
                        <SaveJobButton jobId={job.id} saved={savedJobIds.has(job.id)} />
                      </span>
                    )}
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-between pt-2" aria-label={t("Paginering")}>
              {f.page > 1 ? (
                <Button asChild variant="secondary" size="sm">
                  <Link href={mkPageHref(f.page - 1)}>{t("Vorige")}</Link>
                </Button>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">
                {t("Pagina N van M").replace("N", String(f.page)).replace("M", String(totalPages))}
              </span>
              {f.page < totalPages ? (
                <Button asChild variant="secondary" size="sm">
                  <Link href={mkPageHref(f.page + 1)}>{t("Volgende")}</Link>
                </Button>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
