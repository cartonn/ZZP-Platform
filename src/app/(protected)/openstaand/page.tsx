import { type Metadata } from "next";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { plural } from "@/lib/plural";
import {
  buildAgingReport,
  type OpenInvoice,
  AGING_BUCKETS,
  type AgingBucketKey,
} from "@/lib/administration/aging";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Openstaande posten · ZZP Platform" };

function bucketVariant(key: AgingBucketKey): "muted" | "warning" | "danger" {
  if (key === "d61_90" || key === "d90plus") return "danger";
  if (key === "d0_30" || key === "d31_60") return "warning";
  return "muted";
}

async function fetchOpenInvoices(actorId: string, isFreelancer: boolean): Promise<OpenInvoice[]> {
  const where = isFreelancer
    ? { collaboration: { freelancer: { userId: actorId } } }
    : { collaboration: { company: { userId: actorId } } };

  const invoices = await prisma.invoice.findMany({
    where,
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

  return invoices
    .filter((inv) => {
      const isCascade = inv.lifecycleStatus != null;
      if (isCascade) {
        return ["SUBMITTED", "APPROVED", "OVERDUE"].includes(inv.lifecycleStatus as string);
      }
      return ["SENT", "OVERDUE"].includes(inv.status as string);
    })
    .map((inv) => {
      const isCascade = inv.lifecycleStatus != null;
      const number = isCascade ? (inv.partyInvoiceNumber ?? inv.number) : inv.number;
      const counterpartyName = isFreelancer
        ? (inv.collaboration?.company.name ?? "—")
        : (inv.collaboration?.freelancer.user.name ?? "—");
      return {
        id: inv.id,
        number,
        counterpartyName,
        jobTitle: inv.collaboration?.job.title ?? null,
        dueAt: inv.dueAt,
        amountCents: inv.totalCents,
        collaborationId: inv.collaborationId,
        isCascade,
      };
    });
}

export default async function OpenstaandPage() {
  const actor = await requireActor();
  const isAdmin = actor.role === "ADMIN";
  const isFreelancer = actor.role === "FREELANCER";

  if (isAdmin) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-xl font-semibold tracking-tight">Openstaande posten</h1>
        </header>
        <Card>
          <EmptyState
            icon={Wallet}
            title="Geen openstaande posten"
            description="Beheerders hebben geen eigen openstaande posten."
          />
        </Card>
      </div>
    );
  }

  const openInvoices = await fetchOpenInvoices(actor.id, isFreelancer);
  const report = buildAgingReport(openInvoices, new Date());

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Openstaande posten</h1>
          <p className="text-sm text-muted-foreground">
            {isFreelancer
              ? "Facturen die je nog moet ontvangen, gerangschikt naar ouderdom."
              : "Facturen die je nog moet betalen, gerangschikt naar ouderdom."}
          </p>
        </div>
        {report.rows.length > 0 && (
          <a
            href="/api/administratie/openstaand"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Openstaand CSV
          </a>
        )}
      </header>

      {report.rows.length > 0 && (
        <>
          <div className="flex gap-3">
            <Card className="flex-1">
              <CardContent className="space-y-1 p-4">
                <p className="text-xs text-muted-foreground">Totaal openstaand</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatEuro(report.totalOpenCents)}
                </p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="space-y-1 p-4">
                <p className="text-xs text-muted-foreground">Waarvan te laat</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatEuro(report.overdueCents)}
                </p>
                {report.overdueCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {report.overdueCount} {report.overdueCount === 1 ? "post" : "posten"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {AGING_BUCKETS.map((b) => (
                    <th
                      key={b.key}
                      className="px-4 py-2 text-left text-xs font-medium text-muted-foreground"
                    >
                      {b.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {report.buckets.map((bucket) => (
                    <td key={bucket.key} className="px-4 py-3 tabular-nums">
                      <p className="font-semibold">{formatEuro(bucket.totalCents)}</p>
                      <p className="text-xs text-muted-foreground">
                        {bucket.count} {bucket.count === 1 ? "post" : "posten"}
                      </p>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {report.rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title="Geen openstaande posten"
            description={
              isFreelancer
                ? "Je hebt geen openstaande facturen om te ontvangen."
                : "Je hebt geen openstaande facturen om te betalen."
            }
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {report.rows.map((row) => {
            const href =
              row.isCascade && row.collaborationId
                ? `/samenwerkingen/${row.collaborationId}`
                : `/facturen/${row.id}`;
            return (
              <Link
                key={row.id}
                href={href}
                className="card-interactive flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium tabular-nums">{row.number}</p>
                    <Badge variant={bucketVariant(row.bucket)}>
                      {AGING_BUCKETS.find((b) => b.key === row.bucket)?.label}
                    </Badge>
                    {row.daysOverdue > 0 && (
                      <span className="text-xs text-danger">
                        {plural(row.daysOverdue, "dag", "dagen")} te laat
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.counterpartyName}
                    {row.jobTitle ? ` · ${row.jobTitle}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatEuro(row.amountCents)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
