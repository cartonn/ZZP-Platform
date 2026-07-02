"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { proposeCollaboration, type ProposalState } from "@/app/(protected)/samenwerkingen/actions";

export type ProposeCollaborationLabels = {
  title: string;
  ratePlaceholder: string;
  rate: string;
  startDate: string;
  endDate: string;
  sending: string;
  send: string;
};

export function ProposeCollaboration({
  applicationId,
  labels,
}: {
  applicationId: string;
  labels: ProposeCollaborationLabels;
}) {
  const action = proposeCollaboration.bind(null, applicationId);
  const [state, formAction, isPending] = useActionState<ProposalState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium">{labels.title}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          name="rate"
          type="number"
          min={0}
          max={2000}
          placeholder={labels.ratePlaceholder}
          aria-label={labels.rate}
        />
        <DateInput name="startDate" aria-label={labels.startDate} />
        <DateInput name="endDate" aria-label={labels.endDate} />
      </div>
      {fe.endDate && (
        <p role="alert" className="text-xs text-danger">
          {fe.endDate}
        </p>
      )}
      {state?.error && !Object.keys(fe).length && (
        <p role="alert" className="text-xs text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? labels.sending : labels.send}
      </Button>
    </form>
  );
}
