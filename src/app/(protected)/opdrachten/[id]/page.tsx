import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Pencil } from "lucide-react";
import { owns, requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { JOB_TRANSITIONS } from "@/lib/jobs";
import { type CredentialType, type JobStatus, type WorkMode } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { ComplianceBadge } from "@/components/compliance-badge";
import { type ComplianceStatus } from "@/lib/matching";
import { changeJobStatus, createApplication } from "../actions";
import { ApplicationForm } from "./application-form";

export const metadata: Metadata = { title: "Opdracht · ZZP Platform" };

const WORK_MODE: Record<WorkMode, string> = { REMOTE: "Remote", ONSITE: "Op locatie", HYBRID: "Hybride" };
const CREDENTIAL_LABELS: Record<CredentialType, string> = {
  VOG: "VOG", DIPLOMA: "Diploma", CERTIFICATE: "Certificaat", INSURANCE: "Verzekering", LICENSE: "Licentie", OTHER: "Overig",
};

function transitionLabel(from: JobStatus, to: JobStatus): string {
  if (to === "PUBLISHED") return from === "CLOSED" ? "Heropenen" : "Publiceren";
  if (to === "CLOSED") return "Sluiten";
  return "Terug naar concept";
}

export default async function OpdrachtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: { select: { name: true, userId: true } },
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

  // Bestaande reactie van de huidige ZZP'er (voor de reageer-sectie).
  let myApplication: { status: string; matchScore: number | null; complianceSnapshot: string | null } | null = null;
  if (actor.role === "FREELANCER") {
    const profile = await prisma.freelancerProfile.findUnique({ where: { userId: actor.id }, select: { id: true } });
    if (profile) {
      myApplication = await prisma.application.findUnique({
        where: { jobId_freelancerId: { jobId: job.id, freelancerId: profile.id } },
        select: { status: true, matchScore: true, complianceSnapshot: true },
      });
    }
  }
  const myCompliance = parseComplianceStatus(myApplication?.complianceSnapshot);

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
                {requiredCreds.map((c) => <Badge key={c.id} variant="warning">{CREDENTIAL_LABELS[c.credentialType as CredentialType]}</Badge>)}
              </div>
            </div>
          )}
          {optionalCreds.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium">Gewenste certificaten</h2>
              <div className="flex flex-wrap gap-2">
                {optionalCreds.map((c) => <Badge key={c.id} variant="muted">{CREDENTIAL_LABELS[c.credentialType as CredentialType]}</Badge>)}
              </div>
            </div>
          )}
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
          <div className="border-t border-border pt-4">
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
