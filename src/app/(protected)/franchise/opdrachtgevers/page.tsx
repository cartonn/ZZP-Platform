import { type Metadata } from "next";
import { Building2 } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Opdrachtgevers · Franchise" };

export default async function FranchiseOpdrachtgeversPage() {
  const actor = await requireRole("FRANCHISER");
  const companies = await prisma.company.findMany({
    where: tenantScopeWhere(actor),
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
      _count: { select: { departments: true, jobs: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Opdrachtgevers"
        description="De opdrachtgevers die je in je franchise hebt gebracht, met hun afdelingen."
      />

      {companies.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="Nog geen opdrachtgevers"
            description="Je hebt nog geen opdrachtgevers in je franchise."
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {companies.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-sm text-muted-foreground">{c.user.email}</p>
              </div>
              <p className="shrink-0 text-right text-xs text-muted-foreground">
                {plural(c._count.departments, "afdeling", "afdelingen")} ·{" "}
                {plural(c._count.jobs, "dienst", "diensten")}
                <br />
                sinds {formatDateShortNl(c.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
