"use client";

import { useActionState, useEffect, useRef } from "react";
import { addDepartment, type DepartmentState } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormStatus } from "@/components/ui/form-status";

export function DepartmentForm({ companyId }: { companyId: string }) {
  const action = addDepartment.bind(null, companyId);
  const [state, formAction, pending] = useActionState<DepartmentState, FormData>(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && !state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex-1">
        <label htmlFor="dept-name" className="mb-1 block text-sm font-medium">
          Nieuwe afdeling
        </label>
        <Input id="dept-name" name="name" placeholder="Bijv. Geriatrie" required />
      </div>
      <Input
        name="location"
        aria-label="Locatie (optioneel)"
        placeholder="Locatie (optioneel)"
        className="max-w-44"
      />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Toevoegen…" : "Afdeling toevoegen"}
      </Button>
      <FormStatus error={state?.error} />
    </form>
  );
}
