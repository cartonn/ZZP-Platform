"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckChip } from "@/components/ui/check-chip";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type CredentialType } from "@/lib/enums";
import { saveJob, type JobFormState } from "./actions";

const WORK_MODE = [
  ["REMOTE", "Remote"],
  ["ONSITE", "Op locatie"],
  ["HYBRID", "Hybride"],
] as const;

const CREDENTIAL_LABELS: Record<CredentialType, string> = {
  VOG: "VOG",
  DIPLOMA: "Diploma",
  CERTIFICATE: "Certificaat",
  INSURANCE: "Verzekering",
  LICENSE: "Licentie",
  OTHER: "Overig",
};

export interface JobFormInitial {
  id?: string;
  title: string;
  description: string;
  industryId: string;
  rateMin: string;
  rateMax: string;
  location: string;
  workMode: string;
  startDate: string;
  requiredSkillIds: string[];
  optionalSkillIds: string[];
  requiredCredentialTypes: string[];
  optionalCredentialTypes: string[];
}

export function JobForm({
  initial,
  skills,
  industries,
}: {
  initial: JobFormInitial;
  skills: { id: string; name: string }[];
  industries: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState<JobFormState, FormData>(saveJob, undefined);
  const fe = state?.fieldErrors ?? {};
  const [workMode, setWorkMode] = useState(initial.workMode);
  const [industryId, setIndustryId] = useState(initial.industryId);

  return (
    <form action={formAction} className="space-y-6">
      {initial.id && <input type="hidden" name="jobId" value={initial.id} />}

      <Field label="Titel" htmlFor="title" required error={fe.title}>
        <Input id="title" name="title" defaultValue={initial.title} required maxLength={160} placeholder="Bijv. Frontend Developer (React)" />
      </Field>

      <Field label="Omschrijving" htmlFor="description" required error={fe.description}>
        <Textarea id="description" name="description" defaultValue={initial.description} rows={6} maxLength={5000} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Branche" htmlFor="industryId" error={fe.industryId}>
          <Select id="industryId" name="industryId" value={industryId} onChange={(e) => setIndustryId(e.target.value)}>
            <option value="">— Kies een branche —</option>
            {industries.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Werkmodus" htmlFor="workMode" error={fe.workMode}>
          <Select id="workMode" name="workMode" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
            {WORK_MODE.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </Field>
        <Field label="Min. tarief (€/uur)" htmlFor="rateMin" error={fe.rateMin}>
          <Input id="rateMin" name="rateMin" type="number" min={0} max={2000} defaultValue={initial.rateMin} />
        </Field>
        <Field label="Max. tarief (€/uur)" htmlFor="rateMax" error={fe.rateMax}>
          <Input id="rateMax" name="rateMax" type="number" min={0} max={2000} defaultValue={initial.rateMax} />
        </Field>
        <Field label="Locatie" htmlFor="location" error={fe.location}>
          <Input id="location" name="location" defaultValue={initial.location} placeholder="Amsterdam" />
        </Field>
        <Field label="Startdatum" htmlFor="startDate" error={fe.startDate}>
          <Input id="startDate" name="startDate" type="date" defaultValue={initial.startDate} />
        </Field>
      </div>

      <ChipGroup
        legend="Vereiste skills"
        name="requiredSkillIds"
        options={skills.map((s) => ({ value: s.id, label: s.name }))}
        selected={initial.requiredSkillIds}
        emptyText="Geen skills beschikbaar."
      />
      <ChipGroup
        legend="Gewenste skills"
        name="optionalSkillIds"
        options={skills.map((s) => ({ value: s.id, label: s.name }))}
        selected={initial.optionalSkillIds}
        emptyText="Geen skills beschikbaar."
      />
      <ChipGroup
        legend="Vereiste certificaten"
        name="requiredCredentialTypes"
        options={Object.entries(CREDENTIAL_LABELS).map(([value, label]) => ({ value, label }))}
        selected={initial.requiredCredentialTypes}
      />
      <ChipGroup
        legend="Gewenste certificaten"
        name="optionalCredentialTypes"
        options={Object.entries(CREDENTIAL_LABELS).map(([value, label]) => ({ value, label }))}
        selected={initial.optionalCredentialTypes}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Opslaan…" : initial.id ? "Wijzigingen opslaan" : "Opdracht aanmaken"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Nieuwe opdrachten starten als concept. Publiceren doe je daarna op de detailpagina.
        </span>
      </div>
      {state?.error && !Object.keys(fe).length && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
    </form>
  );
}

function ChipGroup({
  legend,
  name,
  options,
  selected,
  emptyText,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  selected: string[];
  emptyText?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium">{legend}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <CheckChip key={o.value} name={name} value={o.value} label={o.label} defaultChecked={selected.includes(o.value)} />
          ))}
        </div>
      )}
    </fieldset>
  );
}
