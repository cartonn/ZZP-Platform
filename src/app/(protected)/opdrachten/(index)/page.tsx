import { type Metadata } from "next";
import Link from "next/link";
import { Briefcase, ChevronRight, MapPin, Plus, SearchX } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { type Actor, requireActor } from "@/lib/authz";
import { visibleJobsWhere } from "@/lib/tenancy";
import { prisma } from "@/lib/db";
import { JOBS_PER_PAGE, normalizeJobFilters } from "@/lib/jobs";
import { scoreJobForFreelancer } from "@/lib/matching";
import { JOB_STATUSES, type JobStatus, type WorkMode } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Opdrachten · ZZP Platform" };

const WORK_MODE: Record<WorkMode, string> = {
  REMOTE: "Remote",
  ONSITE: "Op locatie",
  HYBRID: "Hybride",
};

const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: "Concept",
  PUBLISHED: "Gepubliceerd",
  CLOSED: "Gesloten",
};

const isJobStatus = (v: string): v is JobStatus => (JOB_STATUSES as readonly string[]).includes(v);

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function OpdrachtenPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireActor();
  const sp = await searchParams;
  if (actor.role === "CLIENT") {
    const statusParam = first(sp.status);
    const status = isJobStatus(statusParam) ? statusParam : undefined;
    return <ClientJobs userId={actor.id} status={status} />;
  }
  return <BrowseJobs searchParams={sp} actor={actor} />;
}

// --- CLIENT: beheeroverzicht van eigen opdrachten ---
async function ClientJobs({ userId, status }: { userId: string; status?: JobStatus }) {
  const where: Prisma.JobWhereInput = { company: { userId } };
  if (status) where.status = status;

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_auto]"
      >
        <Select name="status" defaultValue={status ?? ""} aria-label="Status">
          <option value="">Alle statussen</option>
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {JOB_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Filteren
        </Button>
      </form>

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
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/opdrachten/${job.id}`}
              className="card-interactive flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{job.title}</p>
                <p className="text-xs text-muted-foreground">
                  {plural(job._count.applications, "reactie", "reacties")}
                  {job.location ? ` · ${job.location}` : ""}
                </p>
              </div>
              <JobStatusBadge status={job.status as JobStatus} />
            </Link>
          ))}
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
  // Als AND-clausule zodat de tekstzoek-OR hieronder de zichtbaarheids-OR niet overschrijft.
  const where: Prisma.JobWhereInput = { status: "PUBLISHED", AND: [visibleJobsWhere(actor)] };
  if (f.q) where.OR = [{ title: { contains: f.q } }, { description: { contains: f.q } }];
  if (f.industryId) where.industryId = f.industryId;
  if (f.location) where.location = { contains: f.location };
  if (f.workMode) where.workMode = f.workMode;
  if (f.rateMin != null) where.rateMax = { gte: f.rateMin };
  if (f.rateMax != null) where.rateMin = { lte: f.rateMax };
  if (f.skillIds.length) where.skills = { some: { skillId: { in: f.skillIds } } };
  if (f.requiredCredential) {
    where.credentialRequirements = {
      some: { credentialType: f.requiredCredential, required: true },
    };
  }

  const orderBy: Prisma.JobOrderByWithRelationInput =
    f.sort === "rate_desc"
      ? { rateMax: "desc" }
      : f.sort === "rate_asc"
        ? { rateMin: "asc" }
        : { publishedAt: "desc" };

  const [total, jobs, industries, skills, profile] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy,
      skip: (f.page - 1) * JOBS_PER_PAGE,
      take: JOBS_PER_PAGE,
      include: {
        company: { select: { name: true } },
        industry: { select: { name: true } },
        skills: true,
        credentialRequirements: true,
      },
    }),
    prisma.industry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    actor.role === "FREELANCER"
      ? prisma.freelancerProfile.findUnique({
          where: { userId: actor.id },
          include: {
            skills: { select: { skillId: true } },
            credentials: { select: { type: true, status: true, expiresAt: true } },
          },
        })
      : Promise.resolve(null),
  ]);

  // Persoonlijke matchscore per opdracht zodat de ZZP'er ziet waar te reageren loont.
  const matchByJob = new Map<string, number>();
  if (profile) {
    for (const job of jobs) {
      matchByJob.set(job.id, scoreJobForFreelancer(job, profile).score);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / JOBS_PER_PAGE));
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
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Opdrachten</h1>
        <p className="text-sm text-muted-foreground">Vind opdrachten die bij je passen.</p>
      </header>

      <JobFilters industries={industries} skills={skills} />

      {jobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title="Geen opdrachten gevonden"
            description="Pas je filters aan om meer resultaten te zien."
          />
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {plural(total, "opdracht", "opdrachten")} gevonden
          </p>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/opdrachten/${job.id}`}
                className="card-interactive flex items-center justify-between gap-4 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{job.title}</p>
                  <p className="metadata-row mt-0.5">
                    <span className="font-medium text-foreground/70">{job.company.name}</span>
                    {job.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" aria-hidden /> {job.location}
                      </span>
                    )}
                    <span>{WORK_MODE[job.workMode as WorkMode]}</span>
                    {job.industry && <span>{job.industry.name}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {(job.rateMin != null || job.rateMax != null) && (
                    <span className="hidden text-sm tabular-nums text-muted-foreground sm:inline">
                      € {job.rateMin ?? "?"}
                      {job.rateMax != null ? `–${job.rateMax}` : "+"}/uur
                    </span>
                  )}
                  {matchByJob.has(job.id) && (
                    <Badge variant="accent">Match {matchByJob.get(job.id)}%</Badge>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-between pt-2" aria-label="Paginering">
              {f.page > 1 ? (
                <Button asChild variant="secondary" size="sm">
                  <Link href={mkPageHref(f.page - 1)}>Vorige</Link>
                </Button>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">
                Pagina {f.page} van {totalPages}
              </span>
              {f.page < totalPages ? (
                <Button asChild variant="secondary" size="sm">
                  <Link href={mkPageHref(f.page + 1)}>Volgende</Link>
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
