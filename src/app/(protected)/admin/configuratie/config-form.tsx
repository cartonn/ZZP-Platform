"use client";

import { useActionState } from "react";
import { type DbaThresholds } from "@/lib/platform-config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { updateDbaThresholds, type ConfigFormState } from "./actions";

export function ConfigForm({ thresholds }: { thresholds: DbaThresholds }) {
  const [state, formAction, pending] = useActionState<ConfigFormState, FormData>(
    updateDbaThresholds,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="Eerste duursignaal (maanden)"
        htmlFor="durationSignalMonths"
        error={state?.fieldErrors?.durationSignalMonths}
        hint="Verhoogd-risicosignaal bij opdrachten die langer dan dit aantal maanden lopen."
      >
        <Input
          id="durationSignalMonths"
          name="durationSignalMonths"
          type="number"
          min={1}
          max={60}
          defaultValue={thresholds.durationSignalMonths}
          required
          aria-required="true"
        />
      </Field>

      <Field
        label="Sterk duursignaal (maanden)"
        htmlFor="durationStrongSignalMonths"
        error={state?.fieldErrors?.durationStrongSignalMonths}
        hint="Hoog-risicosignaal bij opdrachten die langer dan dit aantal maanden lopen."
      >
        <Input
          id="durationStrongSignalMonths"
          name="durationStrongSignalMonths"
          type="number"
          min={1}
          max={60}
          defaultValue={thresholds.durationStrongSignalMonths}
          required
          aria-required="true"
        />
      </Field>

      <Field
        label="Omzetconcentratie drempel (%)"
        htmlFor="revenueConcentrationPct"
        error={state?.fieldErrors?.revenueConcentrationPct}
        hint="Verhoogd-risicosignaal als meer dan dit percentage van de omzet bij één opdrachtgever vandaan komt."
      >
        <Input
          id="revenueConcentrationPct"
          name="revenueConcentrationPct"
          type="number"
          min={1}
          max={100}
          defaultValue={thresholds.revenueConcentrationPct}
          required
          aria-required="true"
        />
      </Field>

      {state?.error && !state.fieldErrors && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      {state?.success && (
        <p role="status" className="text-sm text-success">
          Instellingen opgeslagen.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Opslaan…" : "Opslaan"}
        </Button>
      </div>
    </form>
  );
}
