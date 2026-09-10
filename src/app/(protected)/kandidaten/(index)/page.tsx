import { type Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Users, Check, TriangleAlert, GitCompare, Clock } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { getTranslator } from "@/lib/i18n/server";
import { prisma } from "@/lib/db";
import { APPLICATION_TRANSITIONS } from "@/lib/applications";
import {
  KANDIDATEN_FILTER_LABELS,
  buildKandidatenHref,
  kandidatenStatusWhere,
  normalizeKandidatenFilter,
  statusCountsFromGroups,
  totalFromStatusGroups,
} from "@/lib/kandidaten-filter";
import { pageArgs, splitPage } from "@/lib/pagination";
import {
  CANDIDATE_COMPARE_JOBS_LIMIT,
  CANDIDATE_MULTI_APPLY_SCAN_LIMIT,
  CANDIDATE_SIGNAL_SCAN_LIMIT,
} from "@/lib/scan-limits";
import { computeCompliance, scoreJobForFreelancer, topPositiveReason } from "@/lib/matching";
import { computeClientResponsiveness } from "@/lib/client-responsiveness";
import { buildCollaborationProposalPrefill } from "@/lib/collaboration-proposal-prefill";
import { ResponsivenessReputationCard } from "@/components/administratie/responsiveness-reputation-card";
import {
  summarizeCandidateDecision,
  summarizeCandidatesAwaitingDecision,
} from "@/lib/candidate-decision";
import { RATE_FIT_LABEL, RATE_FIT_VARIANT, classifyProposedRateFit } from "@/lib/rate-fit";
import { VerificationMarks } from "@/components/credentials/verification-marks";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { summarizeAvailability } from "@/lib/availability";
import {
  START_FIT_LABEL,
  START_FIT_VARIANT,
  classifyStartFit,
  nextFitAfterStart,
  nextFitLabel,
} from "@/lib/candidate-availability";
import {
  classifyCandidateProximity,
  proximityLabel,
  PROXIMITY_VARIANT,
} from "@/lib/candidate-proximity";
import { formatDateShortNl } from "@/lib/format-date";
import { summarizeCandidateCredentialExpiry } from "@/lib/candidate-credential-expiry";
import { computeTrustLevel } from "@/lib/trust";
import { mandatoryDocuments } from "@/lib/mandatory-documents";
import { TrustBadge } from "@/components/trust/trust-badge";
import { type AvailabilityWindowType } from "@/lib/enums";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type Visibility,
  type CredentialType,
  type CredentialStatus,
} from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { ComplianceBadge } from "@/components/compliance-badge";
import { DeliveryQualityBlock } from "@/components/freelancer/delivery-quality-block";
import { CandidateHistoryBadge } from "@/components/freelancer/candidate-history-badge";
import { RatingStars } from "@/components/reviews/rating-stars";
import { getDeliveryQualityForProfiles } from "@/lib/data/freelancer-delivery-quality";
import { getSharedHistoryForCandidates } from "@/lib/data/candidate-history";
import { getCompletedCollaborationCounts } from "@/lib/data/candidate-track-records";
import { CandidateExperienceBadge } from "@/components/freelancer/candidate-experience-badge";
import { CandidateMultiApplyBadge } from "@/components/freelancer/candidate-multi-apply-badge";
import { summarizeMultiApply, otherAppliedJobs } from "@/lib/candidate-multi-apply";
import { getReviewRatingsForCandidates } from "@/lib/data/candidate-reviews";
import { changeApplicationStatus } from "../actions";
import { ApplicationNoteForm } from "../application-note-form";
import { RejectApplicationDialog } from "../reject-application-dialog";
import { BulkTriageBar } from "../bulk-triage-bar";
import { startConversationForApplication } from "@/app/(protected)/berichten/actions";
import { ProposeCollaboration } from "../propose-collaboration";
import { TriageList, type TriageItem } from "../triage-list";
import { AcceptedSection } from "../accepted-section";
import { partitionTriage } from "@/lib/kandidaten-triage";
import { isReproposableCancelledProposal } from "@/lib/collaboration-reproposal";

export const metadata: Metadata = { title: "Kandidaten · Handslag" };

/**
 * Alles wat één kandidaatrij nodig heeft om volledig te renderen: de match-onderbouwing, de live
 * compliance, de agenda en de stand van een eventuele samenwerking. Bewust zwaar — en daarom
 * uitsluitend toegepast op de zichtbare pagina (en op de ene "beste match"-rij), nooit op de hele
 * reactielijst van de opdrachtgever.
 */
const CANDIDATE_INCLUDE = Prisma.validator<Prisma.ApplicationInclude>()({
  job: {
    select: {
      id: true,
      title: true,
      // description voedt (met de headline/bio van de kandidaat) de inhoudelijke aansluiting
      // in de matchscore, zodat de kandidatenlijst dezelfde score toont als de overige schermen.
      description: true,
      startDate: true,
      rateMin: true,
      rateMax: true,
      workMode: true,
      location: true,
      industryId: true,
      skills: { select: { skillId: true, required: true } },
      credentialRequirements: { select: { credentialType: true, required: true } },
    },
  },
  freelancer: {
    select: {
      id: true,
      headline: true,
      bio: true,
      visibility: true,
      hourlyRate: true,
      workMode: true,
      location: true,
      maxTravelMinutes: true,
      availability: true,
      user: { select: { id: true, name: true, identityVerifiedAt: true } },
      skills: { select: { skillId: true } },
      industries: { select: { industryId: true } },
      availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
      credentials: { select: { type: true, status: true, expiresAt: true } },
    },
  },
  collaboration: {
    // Naast de id ook de velden waaruit blijkt of een bestaande collaboration een herbruikbaar,
    // geannuleerd voorstel is (nooit getekend/actief, geen artefacten). Dan mag de opdrachtgever
    // opnieuw voorstellen en tonen we het formulier i.p.v. een dode "bekijk samenwerking"-knop.
    select: {
      id: true,
      status: true,
      contractStatus: true,
      agreementClientSignedAt: true,
      agreementFreelancerSignedAt: true,
      completedAt: true,
      _count: { select: { invoices: true, performances: true } },
    },
  },
});

