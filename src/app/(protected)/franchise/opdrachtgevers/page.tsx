import { type Metadata } from "next";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Opdrachtgevers · Bemiddeling" };

export default async function FranchiseOpdrachtgeversPage() {
  const actor = await requireRole("FRANCHISER");
  // unbounded-allow: franchise-tenant-scoped bedrijven; beheerbaar volume
  const companies = await prisma.company.findMany({
    where: tenantScopeWhere(actor),
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
      _count: { select: { departments: true, jobs: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opdrachtgevers"
        description="De opdrachtgevers die je in je bemiddeling hebt gebracht, met hun afdelingen."
        action={
          <Button asChild>
            <Link href="/franchise/opdrachtgevers/nieuw">
              <Plus className="size-4" aria-hidden /> Nieuwe opdrachtgever
            </Link>
          </Button>
        }
      />

      {companies.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="Nog geen opdrachtgevers"
            description="Zet je eerste opdrachtgever op — met afdelingen en diensten in één doorloop."
            action={{ label: "Nieuwe opdrachtgever", href: "/franchise/opdrachtgevers/nieuw" }}
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/franchise/opdrachtgevers/${c.id}`}
              className="card-interactive flex items-start justify-between gap-3 p-4"
            >
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
