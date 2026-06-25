import { type Metadata } from "next";
import Link from "next/link";
import { Users, Check, TriangleAlert, GitCompare, Clock } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { getTranslator } from "@/lib/i18n/server";
import { prisma } from "@/lib/db";
import { APPLICATION_TRANSITIONS } from "@/lib/applications";
import {
  KANDIDATEN_FILTER_LABELS,
  countApplicationsByStatus,
  filterApplicationsByStatus,
  normalizeKandidatenFilter,
} from "@/lib/kandidaten-filter";
import { computeCompliance, scoreJobForFreelancer, topPositiveReason } from "@/lib/matching";
import {
  summarizeCandidateDecision,
  summarizeCandidatesAwaitingDecision,
} from "@/lib/candidate-decision";
import { RATE_FIT_LABEL, RATE_FIT_VARIANT, classifyProposedRateFit } from "@/lib/rate-fit";
import { VerificationMarks } from "@/components/credentials/verification-marks";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { summarizeAvailability } from "@/lib/availability";
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
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ApplicationStatusBadge } from "@/components/applications/application-status-badge";
import { ComplianceBadge } from "@/components/compliance-badge";
import { DeliveryQualityBlock } from "@/components/freelancer/delivery-quality-block";
import { getDeliveryQualityForProfiles } from "@/lib/data/freelancer-delivery-quality";
import { changeApplicationStatus } from "./actions";
import { ApplicationNoteForm } from "./application-note-form";
import { BulkTriageBar } from "./bulk-triage-bar";
import { startConversationForApplication } from "@/app/(protected)/berichten/actions";
import { ProposeCollaboration } from "./propose-collaboration";

