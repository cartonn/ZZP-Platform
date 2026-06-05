"use client";

import { useActionState } from "react";
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
