"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { segmentShifts, dutchHolidays, type Shift } from "@/lib/shift";
import { computeOrt, resolveOrtRates } from "@/lib/ort";
import { ORT_CATEGORY_LABEL, type OrtCategory } from "@/lib/config";
import { formatEuro } from "@/lib/invoices";
import { logAndSubmitPerformanceAction } from "./actions";

interface ShiftRow {
  id: number;
  start: string;
  end: string;
}

export function PerformanceForm({
  collaborationId,
  rateCents,
  ortProfile,
  ortCustomRates,
}: {
  collaborationId: string;
  rateCents: number | null;
  ortProfile: string | null;
  ortCustomRates: string | null;
}) {
  const [error, formAction, isPending] = useActionState(
    logAndSubmitPerformanceAction.bind(null, collaborationId),
    null,
  );
  // Eén of meer diensten; elke rij is een begin/eind-paar (client-side beheerd).
  const [rows, setRows] = useState<ShiftRow[]>([{ id: 0, start: "", end: "" }]);
  const addShift = () => setRows((r) => [...r, { id: (r[r.length - 1]?.id ?? 0) + 1, start: "", end: "" }]);
  const removeShift = (id: number) => setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));
  const setRow = (id: number, patch: Partial<ShiftRow>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  // Live preview: leid de ORT-segmenten + subtotaal af terwijl je typt (zelfde motor als de server).
  const preview = useMemo(() => {
    const shifts: Shift[] = [];
    const years = new Set<number>();
    for (const row of rows) {
      if (!row.start || !row.end) continue;
      const start = new Date(row.start);
      const end = new Date(row.end);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end.getTime() <= start.getTime()) continue;
      shifts.push({ start, end });
      years.add(start.getFullYear());
      years.add(end.getFullYear());
    }
    if (shifts.length === 0) return null;
    const holidays = new Set<string>();
    for (const y of years) for (const k of dutchHolidays(y)) holidays.add(k);
    const rates = resolveOrtRates({ ortProfile, ortCustomRates });
    const segments = segmentShifts(shifts, { rates, holidays });
    if (segments.length === 0) return null;
    const ort = rateCents != null ? computeOrt(segments, rateCents, rates) : null;
    return { segments, ort };
  }, [rows, rateCents, ortProfile, ortCustomRates]);

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
              <span className="mb-1 block text-muted-foreground">Uren (bij uurtarief, zonder diensten)</span>
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
          <details className="text-sm" open>
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Diensten (begin/eind) — ORT wordt automatisch berekend</summary>
            <p className="mt-1 text-xs text-muted-foreground">Vul per dienst de begin- en eindtijd in; de avond-/nacht-/weekend-/feestdagtoeslag wordt automatisch afgeleid en over alle diensten opgeteld. Dit overschrijft de handmatige urenverdeling hieronder.</p>
            <div className="mt-2 space-y-2">
              {rows.map((row) => (
                <div key={row.id} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <label className="text-xs">
                    <span className="mb-1 block text-muted-foreground">Begin dienst</span>
                    <input
                      name="shiftStart"
                      type="datetime-local"
                      value={row.start}
                      onChange={(e) => setRow(row.id, { start: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="text-xs">
                    <span className="mb-1 block text-muted-foreground">Einde dienst</span>
                    <input
                      name="shiftEnd"
                      type="datetime-local"
                      value={row.end}
                      onChange={(e) => setRow(row.id, { end: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeShift(row.id)}
                    disabled={rows.length === 1}
                    aria-label="Dienst verwijderen"
                    className="mb-0.5 rounded-md border border-input p-2 text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addShift} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Plus className="size-3.5" aria-hidden /> Dienst toevoegen
              </button>
            </div>

            {preview && (
              <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">Berekende ORT (voorbeeld)</p>
                <table className="mt-1 w-full text-xs">
                  <tbody>
                    {(preview.ort?.lines ?? preview.segments.map((s) => ({ category: s.category, hours: s.hours, surchargeBps: 0, baseCents: 0, surchargeCents: 0, totalCents: 0 }))).map((line, i) => (
                      <tr key={i} className="border-t border-border/40">
                        <td className="py-0.5">{line.category === "NORMAL" ? "Regulier" : ORT_CATEGORY_LABEL[line.category as OrtCategory]}</td>
                        <td className="py-0.5 text-right tabular-nums">{line.hours} u</td>
                        {preview.ort && (
                          <>
                            <td className="py-0.5 text-right tabular-nums text-muted-foreground">
                              {line.surchargeCents > 0 ? `+${formatEuro(line.surchargeCents)} (${Math.round(line.surchargeBps / 100)}%)` : "—"}
                            </td>
                            <td className="py-0.5 text-right tabular-nums font-medium">{formatEuro(line.totalCents)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {preview.ort && (
                    <tfoot>
                      <tr className="border-t border-border">
                        <td colSpan={3} className="py-0.5 font-medium">Subtotaal excl. btw</td>
                        <td className="py-0.5 text-right tabular-nums font-semibold">{formatEuro(preview.ort.subtotalCents)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
                <p className="mt-1 text-[11px] text-muted-foreground">Richtbedrag op basis van het ingestelde profiel; de opdrachtgever keurt de definitieve berekening goed.</p>
              </div>
            )}
          </details>
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Of: onregelmatige uren handmatig — avond/nacht/weekend/feestdag</summary>
            <p className="mt-1 text-xs text-muted-foreground">Vul uren per categorie in; de toeslag wordt automatisch op de factuur berekend. Laat leeg als je hierboven al een dienst hebt ingevuld of als alles regulier is.</p>
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
