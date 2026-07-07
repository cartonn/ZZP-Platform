"use client";

import { useActionState, useState } from "react";
import { Car, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import { createInvoice, type InvoiceState } from "./actions";
import { buildMileageLine, centsToEuroInput } from "@/lib/mileage";
import { eurosToCents } from "@/lib/invoices";
import { MILEAGE_RATE_CENTS } from "@/lib/config";

type Line = { key: number; description: string; quantity: string; unit: string };
let counter = 0;
const newLine = (): Line => ({ key: counter++, description: "", quantity: "1", unit: "" });
const lineFrom = (description: string, quantity: string, unit: string): Line => ({
  key: counter++,
  description,
  quantity,
  unit,
});

export type InvoiceFormInitialLine = { description: string; quantity: string; unit: string };

export function InvoiceForm({
  collaborations,
  initialCollaborationId,
  initialLines,
}: {
  collaborations: { id: string; label: string }[];
  initialCollaborationId?: string;
  initialLines?: InvoiceFormInitialLine[];
}) {
  // Preselecteer de meegegeven samenwerking alleen als die (nog) factureerbaar is; anders de eerste.
  const [collaborationId, setCollaborationId] = useState(
    initialCollaborationId && collaborations.some((c) => c.id === initialCollaborationId)
      ? initialCollaborationId
      : (collaborations[0]?.id ?? ""),
  );
  const action = createInvoice.bind(null, collaborationId);
  const [state, formAction, isPending] = useActionState<InvoiceState, FormData>(action, undefined);
  const [lines, setLines] = useState<Line[]>(
    initialLines && initialLines.length > 0
      ? initialLines.map((l) => lineFrom(l.description, l.quantity, l.unit))
      : [newLine()],
  );

  // Reiskosten-declaratie: kilometers × tarief per km → één nette factuurregel.
  const [mileageOpen, setMileageOpen] = useState(false);
  const [mileageKm, setMileageKm] = useState("");
  const [mileageRate, setMileageRate] = useState(centsToEuroInput(MILEAGE_RATE_CENTS));
  const [mileageError, setMileageError] = useState<string | null>(null);

  const addMileage = () => {
    const result = buildMileageLine({
      kilometers: Number(mileageKm),
      ratePerKmCents: Number.isFinite(Number(mileageRate))
        ? eurosToCents(Number(mileageRate))
        : NaN,
    });
    if (!result.ok) {
      setMileageError(result.error);
      return;
    }
    const { line } = result;
    setLines((ls) => [
      ...ls,
      lineFrom(line.description, String(line.kilometers), centsToEuroInput(line.ratePerKmCents)),
    ]);
    setMileageKm("");
    setMileageRate(centsToEuroInput(MILEAGE_RATE_CENTS));
    setMileageError(null);
    setMileageOpen(false);
  };

  const total = lines.reduce((sum, l) => {
    const q = Number(l.quantity) || 0;
    const u = Number(l.unit) || 0;
    return sum + q * u;
  }, 0);

  const update = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  if (collaborations.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Je hebt nog geen samenwerking om op te factureren. Een factuur stel je op vanuit een lopende
        samenwerking.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Samenwerking" htmlFor="collab">
          <Select
            id="collab"
            value={collaborationId}
            onChange={(e) => setCollaborationId(e.target.value)}
          >
            {collaborations.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Vervaldatum"
          htmlFor="dueAt"
          error={state?.fieldErrors?.dueAt}
          hint="Leeg = 14 dagen na versturen."
        >
          <DateInput id="dueAt" name="dueAt" />
        </Field>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Regels</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setMileageError(null);
                setMileageOpen((v) => !v);
              }}
              aria-expanded={mileageOpen}
            >
              <Car className="size-3.5" aria-hidden /> Reiskosten
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setLines((ls) => [...ls, newLine()])}
            >
              <Plus className="size-3.5" aria-hidden /> Regel
            </Button>
          </div>
        </div>

        {mileageOpen && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              Kilometers × tarief per km wordt één factuurregel. Standaard is het belastingvrije
              tarief van {centsToEuroInput(MILEAGE_RATE_CENTS).replace(".", ",")} per km — pas het
              gerust aan.
            </p>
            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <Field label="Kilometers" htmlFor="mileageKm">
                <Input
                  id="mileageKm"
                  type="number"
                  min={1}
                  step="1"
                  inputMode="numeric"
                  value={mileageKm}
                  onChange={(e) => setMileageKm(e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="€ per km" htmlFor="mileageRate">
                <Input
                  id="mileageRate"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={mileageRate}
                  onChange={(e) => setMileageRate(e.target.value)}
                />
              </Field>
              <Button type="button" size="sm" onClick={addMileage}>
                Toevoegen
              </Button>
            </div>
            {mileageError && (
              <p role="alert" className="text-sm text-danger">
                {mileageError}
              </p>
            )}
          </div>
        )}
        {lines.map((l) => (
          <div key={l.key} className="grid grid-cols-[1fr_4rem_6rem_auto] items-center gap-2">
            <Input
              name="lineDescription"
              value={l.description}
              onChange={(e) => update(l.key, { description: e.target.value })}
              placeholder="Omschrijving"
              maxLength={200}
            />
            <Input
              name="lineQuantity"
              type="number"
              min={1}
              value={l.quantity}
              onChange={(e) => update(l.key, { quantity: e.target.value })}
              aria-label="Aantal"
            />
            <Input
              name="lineUnit"
              type="number"
              min={0}
              step="0.01"
              value={l.unit}
              onChange={(e) => update(l.key, { unit: e.target.value })}
              placeholder="€/stuk"
              aria-label="Tarief per stuk"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Regel verwijderen"
              onClick={() =>
                setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls))
              }
            >
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">Totaal (concept)</span>
        <span className="text-sm font-semibold tabular-nums">
          € {total.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Opslaan…" : "Factuur opstellen (concept)"}
      </Button>
    </form>
  );
}
