"use client";

import { useActionState } from "react";
import { BellRing } from "lucide-react";
import {
  sendFranchiseCredentialReminder,
  type ReminderState,
} from "@/app/(protected)/franchise/zzpers/actions";
import { type CredentialType } from "@/lib/enums";
import { Button } from "@/components/ui/button";

/**
 * "Stuur herinnering" bij een ontbrekend/verlopen verplicht certificaat van een roster-ZZP'er
 * (bemiddelaar-zicht) — één-klik, zelfde patroon als de opdrachtgever-variant. De server bepaalt of
 * het type écht openstaat en dwingt de dag-idempotentie af; deze knop toont alleen de uitkomst.
 */
export function FranchiseCredentialReminderButton({
  freelancerId,
  type,
  label,
  size = "sm",
}: {
  freelancerId: string;
  type: CredentialType;
  /** Optioneel: toon "Herinner aan <label>" i.p.v. het generieke "Stuur herinnering". */
  label?: string;
  size?: "sm" | "xs";
}) {
  const [state, formAction, pending] = useActionState<ReminderState, FormData>(
    sendFranchiseCredentialReminder.bind(null, freelancerId, type),
    undefined,
  );

  return (
    <form action={formAction} className="mt-1.5 inline-flex flex-wrap items-center gap-2">
      <Button type="submit" size={size} variant="secondary" disabled={pending}>
        <BellRing className="mr-1.5 size-3.5" aria-hidden />
        {pending ? "Bezig…" : label ? `Herinner aan ${label}` : "Stuur herinnering"}
      </Button>
      {state?.message && <span className="text-xs text-muted-foreground">{state.message}</span>}
      {state?.error && <span className="text-xs font-medium text-danger">{state.error}</span>}
    </form>
  );
}
