import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
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
import { DbaRiskBadge } from "@/components/dba/dba-risk-badge";
import { dbaAdvice, type DbaReason, type DbaRisk } from "@/lib/dba";
import { assessRateThreshold, rechtsvermoedenHint } from "@/lib/rechtsvermoeden";
import { estimateTravelMinutesWithRouting } from "@/lib/services/routing";
import {
  recommendModelAgreement,
  MODEL_AGREEMENT_LABELS,
  type ModelAgreementType,
} from "@/lib/model-agreement";
import { createApplication } from "../actions";
import { JobStatusButton } from "./job-status-button";
import { startConversationWithFreelancer } from "@/app/(protected)/berichten/actions";
import { ApplicationForm } from "./application-form";
import { formatDateShortNl } from "@/lib/format-date";
import { getPaymentBehaviorForCompany } from "@/lib/data/payment-behavior";
import { PaymentBehaviorBlock } from "@/components/jobs/payment-behavior-block";
import { getClientReliabilityForCompany } from "@/lib/data/client-reliability";
import { ClientReliabilityBlock } from "@/components/jobs/client-reliability-block";
import { getClientResponsivenessForCompany } from "@/lib/data/client-responsiveness";
import { ClientResponsivenessBlock } from "@/components/jobs/client-responsiveness-block";

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
  if (actor.role === "FREELANCER") {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId: actor.id },
      include: {
        skills: { select: { skillId: true } },
        credentials: { select: { type: true, status: true, expiresAt: true } },
      },
    });
    if (profile) {
      myApplication = await prisma.application.findUnique({
        where: { jobId_freelancerId: { jobId: job.id, freelancerId: profile.id } },
        select: { status: true, matchScore: true, complianceSnapshot: true },
      });
      if (!myApplication && status === "PUBLISHED") {
        const routedTravelMinutesToJob =
          profile.maxTravelMinutes != null &&
          profile.maxTravelMinutes > 0 &&
          profile.workMode !== "REMOTE" &&
          job.workMode !== "REMOTE"
            ? await estimateTravelMinutesWithRouting(profile.location, job.location)
            : null;
        const match = scoreJobForFreelancer(job, { ...profile, routedTravelMinutesToJob });
        myFit = {
          score: match.score,
          breakdown: match.breakdown,
          compliance: match.compliance,
          reasons: match.reasons,
        };
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
  const [paymentBehavior, clientReliability, clientResponsiveness] = showClientSignals
    ? await Promise.all([
        getPaymentBehaviorForCompany(job.companyId),
        getClientReliabilityForCompany(job.companyId),
        getClientResponsivenessForCompany(job.companyId),
      ])
    : [null, null, null];

  // Spiegelbeeld voor de opdrachtgever: openbare ZZP'ers die passen en nog niet reageerden.
  const suggestions =
    isOwner && status === "PUBLISHED" ? await suggestedFreelancersForJob(job.id) : [];

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

  return (
    <div className="space-y-6">
      <Link
        href="/opdrachten"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> Terug naar opdrachten
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
            {isOwner && (
              <Link
                href={`/opdrachten/${job.id}/bewerken`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                <Pencil className="size-3.5" aria-hidden /> Bewerken
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden /> {job.location}
              </span>
            )}
            <span>{WORK_MODE[job.workMode as WorkMode]}</span>
            {(job.rateMin != null || job.rateMax != null) && (
              <span className="font-mono font-semibold text-foreground">
                € {job.rateMin ?? "?"}
                {job.rateMax != null ? `–${job.rateMax}` : "+"}/uur
              </span>
            )}
            {job.industry && <span>{job.industry.name}</span>}
            {job.startDate && <span>Start: {formatDateShortNl(job.startDate)}</span>}
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
                Vereiste skills
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
                Gewenste skills
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
                Vereiste certificaten
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
                Gewenste certificaten
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

      {isOwner && suggestions.length > 0 && (
        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Geschikte ZZP&apos;ers
            </h2>
            <p className="text-xs text-muted-foreground">
              Openbare profielen die bij deze opdracht passen en nog niet reageerden.
            </p>
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
                  <form action={startConversationWithFreelancer.bind(null, job.id, f.freelancerId)}>
                    <Button type="submit" variant="secondary" size="sm">
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
              Over de opdrachtgever
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
                  Website <ExternalLink className="size-3.5" aria-hidden />
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
            <p className="text-sm font-medium">Je hebt op deze opdracht gereageerd.</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {myApplication.matchScore != null && (
                <Badge variant="accent">Match {myApplication.matchScore}%</Badge>
              )}
              {myCompliance && <ComplianceBadge status={myCompliance} />}
              <Link href="/reacties" className="underline-offset-4 hover:underline">
                Bekijk mijn reacties
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
                      Jouw aansluiting
                    </h2>
                    {myFit.compliance.status !== "COMPLIANT" && (
                      <ComplianceBadge status={myFit.compliance.status} />
                    )}
                  </div>
                  <ScoreRing value={myFit.score} label="Match" size={64} />
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
                          {r.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <details className="text-sm">
                  <summary className="focus-ring cursor-pointer text-muted-foreground">
                    Hoe is deze score opgebouwd?
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
                            {CRED_STATE_LABEL[state]}
                          </span>
                          {urgent && (
                            <Link
                              href="/certificaten"
                              className="text-xs font-medium underline underline-offset-2"
                            >
                              Toevoegen
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {myFit.compliance.status === "NON_COMPLIANT" && (
                  <p className="text-xs text-muted-foreground">
                    Je kunt nog reageren, maar je voldoet nog niet aan alle vereisten.
                  </p>
                )}
              </section>
            )}
            <ApplicationForm action={createApplication.bind(null, job.id)} />
          </div>
        ) : null)
      )}
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
