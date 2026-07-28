"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type AvailabilityWindowType } from "@/lib/enums";
import { AvailabilityForm } from "./availability-form";
import { deleteAvailabilityWindow } from "./actions";

export type AvailabilityRow = {
  id: string;
  startLabel: string;
  endLabel: string;
  startIso: string;
  endIso: string;
  type: AvailabilityWindowType;
  hoursPerWeek: number | null;
  note: string | null;
};

const TYPE: Record<
  AvailabilityWindowType,
  { label: string; variant: "success" | "warning" | "muted" }
> = {
  AVAILABLE: { label: "Beschikbaar", variant: "success" },
  LIMITED: { label: "Beperkt", variant: "warning" },
  UNAVAILABLE: { label: "Niet beschikbaar", variant: "muted" },
};

export function AvailabilityRows({ rows }: { rows: AvailabilityRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {rows.map((w) => {
        if (editingId === w.id) {
          return (
            <div key={w.id} className="p-4">
              <AvailabilityForm
                initial={{
                  id: w.id,
                  startDate: w.startIso,
                  endDate: w.endIso,
                  type: w.type,
                  hoursPerWeek: w.hoursPerWeek,
                  note: w.note,
                }}
                onCancel={() => setEditingId(null)}
              />
            </div>
          );
        }
        const t = TYPE[w.type];
        return (
          <div key={w.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium tabular-nums">
                  {w.startLabel} — {w.endLabel}
                </p>
                <Badge variant={t.variant}>{t.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {w.hoursPerWeek != null ? `${w.hoursPerWeek} u/week` : "uren n.v.t."}
                {w.note ? ` · ${w.note}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Periode bewerken"
                onClick={() => setEditingId(w.id)}
              >
                <Pencil className="size-3.5" aria-hidden />
              </Button>
              <form action={deleteAvailabilityWindow.bind(null, w.id)}>
                <Button type="submit" variant="ghost" size="sm" aria-label="Periode verwijderen">
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </form>
            </div>
          </div>
        );
      })}
    </div>
  );
}
