import { type Metadata } from "next";
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, ClipboardList, Banknote, ShieldCheck } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { computeCompliance } from "@/lib/matching";
import { complianceBlocksPlacement } from "@/lib/collaborations";
import { getSharedCredentialsForClient } from "@/lib/shared-credentials";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import {
  type CredentialType,
  type CredentialStatus,
  type NoShowVerdict,
  type CollaborationStatus,
  type ContractStatus,
} from "@/lib/enums";
import { assessCollaborationDba, jobDbaIndicators, DBA_LEVEL_LABEL } from "@/lib/dba-monitor";
import { assessRateThreshold, rechtsvermoedenHint } from "@/lib/rechtsvermoeden";
import { recommendModelAgreement } from "@/lib/model-agreement";
import { resolveAgreementType } from "@/lib/contract-agreement";
import { ModelAgreementCard } from "./model-agreement-card";
import { type PerformanceState, type InvoiceLifecycleState } from "@/lib/lifecycles";
import { parseOrtSegments } from "@/lib/ort";
import { ORT_SECTORS, ORT_SECTOR_LABEL, reviewBlindDays } from "@/lib/config";
import { buildChainSteps } from "@/lib/cascade/chain-steps";
import { collaborationStatusLine } from "@/lib/collaboration-status-line";
import { summarizeCollaborationRenewal } from "@/lib/collaboration-renewal";
import { summarizeCollaborationValue } from "@/lib/collaboration-value";
import { CollaborationValueSummary } from "@/components/collaborations/collaboration-value-summary";
import { collaborationLockReason, terminalLockNotice } from "@/lib/collaboration-lock";
import { RenewalNudge } from "@/components/collaborations/renewal-nudge";
import { isPerformanceNewerThanInvoice } from "@/lib/cascade/stage";
import { CascadeStepper } from "@/components/ui/cascade-stepper";
import { TurnBanner } from "@/components/ui/turn-banner";
import { OrtBreakdown } from "@/components/collaborations/ort-breakdown";
import { ReplacementPanel } from "@/components/collaborations/replacement-panel";
import { NoShowReportForm } from "@/components/collaborations/no-show-form";
import { ShiftHandoffForm } from "@/components/collaborations/shift-handoff-form";
import { ShiftHandoffCancelForm } from "@/components/collaborations/shift-handoff-cancel-form";
import { NO_SHOW_LIMIT } from "@/lib/no-show";
import { type ShiftHandoffStatus } from "@/lib/enums";
import { suggestedFreelancersForJob } from "@/lib/suggestions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  signContractAction,
  approvePerformanceAction,
  rejectPerformanceAction,
  editAndResubmitPerformanceAction,
  submitInvoiceAction,
  approveInvoiceAction,
  rejectInvoiceAction,
  confirmPaymentAction,
  creditInvoiceAction,
  openDisputeAction,
  resolveDisputeAction,
} from "./actions";
import { PerformanceForm } from "./performance-form";
import { performanceFormDefaults } from "@/lib/performance-form";
import { OrtProfileForm } from "./ort-profile-form";
import { WeekdaysForm } from "./weekdays-form";
import { ReviewForm } from "./review-form";
import { canLeaveReview, reviewWindowCloses, reviewWindowOpen } from "@/lib/reviews";
import { RatingStars } from "@/components/reviews/rating-stars";
import { ReviewList } from "@/components/reviews/review-list";
import { parseWeekdays, formatWeekdays } from "@/lib/weekdays";
import { formatDateShortNl } from "@/lib/format-date";
import { buildCollaborationTurnItems } from "@/lib/cascade/turn-items";

export const metadata: Metadata = { title: "Samenwerking · Handslag" };

const PERF_STATUS: Record<
  PerformanceState,
  { label: string; variant: "muted" | "warning" | "success" | "danger" }
> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SUBMITTED: { label: "Ter goedkeuring", variant: "warning" },
  APPROVED: { label: "Goedgekeurd", variant: "success" },
  REJECTED: { label: "Afgekeurd", variant: "danger" },
};

const INV_STATUS: Record<
  InvoiceLifecycleState,
  { label: string; variant: "muted" | "warning" | "success" | "danger" }
> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SUBMITTED: { label: "Ingediend", variant: "warning" },
  APPROVED: { label: "Goedgekeurd", variant: "success" },
  PAID: { label: "Betaald", variant: "success" },
  PROCESSED: { label: "Verwerkt", variant: "muted" },
  REJECTED: { label: "Afgekeurd", variant: "danger" },
  OVERDUE: { label: "Te laat", variant: "danger" },
  CREDITED: { label: "Gecrediteerd", variant: "danger" },
};

function fmt(d: Date | null) {
  return d ? formatDateShortNl(d) : null;
}

