"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus, Check, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EngageabilityBadge } from "@/components/engageability-badge";
import { proposeFreelancer, type ProposeState } from "../actions";
import { type RosterCandidate } from "@/lib/franchise/dienst-voordracht";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={disabled || pending}>
      <UserPlus className="size-3.5" aria-hidden />
      {pending ? "Bezig…" : "Voordragen"}
    </Button>
  );
}

/**
 * Eén roster-ZZP'er met inzetbaarheid + voordraag-actie. Server-side is de waarheid: de knop is
 * disabled bij een niet-inzetbare ZZP'er, maar de server weigert het hoe dan ook. Na een geslaagde
 * voordracht toont de rij stil "Voorgedragen · wacht op reactie ZZP'er" (ook bij een idempotente
 * her-voordracht, die de server als no-op afvangt).
 */
function CandidateRow({ jobId, candidate }: { jobId: string; candidate: RosterCandidate }) {
  const [state, formAction] = useActionState<ProposeState, FormData>(proposeFreelancer, undefined);
  const [done, setDone] = useState(candidate.proposed);

  useEffect(() => {
    if (state && "ok" in state && state.ok) setDone(true);
  }, [state]);

  const notEngageable = candidate.engageabilityStatus === "INACTIEF";
  const proposed = done || candidate.proposed;
  const error = state && "error" in state ? state.error : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{candidate.name}</p>
        {candidate.headline && (
          <p className="truncate text-xs text-muted-foreground">{candidate.headline}</p>
        )}
        {/* Waarom deze ZZP'er past bij deze dienst — troef + minpunt uit dezelfde matchmotor als de
            Reacties-lijst en /kandidaten (verklaarbaar, geen black box). */}
        {(candidate.topReason || candidate.topGap) && (
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {candidate.topReason && (
              <span className="inline-flex items-center gap-1 text-success">
                <Check className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{candidate.topReason}</span>
              </span>
            )}
            {candidate.topGap && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Minus className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{candidate.topGap}</span>
              </span>
            )}
          </p>
        )}
        {notEngageable && candidate.blockers.length > 0 && (
          <p className="truncate text-xs text-danger">{candidate.blockers[0]}</p>
        )}
        {error && <p className="truncate text-xs text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Badge variant="muted" className="tabular-nums">
          Match {candidate.matchScore}
        </Badge>
        <EngageabilityBadge status={candidate.engageabilityStatus} />
        {proposed ? (
          <Badge variant="accent" className="inline-flex items-center gap-1">
            <Check className="size-3.5" aria-hidden />
            Voorgedragen · wacht op reactie ZZP&apos;er
          </Badge>
        ) : candidate.hasApplied ? (
          <Badge variant="muted">Heeft al gereageerd</Badge>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="jobId" value={jobId} />
            <input type="hidden" name="freelancerId" value={candidate.freelancerId} />
            <SubmitButton disabled={notEngageable} />
          </form>
        )}
      </div>
    </div>
  );
}

/** Sectie "Voordragen uit je roster" op de dienst-detailpagina. */
export function VoordragenSection({
  jobId,
  candidates,
}: {
  jobId: string;
  candidates: RosterCandidate[];
}) {
  return (
    <div className="divide-y divide-border">
      {candidates.map((c) => (
        <CandidateRow key={c.freelancerId} jobId={jobId} candidate={c} />
      ))}
    </div>
  );
}
