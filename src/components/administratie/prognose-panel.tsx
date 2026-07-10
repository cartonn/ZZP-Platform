import { CircleAlert, Clock, TrendingUp } from "lucide-react";
import { type Actor } from "@/lib/authz";
import { getForecastItemsForFreelancer } from "@/lib/data/income-forecast";
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

const MS_PER_DAY = 86_400_000;

/**
 * Aantal hele dagen dat de betaalgedrag-gecorrigeerde verwachting ná de contractuele vervaldag valt,
 * of `null` als er geen (latere) correctie is. Voedt de "verwacht later"-notitie per regel.
 */
function daysLaterThanDue(item: ForecastItem): number | null {
  if (item.realisticDate == null || item.expectedDate == null) return null;
  const diff = Math.round(
    (item.realisticDate.getTime() - item.expectedDate.getTime()) / MS_PER_DAY,
  );
  return diff > 0 ? diff : null;
}

/**
 * Prognose-paneel: verwachte inkomsten van de ZZP'er op een tijdlijn, inclusief nog te factureren
 * concepten. Alleen FREELANCER (de route/hub gate't rol). Laadt zelf zijn data (tenzij `items`
 * is meegegeven), rendert geen eigen paginakop — de route en de Administratie-hub leveren de titel.
 */
export async function PrognosePanel({ actor, items }: { actor: Actor; items?: ForecastItem[] }) {
  const forecastItems = items ?? (await getForecastItemsForFreelancer(actor.id));

  const forecast = buildIncomeForecast(forecastItems, new Date());
  const hasItems = forecastItems.length > 0;

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

      {/* Betaalgedrag-correctie: uitleg dat een deel van de verwachtingen op historisch betaalgedrag
          i.p.v. de vervaldag is geplaatst. */}
      {forecast.behaviorAdjustedCount > 0 && (
        <p className="flex items-start gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {forecast.behaviorAdjustedCount === 1
              ? "Eén verwachting is"
              : `${forecast.behaviorAdjustedCount} verwachtingen zijn`}{" "}
            op de tijdlijn geplaatst op basis van hoe deze opdrachtgever doorgaans betaalt — vaak
            later dan de vervaldag. Zo blijft je cashflow realistisch.
          </span>
        </p>
      )}

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
                      {(() => {
                        const laterDays = daysLaterThanDue(item);
                        // Toon de betaalgedrag-gecorrigeerde verwachte datum als die er is, anders de
                        // contractuele vervaldag.
                        const shownDate = item.realisticDate ?? item.expectedDate;
                        if (!shownDate) return null;
                        return (
                          <span className="inline-flex items-center gap-1">
                            {laterDays !== null && (
                              <Clock className="size-3 shrink-0" aria-hidden />
                            )}
                            {laterDays !== null ? "Verwacht rond " : ""}
                            {formatNlDate(shownDate)}
                            {laterDays !== null && (
                              <span className="text-[11px]">
                                · doorgaans {laterDays} {laterDays === 1 ? "dag" : "dagen"} na de
                                vervaldag
                              </span>
                            )}
                          </span>
                        );
                      })()}
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
