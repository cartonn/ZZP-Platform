import { type Metadata } from "next";
import Link from "next/link";
import { Briefcase, Check, ChevronRight, MapPin, Minus, Plus, SearchX } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { type Actor, requireActor } from "@/lib/authz";
import { visibleJobsWhere } from "@/lib/tenancy";
import { prisma } from "@/lib/db";
import { JOBS_PER_PAGE, normalizeJobFilters } from "@/lib/jobs";
import { scoreJobForFreelancer, topGapReason, topPositiveReason } from "@/lib/matching";
import { type JobStatus, type WorkMode } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { JobFilters } from "@/components/jobs/job-filters";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { withParams } from "@/components/admin/base-path";
import { plural } from "@/lib/plural";
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
  const jobs = await prisma.job.findMany({
    where: { company: { userId } },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });

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

                  <p className="text-xs text-muted-foreground">
                    {plural(job._count.applications, "reactie", "reacties")}
                  </p>

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
  if (f.industryId) where.industryId = f.industryId;
  if (f.location) where.location = { contains: f.location };
  if (f.workMode) where.workMode = f.workMode;
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

  // Persoonlijke match per opdracht: score plus de zwaarst wegende troef én het zwaarst wegende
  // minpunt — uitlegbaarheid. De ZZP'er ziet niet alleen *of* het matcht, maar *waarom* (en wat niet).
  type JobMatch = { score: number; reason: string | null; gap: string | null };
  const matchByJob = new Map<string, JobMatch>();
  if (profile) {
    for (const job of jobs) {
      const result = scoreJobForFreelancer(job, profile);
      matchByJob.set(job.id, {
        score: result.score,
        reason: topPositiveReason(result.reasons),
        gap: topGapReason(result.reasons),
      });
    }
  }

  // Bewaarde opdrachten (alleen ZZP'er): welke van de zichtbare opdrachten al gebookmarkt zijn, zodat
  // de bewaar-knop direct de juiste staat toont. Eén query, begrensd tot de zichtbare pagina.
  const savedJobIds = new Set<string>();
  if (profile && jobs.length > 0) {
    const saved = await prisma.savedJob.findMany({
      where: { freelancerProfileId: profile.id, jobId: { in: jobs.map((j) => j.id) } },
      select: { jobId: true },
    });
    for (const s of saved) savedJobIds.add(s.jobId);
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
    <div className="space-y-6">
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
            {jobs.map((job) => {
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
                      <span>{WORK_MODE[job.workMode as WorkMode]}</span>
                      {job.industry && <span>{job.industry.name}</span>}
                    </p>
                    {match && (match.reason || match.gap) && (
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        {match.reason && (
                          <span className="inline-flex items-center gap-1 text-success">
                            <Check className="size-3 shrink-0" aria-hidden />
                            <span className="truncate">{match.reason}</span>
                          </span>
                        )}
                        {match.gap && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Minus className="size-3 shrink-0" aria-hidden />
                            <span className="truncate">{match.gap}</span>
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {(job.rateMin != null || job.rateMax != null) && (
                      <span className="hidden text-sm tabular-nums text-muted-foreground sm:inline">
                        € {job.rateMin ?? "?"}
                        {job.rateMax != null ? `–${job.rateMax}` : "+"}/uur
                      </span>
                    )}
                    {match && <Badge variant="accent">Match {match.score}%</Badge>}
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
