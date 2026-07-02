"use client";

import { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import { Button } from "@/components/ui/button";
import { addLeadContact } from "../actions";

/**
 * Een regel toevoegen aan het contactlogboek, met optioneel een opvolgdatum (default = de huidige).
 * Reset na verzenden zodat snel meerdere kunnen volgen.
 */
export function ContactForm({
  leadId,
  defaultFollowUp,
}: {
  leadId: string;
  defaultFollowUp?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addLeadContact(leadId, formData);
        formRef.current?.reset();
      }}
      className="space-y-2"
    >
      <Textarea
        name="body"
        rows={2}
        required
        aria-label="Notitie"
        placeholder="Wat is er besproken? (belletje, mail, gesprek…)"
        className="text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="nextFollowUp" className="text-xs text-muted-foreground">
          Volgende opvolging
        </label>
        <DateInput
          id="nextFollowUp"
          name="nextFollowUp"
          defaultValue={defaultFollowUp ?? ""}
          className="h-8 w-40 text-sm"
        />
        <Button type="submit" size="sm">
          Notitie toevoegen
        </Button>
      </div>
    </form>
  );
}
