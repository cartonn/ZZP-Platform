"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import { createInvoice, type InvoiceState } from "./actions";

type Line = { key: number; description: string; quantity: string; unit: string };
let counter = 0;
const newLine = (): Line => ({ key: counter++, description: "", quantity: "1", unit: "" });

export function InvoiceForm({
  collaborations,
}: {
  collaborations: { id: string; label: string }[];
}) {
  const [collaborationId, setCollaborationId] = useState(collaborations[0]?.id ?? "");
  const action = createInvoice.bind(null, collaborationId);
  const [state, formAction, isPending] = useActionState<InvoiceState, FormData>(action, undefined);
  const [lines, setLines] = useState<Line[]>([newLine()]);

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
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setLines((ls) => [...ls, newLine()])}
          >
            <Plus className="size-3.5" aria-hidden /> Regel
          </Button>
        </div>
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