export default async function WerkprocesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireActor();

  const col = await prisma.collaboration.findUnique({
    where: { id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          dbaDirectSupervision: true,
          dbaEmbedded: true,
          dbaFixedSchedule: true,
          dbaNoSubstitution: true,
          dbaExclusive: true,
          dbaWeakEntrepreneurship: true,
          dbaDurationMonths: true,
          modelAgreementType: true,
          credentialRequirements: { where: { required: true }, select: { credentialType: true } },
        },
      },
      company: { select: { name: true, userId: true } },
      freelancer: {
        select: {
          userId: true,
          user: { select: { name: true } },
          credentials: { select: { type: true, status: true, expiresAt: true } },
        },
      },
      performances: { orderBy: { createdAt: "desc" } },
      invoices: { where: { lifecycleStatus: { not: null } }, orderBy: { createdAt: "desc" } },
      noShowReports: { orderBy: { occurredOn: "desc" }, take: 20 },
      shiftHandoffs: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          reason: true,
          createdAt: true,
          decisionNote: true,
          requestedByUserId: true,
        },
      },
      reviews: {
        select: {
          id: true,
          authorId: true,
          subjectId: true,
          rating: true,
          comment: true,
          status: true,
          createdAt: true,
          author: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!col) notFound();

  const isClient = col.company.userId === actor.id;
  const isFreelancer = col.freelancer.userId === actor.id;
  if (!isClient && !isFreelancer && actor.role !== "ADMIN") notFound();
  // Dispuut-freeze (§4): de server weigert elke cascade-actie tijdens een dispuut; de UI hoort
  // die acties dan ook niet aan te bieden (anders klikt men tegen een kale foutpagina aan).
  const frozen = Boolean(col.disputedAt);
  // Werkproces-slot: naast het dispuut weigert de server sinds #825 óók élke cascade-actie op een
  // terminale samenwerking (`assertCollaborationNotTerminal`). Bied die knoppen dan niet aan —
  // dezelfde "geen dode knoppen"-redenering, nu gegeneraliseerd naar CANCELLED/COMPLETED.
  const lockReason = collaborationLockReason({
    status: col.status as CollaborationStatus,
    disputedAt: col.disputedAt,
  });
  const actionsLocked = lockReason !== null;
  const terminalNotice = terminalLockNotice(lockReason);

  // Herplaatsing bij uitval: de opdrachtgever ziet bij een geannuleerde inzet direct passende,
  // beschikbare ZZP'ers (leeg zodra de dienst niet meer open staat — geen dode lijst).
  const replacementSuggestions =
    isClient && col.status === "CANCELLED" ? await suggestedFreelancersForJob(col.job.id) : [];

  // Inzetbaarheid-gate (ADR-0006, C-hybride): zolang de samenwerking nog niet gestart is, kan ze pas
  // ondertekend/actief worden als de ZZP'er aan de harde certificaateisen voldoet.
  const placementRequired = col.job.credentialRequirements.map((r) => r.credentialType as CredentialType); // prettier-ignore
  const placementCompliance =
    col.status === "PROPOSED" && placementRequired.length > 0
      ? computeCompliance(
          placementRequired,
          col.freelancer.credentials.map((c) => ({
            type: c.type as CredentialType,
            status: c.status as CredentialStatus,
            expiresAt: c.expiresAt,
          })),
        )
      : null;
  const placementBlocked = placementCompliance
    ? complianceBlocksPlacement(placementCompliance.status)
    : false;
  const placementMissing = placementCompliance
    ? [...placementCompliance.missing, ...placementCompliance.expired]
        .map((t) => CREDENTIAL_TYPE_LABEL[t])
        .join(", ")
    : "";

  const counterparty = isClient ? col.freelancer.user.name : col.company.name;
  const active = col.status === "ACTIVE";

  // Shift-overname (productbesluit 16-6-2026): de huidige ZZP'er kan een actieve inzet ter overname
  // aanbieden. Maximaal één OPEN aanvraag tegelijk; goedkeuring legt alléén de beslissing vast.
  const hasOpenHandoff = col.shiftHandoffs.some((h) => h.status === "OPEN");
  const canOfferHandoff = isFreelancer && active && !frozen && !hasOpenHandoff;
  const weekdays = parseWeekdays(col.weekdays);

  // Tweezijdige beoordeling (double-blind reveal): één per partij, alleen binnen het blinde venster.
  // Venster ankert op het afrondingsmoment (fallback createdAt voor legacy). Ná sluiting kan niemand
  // meer beoordelen — dat is de hendel tegen vergelding.
  const isParticipant = isClient || isFreelancer;
  const reviewWindowClosesAt = reviewWindowCloses(
    col.completedAt ?? col.createdAt,
    reviewBlindDays(),
  );
  const reviewWindowIsOpen = reviewWindowOpen(reviewWindowClosesAt, new Date());
  const myReview = col.reviews.find((r) => r.authorId === actor.id) ?? null;
  // De beoordeling óver mij is pas zichtbaar zodra ze PUBLISHED is (anders lek vóór de onthulling).
  const receivedReview =
    col.reviews.find((r) => r.subjectId === actor.id && r.status === "PUBLISHED") ?? null;
  const canReview = canLeaveReview({
    collaborationStatus: col.status,
    isParticipant,
    alreadyReviewed: myReview !== null,
    windowClosed: !reviewWindowIsOpen,
  });

  // Door de ZZP'er met de opdrachtgever gedeelde certificaten (metadata, niet het bestand). Alleen
  // de opdrachtgever-partij ziet ze; de helper dwingt dat server-side af.
  const sharedCredentials = isClient ? await getSharedCredentialsForClient(col.id, actor.id) : [];

  // DBA-monitoring (§6): rustig signaleren, mét disclaimer; geen juridisch oordeel (Besluit 2).
  const dba = assessCollaborationDba(
    { collaborationId: col.id, startDate: col.startDate, ...jobDbaIndicators(col.job) },
    new Date(),
  );

  // Modelovereenkomst (Wet DBA): aanbevolen vorm + de op samenwerking/opdracht vastgelegde keuze.
  const agreementRecommendation = recommendModelAgreement({
    directSupervision: col.job.dbaDirectSupervision,
    embedded: col.job.dbaEmbedded,
    fixedSchedule: col.job.dbaFixedSchedule,
    noSubstitution: col.job.dbaNoSubstitution,
    exclusive: col.job.dbaExclusive,
    weakEntrepreneurship: col.job.dbaWeakEntrepreneurship,
    durationMonths: col.job.dbaDurationMonths,
  });
  const agreementType = resolveAgreementType(
    col.agreementType,
    col.job.modelAgreementType,
    agreementRecommendation.type,
  );
  const myAgreementSignedAt = isFreelancer
    ? col.agreementFreelancerSignedAt
    : isClient
      ? col.agreementClientSignedAt
      : null;
  // Tekenen/wijzigen kan alleen zolang de samenwerking nog loopt; bij een afgeronde of geannuleerde
  // samenwerking is de overeenkomst historisch en read-only (geen actieve "Akkoord geven" meer).
  const agreementStillOpen = col.status === "PROPOSED" || col.status === "ACTIVE";

  // "Aan zet": wat moet déze rol nu doen? Pure kern in `buildCollaborationTurnItems` (unit-testbaar).
  // De `frozen`-poort zit in die functie: bij een open dispuut is de cascade bevroren, alle echte
  // actieknoppen hieronder zijn verborgen en de status-regel toont "werkproces bevroren" — de banner
  // mag zichzelf dan niet tegenspreken met een "keur de prestatie/factuur goed"-nudge (DOEL 1b).
  const todo = buildCollaborationTurnItems({
    status: col.status,
    frozen,
    isClient,
    isFreelancer,
    placementBlocked,
    placementMissing,
    submittedPerformances: col.performances.filter((p) => p.status === "SUBMITTED").length,
    draftInvoices: col.invoices.filter((i) => i.lifecycleStatus === "DRAFT").length,
    submittedInvoices: col.invoices.filter((i) => i.lifecycleStatus === "SUBMITTED").length,
    approvedInvoices: col.invoices.filter((i) => i.lifecycleStatus === "APPROVED").length,
    overdueInvoices: col.invoices.filter((i) => i.lifecycleStatus === "OVERDUE").length,
  });

  // Eén bron voor de cyclus-recency: is de nieuwste prestatie nieuwer dan de nieuwste factuur? Zo ja,
  // dan hoort die factuur bij een vorige cyclus. Zowel de status-line als de voortgang-stepper delen
  // deze berekening — anders zouden ze op een multi-cyclus-samenwerking uit elkaar lopen (drift).
  const performanceNewerThanInvoice = isPerformanceNewerThanInvoice(
    col.performances[0]?.createdAt ?? null,
    col.invoices[0]?.createdAt ?? null,
  );

  // Eén status-regel bovenaan: "wat wordt er nú van wie verwacht?" — hergebruikt de cascade-fase.
  // Zo opent het detail met handelingsperspectief in plaats van met het no-show-blok (dat is
  // verplaatst naar onderaan). Alleen voor de betrokken partijen.
  const statusLine = isParticipant
    ? collaborationStatusLine({
        viewer: isClient ? "CLIENT" : "FREELANCER",
        collaborationId: col.id,
        collaborationStatus: col.status as CollaborationStatus,
        contractStatus: col.contractStatus as ContractStatus,
        disputed: frozen,
        latestPerformanceStatus: (col.performances[0]?.status ?? null) as PerformanceState | null,
        latestInvoiceStatus: (col.invoices[0]?.lifecycleStatus ??
          null) as InvoiceLifecycleState | null,
        performanceNewerThanInvoice,
      })
    : null;

  // Vervolgsignaal: nadert (of passeerde) de einddatum van een lopende inzet? Wijs beide partijen
  // erop zodat ze tijdig een vervolg plannen. Alleen voor de betrokken partijen, niet bij een dispuut.
  const renewal =
    isParticipant && col.endDate
      ? summarizeCollaborationRenewal({
          status: col.status,
          endDate: col.endDate,
          disputed: frozen,
        })
      : null;

  // Waarde-/voortgangsoverzicht van deze samenwerking (geleverd/betaald/openstaand/concept). Alleen
  // voor de betrokken partijen en alleen wanneer er iets te tonen is (verse samenwerking blijft rustig).
  const valueSummary = isParticipant
    ? summarizeCollaborationValue(col.performances, col.invoices)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/samenwerkingen"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Samenwerkingen
        </Link>
      </div>

      <header className="space-y-1">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.13em] text-primary">
          Het samenspel
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="break-words font-display text-2xl font-semibold tracking-tight">
            {col.job.title}
          </h1>
          <Badge variant={active ? "success" : col.status === "COMPLETED" ? "muted" : "default"}>
            {col.status === "PROPOSED"
              ? "Voorgesteld"
              : col.status === "ACTIVE"
                ? "Actief"
                : col.status === "COMPLETED"
                  ? "Afgerond"
                  : "Geannuleerd"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Werkproces met {counterparty} · betaling verloopt rechtstreeks; het platform houdt alleen
          de status bij.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/samenwerkingen/${col.id}/dossier`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ShieldCheck className="size-4" aria-hidden /> Compliance-dossier
          </Link>
          <Link
            href={`/api/samenwerkingen/${col.id}/dba-dossier`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <FileText className="size-4" aria-hidden /> DBA-dossier (PDF)
          </Link>
        </div>
      </header>

      {/* Status-regel: wat wordt er nú van wie verwacht? Afgeleid uit de cascade-fase. Rustig als
          je niets hoeft te doen, nadrukkelijk als er actie nodig is. */}
      {statusLine && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            statusLine.youAreUp
              ? "border-primary/30 bg-primary/10 font-medium text-foreground"
              : "border-border bg-muted/40 text-muted-foreground"
          }`}
        >
          {statusLine.text}
        </div>
      )}

      {/* Vervolgsignaal: einddatum nadert/verstreken → plan een vervolg (rolafhankelijke actie). */}
      {renewal && renewal.attention && col.endDate && (
        <RenewalNudge
          phase={renewal.phase}
          daysRemaining={renewal.daysRemaining}
          endDate={col.endDate}
          viewer={isClient ? "CLIENT" : "FREELANCER"}
          jobId={col.job.id}
          counterparty={counterparty}
        />
      )}

      {/* Annuleringsregistratie: wie, wanneer, waarom — en of de 7-dagen-kostenregel geldt. */}
      {col.status === "CANCELLED" && col.cancellationReason && (
        <Card>
          <CardContent className="space-y-1.5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Annulering
              </p>
              {col.cancellationChargeable && <Badge variant="warning">Betalingsverplichting</Badge>}
            </div>
            <p className="text-sm">
              Geannuleerd
              {col.cancelledAt ? ` op ${formatDateShortNl(col.cancelledAt)}` : ""} door{" "}
              {col.cancelledById === col.company.userId ? "de opdrachtgever" : "de ZZP'er"}.
            </p>
            <p className="text-sm text-muted-foreground">Reden: {col.cancellationReason}</p>
            {col.cancellationChargeable && (
              <p className="text-xs text-muted-foreground">
                Geannuleerd binnen 7 dagen vóór de start — voor de opdrachtgever geldt een
                betalingsverplichting.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Herplaatsing bij uitval: bij een geannuleerde inzet stelt het platform de opdrachtgever
          direct passende, beschikbare ZZP'ers voor om de dienst opnieuw in te vullen. */}
      {isClient && col.status === "CANCELLED" && (
        <ReplacementPanel jobId={col.job.id} suggestions={replacementSuggestions} />
      )}

      {/* Shift-overname (productbesluit 16-6-2026): de huidige ZZP'er biedt een actieve inzet ter
          overname aan; een beheerder/franchiser beoordeelt. Goedkeuring legt alleen de beslissing
          vast — de herplaatsing (met eigen contract voor de overnemer) blijft een aparte stap. */}
      {(canOfferHandoff || (isFreelancer && col.shiftHandoffs.length > 0)) && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Overname
              </p>
              <p className="text-xs text-muted-foreground">
                Kun je deze inzet niet voortzetten? Bied ze ter overname aan. Een beheerder of
                bemiddelaar beoordeelt; de overname wordt pas effectief via de gebruikelijke
                herplaatsing, waarbij de overnemer een eigen contract krijgt.
              </p>
            </div>
            {col.shiftHandoffs.length > 0 && (
              <ul className="divide-y divide-border">
                {col.shiftHandoffs.map((h) => {
                  const status = h.status as ShiftHandoffStatus;
                  const badge =
                    status === "OPEN"
                      ? { label: "In beoordeling", variant: "warning" as const }
                      : status === "APPROVED"
                        ? { label: "Goedgekeurd", variant: "success" as const }
                        : status === "REJECTED"
                          ? { label: "Afgewezen", variant: "danger" as const }
                          : { label: "Ingetrokken", variant: "muted" as const };
                  return (
                    <li key={h.id} className="space-y-0.5 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          Aangevraagd op {formatDateShortNl(h.createdAt)}
                        </span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Reden: {h.reason}</p>
                      {status === "REJECTED" && h.decisionNote && (
                        <p className="text-sm text-muted-foreground">Afgewezen: {h.decisionNote}</p>
                      )}
                      {status === "OPEN" &&
                        isFreelancer &&
                        h.requestedByUserId === actor.id &&
                        !frozen && <ShiftHandoffCancelForm handoffId={h.id} />}
                    </li>
                  );
                })}
              </ul>
            )}
            {canOfferHandoff && <ShiftHandoffForm collaborationId={col.id} />}
          </CardContent>
        </Card>
      )}

      {/* Cascade-keten: visuele voortgang van contract t/m betaling */}
      {col.status !== "CANCELLED" &&
        (() => {
          const steps = buildChainSteps({ ...col, performanceNewerThanInvoice });
          return (
            <Card>
              <CardContent className="py-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Voortgang
                </p>
                <CascadeStepper steps={steps} />
              </CardContent>
            </Card>
          );
        })()}

      {todo.length > 0 && (
        <TurnBanner
          title={todo[0]}
          description={
            todo.length > 1 ? (
              <ul className="list-inside list-disc">
                {todo.slice(1).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            ) : undefined
          }
        />
      )}

      {/* Dispuut: bevroren cascade tot opgelost (§4 zijpad) */}
      {col.disputedAt ? (
        <Card>
          <CardContent className="space-y-2 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-danger">
                Dispuut open — samenwerking bevroren
              </span>
              <Badge variant="danger">Bevroren</Badge>
            </div>
            {col.disputeReason && (
              <p className="text-sm text-muted-foreground">{col.disputeReason}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Het platform bemiddelt. Acties zijn geblokkeerd tot het dispuut is opgelost.
            </p>
            {actor.role === "ADMIN" && (
              <form action={resolveDisputeAction.bind(null, col.id)}>
                <PendingSubmitButton size="sm">Dispuut oplossen</PendingSubmitButton>
              </form>
            )}
          </CardContent>
        </Card>
      ) : (
        active && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Probleem melden / dispuut openen
            </summary>
            <form
              action={openDisputeAction.bind(null, col.id)}
              className="mt-2 flex items-center gap-2"
            >
              <input
                name="reason"
                required
                aria-label="Toelichting bij het dispuut"
                placeholder="Toelichting"
                className="focus-ring flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
              />
              <PendingSubmitButton size="sm" variant="secondary">
                Dispuut openen
              </PendingSubmitButton>
            </form>
          </details>
        )
      )}

      {/* DBA-signalering — rustig, niet-alarmerend, altijd met disclaimer */}
      {active && dba.signals.length > 0 && (
        <Card>
          <CardContent className="space-y-2 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Aandachtspunt inzet</span>
              <Badge variant={dba.level === "HOOG" ? "warning" : "muted"}>
                {DBA_LEVEL_LABEL[dba.level]}
              </Badge>
            </div>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {dba.signals.map((s) => (
                <li key={s.key}>{s.message}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{dba.disclaimer}</p>
          </CardContent>
        </Card>
      )}

      {/* Rechtsvermoeden werknemerschap — tarief-drempelwaarschuwing (rustig, niet-blokkerend) */}
      {(active || col.status === "PROPOSED") &&
        (() => {
          // col.rate is in EUR (Int), convert to cents for the threshold check.
          const rateCents = col.rate != null ? col.rate * 100 : null;
          const rateThreshold = assessRateThreshold(rateCents);
          return rateThreshold.belowThreshold ? (
            <Card>
              <CardContent className="space-y-1.5 py-4">
                <p className="text-sm font-medium text-warning">Rechtsvermoeden werknemerschap</p>
                <p className="text-xs text-muted-foreground">{rechtsvermoedenHint()}</p>
              </CardContent>
            </Card>
          ) : null;
        })()}

      {/* Contract — kan pas ondertekend/actief worden als de ZZP'er aan de certificaateisen voldoet. */}
      {col.status === "PROPOSED" && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Contract
              </p>
              <p className="text-sm text-muted-foreground">
                {placementBlocked
                  ? `Deze samenwerking kan niet starten: een vereist certificaat ontbreekt of is verlopen (${placementMissing}).`
                  : "Onderteken om uren of opleveringen te kunnen vastleggen."}
              </p>
            </div>
            {placementBlocked ? (
              isFreelancer ? (
                <Button asChild variant="secondary" size="sm">
                  <Link href="/certificaten">Naar mijn certificaten</Link>
                </Button>
              ) : null
            ) : (
              <form action={signContractAction.bind(null, col.id)}>
                <PendingSubmitButton size="sm">Contract ondertekenen</PendingSubmitButton>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modelovereenkomst (Wet DBA) — genereerbare overeenkomst + digitaal akkoord per partij. */}
      {col.status !== "CANCELLED" && (isClient || isFreelancer || actor.role === "ADMIN") && (
        <ModelAgreementCard
          collaborationId={col.id}
          agreementType={agreementType}
          recommendation={agreementRecommendation}
          rows={[
            {
              role: "ZZP'er",
              name: col.freelancer.user.name ?? "Opdrachtnemer",
              signedAt: col.agreementFreelancerSignedAt,
            },
            {
              role: "Opdrachtgever",
              name: col.company.name,
              signedAt: col.agreementClientSignedAt,
            },
          ]}
          canSign={(isFreelancer || isClient) && !myAgreementSignedAt && agreementStillOpen}
          canChooseType={
            (isClient || actor.role === "ADMIN") &&
            agreementStillOpen &&
            !col.agreementFreelancerSignedAt &&
            !col.agreementClientSignedAt
          }
        />
      )}

      {/* Gedeelde certificaten — de ZZP'er geeft zelf vrij welke geverifieerde certificaten de
          opdrachtgever mag inzien (alleen de gegevens, niet het bestand). */}
      {isClient && sharedCredentials.length > 0 && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Gedeelde certificaten
              </p>
              <p className="text-xs text-muted-foreground">
                {counterparty} heeft deze geverifieerde certificaten met je gedeeld.
              </p>
            </div>
            <ul className="divide-y divide-border">
              {sharedCredentials.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{c.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {CREDENTIAL_TYPE_LABEL[c.type] ?? c.type}
                      {c.issuer && ` · ${c.issuer}`}
                      {c.verifiedAt && ` · geverifieerd ${formatDateShortNl(c.verifiedAt)}`}
                    </span>
                  </span>
                  <Badge variant="success">Geverifieerd</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ORT-sectorprofiel — bepaalt de onregelmatigheidstoeslagen (zorg). Opdrachtgever/admin stelt in. */}
      {(active || col.status === "PROPOSED") &&
        (isClient || actor.role === "ADMIN" ? (
          <Card>
            <CardContent className="space-y-2 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Toeslagen voor onregelmatige uren (ORT)
                </p>
                <p className="text-xs text-muted-foreground">
                  Avond-, nacht-, weekend- en feestdaguren tellen zwaarder mee op de urenstaat. Kies
                  de CAO-sector van jouw organisatie, of &ldquo;Maatwerk&rdquo; met eigen
                  percentages. Kies je niets, dan rekent de urenstaat zonder toeslagen.
                </p>
              </div>
              <OrtProfileForm
                collaborationId={col.id}
                ortProfile={col.ortProfile}
                ortCustomRates={col.ortCustomRates}
              />
              <p className="text-xs text-muted-foreground">
                De percentages zijn richtwaarden per CAO-categorie; controleer ze met de geldende
                CAO van de opdrachtgever.
              </p>
            </CardContent>
          </Card>
        ) : (
          col.ortProfile && (
            <p className="text-xs text-muted-foreground">
              ORT-profiel:{" "}
              <span className="font-medium text-foreground">
                {ORT_SECTOR_LABEL[col.ortProfile as (typeof ORT_SECTORS)[number]] ?? col.ortProfile}
              </span>
            </p>
          )
        ))}

      {/* Weekrooster (ADR-0004) — welke dagen er bij deze opdrachtgever wordt gewerkt. Beide
          partijen leggen het vast; bij een afgeronde samenwerking alleen tonen. */}
      {active || col.status === "PROPOSED" ? (
        <Card>
          <CardContent className="space-y-2 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Weekrooster
              </p>
              <p className="text-xs text-muted-foreground">
                Leg vast op welke dagen er bij {counterparty} wordt gewerkt. Dit verschijnt in het
                weekoverzicht; geen selectie = niet vastgelegd.
              </p>
            </div>
            <WeekdaysForm collaborationId={col.id} weekdays={weekdays} />
          </CardContent>
        </Card>
      ) : (
        weekdays.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Weekrooster:{" "}
            <span className="font-medium text-foreground">{formatWeekdays(weekdays)}</span>
          </p>
        )
      )}

      {/* Waarde-overzicht: geleverd/betaald/openstaand/concept in één blik, vlak boven de detailsecties. */}
      {valueSummary && <CollaborationValueSummary summary={valueSummary} />}

      {/* Prestaties: urenstaat / oplevering. Anker "uren" — de deep-link vanaf de Urenstaten-pagina
          ("Urenstaat indienen") landt hier op het indienformulier. */}
      <section id="uren" className="scroll-mt-20 space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Uren & opleveringen
          </h2>
        </div>

        {terminalNotice && (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {terminalNotice}
          </p>
        )}

        {active && isFreelancer && !frozen && (
          <PerformanceForm
            collaborationId={col.id}
            rateCents={col.rate != null ? col.rate * 100 : null}
            ortProfile={col.ortProfile}
            ortCustomRates={col.ortCustomRates}
          />
        )}

        {col.performances.length === 0 ? (
          <Card>
            <EmptyState
              icon={ClipboardList}
              title="Nog geen uren of opleveringen"
              description="De ZZP'er dient uren of een oplevering in zodra de opdracht loopt."
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {col.performances.map((p) => {
              const st = PERF_STATUS[p.status as PerformanceState];
              return (
                <Card key={p.id}>
                  <CardContent className="space-y-2 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="min-w-0 truncate font-medium">
                            {p.type === "HOURS" ? "Urenstaat" : p.milestoneTitle || "Oplevering"}
                          </span>
                          <Badge variant={st.variant} className="shrink-0">
                            {st.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {p.type === "HOURS"
                            ? `${p.hours ?? 0} uur${p.rateCents ? ` × ${formatEuro(p.rateCents)}` : ""}${p.periodStart && p.periodEnd ? ` · ${fmt(p.periodStart)} t/m ${fmt(p.periodEnd)}` : ""}`
                            : p.amountCents != null
                              ? formatEuro(p.amountCents)
                              : ""}
                          {p.description ? ` · ${p.description}` : ""}
                        </p>
                        {p.status === "REJECTED" && p.rejectionReason && (
                          <p className="text-xs text-danger">Afgekeurd: {p.rejectionReason}</p>
                        )}
                        {p.type === "HOURS" &&
                          p.rateCents &&
                          (() => {
                            const segs = parseOrtSegments(p.ortSegments);
                            return segs.length > 0 ? (
                              <OrtBreakdown
                                ortSegments={segs}
                                rateCents={p.rateCents}
                                ortProfile={col.ortProfile}
                                ortCustomRates={col.ortCustomRates}
                              />
                            ) : null;
                          })()}
                      </div>
                    </div>
                    {isFreelancer && p.status === "REJECTED" && !actionsLocked && (
                      <details className="border-t border-border pt-2">
                        <summary className="focus-ring cursor-pointer text-sm font-medium text-foreground hover:text-foreground">
                          Corrigeer en dien opnieuw in
                        </summary>
                        <div className="mt-3">
                          <PerformanceForm
                            collaborationId={col.id}
                            rateCents={col.rate != null ? col.rate * 100 : null}
                            ortProfile={col.ortProfile}
                            ortCustomRates={col.ortCustomRates}
                            action={editAndResubmitPerformanceAction.bind(null, p.id, col.id)}
                            submitLabel="Corrigeer en dien opnieuw in"
                            defaults={performanceFormDefaults(p)}
                          />
                        </div>
                      </details>
                    )}
                    {isClient && p.status === "SUBMITTED" && !actionsLocked && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                        <form action={approvePerformanceAction.bind(null, p.id, col.id)}>
                          <PendingSubmitButton size="sm">Goedkeuren</PendingSubmitButton>
                        </form>
                        <form
                          action={rejectPerformanceAction.bind(null, p.id, col.id)}
                          className="flex items-center gap-2"
                        >
                          <input
                            name="reason"
                            required
                            aria-label="Reden van afkeuring"
                            placeholder="Reden afkeuren"
                            className="focus-ring rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                          />
                          <PendingSubmitButton size="sm" variant="destructive">
                            Afkeuren
                          </PendingSubmitButton>
                        </form>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Facturen (afgeleid uit goedgekeurde prestaties) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Facturen
          </h2>
        </div>

        {col.invoices.length === 0 ? (
          <Card>
            <EmptyState
              icon={FileText}
              title="Nog geen facturen"
              description="Na goedkeuring van een prestatie ontstaat automatisch een concept-factuur."
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {col.invoices.map((inv) => {
              const st = INV_STATUS[(inv.lifecycleStatus ?? "DRAFT") as InvoiceLifecycleState];
              return (
                <Card key={inv.id}>
                  <CardContent className="space-y-2 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {inv.partyInvoiceNumber ?? "Concept-factuur"}
                          </span>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatEuro(inv.subtotalCents ?? 0)} excl. +{" "}
                          {formatEuro(inv.vatCents ?? 0)} btw = {formatEuro(inv.totalCents)} incl.
                          {fmt(inv.dueAt) ? ` · vervalt ${fmt(inv.dueAt)}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                      {isFreelancer &&
                        !actionsLocked &&
                        (inv.lifecycleStatus === "DRAFT" || inv.lifecycleStatus === "REJECTED") && (
                          <form action={submitInvoiceAction.bind(null, inv.id, col.id)}>
                            <PendingSubmitButton size="sm">
                              {inv.lifecycleStatus === "REJECTED"
                                ? "Corrigeer en dien opnieuw in"
                                : "Indienen"}
                            </PendingSubmitButton>
                          </form>
                        )}
                      {isClient && inv.lifecycleStatus === "SUBMITTED" && !actionsLocked && (
                        <>
                          <form action={approveInvoiceAction.bind(null, inv.id, col.id)}>
                            <PendingSubmitButton size="sm">Goedkeuren</PendingSubmitButton>
                          </form>
                          <form
                            action={rejectInvoiceAction.bind(null, inv.id, col.id)}
                            className="flex items-center gap-2"
                          >
                            <input
                              name="reason"
                              required
                              placeholder="Reden afkeuren"
                              className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                            />
                            <PendingSubmitButton size="sm" variant="destructive">
                              Afkeuren
                            </PendingSubmitButton>
                          </form>
                        </>
                      )}
                      {(isFreelancer || isClient) &&
                        (inv.lifecycleStatus === "APPROVED" || inv.lifecycleStatus === "OVERDUE") &&
                        !actionsLocked && (
                          <form
                            action={confirmPaymentAction.bind(null, inv.id, col.id)}
                            className="flex items-center gap-2"
                          >
                            <Banknote className="size-4 text-muted-foreground" aria-hidden />
                            <PendingSubmitButton size="sm">
                              {/* De opdrachtgever is de betaler — "ontvangen" zou voor hem het
                                tegenovergestelde beweren van wat hij doet. Rol-afhankelijk label. */}
                              {isClient ? "Markeer als betaald" : "Betaling ontvangen"}
                            </PendingSubmitButton>
                          </form>
                        )}
                      {(inv.lifecycleStatus === "PAID" || inv.lifecycleStatus === "PROCESSED") && (
                        <span className="text-xs text-muted-foreground">
                          Betaling geregistreerd.
                        </span>
                      )}
                      {isFreelancer &&
                        !frozen &&
                        ["APPROVED", "PAID", "PROCESSED", "OVERDUE"].includes(
                          inv.lifecycleStatus ?? "",
                        ) && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              Factuur crediteren
                            </summary>
                            <form
                              action={creditInvoiceAction.bind(null, inv.id, col.id)}
                              className="mt-2 flex items-center gap-2"
                            >
                              <input
                                name="reason"
                                required
                                aria-label="Reden voor creditering"
                                placeholder="Reden creditering"
                                className="focus-ring flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                              />
                              <PendingSubmitButton size="sm" variant="secondary">
                                Crediteren
                              </PendingSubmitButton>
                            </form>
                          </details>
                        )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* No-show-registratie (productbesluit 12-6-2026): naar onderen verplaatst — het is een
          uitzondering, geen openingsscherm. De opdrachtgever meldt mét reden; de ZZP'er ziet elke
          melding terug inclusief het admin-oordeel. Alleen ongegronde no-shows tellen mee richting
          uitschrijving (grens: NO_SHOW_LIMIT). */}
      {(col.noShowReports.length > 0 ||
        (isClient && (col.status === "ACTIVE" || col.status === "CANCELLED"))) && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                No-shows
              </p>
              <p className="text-xs text-muted-foreground">
                Een beheerder beoordeelt elke melding; alleen ongegronde no-shows tellen mee — bij{" "}
                {NO_SHOW_LIMIT} volgt uitschrijving van het platform.
              </p>
            </div>
            {col.noShowReports.length > 0 && (
              <ul className="divide-y divide-border">
                {col.noShowReports.map((r) => {
                  const verdict = r.verdict as NoShowVerdict;
                  return (
                    <li key={r.id} className="space-y-0.5 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          Dienst van {formatDateShortNl(r.occurredOn)}
                        </span>
                        <Badge
                          variant={
                            verdict === "PENDING"
                              ? "warning"
                              : verdict === "JUSTIFIED"
                                ? "success"
                                : "danger"
                          }
                        >
                          {verdict === "PENDING"
                            ? "In beoordeling"
                            : verdict === "JUSTIFIED"
                              ? "Gegrond"
                              : "Ongegrond"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Reden: {r.reason}</p>
                    </li>
                  );
                })}
              </ul>
            )}
            {isClient && (col.status === "ACTIVE" || col.status === "CANCELLED") && (
              <NoShowReportForm collaborationId={col.id} />
            )}
          </CardContent>
        </Card>
      )}

      {col.status === "COMPLETED" && (
        <section className="space-y-3 rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-medium">Beoordeling</h2>
          {isParticipant ? (
            <div className="space-y-4">
              {canReview ? (
                <div className="space-y-2">
                  <ReviewForm collaborationId={col.id} subjectLabel={counterparty} />
                  <p className="text-xs text-muted-foreground">
                    Beoordelingen zijn blind: jouw oordeel wordt pas zichtbaar zodra de ander óók
                    beoordeelt of het venster sluit op {formatDateShortNl(reviewWindowClosesAt)}. Na
                    plaatsen kun je het niet meer wijzigen.
                  </p>
                </div>
              ) : myReview ? (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Jouw beoordeling</p>
                  <RatingStars average={myReview.rating} size="md" showValue />
                  {myReview.comment && (
                    <p className="text-sm text-muted-foreground">{myReview.comment}</p>
                  )}
                  {myReview.status !== "PUBLISHED" && (
                    <p className="text-xs text-muted-foreground">
                      Nog niet zichtbaar voor de ander — wordt onthuld zodra jullie beiden hebben
                      beoordeeld of het venster sluit op {formatDateShortNl(reviewWindowClosesAt)}.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Het beoordelingsvenster is gesloten op {formatDateShortNl(reviewWindowClosesAt)}.
                </p>
              )}
              {receivedReview ? (
                <div className="space-y-1 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    Beoordeling van {receivedReview.author.name}
                  </p>
                  <RatingStars average={receivedReview.rating} size="md" showValue />
                  {receivedReview.comment && (
                    <p className="text-sm text-muted-foreground">{receivedReview.comment}</p>
                  )}
                </div>
              ) : reviewWindowIsOpen ? (
                <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                  De beoordelingen worden tegelijk zichtbaar zodra jullie beiden hebben beoordeeld
                  of het venster sluit op {formatDateShortNl(reviewWindowClosesAt)}.
                </p>
              ) : (
                <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                  De andere partij heeft niet beoordeeld.
                </p>
              )}
            </div>
          ) : (
            // Admin-moderatieweergave: ziet beide richtingen, óók nog-blinde (PENDING_REVEAL)
            // beoordelingen — gelabeld als "nog niet zichtbaar". Meekijken mag; tippen niet.
            <ReviewList
              reviews={col.reviews.map((r) => ({
                id: r.id,
                authorName: r.author.name,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
                pending: r.status !== "PUBLISHED",
              }))}
            />
          )}
        </section>
      )}
    </div>
  );
}
