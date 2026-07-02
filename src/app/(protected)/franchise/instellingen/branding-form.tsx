"use client";

import { useActionState, useState } from "react";
import { updateFranchiseBranding, type BrandingState } from "./actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";

export function BrandingForm({
  initialName,
  initialColor,
  initialFeePercent,
  initialOverflow,
}: {
  initialName: string;
  initialColor: string | null;
  initialFeePercent: number;
  initialOverflow: boolean;
}) {
  const [state, action, pending] = useActionState<BrandingState, FormData>(
    updateFranchiseBranding,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};
  const [color, setColor] = useState(initialColor ?? "");
  const valid = /^#[0-9a-fA-F]{6}$/.test(color);

  return (
    <form action={action} className="space-y-4">
      <Field label="Bemiddeling-naam" htmlFor="name" required error={fe.name}>
        <Input id="name" name="name" defaultValue={initialName} required />
      </Field>
      <Field
        label="Accentkleur"
        htmlFor="brandColor"
        hint="Getoond in de werkplek-header van je hele bemiddeling. Kies een kleur of laat leeg voor de standaard."
        error={fe.brandColor}
      >
        <div className="flex items-center gap-2">
          {/* Kleurkiezer stuurt het hex-tekstveld aan; het tekstveld (name="brandColor") blijft de
              enige form-waarde, zodat "leeg = standaard" en de bestaande validatie behouden blijven. */}
          <input
            type="color"
            aria-label="Kies accentkleur"
            value={valid ? color : "#2563eb"}
            onChange={(e) => setColor(e.target.value)}
            className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
          />
          <Input
            id="brandColor"
            name="brandColor"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#2563eb"
            className="max-w-28 font-mono"
          />
        </div>
      </Field>
      <Field
        label="Fee-percentage"
        htmlFor="feePercent"
        hint="Jouw marge als percentage van het doorgezette volume (0–50%, één decimaal). Zichtbaar als “Jouw fee” op je inzicht."
        error={fe.feePercent}
      >
        <div className="flex items-center gap-2">
          <Input
            id="feePercent"
            name="feePercent"
            type="number"
            inputMode="decimal"
            min={0}
            max={50}
            step={0.1}
            defaultValue={String(initialFeePercent)}
            className="max-w-32"
          />
          <span aria-hidden className="text-sm text-muted-foreground">
            %
          </span>
        </div>
      </Field>
      <label className="flex items-start gap-2.5 border-t border-border pt-4 text-sm">
        <input
          type="checkbox"
          name="openOverflow"
          defaultChecked={initialOverflow}
          className="mt-0.5 size-4 rounded border-input"
        />
        <span>
          <span className="font-medium">Diensten openstellen voor het hele platform</span>
          <span className="block text-xs text-muted-foreground">
            Onvervulde diensten van je franchise worden dan ook zichtbaar voor ZZP&apos;ers buiten
            je roster — betere vulgraad, minder exclusiviteit.
          </span>
        </span>
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Opslaan…" : "Opslaan"}
        </Button>
        <FormStatus success={state?.ok ? "Opgeslagen." : undefined} error={state?.error} />
      </div>
    </form>
  );
}
