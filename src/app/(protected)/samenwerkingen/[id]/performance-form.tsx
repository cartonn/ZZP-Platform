"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { logAndSubmitPerformanceAction } from "./actions";

export function PerformanceForm({ collaborationId }: { collaborationId: string }) {
  const [error, formAction, isPending] = useActionState(
    logAndSubmitPerformanceAction.bind(null, collaborationId),
    null,
  );

  return (
    <Card>
      <CardContent className="py-4">
        <form action={formAction} className="space-y-3">
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Type</span>
              <select name="type" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="HOURS">Urenstaat (uurtarief)</option>
                <option value="MILESTONE">Oplevering (vast bedrag)</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Uren (bij uurtarief)</span>
              <input name="hours" type="number" step="0.25" min="0" placeholder="bv. 8" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Periode van (bij uurtarief)</span>
              <input name="periodStart" type="date" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Periode t/m (bij uurtarief)</span>
              <input name="periodEnd" type="date" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Bedrag € (bij oplevering)</span>
              <input name="amount" type="number" step="0.01" min="0" placeholder="bv. 2500" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Titel oplevering</span>
              <input name="milestoneTitle" type="text" maxLength={120} placeholder="bv. Mijlpaal 1" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </label>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Onregelmatige uren (ORT) — avond/nacht/weekend/feestdag</summary>
            <p className="mt-1 text-xs text-muted-foreground">Vul uren per categorie in; de toeslag wordt automatisch op de factuur berekend. Laat leeg als alles regulier is.</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {[
                ["ort_normal", "Regulier"],
                ["ort_evening", "Avond"],
                ["ort_night", "Nacht"],
                ["ort_saturday", "Zaterdag"],
                ["ort_sunday", "Zondag"],
                ["ort_holiday", "Feestdag"],
              ].map(([name, label]) => (
                <label key={name} className="text-xs">
                  <span className="mb-1 block text-muted-foreground">{label}</span>
                  <input name={name} type="number" step="0.25" min="0" placeholder="0" className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" />
                </label>
              ))}
            </div>
          </details>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Omschrijving</span>
            <input name="description" type="text" maxLength={500} placeholder="Periode of toelichting" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </label>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Bezig..." : "Indienen ter goedkeuring"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
