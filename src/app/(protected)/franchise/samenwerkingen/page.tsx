import { type Metadata } from "next";
import { Handshake } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { hasTenant } from "@/lib/tenancy";
import { type CollaborationStatus } from "@/lib/enums";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDateShortNl } from "@/lib/format-date";

export const metadata: Metadata = { title: "Samenwerkingen · Bemiddeling" };

const STATUS: Record<
  CollaborationStatus,
  { label: string; variant: "muted" | "success" | "warning" | "danger" }
> = {
  // prettier-ignore
  PROPOSED: { label: "Voorgesteld", variant: "warning" },
  ACTIVE: { label: "Actief", variant: "success" },
  COMPLETED: { label: "Afgerond", variant: "muted" },
  CANCELLED: { label: "Geannuleerd", variant: "danger" },
};

export default async function FranchiseSamenwerkingenPage() {
  const actor = await requireRole("FRANCHISER");
  const collabs = hasTenant(actor)
    ? await prisma.collaboration.findMany({
        where: { job: { tenantId: actor.tenantId } },
        orderBy: { updatedAt: "desc" },
        include: {
          job: { select: { title: true, department: { select: { name: true } } } },
          company: { select: { name: true, userId: true } },
          freelancer: { select: { user: { select: { name: true } } } },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Samenwerkingen"
        description="Toezicht op de samenwerkingen die uit je diensten zijn voortgekomen."
      />

      {collabs.length === 0 ? (
        <Card>
          <EmptyState
            icon={Handshake}
            title="Nog geen samenwerkingen"
            description="Zodra een ZZP'er op een dienst reageert en je opdrachtgever akkoord gaat, verschijnt de samenwerking hier."
            action={{ label: "Bekijk je diensten", href: "/franchise/diensten" }}
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {collabs.map((c) => {
            const status = STATUS[c.status as CollaborationStatus] ?? STATUS.PROPOSED;
            return (
              <div key={c.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.job.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {c.company.name}
                      {c.job.department ? ` · ${c.job.department.name}` : ""} ·{" "}
                      {c.freelancer.user.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <span>bijgewerkt {formatDateShortNl(c.updatedAt)}</span>
                  </div>
                </div>
                {/* Annuleringsregistratie voor het franchise-toezicht: wie, wanneer, waarom —
                    en of de 7-dagen-kostenregel geldt (productbesluit 12-6-2026). */}
                {c.status === "CANCELLED" && c.cancellationReason && (
                  <div className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-xs">
                    <p className="font-medium">
                      Geannuleerd
                      {c.cancelledAt ? ` op ${formatDateShortNl(c.cancelledAt)}` : ""} door{" "}
                      {c.cancelledById === c.company.userId ? "de opdrachtgever" : "de ZZP'er"}
                      {c.cancellationChargeable ? " · betalingsverplichting van toepassing" : ""}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">Reden: {c.cancellationReason}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
