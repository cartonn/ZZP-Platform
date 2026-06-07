"use client";

import { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addLeadContact } from "../actions";

/** Een regel toevoegen aan het contactlogboek. Reset na verzenden zodat snel meerdere kunnen volgen. */
export function ContactForm({ leadId }: { leadId: string }) {
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
      <Button type="submit" size="sm">
        Notitie toevoegen
      </Button>
    </form>
  );
}
