import { Building2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { FranchiseForm } from "@/app/(protected)/admin/franchises/franchise-form";

/**
 * Bemiddelaars-paneel: bemiddelaars (tenant-admins) en hun tenants, plus het aanmaakformulier voor
 * een nieuwe bemiddeling. Laadt zelf zijn data (beheer-onboarding, beheersbaar volume). Rendert
 * geen eigen paginakop — die hoort bij de route (/admin/franchises) of de hub.
 */
export async function BemiddelaarsPanel() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { companies: true, freelancers: true, jobs: true } },
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-sm font-semibold tracking-tight">Nieuwe bemiddeling</h2>
          <FranchiseForm />
        </CardContent>
      </Card>

      {tenants.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="Nog geen bemiddelingen"
            description="Maak hierboven de eerste bemiddeling aan."
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
                {plural(t._count.companies, "opdrachtgever", "opdrachtgevers")} ·{" "}
                {plural(t._count.freelancers, "ZZP'er", "ZZP'ers")}
                <br />
                {plural(t._count.jobs, "dienst", "diensten")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
