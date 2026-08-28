import { CalendarClock, CircleAlert, TrendingUp } from "lucide-react";
import { formatEuro } from "@/lib/invoices";
import { type BookedRevenueForecast } from "@/lib/booked-revenue-forecast";
import { Card, CardContent } from "@/components/ui/card";

function formatNlDate(date: Date): string {
  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Geboekte-omzet-vooruitblik: hoeveel inkomen zit al vást in lopende samenwerkingen, en tot wanneer
 * is de agenda gevuld? Toont boven het PrognosePanel op /prognose (alleen FREELANCER — de route
 * gate't de rol). Puur presentatie: de forecast wordt server-side geladen en meegegeven.
 *
 * Zonder bijdrage (geen geschatte waarde én geen doorlopende samenwerking) rendert de kaart niets —
 * de pagina blijft rustig en het paginabrede lege-scherm ligt bij het PrognosePanel.
 */
export function BookedRevenueCard({ forecast }: { forecast: BookedRevenueForecast }) {
  if (forecast.contributingCount === 0 && forecast.openEndedCount === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        {/* Kop + hoofd-KPI */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <TrendingUp className="size-3.5 shrink-0" aria-hidden />
              Al geboekt
            </p>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {formatEuro(forecast.totalBookedCents)}
            </p>
            <p className="text-xs text-muted-foreground">Geboekt (nog te leveren)</p>
          </div>
        </div>

        {/* Runway-regel */}
        {forecast.runwayUntil && (
          <p className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
            <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              Je agenda is gevuld tot{" "}
              <span className="font-medium">{formatNlDate(forecast.runwayUntil)}</span>
            </span>
            {forecast.runwayDays !== null && (
              <span className="text-xs text-muted-foreground">
                · nog {forecast.runwayDays} {forecast.runwayDays === 1 ? "dag" : "dagen"}
              </span>
            )}
          </p>
        )}

        {/* Maand-uitsplitsing */}
        {forecast.months.length > 0 && (
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {forecast.months.map((month) => (
              <div key={month.key} className="flex items-center justify-between gap-4 px-3 py-2">
                <span className="text-sm capitalize">{month.label}</span>
                <span className="font-mono text-sm tabular-nums">{formatEuro(month.cents)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Doorlopende samenwerkingen zonder einddatum */}
        {forecast.openEndedCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {forecast.openEndedCount === 1
              ? "1 doorlopende samenwerking"
              : `${forecast.openEndedCount} doorlopende samenwerkingen`}{" "}
            zonder einddatum — niet in de schatting.
          </p>
        )}

        {/* Disclaimer */}
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Schatting op basis van tarief × 8 uur per werkdag × geplande werkdagen. Hieraan kun je
          geen rechten ontlenen.
        </p>
      </CardContent>
    </Card>
  );
}
