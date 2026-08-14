"use client";

import { useActionState } from "react";
import { BellRing } from "lucide-react";
import { sendPaymentReminder, type ReminderState } from "@/app/(protected)/facturen/actions";
import { Button } from "@/components/ui/button";

/**
 * Compacte "Herinner"-knop voor een rij in de openstaande-postenlijst (`/openstaand`). Geeft de
 * ZZP'er (crediteur) handelingsperspectief op een openstaande factuur zónder eerst het factuurdetail
 * te openen. De server (`sendPaymentReminder`) herbevestigt rol + eigenaarschap + afkoelperiode; deze
 * knop toont alleen de uitkomst. Rendert compact zodat 'ie in een dichte lijstrij past.
 */
export function InlinePaymentReminderButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, pending] = useActionState<ReminderState, FormData>(
    sendPaymentReminder.bind(null, invoiceId),
    undefined,
  );

  return (
    <form action={formAction} className="flex shrink-0 items-center gap-2">
      {state?.message ? (
        <span className="text-xs font-medium text-success">{state.message}</span>
      ) : (
        <Button type="submit" size="sm" variant="ghost" disabled={pending}>
          <BellRing className="mr-1.5 size-3.5" aria-hidden />
          {pending ? "Bezig…" : "Herinner"}
        </Button>
      )}
      {state?.error && <span className="text-xs font-medium text-danger">{state.error}</span>}
    </form>
  );
}
