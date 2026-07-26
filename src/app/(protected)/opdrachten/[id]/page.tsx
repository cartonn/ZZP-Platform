import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  MapPin,
  Pencil,
  ShieldCheck,
  Star,
  TriangleAlert,
} from "lucide-react";
import { owns, requireActor } from "@/lib/authz";
import { canViewJob } from "@/lib/tenancy";
import { prisma } from "@/lib/db";
import { JOB_TRANSITIONS } from "@/lib/jobs";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import {
  type CredentialType,
  type CredentialStatus,
  type JobStatus,
  type WorkMode,
} from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { ComplianceBadge } from "@/components/compliance-badge";
import { MatchBreakdown } from "@/components/match/match-breakdown";
import { AvailabilityBadge } from "@/components/availability-badge";
import { TrustBadge } from "@/components/trust/trust-badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { MatchMeter } from "@/components/ui/match-meter";
import {
  scoreJobForFreelancer,
  liveComplianceStatus,
  type ComplianceResult,
  type ComplianceStatus,
  type MatchReason,
  type MatchResult,
} from "@/lib/matching";
import { suggestedFreelancersForJob } from "@/lib/suggestions";
import { getJobReach } from "@/lib/data/job-reach";
import { JobReachCard } from "@/components/jobs/job-reach-card";
import { summarizeVacancyPerformance } from "@/lib/job-vacancy-performance";
import { JobVacancyPerformanceCard } from "@/components/jobs/job-vacancy-performance-card";
import { summarizeStaffingRisk } from "@/lib/job-staffing-risk";
import { JobStaffingRiskCard } from "@/components/jobs/job-staffing-risk-card";
import { summarizeJobCompetition, type CompetitionSummary } from "@/lib/job-competition";
import { JobCompetitionCard } from "@/components/jobs/job-competition-card";
import { summarizeEffectiveRate, type EffectiveRateSummary } from "@/lib/effective-rate";
import { EffectiveRateCard } from "@/components/jobs/effective-rate-card";
import { assessJobRateFit, type JobRateFitAssessment } from "@/lib/job-rate-fit-detail";
import { JobRateFitCard } from "@/components/jobs/job-rate-fit-card";
import {
  assessJobStartAvailability,
  type JobAvailabilitySignal,
} from "@/lib/job-availability-signal";
import { JobAvailabilitySignalCard } from "@/components/jobs/job-availability-signal-card";
import { type AvailabilityWindowType } from "@/lib/enums";
import { DbaRiskBadge } from "@/components/dba/dba-risk-badge";
import { dbaAdvice, type DbaReason, type DbaRisk } from "@/lib/dba";
import { assessRateThreshold, rechtsvermoedenHint } from "@/lib/rechtsvermoeden";
import { estimateTravelMinutesWithRouting } from "@/lib/services/routing";
import {
  recommendModelAgreement,
  MODEL_AGREEMENT_LABELS,
  type ModelAgreementType,
} from "@/lib/model-agreement";
import {
  createApplication,
  inviteFreelancerToJob,
  inviteSuggestedFreelancersToJob,
} from "../actions";
import { parseInvitedFreelancerIds } from "@/lib/job-invite";
import { parseInviteRecords, summarizeInviteFollowup } from "@/lib/job-invite-followup";
import { JobInviteFollowupCard } from "@/components/jobs/job-invite-followup-card";
import { JobStatusButton } from "./job-status-button";
import { startConversationWithFreelancer } from "@/app/(protected)/berichten/actions";
import { ApplicationForm } from "./application-form";
import { formatDateShortNl } from "@/lib/format-date";
import { getPaymentBehaviorForCompany } from "@/lib/data/payment-behavior";
import { PaymentBehaviorBlock } from "@/components/jobs/payment-behavior-block";
import { getClientReliabilityForCompany } from "@/lib/data/client-reliability";
import { ClientReliabilityBlock } from "@/components/jobs/client-reliability-block";
import { getCompanyReputationForFreelancer } from "@/lib/data/company-reputation";
import { CompanyReputationBlock } from "@/components/jobs/company-reputation-block";
import { ClientHistoryBlock } from "@/components/jobs/client-history-block";
import { getFreelancerClientHistory } from "@/lib/data/freelancer-client-history";
import { getClientResponsivenessForCompany } from "@/lib/data/client-responsiveness";
import { ClientResponsivenessBlock } from "@/components/jobs/client-responsiveness-block";
import { relatedJobsForFreelancer } from "@/lib/recommendations";
import { RelatedJobsSection } from "@/components/jobs/related-jobs-section";
import { getTranslator } from "@/lib/i18n/server";
import { SaveJobButton } from "@/components/jobs/save-job-button";

