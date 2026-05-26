"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { proposeCollaboration, type ProposalState } from "@/app/(protected)/samenwerkingen/actions";

export function ProposeCollaboration({ applicationId }: { applicationId: string }) {
  const action = proposeCollaboration.bind(null, applicationId);
  const [state, formAction, isPending] = useActionState<ProposalState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium">Samenwerking voorstellen</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input name="rate" type="number" min={0} max={2000} placeholder="Tarief €/uur" aria-label="Tarief" />
        <Input name="startDate" type="date" aria-label="Startdatum" />
        <Input name="endDate" type="date" aria-label="Einddatum" />
      </div>
      {fe.endDate && <p role="alert" className="text-xs text-danger">{fe.endDate}</p>}
      {state?.error && !Object.keys(fe).length && <p role="alert" className="text-xs text-danger">{state.error}</p>}
      <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Versturen…" : "Voorstel versturen"}</Button>
    </form>
  );
}