const ACTION_LABEL: Record<ApplicationStatus, string> = {
  NEW: "Terug naar nieuw",
  VIEWED: "Markeer als bekeken",
  SHORTLIST: "Shortlist",
  ACCEPTED: "Accepteren",
  REJECTED: "Afwijzen",
  WITHDRAWN: "Ingetrokken", // nooit een actieknop (geen overgangen), label voor de volledigheid
};

export default async function KandidatenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const actor = await requireRole("CLIENT");
  const { t } = await getTranslator();
  const params = await searchParams;
  const filterStatus = normalizeKandidatenFilter(params.status);
  // Deeplink vanuit /kandidaten/vergelijk ("Kies X") of een gedeelde link: open deze rij meteen.
  const openId = params.open || null;

  // Opdracht-scope (deeplink "Bekijk kandidaten" vanaf de opdracht-detailpagina): beperk de lijst tot
  // één opdracht. Server-side gevalideerd — alleen een opdracht van deze opdrachtgever telt; een
  // onbekende/andermans id valt terug op "alle opdrachten" (geen lege lijst, geen cross-tenant-lek).
  const requestedJobId = params.job || null;
  const scopedJob = requestedJobId
    ? await prisma.job.findFirst({
        where: { id: requestedJobId, company: { userId: actor.id } },
        select: { id: true, title: true },
      })
    : null;
  const jobScope = scopedJob?.id ?? null;

  const noteLabels = {
    placeholder: t("Interne notitie (alleen voor jou)…"),
    saving: t("Opslaan…"),
    save: t("Notitie opslaan"),
  };
  const proposeLabels = {
    title: t("Samenwerking voorstellen"),
    ratePlaceholder: t("Tarief €/uur"),
    rate: t("Tarief"),
    startDate: t("Startdatum"),
    endDate: t("Einddatum"),
    sending: t("Versturen…"),
    send: t("Voorstel versturen"),
    conflictHeading: t("Let op — de kandidaat heeft zich onbeschikbaar gemaakt in deze periode:"),
    conflictRange: t("t/m"),
    reproposalNote: t(
      "Je vorige voorstel is geannuleerd. Stuur een nieuw voorstel om de samenwerking alsnog te starten.",
    ),
    prefillNote: t("Vooringevuld met het tariefvoorstel en de startdatum — pas gerust aan."),
  };
  const bulkLabels = {
    viewed: t("Bekeken"),
    shortlist: t("Shortlist"),
    reject: t("Afwijzen"),
    selected: t("geselecteerd"),
    apply: t("Toepassen op"),
    working: t("Bezig…"),
    confirmReject: t("Geselecteerde reacties afwijzen? De ZZP'ers krijgen hiervan bericht."),
    ariaForm: t("Bulk statuswijziging"),
    ariaStatus: t("Nieuwe status"),
  };

  // Eigenaar-scope: uitsluitend reacties op opdrachten van déze opdrachtgever. Eén keer gedefinieerd
  // en door élke query hieronder hergebruikt, zodat geen enkel pad zonder ownership-filter bestaat.
  const ownerWhere = { job: { company: { userId: actor.id } } };
  const scopedWhere = { ...ownerWhere, ...(jobScope ? { jobId: jobScope } : {}) };
  const listWhere = { ...scopedWhere, ...kandidatenStatusWhere(filterStatus) };
  const cursor = params.cursor || null;

  const [statusGroups, jobGroups] = await Promise.all([
    // Tab-tellingen: de database telt per status. Vroeger werd hiervoor de héle reactielijst geladen.
    prisma.application.groupBy({
      by: ["status"],
      where: scopedWhere,
      _count: { _all: true },
    }),
    // Vergelijk-instap: opdrachten met ≥2 nog-actieve reacties, drukste eerst en begrensd op de
    // constante. Ook dit is een telling, geen lijst — geen enkele reactie hoeft ervoor in het geheugen.
    prisma.application.groupBy({
      by: ["jobId"],
      where: { ...scopedWhere, status: { notIn: ["REJECTED", "WITHDRAWN"] } },
      _count: { jobId: true },
      orderBy: { _count: { jobId: "desc" } },
      take: CANDIDATE_COMPARE_JOBS_LIMIT,
    }),
  ]);
  const counts = statusCountsFromGroups(statusGroups);
  const totalApplications = totalFromStatusGroups(statusGroups);

  const comparableJobIds = jobGroups.filter((g) => g._count.jobId >= 2).map((g) => g.jobId);
  const comparableTitles =
    comparableJobIds.length > 0
      ? await prisma.job.findMany({
          where: { id: { in: comparableJobIds } },
          select: { id: true, title: true },
          take: CANDIDATE_COMPARE_JOBS_LIMIT,
        })
      : [];
  const titleByJobId = new Map(comparableTitles.map((j) => [j.id, j.title]));
  const comparableJobs = jobGroups
    .filter((g) => g._count.jobId >= 2 && titleByJobId.has(g.jobId))
    .map((g) => ({ id: g.jobId, title: titleByJobId.get(g.jobId)!, count: g._count.jobId }));

  // Eén pagina reacties, met de volledige rij-inhoud. Beste match eerst; `id` als tweede sleutel maakt
  // de volgorde deterministisch — voorwaarde voor een betrouwbare cursor. De werkstroom-volgorde
  // (NEW vóór afgehandelde) zetten we hierna in-memory binnen de pagina, want `status` is een
  // string-kolom: DB-`asc` zou lexicografisch sorteren (ACCEPTED bovenaan).
  const pageRows = await prisma.application.findMany({
    where: listWhere,
    orderBy: [{ matchScore: "desc" }, { id: "desc" }],
    ...pageArgs(cursor),
    include: CANDIDATE_INCLUDE,
  });
  const { items: applications, nextCursor } = splitPage(pageRows);

  // Deeplink-garantie ("Kies X" vanuit /kandidaten/vergelijk, of een gedeelde link): de aangewezen
  // reactie moet zichtbaar zijn, ook als hij buiten deze pagina valt. Ownership blijft server-side
  // afgedwongen — een id van een andere opdrachtgever levert simpelweg niets op.
  const openRow =
    openId && !applications.some((a) => a.id === openId)
      ? await prisma.application.findFirst({
          where: { ...scopedWhere, id: openId },
          include: CANDIDATE_INCLUDE,
        })
      : null;
  if (openRow) applications.unshift(openRow);

  // Werkstroom-volgorde binnen de pagina: NEW → VIEWED → SHORTLIST → REJECTED → ACCEPTED
  // (actie-vragend eerst). Stabiel, dus binnen één status blijft de match-volgorde staan.
  applications.sort(
    (a, b) =>
      APPLICATION_STATUSES.indexOf(a.status as ApplicationStatus) -
      APPLICATION_STATUSES.indexOf(b.status as ApplicationStatus),
  );

  // Leverbetrouwbaarheid per kandidaat: spiegel van de opdrachtgever-signalen die de ZZP'er op de
  // opdracht ziet. Eén gebatchte fetch over de profielen op deze pagina (geen N+1).
  const profileIds = applications.map((a) => a.freelancer.id);
  // Reputatie-rating: gemiddelde opdrachtgever-beoordeling per ZZP'er (op user-id, want een Review
  // hangt aan de gebruiker, niet aan het profiel). Alleen PUBLISHED CLIENT_ON_FREELANCER.
  const freelancerUserIds = applications.map((a) => a.freelancer.user.id);
  // Eén tijdstempel per request (patroon van /reacties en /kandidaten/vergelijk), niet per rij.
  const now = new Date();
  const nowMs = now.getTime();

  const [
    deliveryByProfile,
    historyByProfile,
    ratingByUser,
    experienceByProfile,
    best,
    multiApplyRows,
    signalRows,
  ] = await Promise.all([
    getDeliveryQualityForProfiles(profileIds),
    // "Eerder samengewerkt": afgeronde samenwerkingen tussen déze opdrachtgever en de kandidaat —
    // een sterk vertrouwenssignaal bij de beslissing. Per opdrachtgever gescoopt, geen N+1.
    getSharedHistoryForCandidates(actor.id, profileIds),
    getReviewRatingsForCandidates(freelancerUserIds),
    // Platform-brede staat van dienst: afgeronde klussen over álle opdrachtgevers heen. Vult het
    // ervaringssignaal voor een kandidaat die nieuw is voor déze opdrachtgever (geen gedeelde historie).
    getCompletedCollaborationCounts(profileIds),
    // "Beste match": hoogste matchscore onder de reacties die nog een beslissing vragen — over de
    // HELE set, niet alleen de geladen pagina, want de band moet de beste kandidaat etaleren. Eén rij
    // via de database-sortering (`findFirst` = take 1), geen scan. Reacties die al zijn afgehandeld
    // (ACCEPTED/REJECTED/WITHDRAWN) horen hier niet: die band zou misleiden.
    filterStatus
      ? Promise.resolve(null)
      : prisma.application.findFirst({
          where: {
            ...scopedWhere,
            status: { in: ["NEW", "VIEWED", "SHORTLIST"] },
            matchScore: { not: null },
          },
          orderBy: [{ matchScore: "desc" }, { id: "desc" }],
          include: CANDIDATE_INCLUDE,
        }),
    // Breedte-signaal: op hoeveel van je opdrachten dingt één zichtbare kandidaat nog mee? Alleen voor
    // de profielen op deze pagina en bewust ZONDER opdracht-scope — anders zou de gescoopte weergave
    // nooit een "reageerde ook op"-signaal kunnen tonen. Afgewezen/ingetrokken tellen niet mee.
    profileIds.length > 0
      ? prisma.application.findMany({
          where: {
            ...ownerWhere,
            freelancerId: { in: profileIds },
            status: { notIn: ["REJECTED", "WITHDRAWN"] },
          },
          select: { freelancerId: true, status: true, job: { select: { id: true, title: true } } },
          take: CANDIDATE_MULTI_APPLY_SCAN_LIMIT,
        })
      : Promise.resolve([]),
    // Paginabrede signalen (reactiebereidheid + beslis-achterstand) over de meest recente reacties.
    // Lichte select — alleen de velden die de twee pure functies nodig hebben — en expliciet begrensd,
    // zodat dit ook bij duizenden reacties een goedkope query blijft.
    prisma.application.findMany({
      where: scopedWhere,
      orderBy: { createdAt: "desc" },
      take: CANDIDATE_SIGNAL_SCAN_LIMIT,
      select: {
        status: true,
        createdAt: true,
        matchScore: true,
        collaboration: { select: { id: true } },
        job: {
          select: {
            credentialRequirements: { where: { required: true }, select: { credentialType: true } },
          },
        },
        freelancer: {
          select: { credentials: { select: { type: true, status: true, expiresAt: true } } },
        },
      },
    }),
  ]);

  const bestReason = best
    ? topPositiveReason(scoreJobForFreelancer(best.job, best.freelancer).reasons)
    : null;

  // Alleen kandidaten met ≥ 2 opdrachten komen terug uit de samenvatting.
  const multiApplyByFreelancer = summarizeMultiApply(
    multiApplyRows.map((a) => ({
      freelancerId: a.freelancerId,
      jobId: a.job.id,
      jobTitle: a.job.title,
      status: a.status,
    })),
  );

  // Reactiereputatie-spiegel: hetzelfde reactiebereidheid-signaal dat ZZP'ers over deze opdrachtgever
  // zien ("Pakt reacties op" / "Laat reacties liggen"), terug naar hemzelf als zelfverbeter-nudge.
  const responsivenessReputation = computeClientResponsiveness(signalRows, now);

  // Beslis-nu-signaal: hoeveel nog-onbesliste reacties liggen langer dan past bij hun matchkwaliteit?
  // Sterke kandidaten raken elders aan de slag als je te lang wacht. Compliance-geblokkeerde reacties
  // tellen niet mee — die krijgen een eigen, rij-specifieke boodschap.
  const decisionSummary = summarizeCandidatesAwaitingDecision(
    signalRows.map((a) => ({
      status: a.status,
      matchScore: a.matchScore,
      createdAt: a.createdAt,
      hasCollaboration: !!a.collaboration,
      complianceBlocked:
        computeCompliance(
          a.job.credentialRequirements.map((r) => r.credentialType as CredentialType),
          a.freelancer.credentials.map((c) => ({
            type: c.type as CredentialType,
            status: c.status as CredentialStatus,
            expiresAt: c.expiresAt,
          })),
          now,
        ).status === "NON_COMPLIANT",
    })),
    now,
  );

  // Live compliance één keer per zichtbare reactie berekenen en hergebruiken — zowel de paginabrede
  // band als de rij moeten dezelfde compliance-blokkade zien, anders telt de band een niet-inzetbare
  // kandidaat als "sterke match die je elders kunt verliezen" terwijl de rij "eerst compliance
  // oplossen" toont.
  const complianceByApp = new Map(
    applications.map((a) => {
      const requiredTypes = a.job.credentialRequirements
        .filter((r) => r.required)
        .map((r) => r.credentialType as CredentialType);
      const compliance =
        requiredTypes.length > 0
          ? computeCompliance(
              requiredTypes,
              a.freelancer.credentials.map((c) => ({
                type: c.type as CredentialType,
                status: c.status as CredentialStatus,
                expiresAt: c.expiresAt,
              })),
            )
          : null;
      return [a.id, compliance] as const;
    }),
  );

  // Verval-tijdens-opdracht: een nu-geldig vereist certificaat dat vóór of kort na de startdatum
  // verloopt. Beslismoment-signaal náást de live compliance (die op `now` oordeelt) — zelfde `now`,
  // geen extra query (startDate + expiresAt zijn al geladen).
  const expiryByApp = new Map(
    applications.map((a) => {
      const requiredTypes = a.job.credentialRequirements
        .filter((r) => r.required)
        .map((r) => r.credentialType as CredentialType);
      return [
        a.id,
        summarizeCandidateCredentialExpiry({
          requiredTypes,
          credentials: a.freelancer.credentials.map((c) => ({
            type: c.type as CredentialType,
            status: c.status as CredentialStatus,
            expiresAt: c.expiresAt,
          })),
          jobStartDate: a.job.startDate,
          now,
        }),
      ] as const;
    }),
  );

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title={t("Kandidaten")}
        description={t("Reacties op je opdrachten, met match en compliance.")}
      />

      {scopedJob && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
            <span className="min-w-0">
              {t("Reacties op")}{" "}
              <Link
                href={`/opdrachten/${scopedJob.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {scopedJob.title}
              </Link>
            </span>
            <Link
              href="/kandidaten"
              className="focus-ring shrink-0 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {t("Toon alle opdrachten")}
            </Link>
          </CardContent>
        </Card>
      )}

      {totalApplications === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={t("Nog geen reacties")}
            description={
              scopedJob
                ? t("Er zijn nog geen reacties op deze opdracht.")
                : t("Zodra ZZP'ers reageren op je opdrachten, zie je ze hier.")
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <ResponsivenessReputationCard responsiveness={responsivenessReputation} />

          {/* Statusfilter */}
          <nav className="flex flex-wrap gap-2 text-sm" aria-label={t("Filter op status")}>
            {Object.entries(KANDIDATEN_FILTER_LABELS).map(([val, label]) => {
              const active = val === filterStatus;
              const href = buildKandidatenHref({
                status: val as "" | ApplicationStatus,
                job: jobScope,
              });
              const count = val === "" ? totalApplications : counts[val as ApplicationStatus];
              return (
                <Link
                  key={val}
                  href={href}
                  className={
                    active
                      ? "rounded-full bg-primary px-3 py-1 text-primary-foreground"
                      : "rounded-full border border-border px-3 py-1 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  }
                >
                  {t(label)}
                  {count > 0 && (
                    <span className="ml-1 tabular-nums text-muted-foreground/70">({count})</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {comparableJobs.length > 0 && (
            <Card>
              <CardContent className="space-y-2 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("Kandidaten vergelijken")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {comparableJobs.map((j) => (
                    <Link
                      key={j.id}
                      href={`/kandidaten/vergelijk?job=${j.id}`}
                      className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-foreground hover:border-foreground/40"
                    >
                      <GitCompare className="size-3.5 text-muted-foreground" aria-hidden />
                      <span className="max-w-[16rem] truncate">{j.title}</span>
                      <span className="tabular-nums text-muted-foreground">({j.count})</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!filterStatus && best && (
            <Card className="border-accent/40 bg-accent/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("Beste match")}
                  </p>
                  <p className="truncate text-sm font-semibold">
                    {best.freelancer.user.name}
                    {best.matchScore != null && (
                      <span className="ml-2 font-normal text-muted-foreground">
                        {t("Match")} {best.matchScore}%
                      </span>
                    )}
                  </p>
                  {bestReason && <p className="text-xs text-muted-foreground">{bestReason}</p>}
                </div>
                <VerificationMarks credentials={best.freelancer.credentials} />
              </CardContent>
            </Card>
          )}
          {!filterStatus && decisionSummary.total > 0 && (
            <Card className="border-border bg-muted/40">
              <CardContent className="flex items-start gap-2.5 py-3 text-sm">
                <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <p>
                  {decisionSummary.total === 1
                    ? t("1 kandidaat wacht op je beslissing")
                    : `${decisionSummary.total} ${t("kandidaten wachten op je beslissing")}`}
                  {decisionSummary.strong > 0 && (
                    <span className="text-muted-foreground">
                      {" — "}
                      {decisionSummary.strong === 1
                        ? t("waaronder een sterke match die je elders kunt verliezen.")
                        : `${decisionSummary.strong} ${t("sterke matches die je elders kunt verliezen.")}`}
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          )}
          {applications.length === 0 ? (
            <EmptyState
              icon={Users}
              title={cursor ? t("Geen verdere kandidaten") : t("Geen reacties met deze status")}
              description={
                cursor
                  ? t("Je hebt alle kandidaten in deze categorie bekeken.")
                  : t("Er zijn geen reacties in deze categorie. Pas het filter aan.")
              }
            />
          ) : (
            (() => {
              // Bouw per zichtbare kandidaat een compacte kop + uitklapbare inhoud. Geaccepteerde
              // kandidaten gaan naar een aparte, ingeklapte sectie onderaan (de samenwerking loopt al).
              const rendered = applications.map((app) => {
                const status = app.status as ApplicationStatus;
                // Is de (eventuele) bestaande collaboration een herbruikbaar, geannuleerd voorstel?
                // Zo ja, dan is de reactie ná annulering opnieuw voorstelbaar: toon het formulier weer
                // en behandel de reactie als "vraagt nog actie" (niet als afgehandelde samenwerking).
                const reproposable =
                  app.collaboration != null &&
                  isReproposableCancelledProposal({
                    status: app.collaboration.status,
                    contractStatus: app.collaboration.contractStatus,
                    agreementClientSignedAt: app.collaboration.agreementClientSignedAt,
                    agreementFreelancerSignedAt: app.collaboration.agreementFreelancerSignedAt,
                    completedAt: app.collaboration.completedAt,
                    invoicesCount: app.collaboration._count.invoices,
                    performancesCount: app.collaboration._count.performances,
                  });
                // "Blokkeert een levende/afgeronde samenwerking een nieuw voorstel?" — false bij geen
                // collaboration én bij een herbruikbaar geannuleerd voorstel. Voedt de triage + de knoppen.
                const collabBlocks = app.collaboration != null && !reproposable;
                // Vooringave voor het samenwerkingsvoorstel: tariefvoorstel van de kandidaat + de
                // startdatum van de opdracht. Server blijft de waarheid; dit scheelt overtypen.
                const proposalPrefill = buildCollaborationProposalPrefill({
                  proposedRate: app.proposedRate,
                  jobStartDate: app.job.startDate,
                });
                // Live compliance: actuele certificaatstatus, niet de bevroren snapshot van het
                // reactiemoment (een VOG kan intussen verlopen zijn). Eén keer berekend (zie
                // complianceByApp) en hier hergebruikt, zodat band en rij hetzelfde oordeel tonen. De
                // volledige uitsplitsing (missing/expired/inReview) maakt concreet WAT er ontbreekt.
                const compliance = complianceByApp.get(app.id) ?? null;
                const isPublic = (app.freelancer.visibility as Visibility) === "PUBLIC";
                const trust = computeTrustLevel({
                  identityVerified: !!app.freelancer.user.identityVerifiedAt,
                  verifiedCredentialCount: app.freelancer.credentials.filter(
                    (c) =>
                      c.status === "VERIFIED" && (!c.expiresAt || c.expiresAt.getTime() > nowMs),
                  ).length,
                  mandatoryDocsComplete: mandatoryDocuments(
                    app.freelancer.credentials.map((c) => ({
                      type: c.type as CredentialType,
                      status: c.status as CredentialStatus,
                      expiresAt: c.expiresAt,
                    })),
                  ).allSatisfied,
                });
                // Live onderbouwing van de match (waarom past deze kandidaat) — dezelfde server-side
                // regels als de ZZP'er op de opdracht ziet, zodat de opdrachtgever niet alleen "Match X%" leest.
                const fitReasons = scoreJobForFreelancer(app.job, app.freelancer).reasons;
                // Beslis-nu-nudge: alleen tonen wanneer de reactie langer onbeslist ligt dan past bij
                // de matchkwaliteit. Zwijgt voor verse of besloten reacties. Voldoet de kandidaat niet
                // aan een verplicht certificaat, dan wordt het signaal een compliance-blokkade i.p.v.
                // een urgentie-nudge — je haalt niemand "snel binnen" die niet compliant is.
                const decision = summarizeCandidateDecision(
                  {
                    status: app.status,
                    matchScore: app.matchScore,
                    createdAt: app.createdAt,
                    hasCollaboration: collabBlocks,
                    complianceBlocked: compliance?.status === "NON_COMPLIANT",
                  },
                  now,
                );
                // Eerste ontbrekende/verlopen certificaat als concrete eerste stap bij een blokkade.
                const firstBlocker = compliance?.missing[0] ?? compliance?.expired[0] ?? null;
                // "Nieuw" en een wachttijd/blokkade sluiten elkaar uit én zijn gatloos complementair:
                // zolang de reactie nog géén aandacht vraagt (`!attention`) heet hij "Nieuw"; zodra hij
                // dat wél doet, verbergt de badge en vertelt de regel eronder (wachttijd óf compliance)
                // de echte status. Gekoppeld aan de tier-eigen patience, niet aan een vaste drempel, zodat
                // er geen NEW-rij zonder enige status-aanduiding ontstaat.
                const fresh = status === "NEW" && !decision?.attention;
                // Andere opdrachten (≠ deze) waarop dezelfde kandidaat ook nog meedingt.
                const otherJobs = otherAppliedJobs(
                  multiApplyByFreelancer.get(app.freelancer.id),
                  app.job.id,
                );
                const lead = !app.collaboration ? (
                  <input
                    type="checkbox"
                    name="appId"
                    value={app.id}
                    form="kandidaten-bulk"
                    aria-label={`${t("Selecteer")} ${app.freelancer.user.name}`}
                    className="focus-ring size-4 shrink-0 rounded border-input accent-accent"
                  />
                ) : null;
                const header = (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          {/* Naam als tekst — links (profiel/opdracht) staan in de uitgeklapte inhoud;
                              een anchor in de expand-knop zou ongeldige geneste interactie geven. */}
                          <span className="min-w-0 truncate font-medium">
                            {app.freelancer.user.name}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            {/* Een oude NEW-reactie krijgt geen "Nieuw"-badge — die zou botsen met de
                                wachttijd-regel eronder. De wachttijd vertelt dan de echte status. */}
                            {status === "NEW" && !fresh ? null : (
                              <ApplicationStatusBadge status={status} />
                            )}
                            <CandidateHistoryBadge
                              history={historyByProfile.get(app.freelancer.id)}
                            />
                            <CandidateExperienceBadge
                              completedCollaborations={experienceByProfile.get(app.freelancer.id)}
                              hasSharedHistory={
                                (historyByProfile.get(app.freelancer.id)?.count ?? 0) >= 1
                              }
                            />
                            <CandidateMultiApplyBadge otherJobs={otherJobs} />
                            {(() => {
                              // Reputatie: gemiddelde opdrachtgever-beoordeling. Alleen tonen bij ≥1
                              // gepubliceerde beoordeling — anders draagt het vertrouwensniveau.
                              const rating = ratingByUser.get(app.freelancer.user.id);
                              return rating ? (
                                <RatingStars
                                  average={rating.average}
                                  count={rating.count}
                                  showValue
                                />
                              ) : null;
                            })()}
                            <TrustBadge level={trust.level} />
                          </span>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {app.freelancer.headline ?? "—"} · {t("op")} {app.job.title}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {app.matchScore != null && (
                          <Badge variant="accent">
                            {t("Match")} {app.matchScore}%
                          </Badge>
                        )}
                        {compliance && <ComplianceBadge status={compliance.status} />}
                      </div>
                    </div>
                    {decision?.attention &&
                      (decision.kind === "compliance" ? (
                        <p className="flex items-center gap-1.5 text-xs text-danger">
                          <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
                          {/* firstBlocker is bij NON_COMPLIANT altijd gezet (missing/expired is dan
                              niet leeg); de fallback is enkel een type-vangnet. */}
                          {firstBlocker
                            ? `${t("Eerst compliance oplossen:")} ${CREDENTIAL_TYPE_LABEL[firstBlocker]}`
                            : t("Eerst compliance oplossen voordat je beslist.")}
                        </p>
                      ) : (
                        // Rij-specifiek: de wachttijd van deze kandidaat. Genderneutraal en zonder de
                        // paginabrede urgentie-zin te herhalen (die staat al één keer in de band boven de lijst).
                        <p
                          className={`flex items-center gap-1.5 text-xs ${
                            decision.urgency === "high" ? "text-warning" : "text-muted-foreground"
                          }`}
                        >
                          <Clock className="size-3.5 shrink-0" aria-hidden />
                          {decision.tier === "strong"
                            ? `${t("Sterke match — wacht al")} ${decision.daysWaiting} ${t("dagen op je beslissing, beslis voordat deze ZZP'er elders start.")}`
                            : `${t("Wacht al")} ${decision.daysWaiting} ${t("dagen op je beslissing.")}`}
                        </p>
                      ))}
                  </div>
                );
                const body = (
                  <>
                    <p className="flex flex-wrap gap-x-3 text-xs">
                      {isPublic && (
                        <Link
                          href={`/zzp/${app.freelancer.id}`}
                          target="_blank"
                          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                          {t("Profiel bekijken")}
                        </Link>
                      )}
                      <Link
                        href={`/opdrachten/${app.job.id}`}
                        className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {t("Naar opdracht")}: {app.job.title}
                      </Link>
                    </p>

                    {otherJobs.length > 0 && (
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span>{t("Reageerde ook op je opdrachten:")}</span>
                        {otherJobs.map((job) => (
                          <Link
                            key={job.id}
                            href={`/kandidaten?job=${job.id}`}
                            className="underline-offset-4 hover:text-foreground hover:underline"
                          >
                            {job.title}
                          </Link>
                        ))}
                      </p>
                    )}

                    <VerificationMarks credentials={app.freelancer.credentials} />

                    {(() => {
                      const delivery = deliveryByProfile.get(app.freelancer.id);
                      return delivery ? <DeliveryQualityBlock quality={delivery} /> : null;
                    })()}

                    {compliance && compliance.status !== "COMPLIANT" && (
                      <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        {compliance.missing.length > 0 && (
                          <span className="text-danger">
                            {t("Mist:")}{" "}
                            {compliance.missing
                              .map((type) => t(CREDENTIAL_TYPE_LABEL[type]))
                              .join(", ")}
                          </span>
                        )}
                        {compliance.expired.length > 0 && (
                          <span className="text-danger">
                            {t("Verlopen:")}{" "}
                            {compliance.expired
                              .map((type) => t(CREDENTIAL_TYPE_LABEL[type]))
                              .join(", ")}
                          </span>
                        )}
                        {compliance.inReview.length > 0 && (
                          <span className="text-warning">
                            {t("In beoordeling:")}{" "}
                            {compliance.inReview
                              .map((type) => t(CREDENTIAL_TYPE_LABEL[type]))
                              .join(", ")}
                          </span>
                        )}
                      </p>
                    )}

                    {/* Verval-tijdens-opdracht: een nu-geldig vereist certificaat dat vóór of kort na
                        de startdatum verloopt. Alleen tonen wanneer compliance niet al blokkeert (dan
                        staat er al een sterker "Mist/Verlopen"-signaal). */}
                    {compliance?.status !== "NON_COMPLIANT" &&
                      (() => {
                        const expiry = expiryByApp.get(app.id);
                        if (!expiry) return null;
                        const c = expiry.concerns[0];
                        if (!c) return null;
                        const label = t(CREDENTIAL_TYPE_LABEL[c.type]);
                        const extra = expiry.concerns.length - 1;
                        return (
                          <p
                            className={`flex items-start gap-1.5 text-xs ${
                              expiry.worstPhase === "before-start" ? "text-danger" : "text-warning"
                            }`}
                          >
                            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                            <span>
                              {c.phase === "before-start"
                                ? `${label} ${t("verloopt")} ${formatDateShortNl(c.expiresAt)} — ${t("vóór de startdatum, kandidaat is bij aanvang niet compliant.")}`
                                : `${label} ${t("verloopt")} ${formatDateShortNl(c.expiresAt)} — ${t("kort na de startdatum, compliance vervalt tijdens de inzet.")}`}
                              {extra > 0 && ` (${t("en nog")} ${extra})`}
                            </span>
                          </p>
                        );
                      })()}

                    {fitReasons.length > 0 && (
                      <details className="text-sm">
                        <summary className="focus-ring cursor-pointer text-muted-foreground">
                          {t("Waarom deze match?")}
                        </summary>
                        <ul className="mt-2 space-y-1.5">
                          {fitReasons.map((r, i) => (
                            <li key={i} className="flex items-start gap-2">
                              {r.kind === "positive" ? (
                                <Check
                                  className="mt-0.5 size-4 shrink-0 text-success"
                                  aria-hidden
                                />
                              ) : (
                                <TriangleAlert
                                  className="mt-0.5 size-4 shrink-0 text-warning"
                                  aria-hidden
                                />
                              )}
                              <span className={r.kind === "gap" ? "text-muted-foreground" : ""}>
                                {r.label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}

                    <p className="whitespace-pre-line text-sm">{app.motivation}</p>
                    <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                      {app.proposedRate != null &&
                        (() => {
                          const fit = classifyProposedRateFit(
                            app.proposedRate,
                            app.job.rateMin,
                            app.job.rateMax,
                          );
                          return (
                            <span className="inline-flex items-center gap-1.5">
                              {t("Tariefvoorstel")}: € {app.proposedRate}
                              {t("/uur")}
                              {fit !== "unknown" && (
                                <Badge variant={RATE_FIT_VARIANT[fit]}>
                                  {t(RATE_FIT_LABEL[fit])}
                                </Badge>
                              )}
                            </span>
                          );
                        })()}
                      {app.availability && (
                        <span>
                          {t("Aangegeven bij reactie")}: {app.availability}
                        </span>
                      )}
                      {(() => {
                        const windows = app.freelancer.availabilityWindows.map((w) => ({
                          ...w,
                          type: w.type as AvailabilityWindowType,
                        }));
                        const s = summarizeAvailability(windows);
                        const jobStart = app.job.startDate;
                        const fit = jobStart ? classifyStartFit(windows, jobStart) : "unknown";
                        // Niet inzetbaar op de startdatum? Toon wanneer de kandidaat wél kan, zodat de
                        // opdrachtgever de startdatum kan bijstellen i.p.v. een sterke match af te schrijven.
                        const nextFit =
                          fit === "blocked" || fit === "none"
                            ? nextFitAfterStart(windows, jobStart)
                            : null;
                        return (
                          <>
                            {s && (
                              <span>
                                {t("Agenda")}: {s}
                              </span>
                            )}
                            {jobStart && fit !== "unknown" && (
                              <span className="inline-flex items-center gap-1.5">
                                {t("Startdatum")} {formatDateShortNl(jobStart)}:
                                <Badge variant={START_FIT_VARIANT[fit]}>
                                  {t(START_FIT_LABEL[fit])}
                                </Badge>
                                {nextFit && <Badge variant="muted">{nextFitLabel(nextFit)}</Badge>}
                              </span>
                            )}
                            {(() => {
                              const proximity = classifyCandidateProximity({
                                jobWorkMode: app.job.workMode,
                                jobLocation: app.job.location,
                                candidateLocation: app.freelancer.location,
                              });
                              return proximity ? (
                                <span className="inline-flex items-center gap-1.5">
                                  {t("Reistijd")}:
                                  <Badge variant={PROXIMITY_VARIANT[proximity.level]}>
                                    {proximityLabel(proximity)}
                                  </Badge>
                                </span>
                              ) : null;
                            })()}
                          </>
                        );
                      })()}
                    </div>

                    {status === "WITHDRAWN" ? (
                      <p className="border-t border-border pt-3 text-sm text-muted-foreground">
                        {t("De ZZP'er heeft deze reactie ingetrokken.")}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                        {APPLICATION_TRANSITIONS[status].map((to) =>
                          to === "REJECTED" ? (
                            <RejectApplicationDialog
                              key={to}
                              action={changeApplicationStatus.bind(null, app.id, to)}
                              labels={{
                                trigger: t(ACTION_LABEL[to]),
                                title: t("Reactie afwijzen?"),
                                description: t(
                                  "De ZZP'er krijgt bericht dat de reactie is afgewezen. Geef optioneel een reden mee als constructieve feedback. Je kunt dit later nog terugdraaien naar de shortlist.",
                                ),
                                reasonLabel: t("Reden (optioneel, zichtbaar voor de ZZP'er)"),
                                noReason: t("Geen reden opgeven"),
                                confirm: t("Afwijzen"),
                                cancel: t("Annuleren"),
                              }}
                            />
                          ) : (
                            <form key={to} action={changeApplicationStatus.bind(null, app.id, to)}>
                              <Button
                                type="submit"
                                size="sm"
                                variant={to === "ACCEPTED" ? "primary" : "secondary"}
                              >
                                {t(ACTION_LABEL[to])}
                              </Button>
                            </form>
                          ),
                        )}
                      </div>
                    )}

                    <ApplicationNoteForm
                      appId={app.id}
                      defaultNote={app.note ?? ""}
                      labels={noteLabels}
                    />

                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      <form action={startConversationForApplication.bind(null, app.id)}>
                        <Button type="submit" variant="secondary" size="sm">
                          {t("Bericht sturen")}
                        </Button>
                      </form>
                      {app.collaboration && !reproposable && (
                        <Button asChild variant="secondary" size="sm">
                          <Link href={`/samenwerkingen/${app.collaboration.id}`}>
                            {t("Bekijk samenwerking")}
                          </Link>
                        </Button>
                      )}
                    </div>
                    {status === "ACCEPTED" && !collabBlocks && (
                      <ProposeCollaboration
                        applicationId={app.id}
                        reproposal={reproposable}
                        labels={proposeLabels}
                        defaultRate={proposalPrefill.rate}
                        defaultStartIso={proposalPrefill.startIso}
                        unavailableWindows={app.freelancer.availabilityWindows
                          .filter((w) => w.type === "UNAVAILABLE" && w.endDate >= now)
                          .map((w) => ({
                            startISO: w.startDate.toISOString().slice(0, 10),
                            endISO: w.endDate.toISOString().slice(0, 10),
                            startLabel: formatDateShortNl(w.startDate),
                            endLabel: formatDateShortNl(w.endDate),
                          }))}
                      />
                    )}
                  </>
                );
                return {
                  app,
                  status,
                  hasCollaboration: collabBlocks,
                  lead,
                  header,
                  body,
                };
              });

              const { active, accepted: acceptedItems } = partitionTriage(rendered);
              const activeItems: TriageItem[] = active.map((r) => ({
                id: r.app.id,
                lead: r.lead,
                header: r.header,
                body: r.body,
              }));

              return (
                <>
                  <BulkTriageBar labels={bulkLabels} />
                  {activeItems.length > 0 && (
                    <TriageList
                      items={activeItems}
                      defaultOpenId={openId}
                      expandLabel={t("Toon details")}
                      collapseLabel={t("Verberg details")}
                    />
                  )}
                  {acceptedItems.length > 0 && (
                    <AcceptedSection
                      count={acceptedItems.length}
                      title={t("Geaccepteerd — zie Samenwerkingen")}
                      hint={t("Deze kandidaten zijn geaccepteerd; de samenwerking loopt al.")}
                      // Deeplink ("Kies X") naar een al geaccepteerde kandidaat: open de sectie meteen,
                      // anders leidt het anker naar een verborgen rij.
                      defaultOpen={acceptedItems.some((r) => r.app.id === openId)}
                    >
                      {acceptedItems.map((r) => (
                        <Card key={r.app.id} id={`app-${r.app.id}`}>
                          <CardContent className="space-y-3">
                            {r.header}
                            <div className="space-y-3 border-t border-border pt-3">{r.body}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </AcceptedSection>
                  )}
                </>
              );
            })()
          )}

          {nextCursor && (
            <div className="flex justify-center">
              <Button asChild variant="secondary">
                <Link
                  href={buildKandidatenHref({
                    status: filterStatus,
                    job: jobScope,
                    cursor: nextCursor,
                  })}
                >
                  {t("Meer laden")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
