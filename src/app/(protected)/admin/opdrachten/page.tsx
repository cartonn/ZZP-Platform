import { type Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Briefcase } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { type JobStatus } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { adminCloseJob } from "./actions";
import { adminJobRowAction } from "./row-action";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Opdrachten (beheer) · ZZP Platform" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminOpdrachtenPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
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
    <div className="space-y-6">
      <PageHeader
        title="Opdrachten (beheer)"
        description="Alle opdrachten op het platform. Sluit ongepaste opdrachten."
      />

      {draftJobs > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/opdrachten?status=DRAFT"
            className="focus-ring inline-flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-sm text-warning"
          >
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            {plural(draftJobs, "concept", "concepten")} — bekijk
          </Link>
        </div>
      )}

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto]"
      >
        <Input name="q" defaultValue={q} placeholder="Zoek op titel…" aria-label="Zoeken" />
        <Select name="status" defaultValue={status} aria-label="Status">
          <option value="">Alle statussen</option>
          <option value="DRAFT">Concept</option>
          <option value="PUBLISHED">Gepubliceerd</option>
          <option value="CLOSED">Gesloten</option>
        </Select>
        <Button type="submit" variant="secondary">
          Filteren
        </Button>
      </form>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Briefcase}
              title="Geen opdrachten gevonden"
              description="Er zijn geen opdrachten die overeenkomen met de huidige filters."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {jobs.map((job) => {
            const status = job.status as JobStatus;
            const rowAction = adminJobRowAction(status);
            return (
              <div
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/opdrachten/${job.id}`}
                      className="truncate text-sm font-medium underline-offset-4 hover:underline"
                    >
                      {job.title}
                    </Link>
                    <JobStatusBadge status={status} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {job.company.name} · {plural(job._count.applications, "reactie", "reacties")}
                  </p>
                </div>
                {rowAction === "view" && (
                  // Een concept is nog niet live — sluiten is hier zinloos; toon alleen "Bekijken".
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/opdrachten/${job.id}`}>Bekijken</Link>
                  </Button>
                )}
                {rowAction === "close-confirm" && (
                  // Sluiten is moderatie op een live opdracht — achter een bevestiging (geen one-click).
                  <ConfirmButton
                    action={adminCloseJob.bind(null, job.id)}
                    title="Opdracht sluiten?"
                    description={`"${job.title}" wordt gesloten en verdwijnt uit de zoekresultaten. Deze actie kan niet ongedaan worden gemaakt.`}
                    confirmLabel="Sluiten"
                  >
                    Sluiten
                  </ConfirmButton>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