export const metadata: Metadata = { title: "Opdracht · ZZP Platform" };

const WORK_MODE: Record<WorkMode, string> = {
  REMOTE: "Remote",
  ONSITE: "Op locatie",
  HYBRID: "Hybride",
};

function transitionLabel(from: JobStatus, to: JobStatus): string {
  if (to === "PUBLISHED") return from === "CLOSED" ? "Heropenen" : "Publiceren";
  if (to === "CLOSED") return "Sluiten";
  return "Terug naar concept";
}

type CredState = "satisfied" | "inReview" | "expired" | "missing";
function credState(type: CredentialType, c: ComplianceResult): CredState {
  if (c.satisfied.includes(type)) return "satisfied";
  if (c.inReview.includes(type)) return "inReview";
  if (c.expired.includes(type)) return "expired";
  return "missing";
}
const CRED_STATE_LABEL: Record<CredState, string> = {
  satisfied: "in orde",
  inReview: "in beoordeling",
  expired: "verlopen",
  missing: "ontbreekt",
};

export default async function OpdrachtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: {
        select: {
          name: true,
          userId: true,
          description: true,
          website: true,
          location: true,
          industry: { select: { name: true } },
        },
      },
      industry: { select: { name: true } },
      skills: { include: { skill: { select: { name: true } } } },
      credentialRequirements: true,
      tenant: { select: { openOverflow: true } },
    },
  });
  if (!job) notFound();

  const isOwner = owns(actor, job.company.userId);
  const status = job.status as JobStatus;
  // Niet-gepubliceerde opdrachten zijn alleen zichtbaar voor de eigenaar (server-side).
  if (status !== "PUBLISHED" && !isOwner) notFound();
  // Gesloten per tenant (+ overflow): een niet-eigenaar mag een dienst alleen zien als die bij zijn
  // franchise hoort, of als de franchise hem heeft opengesteld. ADMIN ziet alles.
  if (!isOwner && !canViewJob(actor, job)) notFound();

  const requiredSkills = job.skills.filter((s) => s.required);
  const optionalSkills = job.skills.filter((s) => !s.required);
  const requiredCreds = job.credentialRequirements.filter((c) => c.required);
  const optionalCreds = job.credentialRequirements.filter((c) => !c.required);

  // Bestaande reactie van de huidige ZZP'er (voor de reageer-sectie), plus — als hij nog
  // niet reageerde — een persoonlijke aansluiting (match + welke eisen hij al haalt).
  let myApplication: {
    status: string;
    matchScore: number | null;
    complianceSnapshot: string | null;
  } | null = null;
  let myFit: {
    score: number;
    breakdown: MatchResult["breakdown"];
    compliance: ComplianceResult;
    reasons: MatchReason[];
  } | null = null;
  let myCompliance: ComplianceStatus | null = null;
  // Kans-/concurrentiesignaal: hoeveel kandidaten reageerden al + hoe de ZZP'er ervoor staat.
  let jobCompetition: CompetitionSummary | null = null;
  // Effectief uurtarief na (onbetaalde) reistijd — beslis-signaal bij een opdracht op afstand.
  let effectiveRate: EffectiveRateSummary | null = null;
  // Tarief-passendheid t.o.v. het eigen richttarief (los van reistijd): betaalt deze opdracht wat ik vraag?
  let rateFit: JobRateFitAssessment | null = null;
  // Agenda-signaal: valt de startdatum in een periode die de ZZP'er zelf op onbeschikbaar/beperkt zette?
  let availabilitySignal: JobAvailabilitySignal | null = null;
  // Bewaard-status voor de bewaar-knop (alleen relevant voor een niet-eigenaar ZZP'er).
  let isSaved = false;
  // Opgeslagen standaard-motivatie: vult het reageerveld voor (quick-apply).
  let defaultMotivation: string | null = null;
  if (actor.role === "FREELANCER") {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: actor.id },
      // headline/bio + skill-namen voeden de inhoudelijke aansluiting (semantic-scorecomponent),
      // zodat het detailscherm exact dezelfde score toont als dashboard/aanbevelingen (geen drift).
      include: {
        skills: { select: { skillId: true, skill: { select: { name: true } } } },
        credentials: { select: { type: true, status: true, expiresAt: true } },
        industries: { select: { industryId: true } },
        // Eigen beschikbaarheidsvensters voeden het agenda-signaal op de reageer-sectie (voorkomt
        // zelf-dubbelboeking). Eigenaar-scoped en inherent begrensd.
        availabilityWindows: { select: { startDate: true, endDate: true, type: true, note: true } },
      },
    });
    if (profile) {
      defaultMotivation = profile.defaultMotivation;
      if (!isOwner) {
        const saved = await prisma.savedJob.findUnique({
          where: { freelancerProfileId_jobId: { freelancerProfileId: profile.id, jobId: job.id } },
          select: { id: true },
        });
        isSaved = saved !== null;
      }
      myApplication = await prisma.application.findUnique({
        where: { jobId_freelancerId: { jobId: job.id, freelancerId: profile.id } },
        select: { status: true, matchScore: true, complianceSnapshot: true },
      });
      // Een ingetrokken reactie telt voor de UI als "nog niet gereageerd": de ZZP'er ziet weer het
      // reageer-formulier en zijn aansluiting, en kan opnieuw reageren (server hergebruikt de rij).
      if (myApplication?.status === "WITHDRAWN") myApplication = null;
      if (!myApplication && status === "PUBLISHED") {
        // Concurrentie: actieve reacties van ándere ZZP'ers (ingetrokken telt niet mee). De huidige
        // ZZP'er heeft geen actieve reactie (anders was myFit niet gezet), dus dit zijn allemaal
        // anderen. De telling start vóór de (trage) externe routing-call: ze zijn onafhankelijk,
        // dus de netwerk-latency hoort niet serieel vóór deze DB-query te staan.
        const applicantCountPromise = prisma.application.count({
          where: { jobId: job.id, status: { not: "WITHDRAWN" } },
        });
        const routedTravelMinutesToJob =
          profile.maxTravelMinutes != null &&
          profile.maxTravelMinutes > 0 &&
          profile.workMode !== "REMOTE" &&
          job.workMode !== "REMOTE"
            ? await estimateTravelMinutesWithRouting(profile.location, job.location)
            : null;
        const match = scoreJobForFreelancer(job, { ...profile, routedTravelMinutesToJob });
        // Dezelfde reistijd die de proximity-factor voedt, ook naar een effectief uurtarief vertalen:
        // wat houdt de ZZP'er per uur over als de onbetaalde reis meetelt? (Alleen zinvol op afstand.)
        effectiveRate = summarizeEffectiveRate({
          rateMinEuros: job.rateMin,
          rateMaxEuros: job.rateMax,
          oneWayTravelMinutes: routedTravelMinutesToJob,
        });
        // Betaalt het budget wat de ZZP'er vraagt? Puur uit het eigen richttarief en het gepubliceerde
        // budget — geen extra query, altijd zichtbaar (i.t.t. de effectief-na-reistijd-kaart die alleen
        // bij routebare reis verschijnt).
        rateFit = assessJobRateFit(profile.hourlyRate, job.rateMin, job.rateMax);
        myFit = {
          score: match.score,
          breakdown: match.breakdown,
          compliance: match.compliance,
          reasons: match.reasons,
        };
        jobCompetition = summarizeJobCompetition({
          applicantCount: await applicantCountPromise,
          myScore: match.score,
        });
        // Botst de startdatum met de eigen agenda? Puur uit de eigen vensters berekend (geen extra query).
        availabilitySignal = assessJobStartAvailability(
          job.startDate,
          profile.availabilityWindows.map((w) => ({
            startDate: w.startDate,
            endDate: w.endDate,
            type: w.type as AvailabilityWindowType,
            note: w.note,
          })),
        );
      }
      // Live compliance voor een reeds verstuurde reactie (i.p.v. de bevroren snapshot).
      if (myApplication) {
        myCompliance = liveComplianceStatus(
          requiredCreds.map((c) => c.credentialType as CredentialType),
          profile.credentials.map((c) => ({
            type: c.type as CredentialType,
            status: c.status as CredentialStatus,
            expiresAt: c.expiresAt,
          })),
        );
      }
    }
  }

  // Betaalgedrag-signaal: alleen voor de ZZP'er die een beslissing neemt (niet voor de eigenaar
  // zelf; wel voor niet-eigenaar FREELANCER-rol die de opdracht bekijkt).
  const showClientSignals = !isOwner && actor.role === "FREELANCER";
  const [
    paymentBehavior,
    clientReliability,
    clientResponsiveness,
    companyReputation,
    clientHistory,
  ] = showClientSignals
    ? await Promise.all([
        getPaymentBehaviorForCompany(job.companyId),
        getClientReliabilityForCompany(job.companyId),
        getClientResponsivenessForCompany(job.companyId),
        getCompanyReputationForFreelancer(job.companyId),
        // "Eerder samengewerkt"-vertrouwenssignaal: afgeronde samenwerkingen tussen déze ZZP'er en
        // deze opdrachtgever. Gescoopt op het (ZZP'er, opdrachtgever)-paar — geen andere partij.
        getFreelancerClientHistory(actor.id, job.companyId),
      ])
    : [null, null, null, null, null];

  // Spiegelbeeld voor de opdrachtgever: openbare ZZP'ers die passen en nog niet reageerden,
  // plus de geaggregeerde bereik-indicatie (hoeveel passend/beschikbaar). Parallel opgehaald.
  const [suggestions, reach] =
    isOwner && status === "PUBLISHED"
      ? await Promise.all([suggestedFreelancersForJob(job.id), getJobReach(job.id)])
      : [[], null];

  // Vacaturetempo voor de eigenaar: hoe presteert deze gepubliceerde opdracht in de tijd
  // (dagen open, reacties/week, momentum). Afgeleid uit het publicatiemoment + de actieve
  // reactie-tijdstempels; begrensde scan.
  const vacancyPerformance =
    isOwner && status === "PUBLISHED"
      ? summarizeVacancyPerformance({
          publishedAt: job.publishedAt ?? job.createdAt,
          now: new Date(),
          applicationDates: (
            await prisma.application.findMany({
              where: { jobId: job.id, status: { not: "WITHDRAWN" } },
              orderBy: { createdAt: "asc" },
              take: 500,
              select: { createdAt: true },
            })
          ).map((a) => a.createdAt),
        })
      : null;

  // Bezettingsrisico voor de eigenaar: nadert de startdatum terwijl er nog niemand is vastgelegd?
  // "Vastgelegd" = een ACCEPTED reactie óf een lopende/afgeronde samenwerking (ACTIVE/COMPLETED). Een
  // PROPOSED voorstel telt bewust níét als lock-in — de ZZP'er heeft nog niet toegezegd — en valt al
  // onder de ACCEPTED-reactie waaruit het voortkomt. Reactie-tellingen uit één groupBy; de
  // samenwerking-check uit één count. Alleen relevant voor een gepubliceerde opdracht.
  const staffingRisk =
    isOwner && status === "PUBLISHED" && job.startDate
      ? await (async () => {
          const [byStatus, activeCollabs] = await Promise.all([
            prisma.application.groupBy({
              by: ["status"],
              where: { jobId: job.id },
              _count: { _all: true },
            }),
            prisma.collaboration.count({
              where: { jobId: job.id, status: { in: ["ACTIVE", "COMPLETED"] } },
            }),
          ]);
          const countFor = (s: string) => byStatus.find((r) => r.status === s)?._count._all ?? 0;
          const applicantCount = byStatus
            .filter((r) => r.status !== "WITHDRAWN")
            .reduce((sum, r) => sum + r._count._all, 0);
          return summarizeStaffingRisk({
            status,
            startDate: job.startDate,
            lockedIn: activeCollabs > 0 || countFor("ACCEPTED") > 0,
            applicantCount,
            shortlistCount: countFor("SHORTLIST"),
            now: new Date(),
          });
        })()
      : null;

  // Voor de ZZP'er die deze opdracht bekijkt: andere open opdrachten die bij zijn profiel passen
  // (dezelfde verklaarbare matchmotor), met deze opdracht uitgesloten. Drijft ontdekking.
  const relatedJobs =
    !isOwner && actor.role === "FREELANCER" && status === "PUBLISHED"
      ? await relatedJobsForFreelancer(actor.id, job.id)
      : [];

  // Flexpool "eerst eigen mensen": toon de eigenaar hoeveel poule-leden bij de eerste publicatie
  // direct zijn geïnformeerd (de gezaghebbende telling staat in het POOL_INVITED-auditrecord, niet
  // live herberekend — zo claimt de UI alleen wat daadwerkelijk verstuurd is).
  const poolInviteLog = isOwner
    ? await prisma.auditLog.findFirst({
        where: { entityType: "Job", entityId: job.id, action: "POOL_INVITED" },
        orderBy: { createdAt: "desc" },
        select: { metadata: true },
      })
    : null;
  const poolInvitedCount = ((): number => {
    if (!poolInviteLog?.metadata) return 0;
    try {
      const meta = JSON.parse(poolInviteLog.metadata) as { count?: unknown };
      return typeof meta.count === "number" ? meta.count : 0;
    } catch {
      return 0;
    }
  })();

  // Directe uitnodigingen die de eigenaar al voor deze opdracht verstuurde (gezaghebbend uit de
  // JOB_INVITED-auditrecords) → zet de knop per geschikte ZZP'er om in een "Uitgenodigd"-badge én
  // voedt de opvolging (hoeveel uitgenodigde ZZP'ers reageerden). Voor élke eigenaar geladen (niet
  // alleen bij levende suggesties): de opvolging blijft relevant nadat de suggestielijst leegloopt.
  const inviteLogs = isOwner
    ? await prisma.auditLog.findMany({
        where: { entityType: "Job", entityId: job.id, action: "JOB_INVITED" },
        select: { metadata: true, createdAt: true },
        take: 200,
      })
    : [];
  const invitedFreelancerIds = parseInvitedFreelancerIds(inviteLogs);

  // Aantal geschikte ZZP'ers dat nog niet is uitgenodigd → voedt de bulk-knop "Nodig alle uit".
  const uninvitedSuggestionCount = suggestions.filter(
    (f) => !invitedFreelancerIds.has(f.freelancerId),
  ).length;

  // Opvolging: welke uitgenodigde ZZP'ers reageerden (een niet-ingetrokken reactie op deze
  // opdracht). Eén begrensde query, alleen wanneer er daadwerkelijk uitnodigingen zijn — geaggregeerd.
  const inviteFollowup =
    invitedFreelancerIds.size > 0
      ? summarizeInviteFollowup(
          parseInviteRecords(inviteLogs),
          new Set(
            // unbounded-allow: begrensd door `freelancerId in invitedFreelancerIds` (≤ 200, uit de
            // met take:200 geladen JOB_INVITED-logs) — één reactie per (opdracht, ZZP'er).
            (
              await prisma.application.findMany({
                where: {
                  jobId: job.id,
                  freelancerId: { in: [...invitedFreelancerIds] },
                  status: { not: "WITHDRAWN" },
                },
                select: { freelancerId: true },
              })
            ).map((a) => a.freelancerId),
          ),
          new Date(),
        )
      : null;

  const { t } = await getTranslator();

  return (
    <div className="space-y-6">
      <Link
        href="/opdrachten"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> {t("Terug naar opdrachten")}
      </Link>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="break-words font-display text-2xl font-semibold tracking-tight">
                  {job.title}
                </h1>
                {isOwner && <JobStatusBadge status={status} />}
              </div>
              <p className="text-sm text-muted-foreground">{job.company.name}</p>
            </div>
            {isOwner ? (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/opdrachten/nieuw?from=${job.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <Copy className="size-3.5" aria-hidden /> Dupliceren
                </Link>
                <Link
                  href={`/opdrachten/${job.id}/bewerken`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <Pencil className="size-3.5" aria-hidden /> Bewerken
                </Link>
              </div>
            ) : (
              actor.role === "FREELANCER" &&
              status === "PUBLISHED" && <SaveJobButton jobId={job.id} saved={isSaved} />
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden /> {job.location}
              </span>
            )}
            <span>{t(WORK_MODE[job.workMode as WorkMode])}</span>
            {(job.rateMin != null || job.rateMax != null) && (
              <span className="font-mono font-semibold text-foreground">
                € {job.rateMin ?? "?"}
                {job.rateMax != null ? `–${job.rateMax}` : "+"}
                {t("/uur")}
              </span>
            )}
            {job.industry && <span>{job.industry.name}</span>}
            {job.startDate && (
              <span>
                {t("Start:")} {formatDateShortNl(job.startDate)}
              </span>
            )}
          </div>

          <p className="whitespace-pre-line text-sm leading-relaxed">{job.description}</p>
        </CardContent>
      </Card>

      {/* Risk-reversal: etaleer de bestaande compliance-gate als zekerheid voor de opdrachtgever. */}
      {isOwner && (
        <Card>
          <CardContent className="space-y-1 py-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="size-4 text-success" aria-hidden /> Veilig inhuren
            </p>
            <p className="text-sm text-muted-foreground">
              Elke kandidaat doorloopt certificaat-verificatie. Een samenwerking kan pas starten als
              de verplichte certificaten (zoals VOG en bevoegdheid) geldig zijn — de
              compliance-check zit vóór de bevestiging, niet erna.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Flexpool "eerst eigen mensen": rustige bevestiging dat de poule bij publicatie voorrang kreeg. */}
      {isOwner && poolInvitedCount > 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="size-4 text-primary" aria-hidden />
          <span>
            {poolInvitedCount === 1 ? "1 lid uit je " : `${poolInvitedCount} leden uit je `}
            <Link href="/favorieten" className="font-medium text-foreground hover:underline">
              Flexpool
            </Link>{" "}
            {poolInvitedCount === 1 ? "is" : "zijn"} bij publicatie als eerste geïnformeerd.
          </span>
        </p>
      )}

      {(requiredSkills.length > 0 || optionalSkills.length > 0) && (
        <section className="space-y-3">
          {requiredSkills.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("Vereiste skills")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((s) => (
                  <Badge key={s.skillId}>{s.skill.name}</Badge>
                ))}
              </div>
            </div>
          )}
          {optionalSkills.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("Gewenste skills")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {optionalSkills.map((s) => (
                  <Badge key={s.skillId} variant="muted">
                    {s.skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {(requiredCreds.length > 0 || optionalCreds.length > 0) && (
        <section className="space-y-3">
          {requiredCreds.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("Vereiste certificaten")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {requiredCreds.map((c) => (
                  <Badge key={c.id} variant="warning">
                    {CREDENTIAL_TYPE_LABEL[c.credentialType as CredentialType]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {optionalCreds.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("Gewenste certificaten")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {optionalCreds.map((c) => (
                  <Badge key={c.id} variant="muted">
                    {CREDENTIAL_TYPE_LABEL[c.credentialType as CredentialType]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {isOwner && job.dbaRisk && (
        <section className="space-y-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Wet DBA — risico
            </h2>
            <DbaRiskBadge level={job.dbaRisk as DbaRisk} />
          </div>
          <p className="text-xs text-muted-foreground">{dbaAdvice(job.dbaRisk as DbaRisk)}</p>
          {parseDbaReasons(job.dbaReasons).length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {parseDbaReasons(job.dbaReasons).map((r) => (
                <li key={r.factor}>{r.message}</li>
              ))}
            </ul>
          )}
          {(() => {
            const modelRec = recommendModelAgreement({
              directSupervision: job.dbaDirectSupervision,
              embedded: job.dbaEmbedded,
              fixedSchedule: job.dbaFixedSchedule,
              noSubstitution: job.dbaNoSubstitution,
              exclusive: job.dbaExclusive,
              weakEntrepreneurship: job.dbaWeakEntrepreneurship,
              durationMonths: job.dbaDurationMonths,
            });
            return (
              <>
                {modelRec.recommended && (
                  <div className="rounded-md border border-border bg-muted/40 p-2.5">
                    <p className="text-xs font-medium">
                      Aanbevolen modelovereenkomst: {modelRec.label}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">{modelRec.note}</p>
                  </div>
                )}
                {job.modelAgreementType ? (
                  <p className="text-xs text-muted-foreground">
                    Vastgelegd:{" "}
                    <span className="font-medium text-foreground">
                      {MODEL_AGREEMENT_LABELS[job.modelAgreementType as ModelAgreementType]}
                    </span>
                  </p>
                ) : (
                  modelRec.recommended && (
                    <p className="text-[11px] text-muted-foreground/70">
                      Nog geen modelovereenkomst vastgelegd.
                    </p>
                  )
                )}
              </>
            );
          })()}
          <p className="text-[11px] text-muted-foreground/70">Hulpmiddel, geen juridisch advies.</p>
        </section>
      )}

      {isOwner &&
        (() => {
          // rateMin is in EUR (Int), convert to cents for the threshold check.
          const rateMinCents = job.rateMin != null ? job.rateMin * 100 : null;
          const rateThreshold = assessRateThreshold(rateMinCents);
          return rateThreshold.belowThreshold ? (
            <section className="space-y-1.5 rounded-lg border border-warning/40 bg-warning/5 p-4">
              <p className="text-xs font-medium text-warning">Rechtsvermoeden werknemerschap</p>
              <p className="text-xs text-muted-foreground">{rechtsvermoedenHint()}</p>
            </section>
          ) : null;
        })()}

      {isOwner && staffingRisk && <JobStaffingRiskCard summary={staffingRisk} jobId={job.id} />}

      {isOwner && vacancyPerformance && <JobVacancyPerformanceCard summary={vacancyPerformance} />}

      {isOwner && reach && <JobReachCard reach={reach} />}

      {isOwner && inviteFollowup && <JobInviteFollowupCard followup={inviteFollowup} />}

      {isOwner && suggestions.length > 0 && (
        <section className="rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-3">
            <div className="min-w-0">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Geschikte ZZP&apos;ers
              </h2>
              <p className="text-xs text-muted-foreground">
                Openbare profielen die bij deze opdracht passen en nog niet reageerden.
              </p>
            </div>
            {uninvitedSuggestionCount >= 2 && (
              <form action={inviteSuggestedFreelancersToJob.bind(null, job.id)}>
                <Button type="submit" size="sm">
                  Nodig alle uit ({uninvitedSuggestionCount})
                </Button>
              </form>
            )}
          </div>
          <ul className="divide-y divide-border">
            {suggestions.map((f) => (
              <li
                key={f.freelancerId}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Link
                    href={`/zzp/${f.freelancerId}`}
                    target="_blank"
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {f.name}
                  </Link>
                  <TrustBadge level={f.trustLevel} />
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  {/* Rustig: badges alleen als ze iets signaleren — beschikbaar/compliant is de norm. */}
                  {f.availability !== "AVAILABLE" && <AvailabilityBadge status={f.availability} />}
                  {f.compliance !== "COMPLIANT" && <ComplianceBadge status={f.compliance} />}
                  <span className="flex flex-col items-end gap-1">
                    <span className="font-mono text-sm font-semibold tracking-tight text-primary">
                      {f.score}%
                    </span>
                    <MatchMeter score={f.score} />
                  </span>
                  {invitedFreelancerIds.has(f.freelancerId) ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-success/40 bg-success/5 px-2 py-1 text-xs font-medium text-success">
                      <Check className="size-3.5" aria-hidden /> Uitgenodigd
                    </span>
                  ) : (
                    <form action={inviteFreelancerToJob.bind(null, job.id, f.freelancerId)}>
                      <Button type="submit" variant="secondary" size="sm">
                        Nodig uit
                      </Button>
                    </form>
                  )}
                  <form action={startConversationWithFreelancer.bind(null, job.id, f.freelancerId)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Bericht sturen
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!isOwner &&
        (job.company.description ||
          job.company.location ||
          job.company.website ||
          job.company.industry) && (
          <section className="space-y-2 rounded-lg border border-border bg-card p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("Over de opdrachtgever")}
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {job.company.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden /> {job.company.location}
                </span>
              )}
              {job.company.industry && <span>{job.company.industry.name}</span>}
              {job.company.website && (
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                >
                  {t("Website")} <ExternalLink className="size-3.5" aria-hidden />
                </a>
              )}
            </div>
            {job.company.description && (
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {job.company.description}
              </p>
            )}
          </section>
        )}

      {clientHistory && (
        <ClientHistoryBlock history={clientHistory} companyName={job.company.name} />
      )}

      {companyReputation && <CompanyReputationBlock reputation={companyReputation} />}

      {paymentBehavior && <PaymentBehaviorBlock behavior={paymentBehavior} />}

      {clientReliability && <ClientReliabilityBlock reliability={clientReliability} />}

      {clientResponsiveness && <ClientResponsivenessBlock responsiveness={clientResponsiveness} />}

      {isOwner ? (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          {JOB_TRANSITIONS[status].map((to) => (
            <JobStatusButton
              key={to}
              jobId={job.id}
              to={to}
              label={transitionLabel(status, to)}
              primary={to === "PUBLISHED"}
            />
          ))}
        </div>
      ) : (
        actor.role === "FREELANCER" &&
        (myApplication ? (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">{t("Je hebt op deze opdracht gereageerd.")}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {myApplication.matchScore != null && (
                <Badge variant="accent">
                  {t("Match")} {myApplication.matchScore}%
                </Badge>
              )}
              {myCompliance && <ComplianceBadge status={myCompliance} />}
              <Link href="/reacties" className="underline-offset-4 hover:underline">
                {t("Bekijk mijn reacties")}
              </Link>
            </div>
          </div>
        ) : status === "PUBLISHED" ? (
          <div className="space-y-4 border-t border-border pt-4">
            {myFit && (
              <section className="space-y-3 rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("Jouw aansluiting")}
                    </h2>
                    {myFit.compliance.status !== "COMPLIANT" && (
                      <ComplianceBadge status={myFit.compliance.status} />
                    )}
                  </div>
                  <ScoreRing value={myFit.score} label={t("Match")} size={64} />
                </div>
                {myFit.reasons.length > 0 && (
                  <ul className="space-y-1.5 text-sm">
                    {myFit.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {r.kind === "positive" ? (
                          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                        ) : (
                          <TriangleAlert
                            className="mt-0.5 size-4 shrink-0 text-warning"
                            aria-hidden
                          />
                        )}
                        <span className={r.kind === "gap" ? "text-muted-foreground" : ""}>
                          {t(r.label)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <details className="text-sm">
                  <summary className="focus-ring cursor-pointer text-muted-foreground">
                    {t("Hoe is deze score opgebouwd?")}
                  </summary>
                  <div className="mt-3">
                    <MatchBreakdown breakdown={myFit.breakdown} />
                  </div>
                </details>
                {requiredCreds.length > 0 && (
                  <ul className="space-y-1.5 text-sm">
                    {requiredCreds.map((c) => {
                      const type = c.credentialType as CredentialType;
                      const state = credState(type, myFit!.compliance);
                      const urgent = state === "missing" || state === "expired";
                      return (
                        <li key={c.id} className="flex flex-wrap items-center gap-2">
                          {state === "satisfied" ? (
                            <Check className="size-4 shrink-0 text-success" aria-hidden />
                          ) : (
                            <TriangleAlert
                              className={`size-4 shrink-0 ${urgent ? "text-danger" : "text-warning"}`}
                              aria-hidden
                            />
                          )}
                          <span>{CREDENTIAL_TYPE_LABEL[type]}</span>
                          <span className="text-xs text-muted-foreground">
                            {t(CRED_STATE_LABEL[state])}
                          </span>
                          {urgent && (
                            <Link
                              href="/certificaten"
                              className="text-xs font-medium underline underline-offset-2"
                            >
                              {t("Toevoegen")}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {myFit.compliance.status === "NON_COMPLIANT" && (
                  <p className="text-xs text-muted-foreground">
                    {t("Je kunt nog reageren, maar je voldoet nog niet aan alle vereisten.")}
                  </p>
                )}
              </section>
            )}
            {rateFit && <JobRateFitCard assessment={rateFit} />}
            {effectiveRate && <EffectiveRateCard summary={effectiveRate} />}
            {availabilitySignal && <JobAvailabilitySignalCard signal={availabilitySignal} />}
            {jobCompetition && <JobCompetitionCard competition={jobCompetition} />}
            <ApplicationForm
              action={createApplication.bind(null, job.id)}
              defaultMotivation={defaultMotivation}
            />
          </div>
        ) : null)
      )}

      <RelatedJobsSection jobs={relatedJobs} />
    </div>
  );
}

function parseDbaReasons(raw: string | null | undefined): DbaReason[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as DbaReason[]) : [];
  } catch {
    return [];
  }
}
