"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WEEKDAYS, type Weekday } from "@/lib/enums";
import { WEEKDAY_LABEL_SHORT, WEEKDAY_LABEL_FULL } from "@/lib/weekdays";
import { setWeekdaysAction } from "./actions";

/**
 * Weekrooster vastleggen (ADR-0004): kies de weekdagen waarop bij deze opdrachtgever wordt gewerkt.
 * Zeven schakelbare pillen (ma–zo); geen selectie = "niet vastgelegd". De server bepaalt wie mag
 * opslaan (beide partijen + admin) en normaliseert de volgorde.
 */
export function WeekdaysForm({
  collaborationId,
  weekdays,
}: {
  collaborationId: string;
  weekdays: Weekday[];
}) {
  const [selected, setSelected] = useState<Set<Weekday>>(new Set(weekdays));

  function toggle(day: Weekday) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  return (
    <form action={setWeekdaysAction.bind(null, collaborationId)} className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {WEEKDAYS.map((day) => {
          const on = selected.has(day);
          return (
            <label
              key={day}
              className={`flex h-9 w-11 cursor-pointer select-none items-center justify-center rounded-md border text-sm font-medium capitalize transition-colors focus-within:ring-2 focus-within:ring-ring/50 ${
                on
                  ? "border-foreground bg-foreground text-background"
                  : "border-input bg-background text-muted-foreground hover:border-foreground/40"
              }`}
              title={WEEKDAY_LABEL_FULL[day]}
            >
              <input
                type="checkbox"
                name="weekdays"
                value={day}
                checked={on}
                onChange={() => toggle(day)}
                className="sr-only"
              />
              {WEEKDAY_LABEL_SHORT[day]}
            </label>
          );
        })}
      </div>
      <Button type="submit" size="sm" variant="secondary">
        Weekrooster opslaan
      </Button>
    </form>
  );
}
