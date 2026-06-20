"use client";

import { useActionState, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { claimShift, type ClaimState } from "./actions";

/**
 * Directe claim/reactie vanuit de rooster-kalender. Standaard ingeklapt (één "Reageren"-knop);
 * uitgeklapt toont het een compacte motivatie + optioneel tariefvoorstel en verstuurt via de
 * `claimShift`-server-action. Bij succes blijft de ZZP'er op `/rooster`: de revalidatie verwisselt
 * de knop voor de "Gereageerd"-badge en deze bevestiging dekt het korte tussenmoment.
 */
export function ClaimShift({ jobId, title }: { jobId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ClaimState, FormData>(
    claimShift.bind(null, jobId),
    undefined,
  );
  const fe = state?.fieldErrors ?? {};

  if (state?.ok) {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
        <Check className="size-4 shrink-0" aria-hidden />
        Verstuurd
      </span>
    );
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Reageren
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full max-w-md space-y-3 rounded-lg border border-border bg-muted/30 p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">Reageren op «{title}»</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="focus-ring -m-1 rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label="Annuleren"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <Field label="Motivatie" htmlFor={`motivation-${jobId}`} required error={fe.motivation}>
        <Textarea
          id={`motivation-${jobId}`}
          name="motivation"
          rows={3}
          maxLength={2000}
          placeholder="Waarom past deze dienst bij jou?"
        />
      </Field>

      <Field
        label="Tariefvoorstel (€/uur)"
        htmlFor={`proposedRate-${jobId}`}
        error={fe.proposedRate}
      >
        <Input
          id={`proposedRate-${jobId}`}
          name="proposedRate"
          type="number"
          min={0}
          max={2000}
          placeholder="bijv. 85"
        />
      </Field>

      {state?.error && !Object.keys(fe).length && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Versturen…" : "Reactie versturen"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Annuleren
        </Button>
      </div>
    </form>
  );
}
