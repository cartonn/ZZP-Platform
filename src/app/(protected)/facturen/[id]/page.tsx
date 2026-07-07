import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy, FileText } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { type InvoiceStatus } from "@/lib/enums";
import { type InvoiceLifecycleState } from "@/lib/lifecycles";
import { computeOrt, resolveOrtRates, type OrtSegment } from "@/lib/ort";
import { currentDunningStage } from "@/lib/payment-reminders";
import { buildAanmaningData } from "@/lib/aanmaning";
import { AanmaningSection } from "@/components/invoices/aanmaning-section";
import { ORT_CATEGORY_LABEL, type OrtCategory } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import { PaymentReminderButton } from "@/components/invoices/payment-reminder-button";
import { canSendPaymentReminder, isAwaitingPayment } from "@/lib/manual-payment-reminder";
import { cancelInvoice, markInvoicePaid, sendInvoice } from "../actions";
import { PrintButton } from "@/components/ui/print-button";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";

export const metadata: Metadata = { title: "Factuur · ZZP Platform" };

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

function fmt(d: Date | null) {
  return d ? formatDateShortNl(d) : "—";
}

function parseOrtSegments(json: string | null | undefined): OrtSegment[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as OrtSegment[];
  } catch {
    return [];
  }
}

export default async function FactuurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lines: true,
      performance: {
        select: {
          id: true,
          type: true,
          description: true,
          hours: true,
          rateCents: true,
          amountCents: true,
          milestoneTitle: true,
          approvedAt: true,
          periodStart: true,
          periodEnd: true,
          submittedAt: true,
          status: true,
          ortSegments: true,
        },
      },
      collaboration: {
        select: {
          id: true,
          ortProfile: true,
          ortCustomRates: true,
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
  const cascadeMeta = cascade
    ? CASCADE_LABEL[invoice.lifecycleStatus as InvoiceLifecycleState]
    : null;
  const canSend = !cascade && isFreelancerOwner && status === "DRAFT";
  const canCancel =
    !cascade &&
    isFreelancerOwner &&
    (status === "DRAFT" || status === "SENT" || status === "OVERDUE");
  const canPay = !cascade && isClient && (status === "SENT" || status === "OVERDUE");

  // Aanmaningsniveau (rustig informatief) voor te late cascade-facturen.
  const dunning =
    cascade && invoice.lifecycleStatus === "OVERDUE" ? currentDunningStage(invoice.dueAt) : null;

  // Handmatige betaalherinnering: mag de ZZP'er (crediteur) nú de opdrachtgever nudgen? Server is de
  // waarheid — de afkoelperiode leunt op de laatste herinnering uit het auditlogboek.
  const lifecycle = invoice.lifecycleStatus as InvoiceLifecycleState | null;
  const awaitingPayment = isFreelancerOwner && isAwaitingPayment(status, lifecycle);
  const lastReminder = awaitingPayment
    ? await prisma.auditLog.findFirst({
        where: { action: "INVOICE_REMINDER_SENT", entityId: invoice.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      })
    : null;
  const reminder = awaitingPayment
    ? canSendPaymentReminder({
        isFreelancerOwner: true,
        status,
        lifecycleStatus: lifecycle,
        issuedAt: invoice.issuedAt,
        dueAt: invoice.dueAt,
        lastReminderAt: lastReminder?.createdAt ?? null,
      })
    : null;

  // De ZZP'er (crediteur) kan voor een te late, onbetaalde factuur een aanmaning opstellen.
  const overdueForReminder =
    isFreelancerOwner &&
    invoice.dueAt != null &&
    invoice.dueAt.getTime() < Date.now() &&
    status !== "PAID" &&
    status !== "CANCELLED" &&
    !["PAID", "PROCESSED", "CREDITED"].includes(invoice.lifecycleStatus ?? "");

  return (
    <div className="space-y-6">
      <div className="print-hide flex items-center justify-between">
        <Link
          href="/facturen"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden /> Terug naar facturen
        </Link>
        <div className="flex items-center gap-2">
          {/* Handmatige factuur herhalen: één klik naar een vers concept met dezelfde regels
              (terugkerende maandfacturatie). Alleen de crediteur, niet voor cascade-facturen. */}
          {isFreelancerOwner && !cascade && (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/facturen/nieuw?from=${invoice.id}`}>
                <Copy className="size-4" aria-hidden /> Herhaal factuur
              </Link>
            </Button>
          )}
          <Button asChild variant="secondary" size="sm">
            <a href={`/api/facturen/${id}/pdf`} target="_blank" rel="noreferrer">
              <FileText className="size-4" aria-hidden /> Open als PDF
            </a>
          </Button>
          <PrintButton />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tabular-nums tracking-tight">
                Factuur {cascade ? (invoice.partyInvoiceNumber ?? "(concept)") : invoice.number}
              </h1>
              <p className="text-sm text-muted-foreground">{invoice.collaboration.job.title}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {cascadeMeta ? (
                <Badge variant={cascadeMeta.variant}>{cascadeMeta.label}</Badge>
              ) : (
                <InvoiceStatusBadge status={status} dueAt={invoice.dueAt} />
              )}
              {dunning && (
                <span className="text-xs text-muted-foreground">
                  {dunning.label} · {plural(dunning.daysOverdue, "dag", "dagen")} te laat
                </span>
              )}
            </div>
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotaal (excl. btw)</span>
                  <span className="tabular-nums">{formatEuro(invoice.subtotalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Btw{invoice.vatRegime ? ` (${invoice.vatRegime})` : ""}
                  </span>
                  <span className="tabular-nums">{formatEuro(invoice.vatCents)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Totaal (incl. btw)</span>
                  <span className="tabular-nums">{formatEuro(invoice.totalCents)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between font-semibold">
                <span>Totaal</span>
                <span className="tabular-nums">{formatEuro(invoice.totalCents)}</span>
              </div>
            )}
          </div>

          {(canSend || canCancel || canPay) && (
            <div className="print-hide flex flex-wrap gap-2 border-t border-border pt-4">
              {canSend && (
                <form action={sendInvoice.bind(null, invoice.id)}>
                  <Button type="submit" size="sm">
                    Versturen
                  </Button>
                </form>
              )}
              {canPay && (
                <form action={markInvoicePaid.bind(null, invoice.id)}>
                  <Button type="submit" size="sm">
                    Markeer als betaald
                  </Button>
                </form>
              )}
              {canCancel && (
                <form action={cancelInvoice.bind(null, invoice.id)}>
                  <Button type="submit" variant="destructive" size="sm">
                    Annuleren
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {awaitingPayment && reminder && (
        <Card className="print-hide">
          <CardContent className="space-y-2 py-4">
            <p className="text-sm font-medium">Wacht op betaling</p>
            <p className="text-xs text-muted-foreground">
              {reminder.daysOverdue > 0
                ? `Deze factuur is ${plural(reminder.daysOverdue, "dag", "dagen")} over de vervaldag.`
                : "Deze factuur staat nog open bij de opdrachtgever."}{" "}
              Stuur een korte herinnering; betaling verloopt rechtstreeks aan jou.
            </p>
            {reminder.eligible ? (
              <PaymentReminderButton invoiceId={invoice.id} />
            ) : reminder.reason === "cooldown" && reminder.nextAllowedAt ? (
              <p className="text-xs text-muted-foreground">
                Je hebt onlangs herinnerd. Opnieuw mogelijk vanaf{" "}
                <span className="tabular-nums">{fmt(reminder.nextAllowedAt)}</span>.
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {overdueForReminder && (
        <AanmaningSection
          data={buildAanmaningData({
            freelancerName: invoice.collaboration.freelancer.user.name ?? "",
            companyName: invoice.collaboration.company.name,
            invoiceNumber: invoice.partyInvoiceNumber ?? invoice.number,
            jobTitle: invoice.collaboration.job.title,
            issuedAt: invoice.issuedAt ?? invoice.createdAt,
            dueAt: invoice.dueAt,
            totalCents: invoice.totalCents,
          })}
        />
      )}

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
                    <p className="tabular-nums text-muted-foreground">
                      {invoice.performance.hours ?? 0} uur
                      {invoice.performance.rateCents
                        ? ` × ${formatEuro(invoice.performance.rateCents)}`
                        : ""}
                      {invoice.performance.amountCents
                        ? ` = ${formatEuro(invoice.performance.amountCents)}`
                        : ""}
                    </p>
                    {(() => {
                      const segs = parseOrtSegments(invoice.performance?.ortSegments);
                      if (segs.length === 0 || !invoice.performance?.rateCents) return null;
                      const ort = computeOrt(
                        segs,
                        invoice.performance.rateCents,
                        resolveOrtRates({
                          ortProfile: invoice.collaboration.ortProfile,
                          ortCustomRates: invoice.collaboration.ortCustomRates,
                        }),
                      );
                      return (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            ORT-uitsplitsing
                          </p>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-muted-foreground">
                                <th className="py-0.5 font-normal">Categorie</th>
                                <th className="py-0.5 text-right font-normal">Uren</th>
                                <th className="py-0.5 text-right font-normal">Basis</th>
                                <th className="py-0.5 text-right font-normal">Toeslag</th>
                                <th className="py-0.5 text-right font-normal">Totaal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ort.lines.map((line, i) => (
                                <tr key={i} className="border-t border-border/40">
                                  <td className="py-0.5">
                                    {line.category === "NORMAL"
                                      ? "Regulier"
                                      : ORT_CATEGORY_LABEL[line.category as OrtCategory]}
                                  </td>
                                  <td className="py-0.5 text-right tabular-nums">{line.hours}</td>
                                  <td className="py-0.5 text-right tabular-nums">
                                    {formatEuro(line.baseCents)}
                                  </td>
                                  <td className="py-0.5 text-right tabular-nums">
                                    {line.surchargeCents > 0
                                      ? `+${formatEuro(line.surchargeCents)} (${Math.round(line.surchargeBps / 100)}%)`
                                      : "—"}
                                  </td>
                                  <td className="py-0.5 text-right font-medium tabular-nums">
                                    {formatEuro(line.totalCents)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-border">
                                <td colSpan={4} className="py-0.5 font-medium">
                                  Subtotaal excl. btw
                                </td>
                                <td className="py-0.5 text-right font-semibold tabular-nums">
                                  {formatEuro(ort.subtotalCents)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      );
                    })()}
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
                      <p className="tabular-nums text-muted-foreground">
                        {formatEuro(invoice.performance.amountCents)}
                      </p>
                    )}
                    {invoice.performance.description && (
                      <p className="text-muted-foreground">{invoice.performance.description}</p>
                    )}
                  </>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {invoice.performance.submittedAt && (
                    <span>
                      Ingediend:{" "}
                      <span className="tabular-nums">{fmt(invoice.performance.submittedAt)}</span>
                    </span>
                  )}
                  {invoice.performance.approvedAt && (
                    <span>
                      Goedgekeurd:{" "}
                      <span className="tabular-nums">{fmt(invoice.performance.approvedAt)}</span>
                    </span>
                  )}
                </div>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
              Betaling verloopt rechtstreeks; het platform registreert alleen de status.
            </p>

            <Link
              href={`/samenwerkingen/${invoice.collaboration.id}`}
              className="inline-flex items-center gap-1 font-medium underline underline-offset-4"
            >
              Open de samenwerking →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
