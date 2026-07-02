"use client";

import { useActionState } from "react";
import { DateInput } from "@/components/ui/date-input";
import { INDIRECT_HOUR_CATEGORIES, INDIRECT_HOUR_CATEGORY_LABEL } from "@/lib/tax/indirect-hours";
import { addIndirectHours, type IndirectHoursState } from "./actions";

// Vandaag als standaardwaarde voor het datumveld (YYYY-MM-DD in lokale tijd).
function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function IndirectHoursForm() {
  const [state, action, isPending] = useActionState<IndirectHoursState, FormData>(
    addIndirectHours,
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      {state?.error ? (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Datum */}
        <div className="space-y-1">
          <label htmlFor="workedOn" className="block text-sm font-medium">
            Datum
          </label>
          <DateInput
            id="workedOn"
            name="workedOn"
            defaultValue={todayString()}
            max={todayString()}
            required
          />
        </div>

        {/* Uren */}
        <div className="space-y-1">
          <label htmlFor="hours" className="block text-sm font-medium">
            Uren
          </label>
          <input
            id="hours"
            name="hours"
            type="number"
            step="0.25"
            min="0.25"
            max="24"
            placeholder="bv. 1,5"
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Categorie */}
        <div className="space-y-1">
          <label htmlFor="category" className="block text-sm font-medium">
            Categorie
          </label>
          <select
            id="category"
            name="category"
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {INDIRECT_HOUR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {INDIRECT_HOUR_CATEGORY_LABEL[cat]}
              </option>
            ))}
          </select>
        </div>

        {/* Notitie */}
        <div className="space-y-1">
          <label htmlFor="note" className="block text-sm font-medium">
            Notitie <span className="font-normal text-muted-foreground">(optioneel)</span>
          </label>
          <input
            id="note"
            name="note"
            type="text"
            maxLength={280}
            placeholder="Korte omschrijving"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Opslaan…" : "Uren registreren"}
      </button>
    </form>
  );
}
