"use client";

import { useActionState } from "react";
import {
  approveShiftHandoff,
  type ShiftHandoffDecisionState,
} from "@/app/(protected)/admin/shift-overnames/actions";
import { Button } from "@/components/ui/button";

// Goedkeuring van een shift-overname-aanvraag (franchiser/admin). Een klein client-formulier met
// useActionState zodat een geweigerde/geraceerde beslissing inline verschijnt i.p.v. via de
// Next-foutgrens. Server-side blijft de waarheid (atomaire status-guard + tenant-isolatie).
export function ShiftHandoffApproveForm({ handoffId }: { handoffId: string }) {
  const [state, formAction, pending] = useActionState<ShiftHandoffDecisionState, FormData>(
    approveShiftHandoff.bind(null, handoffId),
    undefined,
  );

  if (state?.ok) {
    return <p className="text-xs font-medium text-success">Aanvraag goedgekeurd.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Button type="submit" size="sm" variant="primary" disabled={pending}>
        {pending ? "Bezig…" : "Goedkeuren"}
      </Button>
      {state?.error && <p className="text-xs font-medium text-danger">{state.error}</p>}
    </form>
  );
}
