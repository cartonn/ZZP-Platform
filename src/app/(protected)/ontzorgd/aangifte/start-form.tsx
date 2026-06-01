"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { startFiling, type FilingState } from "./actions";

const CURRENT_YEAR = new Date().getUTCFullYear();

/** Consent-flow: granulaire, losse toestemming (geen voorgevinkte vakjes) + middel/jaar + machtigingsvorm. */
export function StartFilingForm() {
  const [state, formAction, isPending] = useActionState<FilingState, FormData>(
    startFiling,
    undefined,
  );
  const [kind, setKind] = useState<"IB" | "BTW">("IB");

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1">
          <span className="block text-sm font-medium">Aangifte</span>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as "IB" | "BTW")}
            className="focus-ring h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="IB">Inkomstenbelasting</option>
            <option value="BTW">BTW (kwartaal)</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">Belastingjaar</span>
          <select
            name="taxYear"
            defaultValue={CURRENT_YEAR}
            className="focus-ring h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value={CURRENT_YEAR}>{CURRENT_YEAR}</option>
            <option value={CURRENT_YEAR - 1}>{CURRENT_YEAR - 1}</option>
          </select>
        </label>
        {kind === "BTW" && (
          <label className="space-y-1">
            <span className="block text-sm font-medium">Kwartaal</span>
            <select
              name="quarter"
              defaultValue={1}
              className="focus-ring h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>
                  Q{q}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="space-y-1">
        <span className="block text-sm font-medium">Machtigingsvorm</span>
        <select
          name="mandateKind"
          defaultValue="DIGID"
          className="focus-ring h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="DIGID">DigiD machtigen (eenmanszaak/zzp)</option>
          <option value="EHERKENNING">eHerkenning-ketenmachtiging</option>
        </select>
      </label>

      <fieldset className="space-y-2 rounded-md border border-border p-3">
        <legend className="px-1 text-xs font-medium text-muted-foreground">Jouw akkoord</legend>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consentDpa" className="mt-0.5" />
          <span>
            Ik ga akkoord met de verwerkersovereenkomst voor het verwerken van mijn fiscale
            gegevens.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consentShare" className="mt-0.5" />
          <span>
            Ik geef toestemming om mijn dossier te delen met het aangesloten belastingkantoor.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consentMandate" className="mt-0.5" />
          <span>
            Ik machtig het belastingkantoor om voor dit middel en jaar namens mij aangifte te doen.
          </span>
        </label>
      </fieldset>

      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Bezig…" : "Start mijn aangifte"}
      </Button>
    </form>
  );
}
