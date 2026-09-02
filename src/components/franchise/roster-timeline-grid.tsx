import { cn } from "@/lib/utils";
import { formatDateShortNl } from "@/lib/format-date";
import { CELL_META, type CellState, type RosterTimeline } from "@/lib/franchise/roster-timeline";

// Read-only roosterbezetting-tijdlijn: rosterrijen × dagkolommen, elke cel gekleurd naar de
// afgeleide celtoestand (PLACED/UNAVAILABLE/LIMITED/AVAILABLE). Zuivere presentatie — alle
// afleiding gebeurt server-side in `buildRosterTimeline` (CLAUDE.md regel 1). Het raster scrollt
// horizontaal binnen zijn eigen container zodat de paginabody nooit meebeweegt op smalle schermen.

// Cel-tint (gevulde achtergrond + leesbare tekst) per toestand. Semantische tokens waar mogelijk;
// PLACED krijgt blauw zodat "ingezet" duidelijk verschilt van het groene "beschikbaar". Elk paar is
// leesbaar in licht én donker.
export const CELL_TONE: Record<CellState, string> = {
  AVAILABLE: "bg-success/15 text-success",
  LIMITED: "bg-warning/15 text-warning",
  PLACED: "bg-blue-500/15 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300",
  UNAVAILABLE: "bg-muted text-muted-foreground",
};

// Compacte kleurstip voor de legenda op de pagina — dezelfde kleurtaal als de cellen.
export const CELL_SWATCH: Record<CellState, string> = {
  AVAILABLE: "bg-success",
  LIMITED: "bg-warning",
  PLACED: "bg-blue-500 dark:bg-blue-400",
  UNAVAILABLE: "bg-muted-foreground/40",
};

/** Weergavevolgorde in de legenda: meest inzetbaar eerst. */
export const CELL_LEGEND_ORDER: CellState[] = ["AVAILABLE", "LIMITED", "PLACED", "UNAVAILABLE"];

// Presentatie-only weekdag-afkorting (bv. "ma") in Europe/Amsterdam. UTC-middernacht valt in
// Amsterdam op dezelfde kalenderdag (TZ ligt vóór op UTC) → geen dag-verschuiving.
function weekdayShortNl(date: Date): string {
  return date.toLocaleDateString("nl-NL", { weekday: "short", timeZone: "Europe/Amsterdam" });
}

function dayOfMonthNl(date: Date): string {
  return date.toLocaleDateString("nl-NL", { day: "numeric", timeZone: "Europe/Amsterdam" });
}

export function RosterTimelineGrid({ timeline }: { timeline: RosterTimeline }) {
  const { days, rows, perDayAvailable } = timeline;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          Roosterbezetting per ZZP&apos;er over de komende {days.length} dagen
        </caption>
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              ZZP&apos;er
            </th>
            {days.map((day) => (
              <th
                key={day.iso}
                scope="col"
                title={formatDateShortNl(day.date)}
                className={cn(
                  "px-1 py-2 text-center text-[11px] font-medium text-muted-foreground",
                  day.weekend && "bg-muted/40",
                )}
              >
                <span className="flex flex-col leading-tight">
                  <span className="uppercase">{weekdayShortNl(day.date)}</span>
                  <span className="tabular-nums text-foreground">{dayOfMonthNl(day.date)}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id}>
              <th
                scope="row"
                className="sticky left-0 z-10 bg-card px-3 py-2 text-left align-middle"
              >
                <div className="whitespace-nowrap font-medium text-foreground">
                  {row.name || "—"}
                </div>
                <div className="text-xs font-normal text-muted-foreground">
                  {row.availableDays} van {days.length} dagen vrij
                </div>
              </th>
              {row.cells.map((cell) => (
                <td key={cell.iso} className="px-1 py-1 text-center">
                  <span
                    title={CELL_META[cell.state].label}
                    aria-label={CELL_META[cell.state].label}
                    className={cn(
                      "inline-flex h-7 min-w-[2.75rem] items-center justify-center rounded px-1.5 text-[11px] font-medium",
                      CELL_TONE[cell.state],
                    )}
                  >
                    {CELL_META[cell.state].short}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <th
              scope="row"
              className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-xs font-medium text-muted-foreground"
            >
              Vrij per dag
            </th>
            {days.map((day, i) => (
              <td
                key={day.iso}
                className={cn(
                  "px-1 py-2 text-center text-[11px] tabular-nums text-muted-foreground",
                  day.weekend && "bg-muted/40",
                )}
              >
                {perDayAvailable[i]}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
