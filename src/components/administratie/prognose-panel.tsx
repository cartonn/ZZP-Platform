import { CircleAlert, TrendingUp } from "lucide-react";
import { type Actor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { buildIncomeForecast, type ForecastItem, type ForecastStage } from "@/lib/income-forecast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type BadgeVariant = "muted" | "warning" | "danger" | "success";

function stageVariant(stage: ForecastStage): BadgeVariant {
  switch (stage) {
    case "OVERDUE":
      return "danger";
    case "APPROVED":
      return "success";
    case "SUBMITTED":
      return "muted";
    case "DRAFT":
      return "muted";
  }
}

function stageLabel(stage: ForecastStage): string {
  switch (stage) {
    case "DRAFT":
      return "Concept";
    case "SUBMITTED":
      return "In beoordeling";
    case "APPROVED":
      return "Goedgekeurd";
    case "OVERDUE":
      return "Te laat";
  }
}

function formatNlDate(date: Date): string {
  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Prognose-paneel: verwachte inkomsten van de ZZP'er op een tijdlijn, inclusief nog te factureren
 * concepten. Alleen FREELANCER (de route/hub gate't rol). Laadt zelf zijn data, rendert geen
 * eigen paginakop — de route en de Administratie-hub leveren de titel.
 */
export async function PrognosePanel({ actor }: { actor: Actor }) {
  // Cap: een prognose over de eerstvolgende ~200 open facturen is ruim voldoende;
  // oudste vervaldag eerst zodat de dichtstbijzijnde verwachting nooit buiten de cap valt.
  const invoices = await prisma.invoice.findMany({
    where: {
      collaboration: { freelancer: { userId: actor.id } },
      lifecycleStatus: { in: ["DRAFT", "SUBMITTED", "APPROVED", "OVERDUE"] },
    },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { id: "asc" }],
    take: 200,
    include: {
      collaboration: {
        select: {
          job: { select: { title: true } },
          company: { select: { name: true } },
        },
      },
    },
  });

  const items: ForecastItem[] = invoices.map((inv) => ({
    invoiceId: inv.id,
    stage: inv.lifecycleStatus as ForecastStage,
    netCents: inv.subtotalCents ?? 0,
    vatCents: inv.vatCents ?? 0,
    grossCents: inv.totalCents,
    expectedDate: inv.dueAt,
    counterpartyName: inv.collaboration?.company.name ?? "—",
    number: inv.partyInvoiceNumber ?? null,
    jobTitle: inv.collaboration?.job.title ?? null,
  }));

  const forecast = buildIncomeForecast(items, new Date());
  const hasItems = items.length > 0;

  if (!hasItems) {
    return (
      <Card>
        <EmptyState
          icon={TrendingUp}
          title="Nog geen verwachte inkomsten"
          description="Zodra je samenwerkingen en facturen aanmaakt, verschijnt hier je inkomstenprognose."
          action={{ label: "Naar samenwerkingen", href: "/samenwerkingen" }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Samenvattingsstrip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Nog te factureren
            </p>
            <p className="font-mono text-base font-semibold tabular-nums">
              {formatEuro(forecast.unbilledGrossCents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Onderweg
            </p>
            <p className="font-mono text-base font-semibold tabular-nums">
              {formatEuro(forecast.inFlightGrossCents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Te laat
            </p>
            <p className="font-mono text-base font-semibold tabular-nums text-danger">
              {formatEuro(forecast.overdueGrossCents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Totaal verwacht
            </p>
            <p className="font-mono text-base font-semibold tabular-nums">
              {formatEuro(forecast.totalGrossCents)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Buckets */}
      <div className="space-y-6">
        {forecast.buckets.map((bucket) => (
          <section key={bucket.key} className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {bucket.label}
              </h2>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {formatEuro(bucket.grossCents)}
              </span>
            </div>
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {bucket.items.map((item) => (
                <div
                  key={item.invoiceId}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{item.counterpartyName}</p>
                      <Badge variant={stageVariant(item.stage)}>{stageLabel(item.stage)}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      {item.jobTitle && <span className="truncate">{item.jobTitle}</span>}
                      {item.number && <span className="font-mono">{item.number}</span>}
                      {item.expectedDate && <span>{formatNlDate(item.expectedDate)}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                    {formatEuro(item.grossCents)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* BTW-hint */}
      {forecast.totalVatCents > 0 && (
        <p className="text-xs text-muted-foreground">
          Hiervan is{" "}
          <span className="font-medium tabular-nums">{formatEuro(forecast.totalVatCents)}</span> BTW
          — zet dit opzij.
        </p>
      )}

      {/* Disclaimer */}
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Dit is een prognose op basis van jouw factuurgegevens. Hieraan kun je geen rechten ontlenen
        op de werkelijke betaaldatum.
      </p>
    </div>
  );
}
