import { type Metadata } from "next";
import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { type InvoiceStatus } from "@/lib/enums";
import { type InvoiceLifecycleState } from "@/lib/lifecycles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Facturen · ZZP Platform" };

const CASCADE_LABEL: Record<
  InvoiceLifecycleState,
  { label: string; variant: "muted" | "warning" | "success" | "danger" }
> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SUBMITTED: { label: "Ingediend", variant: "warning" },
  APPROVED: { label: "Goedgekeurd", variant: "success" },
  PAID: { label: "Betaald", variant: "success" },
  PROCESSED: { label: "Verwerkt", variant: "muted" },
  REJECTED: { label: "Afgekeurd", variant: "danger" },
  OVERDUE: { label: "Te laat", variant: "danger" },
  CREDITED: { label: "Gecrediteerd", variant: "danger" },
};

export default async function FacturenPage() {
  const actor = await requireActor();
  const isFreelancer = actor.role === "FREELANCER";

  const where = isFreelancer
    ? { collaboration: { freelancer: { userId: actor.id } } }
    : { collaboration: { company: { userId: actor.id } } };

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      collaboration: {
        select: {
          job: { select: { title: true } },
          company: { select: { name: true } },
          freelancer: { select: { user: { select: { name: true } } } },
        },
      },
    },
  });

  const paidCents = invoices.reduce(
    (sum, inv) => (inv.status === "PAID" ? sum + inv.totalCents : sum),
    0,
  );
  const openCents = invoices.reduce(
    (sum, inv) => (inv.status === "SENT" || inv.status === "OVERDUE" ? sum + inv.totalCents : sum),
    0,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Facturen</h1>
          <p className="text-sm text-muted-foreground">
            {isFreelancer
              ? "Je opgestelde en verzonden facturen."
              : "Ontvangen facturen van je samenwerkingen."}
          </p>
        </div>
        {isFreelancer && (
          <Button asChild>
            <Link href="/facturen/nieuw">
              <Plus className="size-4" aria-hidden /> Nieuwe factuur
            </Link>
          </Button>
        )}
      </header>

      {invoices.length > 0 && (
        <div className="flex gap-3">
          <Card className="flex-1">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">Betaald</p>
              <p className="text-lg font-semibold tabular-nums">{formatEuro(paidCents)}</p>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-muted-foreground">Openstaand</p>
              <p className="text-lg font-semibold tabular-nums">{formatEuro(openCents)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {invoices.length === 0 ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title={isFreelancer ? "Nog geen facturen" : "Nog geen facturen ontvangen"}
            description={
              isFreelancer ? "Stel een factuur op vanuit een actieve samenwerking." : undefined
            }
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {invoices.map((inv) => {
            const cascade = inv.lifecycleStatus != null;
            const href =
              cascade && inv.collaborationId
                ? `/samenwerkingen/${inv.collaborationId}`
                : `/facturen/${inv.id}`;
            const cascadeMeta = cascade
              ? CASCADE_LABEL[inv.lifecycleStatus as InvoiceLifecycleState]
              : null;
            const displayNumber = cascade
              ? (inv.partyInvoiceNumber ?? "Concept-factuur")
              : inv.number;
            return (
              <Link
                key={inv.id}
                href={href}
                className="card-interactive flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium tabular-nums">{displayNumber}</p>
                    {cascadeMeta ? (
                      <Badge variant={cascadeMeta.variant}>{cascadeMeta.label}</Badge>
                    ) : (
                      <InvoiceStatusBadge status={inv.status as InvoiceStatus} dueAt={inv.dueAt} />
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {isFreelancer
                      ? inv.collaboration?.company.name
                      : inv.collaboration?.freelancer.user.name}
                    {inv.collaboration?.job.title ? ` · ${inv.collaboration.job.title}` : ""}
                    {cascade ? " · via werkproces" : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatEuro(inv.totalCents)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