export const metadata: Metadata = { title: "Kandidaten · ZZP Platform" };

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
  const filterStatus = normalizeKandidatenFilter((await searchParams).status);

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

  const applications = await prisma.application.findMany({
    where: { job: { company: { userId: actor.id } } },
    // Beste match eerst; de werkstroom-volgorde (NEW vóór afgehandelde) zetten we in-memory, want
    // `status` is een string-kolom — DB-`asc` zou lexicografisch sorteren (ACCEPTED bovenaan).
    orderBy: { matchScore: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          rateMin: true,
          rateMax: true,
          workMode: true,
          location: true,
          skills: { select: { skillId: true, required: true } },
          credentialRequirements: { select: { credentialType: true, required: true } },
        },
      },
      freelancer: {
        select: {
          id: true,
          headline: true,
          visibility: true,
          hourlyRate: true,
          workMode: true,
          location: true,
          maxTravelMinutes: true,
          availability: true,
          user: { select: { name: true, identityVerifiedAt: true } },
          skills: { select: { skillId: true } },
          availabilityWindows: { select: { startDate: true, endDate: true, type: true } },
          credentials: { select: { type: true, status: true, expiresAt: true } },
        },
      },
      collaboration: { select: { id: true } },
    },
  });

  // Leverbetrouwbaarheid per kandidaat: spiegel van de opdrachtgever-signalen die de ZZP'er op de
  // opdracht ziet. Eén gebatchte fetch over alle reagerende profielen (geen N+1).
  const deliveryByProfile = await getDeliveryQualityForProfiles(
    applications.map((a) => a.freelancer.id),
  );

  // Werkstroom-volgorde: NEW → VIEWED → SHORTLIST → REJECTED → ACCEPTED (actie-vragend eerst,
  // afgehandeld onderaan). Stabiel, dus binnen één status blijft de match-volgorde (hoogste eerst) staan.
  applications.sort(
    (a, b) =>
      APPLICATION_STATUSES.indexOf(a.status as ApplicationStatus) -
      APPLICATION_STATUSES.indexOf(b.status as ApplicationStatus),
  );

  // "Beste match": hoogste matchscore onder de nog niet afgewezen reacties — bovenaan etaleren met de
  // belangrijkste reden, want geen enkele concurrent toont leesbare match-redenen aan de beslisser.
  const best =
    [...applications]
      .filter((a) => a.status !== "REJECTED" && a.status !== "WITHDRAWN" && a.matchScore != null)
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))[0] ?? null;
  const bestReason = best
    ? topPositiveReason(scoreJobForFreelancer(best.job, best.freelancer).reasons)
    : null;

  // Statusfilter (pill-tabs met tellingen) — zelfde idioom als /prestaties en /diensten.
  const counts = countApplicationsByStatus(applications);
  const visible = filterApplicationsByStatus(applications, filterStatus);

  // Vergelijk-instap: per opdracht met ≥2 actieve reacties (nog in de race) een link naar de
  // side-by-side vergelijking. Afgewezen/ingetrokken reacties tellen niet mee. Geen extra query —
  // afgeleid uit de reeds opgehaalde lijst.
  const comparableByJob = new Map<string, { title: string; count: number }>();
  for (const a of applications) {
    if (a.status === "REJECTED" || a.status === "WITHDRAWN") continue;
    const entry = comparableByJob.get(a.job.id) ?? { title: a.job.title, count: 0 };
    entry.count += 1;
    comparableByJob.set(a.job.id, entry);
  }
  const comparableJobs = [...comparableByJob.entries()]
    .filter(([, v]) => v.count >= 2)
    .map(([id, v]) => ({ id, title: v.title, count: v.count }));

  // Beslis-nu-signaal: hoeveel nog-onbesliste reacties liggen langer dan past bij hun matchkwaliteit?
  // Sterke kandidaten raken elders aan de slag als je te lang wacht — afgeleid uit de reeds opgehaalde
  // lijst (geen extra query). Eén `now` zodat strip- en kaart-signaal consistent zijn.
  const now = new Date();
  const decisionSummary = summarizeCandidatesAwaitingDecision(
    applications.map((a) => ({
      status: a.status,
      matchScore: a.matchScore,
      createdAt: a.createdAt,
      hasCollaboration: !!a.collaboration,
    })),
    now,
  );

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title={t("Kandidaten")}
        description={t("Reacties op je opdrachten, met match en compliance.")}
      />

      {applications.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={t("Nog geen reacties")}
            description={t("Zodra ZZP'ers reageren op je opdrachten, zie je ze hier.")}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Statusfilter */}
          <nav className="flex flex-wrap gap-2 text-sm" aria-label={t("Filter op status")}>
            {Object.entries(KANDIDATEN_FILTER_LABELS).map(([val, label]) => {
              const active = val === filterStatus;
              const href = val ? `/kandidaten?status=${val}` : "/kandidaten";
              const count = val === "" ? applications.length : counts[val as ApplicationStatus];
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
            <Card className="border-warning/40 bg-warning/5">
              <CardContent className="flex items-start gap-2.5 py-3 text-sm">
                <Clock className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
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
          {visible.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("Geen reacties met deze status")}
              description={t("Er zijn geen reacties in deze categorie. Pas het filter aan.")}
            />
          ) : (
            <>
              <BulkTriageBar labels={bulkLabels} />
              {visible.map((app) => {
                const status = app.status as ApplicationStatus;
                // Live compliance: actuele certificaatstatus, niet de bevroren snapshot van het
                // reactiemoment (een VOG kan intussen verlopen zijn). De volledige uitsplitsing
                // (missing/expired/inReview) maakt voor de opdrachtgever concreet WAT er ontbreekt.
                const requiredTypes = app.job.credentialRequirements
                  .filter((r) => r.required)
                  .map((r) => r.credentialType as CredentialType);
                const compliance =
                  requiredTypes.length > 0
                    ? computeCompliance(
                        requiredTypes,
                        app.freelancer.credentials.map((c) => ({
                          type: c.type as CredentialType,
                          status: c.status as CredentialStatus,
                          expiresAt: c.expiresAt,
                        })),
                      )
                    : null;
                const isPublic = (app.freelancer.visibility as Visibility) === "PUBLIC";
                const nowMs = Date.now();
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
                // de matchkwaliteit. Zwijgt voor verse of besloten reacties.
                const decision = summarizeCandidateDecision(
                  {
                    status: app.status,
                    matchScore: app.matchScore,
                    createdAt: app.createdAt,
                    hasCollaboration: !!app.collaboration,
                  },
                  now,
                );
                return (
                  <Card key={app.id}>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            {!app.collaboration && (
                              <input
                                type="checkbox"
                                name="appId"
                                value={app.id}
                                form="kandidaten-bulk"
                                aria-label={`${t("Selecteer")} ${app.freelancer.user.name}`}
                                className="focus-ring size-4 shrink-0 rounded border-input accent-accent"
                              />
                            )}
                            {isPublic ? (
                              <Link
                                href={`/zzp/${app.freelancer.id}`}
                                target="_blank"
                                className="min-w-0 truncate font-medium underline-offset-4 hover:underline"
                              >
                                {app.freelancer.user.name}
                              </Link>
                            ) : (
                              <span className="min-w-0 truncate font-medium">
                                {app.freelancer.user.name}
                              </span>
                            )}
                            <span className="flex shrink-0 items-center gap-2">
                              <ApplicationStatusBadge status={status} />
                              <TrustBadge level={trust.level} />
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {app.freelancer.headline ?? "—"} · {t("op")}{" "}
                            <Link
                              href={`/opdrachten/${app.job.id}`}
                              className="underline-offset-4 hover:underline"
                            >
                              {app.job.title}
                            </Link>
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

                      <VerificationMarks credentials={app.freelancer.credentials} />

                      {decision?.attention && (
                        <p
                          className={`flex items-center gap-1.5 text-xs ${
                            decision.urgency === "high" ? "text-warning" : "text-muted-foreground"
                          }`}
                        >
                          <Clock className="size-3.5 shrink-0" aria-hidden />
                          {decision.tier === "strong"
                            ? `${t("Sterke match — wacht al")} ${decision.daysWaiting} ${t("dagen op je beslissing. Beslis nu voordat hij elders aan de slag gaat.")}`
                            : `${t("Wacht al")} ${decision.daysWaiting} ${t("dagen op je beslissing.")}`}
                        </p>
                      )}

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
                          const s = summarizeAvailability(
                            app.freelancer.availabilityWindows.map((w) => ({
                              ...w,
                              type: w.type as AvailabilityWindowType,
                            })),
                          );
                          return s ? (
                            <span>
                              {t("Agenda")}: {s}
                            </span>
                          ) : null;
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
                              <ConfirmButton
                                key={to}
                                action={changeApplicationStatus.bind(null, app.id, to)}
                                triggerVariant="destructive"
                                size="sm"
                                title={t("Reactie afwijzen?")}
                                description={t(
                                  "De ZZP'er krijgt bericht dat de reactie is afgewezen. Je kunt dit later nog terugdraaien naar de shortlist.",
                                )}
                                confirmLabel={t("Afwijzen")}
                              >
                                {t(ACTION_LABEL[to])}
                              </ConfirmButton>
                            ) : (
                              <form
                                key={to}
                                action={changeApplicationStatus.bind(null, app.id, to)}
                              >
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
                        {app.collaboration && (
                          <Button asChild variant="secondary" size="sm">
                            <Link href={`/samenwerkingen/${app.collaboration.id}`}>
                              {t("Bekijk samenwerking")}
                            </Link>
                          </Button>
                        )}
                      </div>
                      {status === "ACCEPTED" && !app.collaboration && (
                        <ProposeCollaboration applicationId={app.id} labels={proposeLabels} />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
