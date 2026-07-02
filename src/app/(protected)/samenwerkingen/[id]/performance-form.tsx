"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { segmentShifts, dutchHolidays, type Shift } from "@/lib/shift";
import { computeOrt, resolveOrtRates } from "@/lib/ort";
import { ORT_CATEGORY_LABEL, type OrtCategory } from "@/lib/config";
import { formatEuro } from "@/lib/invoices";
import { logAndSubmitPerformanceAction } from "./actions";
import { type ManualOrtField, type PerformanceFormDefaults } from "@/lib/performance-form";

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
  action,
  submitLabel = "Indienen ter goedkeuring",
  defaults,
  onResolved,
}: {
  collaborationId: string;
  rateCents: number | null;
  ortProfile: string | null;
  ortCustomRates: string | null;
  /** Eigen form-actie (bv. corrigeren-en-opnieuw-indienen); standaard = nieuw indienen. */
  action?: (prevState: string | null, formData: FormData) => Promise<string | null>;
  submitLabel?: string;
  /** Voorinvulling bij het corrigeren van een bestaande prestatie. */
  defaults?: PerformanceFormDefaults;
  /** Vuurt na een geslaagde indiening — gebruikt door het Actiecentrum (drawer sluiten + doorvloeien). */
  onResolved?: () => void;
}) {
  const [error, formAction, isPending] = useActionState(
    action ?? logAndSubmitPerformanceAction.bind(null, collaborationId),
    null,
  );
  // Succes-signaal: de actie geeft string|null terug (geen expliciet ok). Een geslaagde submit is
  // een pending→klaar-overgang die op null eindigt. Zo kan de drawer sluiten + doorvloeien.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !isPending && error === null) onResolved?.();
    wasPending.current = isPending;
  }, [isPending, error, onResolved]);
  // Eén of meer diensten; elke rij is een begin/eind-paar (client-side beheerd).
  const [rows, setRows] = useState<ShiftRow[]>(
    defaults?.shifts.length
      ? defaults.shifts.map((s, i) => ({ id: i, start: s.start, end: s.end }))
      : [{ id: 0, start: "", end: "" }],
  );
  const addShift = () =>
    setRows((r) => [...r, { id: (r[r.length - 1]?.id ?? 0) + 1, start: "", end: "" }]);
  const removeShift = (id: number) =>
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));
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
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end.getTime() <= start.getTime())
        continue;
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
              <select
                name="type"
                defaultValue={defaults?.type}
                className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="HOURS">Urenstaat (uurtarief)</option>
                <option value="MILESTONE">Oplevering (vast bedrag)</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">
                Uren (bij uurtarief, zonder diensten)
              </span>
              <input
                name="hours"
                type="number"
                step="0.25"
                min="0"
                placeholder="bv. 8"
                defaultValue={defaults?.hours}
                className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Periode van (bij uurtarief)</span>
              <DateInput name="periodStart" defaultValue={defaults?.periodStart} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Periode t/m (bij uurtarief)</span>
              <DateInput name="periodEnd" defaultValue={defaults?.periodEnd} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Bedrag € (bij oplevering)</span>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="bv. 2500"
                defaultValue={defaults?.amount}
                className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Titel oplevering</span>
              <input
                name="milestoneTitle"
                type="text"
                maxLength={120}
                placeholder="bv. Mijlpaal 1"
                defaultValue={defaults?.milestoneTitle}
                className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>
          <details className="text-sm" open>
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Diensten (begin/eind) — ORT wordt automatisch berekend
            </summary>
            <p className="mt-1 text-xs text-muted-foreground">
              Vul per dienst de begin- en eindtijd in; de avond-/nacht-/weekend-/feestdagtoeslag
              wordt automatisch afgeleid en over alle diensten opgeteld. Dit overschrijft de
              handmatige urenverdeling hieronder.
            </p>
            <div className="mt-2 space-y-2">
              {rows.map((row, i) => (
                <div key={row.id} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <label className="text-xs">
                    <span className="mb-1 block text-muted-foreground">Begin dienst</span>
                    <input
                      name="shiftStart"
                      type="datetime-local"
                      value={row.start}
                      onChange={(e) => setRow(row.id, { start: e.target.value })}
                      aria-label={`Begin dienst ${i + 1}`}
                      className="focus-ring w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="text-xs">
                    <span className="mb-1 block text-muted-foreground">Einde dienst</span>
                    <input
                      name="shiftEnd"
                      type="datetime-local"
                      value={row.end}
                      onChange={(e) => setRow(row.id, { end: e.target.value })}
                      aria-label={`Einde dienst ${i + 1}`}
                      className="focus-ring w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeShift(row.id)}
                    disabled={rows.length === 1}
                    aria-label={`Dienst ${i + 1} verwijderen`}
                    className="focus-ring mb-0.5 rounded-md border border-input p-2 text-muted-foreground hover:text-foreground disabled:opacity-40"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addShift}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-3.5" aria-hidden /> Dienst toevoegen
              </button>
            </div>

            {preview && (
              <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Berekende ORT (voorbeeld)
                </p>
                <table className="mt-1 w-full text-xs">
                  <tbody>
                    {(
                      preview.ort?.lines ??
                      preview.segments.map((s) => ({
                        category: s.category,
                        hours: s.hours,
                        surchargeBps: 0,
                        baseCents: 0,
                        surchargeCents: 0,
                        totalCents: 0,
                      }))
                    ).map((line, i) => (
                      <tr key={i} className="border-t border-border/40">
                        <td className="py-0.5">
                          {line.category === "NORMAL"
                            ? "Regulier"
                            : ORT_CATEGORY_LABEL[line.category as OrtCategory]}
                        </td>
                        <td className="py-0.5 text-right tabular-nums">{line.hours} u</td>
                        {preview.ort && (
                          <>
                            <td className="py-0.5 text-right tabular-nums text-muted-foreground">
                              {line.surchargeCents > 0
                                ? `+${formatEuro(line.surchargeCents)} (${Math.round(line.surchargeBps / 100)}%)`
                                : "—"}
                            </td>
                            <td className="py-0.5 text-right font-medium tabular-nums">
                              {formatEuro(line.totalCents)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {preview.ort && (
                    <tfoot>
                      <tr className="border-t border-border">
                        <td colSpan={3} className="py-0.5 font-medium">
                          Subtotaal excl. btw
                        </td>
                        <td className="py-0.5 text-right font-semibold tabular-nums">
                          {formatEuro(preview.ort.subtotalCents)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Richtbedrag op basis van het ingestelde profiel; de opdrachtgever keurt de
                  definitieve berekening goed.
                </p>
              </div>
            )}
          </details>
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Of: onregelmatige uren handmatig — avond/nacht/weekend/feestdag
            </summary>
            <p className="mt-1 text-xs text-muted-foreground">
              Vul uren per categorie in; de toeslag wordt automatisch op de factuur berekend. Laat
              leeg als je hierboven al een dienst hebt ingevuld of als alles regulier is.
            </p>
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
                  <input
                    name={name}
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="0"
                    defaultValue={defaults?.manualOrt[name as ManualOrtField]}
                    className="focus-ring w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                </label>
              ))}
            </div>
          </details>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Omschrijving</span>
            <input
              name="description"
              type="text"
              maxLength={500}
              placeholder="Periode of toelichting"
              defaultValue={defaults?.description}
              className="focus-ring w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Bezig..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
