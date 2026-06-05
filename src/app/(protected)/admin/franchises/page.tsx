import { type Metadata } from "next";
import { Building2 } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDateShortNl } from "@/lib/format-date";
import { FranchiseForm } from "./franchise-form";

export const metadata: Metadata = { title: "Franchises · ZZP Platform" };

export default async function FranchisesPage() {
  await requireRole("ADMIN");

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { companies: true, freelancers: true, jobs: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Franchises"
        description="Franchisenemers (tenant-admins) en hun tenants. Een franchisenemer brengt eigen opdrachtgevers en ZZP'ers in het platform."
      />

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Nieuwe franchise</h2>
          <FranchiseForm />
        </CardContent>
      </Card>

      {tenants.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="Nog geen franchises"
            description="Maak hierboven de eerste franchise aan."
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {tenants.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  {t.name}
                  {t.status !== "ACTIVE" && <Badge variant="muted">{t.status}</Badge>}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {t.owner.name} · {t.owner.email} · sinds {formatDateShortNl(t.createdAt)}
                </p>
              </div>
              <p className="shrink-0 text-right text-xs text-muted-foreground">
                {t._count.companies} opdrachtgevers · {t._count.freelancers} ZZP&apos;ers
                <br />
                {t._count.jobs} diensten
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
