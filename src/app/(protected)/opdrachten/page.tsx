import { type Metadata } from "next";
import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { JOBS_PER_PAGE, normalizeJobFilters } from "@/lib/jobs";
import { type JobStatus, type WorkMode } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";

export const metadata: Metadata = { title: "Opdrachten · ZZP Platform" };

const WORK_MODE: Record<WorkMode, string> = { REMOTE: "Remote", ONSITE: "Op locatie", HYBRID: "Hybride" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function OpdrachtenPage({ searchParams }: { searchParams: SearchParams }) {
  const actor = await requireActor();
  if (actor.role === "CLIENT") return <ClientJobs userId={actor.id} />;
  return <BrowseJobs searchParams={await searchParams} />;
}

// --- CLIENT: beheeroverzicht van eigen opdrachten ---
async function ClientJobs({ userId }: { userId: string }) {
  const jobs = await prisma.job.findMany({
    where: { company: { userId } },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Mijn opdrachten</h1>
          <p className="text-sm text-muted-foreground">Beheer je opdrachten en publiceer ze voor ZZP&apos;ers.</p>
        </div>
        <Button asChild>
          <Link href="/opdrachten/nieuw"><Plus className="size-4" aria-hidden /> Nieuwe opdracht</Link>
        </Button>
      </header>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="text-center text-sm text-muted-foreground">
            Je hebt nog geen opdrachten. Maak je eerste opdracht aan.
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {jobs.map((job) => (
            <Link key={job.id} href={`/opdrachten/${job.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{job.title}</p>
                <p className="text-xs text-muted-foreground">
                  {job._count.applications} reactie(s)
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
async function BrowseJobs({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const f = normalizeJobFilters(searchParams);

  const where: Prisma.JobWhereInput = { status: "PUBLISHED" };
  if (f.q) where.OR = [{ title: { contains: f.q } }, { description: { contains: f.q } }];
  if (f.industryId) where.industryId = f.industryId;
  if (f.workMode) where.workMode = f.workMode;
  if (f.rateMin != null) where.rateMax = { gte: f.rateMin };
  if (f.rateMax != null) where.rateMin = { lte: f.rateMax };
  if (f.skillIds.length) where.skills = { some: { skillId: { in: f.skillIds } } };
  if (f.requiredCredential) {
    where.credentialRequirements = { some: { credentialType: f.requiredCredential, required: true } };
  }

  const orderBy: Prisma.JobOrderByWithRelationInput =
    f.sort === "rate_desc" ? { rateMax: "desc" } : f.sort === "rate_asc" ? { rateMin: "asc" } : { publishedAt: "desc" };

  const [total, jobs, industries, skills] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy,
      skip: (f.page - 1) * JOBS_PER_PAGE,
      take: JOBS_PER_PAGE,
      include: { company: { select: { name: true } }, industry: { select: { name: true } } },
    }),
    prisma.industry.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

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
          <CardContent className="text-center text-sm text-muted-foreground">
            Geen opdrachten gevonden. Pas je filters aan.
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{total} opdracht(en) gevonden</p>
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link key={job.id} href={`/opdrachten/${job.id}`} className="block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">{job.company.name}</p>
                  </div>
                  {(job.rateMin != null || job.rateMax != null) && (
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      € {job.rateMin ?? "?"}{job.rateMax != null ? `–${job.rateMax}` : "+"}/uur
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {job.location && (
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3" aria-hidden /> {job.location}</span>
                  )}
                  <span>{WORK_MODE[job.workMode as WorkMode]}</span>
                  {job.industry && <span>{job.industry.name}</span>}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex items-center justify-between pt-2" aria-label="Paginering">
              {f.page > 1 ? (
                <Button asChild variant="secondary" size="sm"><Link href={mkPageHref(f.page - 1)}>Vorige</Link></Button>
              ) : <span />}
              <span className="text-xs text-muted-foreground">Pagina {f.page} van {totalPages}</span>
              {f.page < totalPages ? (
                <Button asChild variant="secondary" size="sm"><Link href={mkPageHref(f.page + 1)}>Volgende</Link></Button>
              ) : <span />}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
