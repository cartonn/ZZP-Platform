import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ExternalLink, MapPin, Pencil, TriangleAlert } from "lucide-react";
import { owns, requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { JOB_TRANSITIONS } from "@/lib/jobs";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type CredentialType, type JobStatus, type WorkMode } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { ComplianceBadge } from "@/components/compliance-badge";
import { TrustBadge } from "@/components/trust/trust-badge";
import { scoreJobForFreelancer, type ComplianceResult, type ComplianceStatus } from "@/lib/matching";
import { suggestedFreelancersForJob } from "@/lib/suggestions";
import { DbaRiskBadge } from "@/components/dba/dba-risk-badge";
import { dbaAdvice, type DbaReason, type DbaRisk } from "@/lib/dba";
import { changeJobStatus, createApplication } from "../actions";
import { startConversationWithFreelancer } from "@/app/(protected)/berichten/actions";
import { ApplicationForm } from "./application-form";

export const metadata: Metadata = { title: "Opdracht · ZZP Platform" };

const WORK_MODE: Record<WorkMode, string> = { REMOTE: "Remote", ONSITE: "Op locatie", HYBRID: "Hybride" };

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
    },
  });
  if (!job) notFound();

  const isOwner = owns(actor, job.company.userId);
  const status = job.status as JobStatus;
  // Niet-gepubliceerde opdrachten zijn alleen zichtbaar voor de eigenaar (server-side).
  if (status !== "PUBLISHED" && !isOwner) notFound();

  const requiredSkills = job.skills.filter((s) => s.required);
  const optionalSkills = job.skills.filter((s) => !s.required);
  const requiredCreds = job.credentialRequirements.filter((c) => c.required);
  const optionalCreds = job.credentialRequirements.filter((c) => !c.required);

  // Bestaande reactie van de huidige ZZP'er (voor de reageer-sectie), plus — als hij nog
  // niet reageerde — een persoonlijke aansluiting (match + welke eisen hij al haalt).
  let myApplication: { status: string; matchScore: number | null; complianceSnapshot: string | null } | null = null;
  let myFit: { score: number; compliance: ComplianceResult } | null = null;
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
        const match = scoreJobForFreelancer(job, profile);
        myFit = { score: match.score, compliance: match.compliance };
      }
    }
  }
  const myCompliance = parseComplianceStatus(myApplication?.complianceSnapshot);

  // Spiegelbeeld voor de opdrachtgever: openbare ZZP'ers die passen en nog niet reageerden.
  const suggestions = isOwner && status === "PUBLISHED" ? await suggestedFreelancersForJob(job.id) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/opdrachten" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden /> Terug naar opdrachten
      </Link>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{job.title}</h1>
                {isOwner && <JobStatusBadge status={status} />}
              </div>
              <p className="text-sm text-muted-foreground">{job.company.name}</p>
            </div>
            {isOwner && (
              <Link href={`/opdrachten/${job.id}/bewerken`} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
                <Pencil className="size-3.5" aria-hidden /> Bewerken
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {job.location && (
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden /> {job.location}</span>
            )}
            <span>{WORK_MODE[job.workMode as WorkMode]}</span>
            {(job.rateMin != null || job.rateMax != null) && (
              <span>
                € {job.rateMin ?? "?"}{job.rateMax != null ? `–${job.rateMax}` : "+"}/uur
              </span>
            )}
            {job.industry && <span>{job.industry.name}</span>}
            {job.startDate && <span>Start: {job.startDate.toISOString().slice(0, 10)}</span>}
          </div>

          <p className="whitespace-pre-line text-sm leading-relaxed">{job.description}</p>
        </CardContent>
      </Card>

      {(requiredSkills.length > 0 || optionalSkills.length > 0) && (
        <section className="space-y-3">
          {requiredSkills.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Vereiste skills</h2>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((s) => <Badge key={s.skillId}>{s.skill.name}</Badge>)}
              </div>
            </div>
          )}
          {optionalSkills.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Gewenste skills</h2>
              <div className="flex flex-wrap gap-2">
                {optionalSkills.map((s) => <Badge key={s.skillId} variant="muted">{s.skill.name}</Badge>)}
              </div>
            </div>
          )}
        </section>
      )}

      {(requiredCreds.length > 0 || optionalCreds.length > 0) && (
        <section className="space-y-3">
          {requiredCreds.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Vereiste certificaten</h2>
              <div className="flex flex-wrap gap-2">
                {requiredCreds.map((c) => <Badge key={c.id} variant="warning">{CREDENTIAL_TYPE_LABEL[c.credentialType as CredentialType]}</Badge>)}
              </div>
            </div>
          )}
          {optionalCreds.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Gewenste certificaten</h2>
              <div className="flex flex-wrap gap-2">
                {optionalCreds.map((c) => <Badge key={c.id} variant="muted">{CREDENTIAL_TYPE_LABEL[c.credentialType as CredentialType]}</Badge>)}
              </div>
            </div>
          )}
        </section>
      )}

      {isOwner && job.dbaRisk && (
        <section className="space-y-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium">Wet DBA — risico</h2>
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
          <p className="text-[11px] text-muted-foreground/70">Hulpmiddel, geen juridisch advies.</p>
        </section>
      )}

      {isOwner && suggestions.length > 0 && (
        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">Geschikte ZZP&apos;ers</h2>
            <p className="text-xs text-muted-foreground">Openbare profielen die bij deze opdracht passen en nog niet reageerden.</p>
          </div>
          <ul className="divide-y divide-border">
            {suggestions.map((f) => (
              <li key={f.freelancerId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Link href={`/zzp/${f.freelancerId}`} target="_blank" className="font-medium underline-offset-4 hover:underline">
                    {f.name}
                  </Link>
                  <TrustBadge level={f.trustLevel} />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ComplianceBadge status={f.compliance} />
                  <Badge variant="muted">Match {f.score}%</Badge>
                  <form action={startConversationWithFreelancer.bind(null, job.id, f.freelancerId)}>
                    <Button type="submit" variant="secondary" size="sm">Bericht sturen</Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!isOwner && (job.company.description || job.company.location || job.company.website || job.company.industry) && (
        <section className="space-y-2 rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-medium">Over de opdrachtgever</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {job.company.location && (
              <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden /> {job.company.location}</span>
            )}
            {job.company.industry && <span>{job.company.industry.name}</span>}
            {job.company.website && (
              <a href={job.company.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
                Website <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </div>
          {job.company.description && <p className="whitespace-pre-line text-sm leading-relaxed">{job.company.description}</p>}
        </section>
      )}

      {isOwner ? (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          {JOB_TRANSITIONS[status].map((to) => (
            <form key={to} action={changeJobStatus.bind(null, job.id, to)}>
              <Button type="submit" variant={to === "PUBLISHED" ? "primary" : "secondary"} size="sm">
                {transitionLabel(status, to)}
              </Button>
            </form>
          ))}
        </div>
      ) : (
        actor.role === "FREELANCER" &&
        (myApplication ? (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">Je hebt op deze opdracht gereageerd.</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {myApplication.matchScore != null && <Badge variant="muted">Match {myApplication.matchScore}%</Badge>}
              {myCompliance && <ComplianceBadge status={myCompliance} />}
              <Link href="/reacties" className="underline-offset-4 hover:underline">Bekijk mijn reacties</Link>
            </div>
          </div>
        ) : status === "PUBLISHED" ? (
          <div className="space-y-4 border-t border-border pt-4">
            {myFit && (
              <section className="space-y-3 rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-medium">Jouw aansluiting</h2>
                  <Badge variant="muted">Match {myFit.score}%</Badge>
                  <ComplianceBadge status={myFit.compliance.status} />
                </div>
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
                            <TriangleAlert className={`size-4 shrink-0 ${urgent ? "text-danger" : "text-warning"}`} aria-hidden />
                          )}
                          <span>{CREDENTIAL_TYPE_LABEL[type]}</span>
                          <span className="text-xs text-muted-foreground">{CRED_STATE_LABEL[state]}</span>
                          {urgent && (
                            <Link href="/certificaten" className="text-xs font-medium underline underline-offset-2">
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

function parseComplianceStatus(raw: string | null | undefined): ComplianceStatus | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return (v?.status as ComplianceStatus) ?? null;
  } catch {
    return null;
  }
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
