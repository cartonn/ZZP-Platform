import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { type InvoiceStatus } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { cancelInvoice, markInvoicePaid, sendInvoice } from "../actions";

export const metadata: Metadata = { title: "Factuur · ZZP Platform" };

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
      collaboration: {
        select: {
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
  const canSend = isFreelancerOwner && status === "DRAFT";
  const canCancel = isFreelancerOwner && (status === "DRAFT" || status === "SENT" || status === "OVERDUE");
  const canPay = isClient && (status === "SENT" || status === "OVERDUE");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/facturen" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden /> Terug naar facturen
      </Link>

      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight tabular-nums">Factuur {invoice.number}</h1>
              <p className="text-sm text-muted-foreground">{invoice.collaboration.job.title}</p>
            </div>
            <InvoiceStatusBadge status={status} dueAt={invoice.dueAt} />
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
            <tfoot>
              <tr>
                <td colSpan={3} className="py-2 text-right text-sm font-medium">Totaal</td>
                <td className="py-2 text-right font-semibold tabular-nums">{formatEuro(invoice.totalCents)}</td>
              </tr>
            </tfoot>
          </table>

          {(canSend || canCancel || canPay) && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
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
    </div>
  );
}
