import { type Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Briefcase } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { type JobStatus } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { adminCloseJob } from "./actions";

export const metadata: Metadata = { title: "Opdrachten (beheer) · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminOpdrachtenPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const q = first(sp.q).trim();
  const status = first(sp.status);

  const where: Prisma.JobWhereInput = {};
  if (q) where.title = { contains: q };
  if (status) where.status = status;

  const [jobs, draftJobs] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { company: { select: { name: true } }, _count: { select: { applications: true } } },
    }),
    prisma.job.count({ where: { status: "DRAFT" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Opdrachten (beheer)</h1>
        <p className="text-sm text-muted-foreground">Alle opdrachten op het platform. Sluit ongepaste opdrachten.</p>
      </header>

      {draftJobs > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/opdrachten?status=DRAFT"
            className="inline-flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-sm text-warning focus-ring"
          >
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            {draftJobs} concept(en) — bekijk
          </Link>
        </div>
      )}

      <form method="get" className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto]">
        <Input name="q" defaultValue={q} placeholder="Zoek op titel…" aria-label="Zoeken" />
        <Select name="status" defaultValue={status} aria-label="Status">
          <option value="">Alle statussen</option>
          <option value="DRAFT">Concept</option>
          <option value="PUBLISHED">Gepubliceerd</option>
          <option value="CLOSED">Gesloten</option>
        </Select>
        <Button type="submit" variant="secondary">Filteren</Button>
      </form>

      {jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="Geen opdrachten gevonden" description="Pas je zoekopdracht of filters aan." />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {jobs.map((job) => {
            const status = job.status as JobStatus;
            return (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/opdrachten/${job.id}`} className="truncate text-sm font-medium underline-offset-4 hover:underline">{job.title}</Link>
                    <JobStatusBadge status={status} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{job.company.name} · {job._count.applications} reactie(s)</p>
                </div>
                {status !== "CLOSED" && (
                  <form action={adminCloseJob.bind(null, job.id)}>
                    <Button type="submit" variant="danger" size="sm">Sluiten</Button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
