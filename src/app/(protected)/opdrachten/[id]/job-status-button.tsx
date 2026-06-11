"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";
import { changeJobStatus, type JobStatusState } from "../actions";

/**
 * Statusovergang-knop (publiceren/sluiten/heropenen). Toont een mislukte overgang
 * (verkeerde transitie, ontbrekende titel/omschrijving) inline i.p.v. de hele pagina naar
 * de error-boundary te gooien; disablet zichzelf tijdens de actie.
 */
export function JobStatusButton({
  jobId,
  to,
  label,
  primary,
}: {
  jobId: string;
  to: string;
  label: string;
  primary?: boolean;
}) {
  const [state, formAction, isPending] = useActionState<JobStatusState, FormData>(
    changeJobStatus.bind(null, jobId, to),
    undefined,
  );
  // Watchdog (issue #329): de action-response blijft in productie intermitterend hangen terwijl
  // de statuswissel server-side al gelukt is — de knop stond dan eeuwig op "bezig". Komt er
  // binnen 4s geen antwoord, dan halen we de pagina hard opnieuw op; een verse GET toont
  // gegarandeerd de werkelijke status. Verdwijnt zodra de wortel in Next is gevonden.
  useEffect(() => {
    if (!isPending) return;
    const t = setTimeout(() => window.location.reload(), 4000);
    return () => clearTimeout(t);
  }, [isPending]);
  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Button
        type="submit"
        variant={primary ? "primary" : "secondary"}
        size="sm"
        disabled={isPending}
      >
        {label}
      </Button>
      <FormStatus error={state?.error} />
    </form>
  );
}
