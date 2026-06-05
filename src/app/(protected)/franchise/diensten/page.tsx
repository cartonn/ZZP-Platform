import { type Metadata } from "next";
import { Clock } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { type JobStatus } from "@/lib/enums";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Diensten · Franchise" };

const STATUS: Record<JobStatus, { label: string; variant: "muted" | "success" | "warning" }> = {
  DRAFT: { label: "Concept", variant: "muted" },
  PUBLISHED: { label: "Open", variant: "success" },
  CLOSED: { label: "Gesloten", variant: "warning" },
};

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
        description="De diensten die je namens je opdrachtgevers hebt uitgezet."
      />

      {diensten.length === 0 ? (
        <Card>
          <EmptyState
            icon={Clock}
            title="Nog geen diensten"
            description="Je hebt nog geen diensten uitgezet voor je opdrachtgevers."
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {diensten.map((d) => {
            const status = STATUS[d.status as JobStatus] ?? STATUS.DRAFT;
            return (
              <div key={d.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{d.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {d.company.name}
                    {d.department ? ` · ${d.department.name}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <span>{plural(d._count.applications, "reactie", "reacties")}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
