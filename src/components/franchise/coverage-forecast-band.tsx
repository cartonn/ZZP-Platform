import { CalendarRange, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { type CoverageForecast } from "@/lib/franchise/coverage-forecast";

// Vooruitkijkende dekkingsband op /franchise/diensten: per komende roosterweek de dekking van de
// gepubliceerde diensten, met een vroeg signaal welke week dreigt onder te bezetten. Presentationeel
// (server-component, geen client-JS); verbergt zichzelf zodra er niets vooruit te plannen valt.

function weekLabel(weekOffset: number, weekStart: Date): string {
  if (weekOffset === 0) return "Deze week";
  if (weekOffset === 1) return "Volgende week";
  return `Week van ${formatDateShortNl(weekStart)}`;
}

export function CoverageForecastBand({ forecast }: { forecast: CoverageForecast }) {
  const { weeks, horizonWeeks, openWithinHorizon, firstGapWeekOffset, laterOpen, undatedOpen } =
    forecast;

  // Niets vooruit te plannen → niets tonen (rustige pagina).
  if (weeks.length === 0 && laterOpen === 0 && undatedOpen === 0) return null;

  const gapWeek =
    firstGapWeekOffset != null ? weeks.find((w) => w.weekOffset === firstGapWeekOffset) : undefined;

  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <div className="flex items-center gap-2">
          <CalendarRange className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dekkingsprognose · komende {horizonWeeks} weken
          </p>
        </div>

        {gapWeek ? (
          <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <p className="text-sm text-foreground">
              {weekLabel(gapWeek.weekOffset, gapWeek.weekStart).toLowerCase()} dreigt onderbezetting
              — {plural(openWithinHorizon, "dienst", "diensten")} nog open binnen de prognose.
              Benader op tijd extra ZZP&apos;ers of stel het tarief bij.
            </p>
          </div>
        ) : weeks.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Alle ingeroosterde diensten in de prognose zijn gevuld.
          </p>
        ) : null}

        {weeks.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {weeks.map((w) => (
              <li
                key={w.weekOffset}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {weekLabel(w.weekOffset, w.weekStart)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {w.filled} van {plural(w.total, "dienst", "diensten")} gevuld
                  </p>
                </div>
                {w.open > 0 ? (
                  <Badge variant="warning">{w.open} open</Badge>
                ) : (
                  <Badge variant="success">Gevuld</Badge>
                )}
              </li>
            ))}
          </ul>
        )}

        {(laterOpen > 0 || undatedOpen > 0) && (
          <div className="space-y-1 text-xs text-muted-foreground">
            {laterOpen > 0 && (
              <p>
                Nog {plural(laterOpen, "open dienst", "open diensten")} ná de komende {horizonWeeks}{" "}
                weken.
              </p>
            )}
            {undatedOpen > 0 && (
              <p>
                {plural(undatedOpen, "open dienst heeft", "open diensten hebben")} geen startdatum —
                plan een startdatum in om mee te tellen in de prognose.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
