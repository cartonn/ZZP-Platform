import { type Metadata } from "next";
import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro, invoiceableCollaborationsWhere } from "@/lib/invoices";
import { isInvoiceOutstanding } from "@/lib/administration/outstanding";
import { type InvoiceStatus } from "@/lib/enums";
import { type InvoiceLifecycleState } from "@/lib/lifecycles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

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
  // Cascade-bewust: cascade-facturen blijven status='DRAFT' en gelden als openstaand op hun
  // lifecycleStatus (SUBMITTED/APPROVED/OVERDUE) — alleen op `status` filteren mist ze allemaal.
  const openCents = invoices.reduce(
    (sum, inv) => (isInvoiceOutstanding(inv) ? sum + inv.totalCents : sum),
    0,
  );

  // "Nieuwe factuur" alleen tonen als er écht een samenwerking is om een LOSSE factuur uit op te
  // stellen (niet in de cascade). Anders loopt de knop dood op een lege keuzelijst — dezelfde regel
  // als /facturen/nieuw, gedeeld via invoiceableCollaborationsWhere.
  const canInvoice =
    isFreelancer &&
    (await prisma.collaboration.count({ where: invoiceableCollaborationsWhere(actor.id) })) > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Facturen"
        description={
          isFreelancer
            ? "Je opgestelde en verzonden facturen."
            : "Ontvangen facturen van je samenwerkingen."
        }
        action={
          canInvoice ? (
            <Button asChild>
              <Link href="/facturen/nieuw">
                <Plus className="size-4" aria-hidden /> Nieuwe factuur
              </Link>
            </Button>
          ) : undefined
        }
      />

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
              isFreelancer
                ? canInvoice
                  ? "Stel een factuur op vanuit een actieve samenwerking."
                  : "Zodra een opdracht tot een samenwerking leidt, kun je hier factureren."
                : undefined
            }
            action={
              isFreelancer
                ? canInvoice
                  ? { label: "Factuur opstellen", href: "/facturen/nieuw" }
                  : { label: "Bekijk opdrachten", href: "/opdrachten" }
                : undefined
            }
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {invoices.map((inv) => {
            const cascade = inv.lifecycleStatus != null;
            // Een rij in de facturenlijst toont factuurnummer + bedrag; klikken hoort het
            // factuurdetail te openen (met PDF/print), niet onverwacht naar het werkproces te springen.
            const href = `/facturen/${inv.id}`;
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
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums">
                    {formatEuro(inv.totalCents)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">incl. btw</span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
