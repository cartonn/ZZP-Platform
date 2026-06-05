import { type Metadata } from "next";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "ZZP'ers · Franchise" };

const AVAIL_LABEL: Record<string, string> = {
  AVAILABLE: "Beschikbaar",
  LIMITED: "Beperkt",
  UNAVAILABLE: "Niet beschikbaar",
  UNKNOWN: "Onbekend",
};

export default async function FranchiseZzpersPage() {
  const actor = await requireRole("FRANCHISER");
  const freelancers = await prisma.freelancerProfile.findMany({
    where: tenantScopeWhere(actor),
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { credentials: true, collaborations: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="ZZP'ers"
        description="De ZZP'ers in je roster — degenen die je in je franchise hebt gebracht."
      />

      {freelancers.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Nog geen ZZP'ers"
            description="Je hebt nog geen ZZP'ers in je roster."
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {freelancers.map((f) => (
            <div key={f.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{f.user.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {f.headline ?? f.user.email}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                <Badge variant={f.availability === "AVAILABLE" ? "success" : "muted"}>
                  {AVAIL_LABEL[f.availability] ?? f.availability}
                </Badge>
                <span>{plural(f._count.credentials, "certificaat", "certificaten")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
