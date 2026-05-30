import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { type InvoiceStatus } from "@/lib/enums";
import { type InvoiceLifecycleState } from "@/lib/lifecycles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { cancelInvoice, markInvoicePaid, sendInvoice } from "../actions";
import { PrintButton } from "@/components/ui/print-button";

export const metadata: Metadata = { title: "Factuur · ZZP Platform" };

const CASCADE_LABEL: Record<InvoiceLifecycleState, { label: string; variant: "muted" | "warning" | "success" | "danger" }> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SUBMITTED: { label: "Ingediend", variant: "warning" },
  APPROVED: { label: "Goedgekeurd", variant: "success" },
  PAID: { label: "Betaald", variant: "success" },
  PROCESSED: { label: "Verwerkt", variant: "muted" },
  REJECTED: { label: "Afgekeurd", variant: "danger" },
  OVERDUE: { label: "Te laat", variant: "danger" },
  CREDITED: { label: "Gecrediteerd", variant: "danger" },
};

function fmt(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : "—";
}

export default async function FactuurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lines: true,
      performance: { select: { id: true, type: true, description: true, hours: true, rateCents: true, amountCents: true, milestoneTitle: true, approvedAt: true, periodStart: true, periodEnd: true, submittedAt: true, status: true } },
      collaboration: {
        select: {
          id: true,
          job: { select: { title: true } },
          company: { select: { name: true, userId: true } },
          freelancer: { select: { userId: true, user: { select: { name: true } } } },
        },
      },
    },
  });
  if (!invoice || !invoice.collaboration) notFound();

  const isFreelancerOwner = invoice.collaboration.freelancer.userId === actor.id;
  const isClient = invoice.collaboration.company.userId === actor.id;
  if (!isFreelancerOwner && !isClient) notFound();

  const status = invoice.status as InvoiceStatus;
  // Cascade-facturen worden via het werkproces afgehandeld; de legacy-acties verbergen we daar.
  const cascade = invoice.lifecycleStatus != null;
  const cascadeMeta = cascade ? CASCADE_LABEL[invoice.lifecycleStatus as InvoiceLifecycleState] : null;
  const canSend = !cascade && isFreelancerOwner && status === "DRAFT";
  const canCancel = !cascade && isFreelancerOwner && (status === "DRAFT" || status === "SENT" || status === "OVERDUE");
  const canPay = !cascade && isClient && (status === "SENT" || status === "OVERDUE");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between print-hide">
        <Link href="/facturen" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" aria-hidden /> Terug naar facturen
        </Link>
        <PrintButton />
      </div>

      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight tabular-nums">
                Factuur {cascade ? invoice.partyInvoiceNumber ?? "(concept)" : invoice.number}
              </h1>
              <p className="text-sm text-muted-foreground">{invoice.collaboration.job.title}</p>
            </div>
            {cascadeMeta ? <Badge variant={cascadeMeta.variant}>{cascadeMeta.label}</Badge> : <InvoiceStatusBadge status={status} dueAt={invoice.dueAt} />}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Van (ZZP&apos;er)</p>
              <p>{invoice.collaboration.freelancer.user.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Aan (opdrachtgever)</p>
              <p>{invoice.collaboration.company.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Factuurdatum</p>
              <p>{fmt(invoice.issuedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vervaldatum</p>
              <p>{fmt(invoice.dueAt)}</p>
            </div>
          </div>

          {invoice.lines.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 font-medium">Omschrijving</th>
                  <th className="py-2 text-right font-medium">Aantal</th>
                  <th className="py-2 text-right font-medium">Per stuk</th>
                  <th className="py-2 text-right font-medium">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((l) => (
                  <tr key={l.id} className="border-b border-border/60">
                    <td className="py-2">{l.description}</td>
                    <td className="py-2 text-right tabular-nums">{l.quantity}</td>
                    <td className="py-2 text-right tabular-nums">{formatEuro(l.unitCents)}</td>
                    <td className="py-2 text-right tabular-nums">{formatEuro(l.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Bedragen: BTW-uitsplitsing voor cascade-facturen, anders enkel totaal. */}
          <div className="space-y-1 border-t border-border pt-3 text-sm">
            {cascade && invoice.subtotalCents != null && invoice.vatCents != null ? (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotaal (excl. btw)</span><span className="tabular-nums">{formatEuro(invoice.subtotalCents)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Btw{invoice.vatRegime ? ` (${invoice.vatRegime})` : ""}</span><span className="tabular-nums">{formatEuro(invoice.vatCents)}</span></div>
                <div className="flex justify-between font-semibold"><span>Totaal (incl. btw)</span><span className="tabular-nums">{formatEuro(invoice.totalCents)}</span></div>
              </>
            ) : (
              <div className="flex justify-between font-semibold"><span>Totaal</span><span className="tabular-nums">{formatEuro(invoice.totalCents)}</span></div>
            )}
          </div>

          {(canSend || canCancel || canPay) && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4 print-hide">
              {canSend && (
                <form action={sendInvoice.bind(null, invoice.id)}>
                  <Button type="submit" size="sm">Versturen</Button>
                </form>
              )}
              {canPay && (
                <form action={markInvoicePaid.bind(null, invoice.id)}>
                  <Button type="submit" size="sm">Markeer als betaald</Button>
                </form>
              )}
              {canCancel && (
                <form action={cancelInvoice.bind(null, invoice.id)}>
                  <Button type="submit" variant="danger" size="sm">Annuleren</Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Herleidingsbewijs (§5): factuur → goedgekeurde prestatie → samenwerking/werkproces */}
      {cascade && (
        <Card>
          <CardContent className="space-y-3 py-4 text-sm">
            <p className="font-medium">Herleidingsbewijs</p>

            {invoice.performance ? (
              <div className="space-y-2">
                {invoice.performance.type === "HOURS" ? (
                  <>
                    <Badge variant="muted">Urenstaat</Badge>
                    {invoice.performance.periodStart && invoice.performance.periodEnd && (
                      <p className="text-muted-foreground">
                        Periode:{" "}
                        <span className="tabular-nums">{fmt(invoice.performance.periodStart)}</span>
                        {" t/m "}
                        <span className="tabular-nums">{fmt(invoice.performance.periodEnd)}</span>
                      </p>
                    )}
                    <p className="text-muted-foreground tabular-nums">
                      {invoice.performance.hours ?? 0} uur
                      {invoice.performance.rateCents ? ` × ${formatEuro(invoice.performance.rateCents)}` : ""}
                      {invoice.performance.amountCents ? ` = ${formatEuro(invoice.performance.amountCents)}` : ""}
                    </p>
                    {invoice.performance.description && (
                      <p className="text-muted-foreground">{invoice.performance.description}</p>
                    )}
                  </>
                ) : (
                  <>
                    <Badge variant="muted">Oplevering</Badge>
                    {invoice.performance.milestoneTitle && (
                      <p className="text-muted-foreground">{invoice.performance.milestoneTitle}</p>
                    )}
                    {invoice.performance.amountCents && (
                      <p className="text-muted-foreground tabular-nums">{formatEuro(invoice.performance.amountCents)}</p>
                    )}
                    {invoice.performance.description && (
                      <p className="text-muted-foreground">{invoice.performance.description}</p>
                    )}
                  </>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {invoice.performance.submittedAt && (
                    <span>Ingediend: <span className="tabular-nums">{fmt(invoice.performance.submittedAt)}</span></span>
                  )}
                  {invoice.performance.approvedAt && (
                    <span>Goedgekeurd: <span className="tabular-nums">{fmt(invoice.performance.approvedAt)}</span></span>
                  )}
                </div>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
              Betaling verloopt rechtstreeks; het platform registreert alleen de status.
            </p>

            <Link href={`/samenwerkingen/${invoice.collaboration.id}`} className="inline-flex items-center gap-1 font-medium underline underline-offset-4">
              Open het werkproces →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
