import Link from "next/link";

import { type WeekStrip } from "@/lib/week-strip";
import { WEEKDAY_LABEL_SHORT, WEEKDAY_LABEL_FULL } from "@/lib/weekdays";

/**
 * Weekrooster-strip (ma→zo) voor de dashboard-zone "Wat loopt er nu". Toont per kalenderdag de
 * samenwerkingen die er lopen als compacte dienstblokken; "vandaag" is geaccentueerd. Pure
 * presentatie — alle plaatsingslogica zit in `buildWeekStrip` (week-strip.ts). Server-component,
 * geen client-JS.
 */
export function WeekStripView({ strip }: { strip: WeekStrip }) {
  return (
    <div className="overflow-x-auto">
      <ol className="grid min-w-[40rem] grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {strip.days.map((day) => {
          const dayNum = day.date.getUTCDate();
          return (
            <li
              key={day.weekday}
              className={
                day.isToday
                  ? "flex min-h-28 flex-col bg-accent/10"
                  : "flex min-h-28 flex-col bg-card"
              }
            >
              <div className="flex items-baseline justify-between gap-1 border-b border-border px-2 py-1.5">
                <span
                  className={
                    day.isToday
                      ? "text-xs font-semibold uppercase tracking-wide text-accent"
                      : "text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  }
                  title={WEEKDAY_LABEL_FULL[day.weekday]}
                >
                  {WEEKDAY_LABEL_SHORT[day.weekday]}
                </span>
                <span
                  className={
                    day.isToday
                      ? "font-mono text-xs font-semibold text-accent"
                      : "font-mono text-xs text-muted-foreground"
                  }
                >
                  {dayNum}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1 p-1.5">
                {day.entries.length === 0 ? (
                  <span className="px-1 text-xs text-muted-foreground/50" aria-hidden>
                    —
                  </span>
                ) : (
                  day.entries.map((e) => (
                    <Link
                      key={e.collaborationId}
                      href={`/samenwerkingen/${e.collaborationId}`}
                      title={`${e.clientName} · ${e.jobTitle}`}
                      className="focus-ring block truncate rounded border border-border bg-muted/40 px-1.5 py-1 text-xs transition-colors hover:bg-muted"
                    >
                      {e.clientName}
                    </Link>
                  ))
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
