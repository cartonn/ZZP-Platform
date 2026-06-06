"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { addAfdelingStep, type WizardAfdelingState } from "./actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";

export function WizardAfdelingForm({ companyId }: { companyId: string }) {
  const [state, action, pending] = useActionState<WizardAfdelingState, FormData>(
    addAfdelingStep.bind(null, companyId),
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Na een geslaagde toevoeging (geen fout) het formulier leegmaken, zodat de volgende afdeling
  // meteen ingevoerd kan worden.
  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Naam afdeling" htmlFor="name" required>
          <Input id="name" name="name" placeholder="Bijv. Geriatrie" required />
        </Field>
        <Field label="Locatie (optioneel)" htmlFor="location">
          <Input id="location" name="location" placeholder="Plaats" />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          <Plus className="size-3.5" aria-hidden /> {pending ? "Toevoegen…" : "Afdeling toevoegen"}
        </Button>
        <FormStatus error={state?.error} />
      </div>
    </form>
  );
}
