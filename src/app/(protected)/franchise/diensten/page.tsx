import { type Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { type JobStatus } from "@/lib/enums";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Diensten · Franchise" };

export default async function FranchiseDienstenPage() {
  const actor = await requireRole("FRANCHISER");
  const diensten = await prisma.job.findMany({
    where: tenantScopeWhere(actor),
    orderBy: { createdAt: "desc" },
    include: {
      company: { select: { name: true } },
      department: { select: { name: true } },
      _count: { select: { applications: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Diensten"
        description="Een overzicht van alle diensten die je hebt uitgezet. Nieuwe diensten zet je uit bij een opdrachtgever."
        action={
          <Button asChild variant="secondary">
            <Link href="/franchise/opdrachtgevers">
              Naar opdrachtgevers <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      {diensten.length === 0 ? (
        <Card>
          <EmptyState
            icon={Clock}
            title="Nog geen diensten"
            description="Zet diensten uit bij een opdrachtgever — per afdeling, met tarief, skills en vereiste certificaten."
            action={{ label: "Naar opdrachtgevers", href: "/franchise/opdrachtgevers" }}
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {diensten.map((d) => (
            <Link
              key={d.id}
              href={`/opdrachten/${d.id}`}
              className="card-interactive flex items-start justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{d.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {d.company.name}
                  {d.department ? ` · ${d.department.name}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                <JobStatusBadge status={d.status as JobStatus} />
                {d._count.applications > 0 && (
                  <Badge variant="muted">
                    {plural(d._count.applications, "reactie", "reacties")}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
