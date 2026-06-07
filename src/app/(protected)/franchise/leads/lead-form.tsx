"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLead, type LeadFormState } from "./actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";

/**
 * Nieuwe lead vastleggen. Na het aanmaken gaan we direct naar het lead-detail, zodat de
 * franchiser meteen het contactlogboek kan bijhouden.
 */
export function LeadForm({ onCancel }: { onCancel?: () => void }) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(createLead, undefined);
  const router = useRouter();
  const fe = state && "fieldErrors" in state ? (state.fieldErrors ?? {}) : {};

  useEffect(() => {
    if (state && "ok" in state && state.ok) router.push(`/franchise/leads/${state.leadId}`);
  }, [state, router]);

  return (
    <form action={action} className="space-y-3">
      <Field label="Organisatie" htmlFor="organizationName" required error={fe.organizationName}>
        <Input
          id="organizationName"
          name="organizationName"
          placeholder="Bijv. Zorggroep De Linde"
          required
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Contactpersoon" htmlFor="contactName" error={fe.contactName}>
          <Input id="contactName" name="contactName" placeholder="Naam" />
        </Field>
        <Field label="E-mail" htmlFor="email" error={fe.email}>
          <Input id="email" name="email" type="email" placeholder="naam@organisatie.nl" />
        </Field>
        <Field label="Telefoon" htmlFor="phone" error={fe.phone}>
          <Input id="phone" name="phone" placeholder="06…" />
        </Field>
      </div>
      <Field label="Notitie" htmlFor="notes" error={fe.notes}>
        <Textarea id="notes" name="notes" rows={2} placeholder="Context, bron, eerste indruk…" />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Opslaan…" : "Lead toevoegen"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Annuleren
          </Button>
        )}
        <FormStatus error={state && "error" in state ? state.error : undefined} />
      </div>
    </form>
  );
}
