"use client";

import { useState } from "react";
import { LEAD_TRANSITIONS, type LeadStatus } from "@/lib/enums";
import { LEAD_STATUS_LABEL, leadStatusRequiresReason } from "@/lib/leads";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { setLeadStatus } from "./actions";

/**
 * Franchiser verzet de status van een lead — alleen geldige overgangen (incl. de huidige status).
 * Kiest hij "Afgevallen", dan verschijnt een verplicht redenveld (de server dwingt het ook af);
 * de reden belandt in het contactlogboek.
 */
export function StatusControl({
  leadId,
  status,
  organizationName,
}: {
  leadId: string;
  status: LeadStatus;
  organizationName: string;
}) {
  const [selected, setSelected] = useState<LeadStatus>(status);
  // "Klant" is bewust GEEN losse dropdown-overgang: een lead wordt klant via de onboarding-wizard
  // (die een echte opdrachtgever aanmaakt). Direct op KLANT zetten gaf een doodloop — geen
  // opdrachtgever, terminale status, CTA verdwenen. Daarom hier uitgefilterd; de "Wordt klant"-CTA blijft.
  const options: LeadStatus[] = [status, ...LEAD_TRANSITIONS[status]].filter((s) => s !== "KLANT");
  const needsReason = leadStatusRequiresReason(selected) && selected !== status;
  const isTerminal = LEAD_TRANSITIONS[status].length === 0;

  if (isTerminal) return null;

  return (
    <form action={setLeadStatus.bind(null, leadId)} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Status:</span>
        <Select
          name="status"
          defaultValue={status}
          onChange={(e) => setSelected(e.target.value as LeadStatus)}
          aria-label={`Status van lead: ${organizationName}`}
          className="h-8 max-w-40 text-sm"
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
        <Button type="submit" size="xs" variant="secondary">
          Opslaan
        </Button>
      </div>
      {needsReason && (
        <Textarea
          name="reason"
          rows={2}
          required
          aria-label="Reden voor afvallen"
          placeholder="Waarom valt deze lead af? Komt in het contactlogboek."
          className="text-sm"
        />
      )}
    </form>
  );
}
