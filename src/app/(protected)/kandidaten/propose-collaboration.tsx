"use client";

import { useActionState, useMemo, useState } from "react";
import { CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput, displayToIso } from "@/components/ui/date-input";
import { proposeCollaboration, type ProposalState } from "@/app/(protected)/samenwerkingen/actions";
import {
  isIsoDate,
  proposalDateConflicts,
  type UnavailableWindow,
} from "@/lib/proposal-availability";

export type ProposeCollaborationLabels = {
  title: string;
  ratePlaceholder: string;
  rate: string;
  startDate: string;
  endDate: string;
  sending: string;
  send: string;
  /** Kop van de conflict-waarschuwing (bevat de naam van de kandidaat). */
  conflictHeading: string;
  /** Verbindend woord tussen de twee datums in een periode-label ("t/m"). */
  conflictRange: string;
};

/**
 * Normaliseer een DateInput-onChange-waarde naar ISO (yyyy-mm-dd), leeg/ongeldig → "". Het
 * tekstveld levert dd-mm-jjjj; de kalender-picker levert al ISO — we accepteren beide zodat de
 * waarschuwing werkt ongeacht hoe de opdrachtgever de datum invult.
 */
function readIso(value: string): string {
  const trimmed = value.trim();
  if (isIsoDate(trimmed)) return trimmed;
  return displayToIso(trimmed) ?? "";
}

export function ProposeCollaboration({
  applicationId,
  labels,
  unavailableWindows = [],
}: {
  applicationId: string;
  labels: ProposeCollaborationLabels;
  /** Toekomstige UNAVAILABLE-vensters van de kandidaat, server-side voorberekend. */
  unavailableWindows?: UnavailableWindow[];
}) {
  const action = proposeCollaboration.bind(null, applicationId);
  const [state, formAction, isPending] = useActionState<ProposalState, FormData>(action, undefined);
  const fe = state?.fieldErrors ?? {};

  // Live spiegel van de ingevulde datums (ISO) om het conflict-signaal te berekenen. De DateInput
  // blijft uncontrolled; we lezen alleen de getypte waarde mee via onChange.
  const [startIso, setStartIso] = useState("");
  const [endIso, setEndIso] = useState("");

  const conflicts = useMemo(
    () => proposalDateConflicts(startIso, endIso, unavailableWindows),
    [startIso, endIso, unavailableWindows],
  );

  return (
    <form action={formAction} className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium">{labels.title}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          name="rate"
          type="number"
          min={1}
          max={2000}
          placeholder={labels.ratePlaceholder}
          aria-label={labels.rate}
        />
        <DateInput
          name="startDate"
          aria-label={labels.startDate}
          onChange={(e) => setStartIso(readIso(e.target.value))}
        />
        <DateInput
          name="endDate"
          aria-label={labels.endDate}
          onChange={(e) => setEndIso(readIso(e.target.value))}
        />
      </div>
      {conflicts.length > 0 && (
        <div
          role="status"
          className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-2.5 text-xs text-foreground"
        >
          <CalendarX2 className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          <div className="space-y-0.5">
            <p className="font-medium">{labels.conflictHeading}</p>
            <ul className="text-muted-foreground">
              {conflicts.map((w) => (
                <li key={`${w.startISO}-${w.endISO}`}>
                  {w.startLabel} {labels.conflictRange} {w.endLabel}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
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
