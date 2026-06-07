import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleAlert, TrendingUp } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { buildIncomeForecast, type ForecastItem, type ForecastStage } from "@/lib/income-forecast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Inkomstenprognose · ZZP Platform" };

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

export default async function PrognosePage() {
  const actor = await requireActor();

  if (actor.role !== "FREELANCER") {
    redirect("/administratie");
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      collaboration: { freelancer: { userId: actor.id } },
      lifecycleStatus: { in: ["DRAFT", "SUBMITTED", "APPROVED", "OVERDUE"] },
    },
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Inkomstenprognose</h1>
        <p className="text-sm text-muted-foreground">
          Verwachte inkomsten op een tijdlijn — inclusief concepten die je nog moet factureren.
        </p>
      </header>

      {!hasItems ? (
        <Card>
          <EmptyState
            icon={TrendingUp}
            title="Nog geen verwachte inkomsten"
            description="Zodra je samenwerkingen en facturen aanmaakt, verschijnt hier je inkomstenprognose."
            action={{ label: "Naar samenwerkingen", href: "/samenwerkingen" }}
          />
        </Card>
      ) : (
        <>
          {/* Samenvattingsstrip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <CardContent className="space-y-1 p-4">
                <p className="text-xs text-muted-foreground">Nog te factureren</p>
                <p className="text-base font-semibold tabular-nums">
                  {formatEuro(forecast.unbilledGrossCents)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 p-4">
                <p className="text-xs text-muted-foreground">Onderweg</p>
                <p className="text-base font-semibold tabular-nums">
                  {formatEuro(forecast.inFlightGrossCents)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 p-4">
                <p className="text-xs text-muted-foreground">Te laat</p>
                <p className="text-base font-semibold tabular-nums text-danger">
                  {formatEuro(forecast.overdueGrossCents)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 p-4">
                <p className="text-xs text-muted-foreground">Totaal verwacht</p>
                <p className="text-base font-semibold tabular-nums">
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
                  <h2 className="text-sm font-semibold">{bucket.label}</h2>
                  <span className="text-sm tabular-nums text-muted-foreground">
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
                          <span>{item.number ?? "Concept"}</span>
                          {item.expectedDate && <span>{formatNlDate(item.expectedDate)}</span>}
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
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
              <span className="font-medium tabular-nums">{formatEuro(forecast.totalVatCents)}</span>{" "}
              BTW — zet dit opzij.
            </p>
          )}

          {/* Disclaimer */}
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Dit is een prognose op basis van jouw factuurgegevens. Hieraan kun je geen rechten
            ontlenen op de werkelijke betaaldatum.
          </p>
        </>
      )}
    </div>
  );
}
