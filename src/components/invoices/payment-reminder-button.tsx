"use client";

import { useActionState } from "react";
import { BellRing } from "lucide-react";
import { sendPaymentReminder, type ReminderState } from "@/app/(protected)/facturen/actions";
import { Button } from "@/components/ui/button";

/**
 * "Herinner de opdrachtgever" bij een openstaande, verzonden factuur (ZZP'er-zicht). De server
 * bepaalt of de factuur écht op betaling wacht en dwingt de afkoelperiode af; deze knop toont
 * alleen de uitkomst. Geeft de wachtende betaling handelingsperspectief zonder op de automatische
 * aanmaningsladder te wachten.
 */
export function PaymentReminderButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, pending] = useActionState<ReminderState, FormData>(
    sendPaymentReminder.bind(null, invoiceId),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        <BellRing className="mr-1.5 size-3.5" aria-hidden />
        {pending ? "Bezig…" : "Herinner de opdrachtgever"}
      </Button>
      {state?.message && <span className="text-xs text-success">{state.message}</span>}
      {state?.error && <span className="text-xs font-medium text-danger">{state.error}</span>}
    </form>
  );
}
