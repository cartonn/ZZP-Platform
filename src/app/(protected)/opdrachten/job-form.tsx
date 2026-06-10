"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckChip } from "@/components/ui/check-chip";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DbaRiskBadge } from "@/components/dba/dba-risk-badge";
import { assessDbaRisk, dbaAdvice } from "@/lib/dba";
import {
  recommendModelAgreement,
  MODEL_AGREEMENT_LABELS,
  MODEL_AGREEMENT_TYPES,
} from "@/lib/model-agreement";
import { assessRateThreshold, rechtsvermoedenHint } from "@/lib/rechtsvermoeden";
import { type CredentialType } from "@/lib/enums";
import { saveJob, type JobFormState } from "./actions";

const DBA_FACTORS = [
  ["dbaDirectSupervision", "De ZZP'er werkt onder directe aansturing/instructies"],
  ["dbaEmbedded", "De rol is structureel ingebed in de organisatie/het team"],
  ["dbaFixedSchedule", "Vaste uren/rooster zoals een werknemer"],
  ["dbaNoSubstitution", "Vrije vervanging is niet toegestaan"],
  ["dbaExclusive", "De ZZP'er werkt exclusief voor dit bedrijf"],
  ["dbaWeakEntrepreneurship", "Tarief onder marktconform / nauwelijks andere opdrachtgevers"],
] as const;

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
  modelAgreementType: string;
  dba: {
    dbaDirectSupervision: boolean;
    dbaEmbedded: boolean;
    dbaFixedSchedule: boolean;
    dbaNoSubstitution: boolean;
    dbaExclusive: boolean;
    dbaWeakEntrepreneurship: boolean;
    dbaDurationMonths: string;
  };
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
  const formRef = useRef<HTMLFormElement>(null);

  // Na een server-validatie: spring naar het eerste foutieve veld (lange form, DBA-blok onderaan).
  // Field zet aria-invalid op het foutieve input, dus dat is meteen het anker + SR-aankondiging.
  useEffect(() => {
    if (!state?.fieldErrors || Object.keys(state.fieldErrors).length === 0) return;
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (first) {
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      first.focus({ preventScroll: true });
    }
  }, [state]);
  const [workMode, setWorkMode] = useState(initial.workMode);
  const [industryId, setIndustryId] = useState(initial.industryId);
  const [dba, setDba] = useState(initial.dba);
  const [modelAgreementType, setModelAgreementType] = useState(initial.modelAgreementType);
  const [rateMin, setRateMin] = useState(initial.rateMin);

  // Live rechtsvermoeden-drempelcheck op het minimumtarief (pure functie, centen).
  const rateMinCents = rateMin !== "" ? Number(rateMin) * 100 : null;
  const rateThreshold = assessRateThreshold(rateMinCents);

  // Live, deterministische DBA-inschatting (zelfde pure functie als de server gebruikt).
  const dbaResult = assessDbaRisk({
    directSupervision: dba.dbaDirectSupervision,
    embedded: dba.dbaEmbedded,
    fixedSchedule: dba.dbaFixedSchedule,
    noSubstitution: dba.dbaNoSubstitution,
    exclusive: dba.dbaExclusive,
    weakEntrepreneurship: dba.dbaWeakEntrepreneurship,
    durationMonths: dba.dbaDurationMonths ? Number(dba.dbaDurationMonths) : null,
  });

  const modelRec = recommendModelAgreement({
    directSupervision: dba.dbaDirectSupervision,
    embedded: dba.dbaEmbedded,
    fixedSchedule: dba.dbaFixedSchedule,
    noSubstitution: dba.dbaNoSubstitution,
    exclusive: dba.dbaExclusive,
    weakEntrepreneurship: dba.dbaWeakEntrepreneurship,
    durationMonths: dba.dbaDurationMonths ? Number(dba.dbaDurationMonths) : null,
  });

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-6">
      {initial.id && <input type="hidden" name="jobId" value={initial.id} />}

      <div className="space-y-1 border-b border-border pb-2">
        <h2 className="text-sm font-semibold tracking-tight">Basisgegevens</h2>
        <p className="text-xs text-muted-foreground">
          Wat houdt de opdracht in en onder welke voorwaarden?
        </p>
      </div>

      <Field label="Titel" htmlFor="title" required error={fe.title}>
        <Input
          id="title"
          name="title"
          defaultValue={initial.title}
          required
          maxLength={160}
          placeholder="Bijv. Frontend Developer (React)"
        />
      </Field>

      <Field label="Omschrijving" htmlFor="description" required error={fe.description}>
        <Textarea
          id="description"
          name="description"
          defaultValue={initial.description}
          required
          rows={6}
          maxLength={5000}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Branche" htmlFor="industryId" error={fe.industryId}>
          <Select
            id="industryId"
            name="industryId"
            value={industryId}
            onChange={(e) => setIndustryId(e.target.value)}
          >
            <option value="">— Kies een branche —</option>
            {industries.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Werkmodus" htmlFor="workMode" error={fe.workMode}>
          <Select
            id="workMode"
            name="workMode"
            value={workMode}
            onChange={(e) => setWorkMode(e.target.value)}
          >
            {WORK_MODE.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Min. tarief (€/uur)" htmlFor="rateMin" error={fe.rateMin}>
          <Input
            id="rateMin"
            name="rateMin"
            type="number"
            min={0}
            max={2000}
            value={rateMin}
            onChange={(e) => setRateMin(e.target.value)}
          />
          {rateThreshold.belowThreshold && (
            <p className="mt-1 text-xs text-warning" role="note">
              {rechtsvermoedenHint()}
            </p>
          )}
        </Field>
        <Field label="Max. tarief (€/uur)" htmlFor="rateMax" error={fe.rateMax}>
          <Input
            id="rateMax"
            name="rateMax"
            type="number"
            min={0}
            max={2000}
            defaultValue={initial.rateMax}
          />
        </Field>
        <Field label="Locatie" htmlFor="location" error={fe.location}>
          <Input
            id="location"
            name="location"
            defaultValue={initial.location}
            placeholder="Amsterdam"
          />
        </Field>
        <Field label="Startdatum" htmlFor="startDate" error={fe.startDate}>
          <Input id="startDate" name="startDate" type="date" defaultValue={initial.startDate} />
        </Field>
      </div>

      <div className="space-y-1 border-b border-border pb-2 pt-2">
        <h2 className="text-sm font-semibold tracking-tight">Eisen aan de ZZP&apos;er</h2>
        <p className="text-xs text-muted-foreground">
          Skills en certificaten bepalen de match en de compliance-check.
        </p>
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

      <div className="space-y-1 border-b border-border pb-2 pt-2">
        <h2 className="text-sm font-semibold tracking-tight">Compliance &amp; overeenkomst</h2>
        <p className="text-xs text-muted-foreground">
          We toetsen het risico op schijnzelfstandigheid en adviseren een modelovereenkomst.
        </p>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border bg-card p-5">
        <legend className="text-sm font-medium">Wet DBA — risicocheck</legend>
        <p className="text-xs text-muted-foreground">
          Vink aan wat van toepassing is. We tonen direct het risico op schijnzelfstandigheid met
          uitleg. Dit is een hulpmiddel, geen juridisch advies.
        </p>
        <div className="space-y-2">
          {DBA_FACTORS.map(([name, label]) => (
            <label key={name} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name={name}
                checked={dba[name]}
                onChange={(e) => setDba((d) => ({ ...d, [name]: e.target.checked }))}
                className="mt-0.5"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <Field label="Verwachte duur (maanden)" htmlFor="dbaDurationMonths">
          <Input
            id="dbaDurationMonths"
            name="dbaDurationMonths"
            type="number"
            min={0}
            max={240}
            value={dba.dbaDurationMonths}
            onChange={(e) => setDba((d) => ({ ...d, dbaDurationMonths: e.target.value }))}
            className="max-w-32"
          />
        </Field>

        <div className="rounded-md border border-border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Inschatting:</span>
            <DbaRiskBadge level={dbaResult.level} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{dbaAdvice(dbaResult.level)}</p>
          {dbaResult.reasons.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {dbaResult.reasons.map((r) => (
                <li key={r.factor}>{r.message}</li>
              ))}
            </ul>
          )}
        </div>

        {modelRec.recommended && (
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="text-sm font-medium">Aanbevolen modelovereenkomst: {modelRec.label}</p>
            {modelRec.reasons.length > 0 && (
              <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {modelRec.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <p className="mt-1.5 text-[11px] text-muted-foreground/70">{modelRec.note}</p>
          </div>
        )}

        <Field label="Vastgelegde modelovereenkomst" htmlFor="modelAgreementType">
          <Select
            id="modelAgreementType"
            name="modelAgreementType"
            value={modelAgreementType}
            onChange={(e) => setModelAgreementType(e.target.value)}
          >
            <option value="">Geen modelovereenkomst</option>
            {MODEL_AGREEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {MODEL_AGREEMENT_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Opslaan…" : initial.id ? "Wijzigingen opslaan" : "Opdracht aanmaken"}
        </Button>
        <span className="text-xs text-muted-foreground">
          Nieuwe opdrachten starten als concept. Publiceren doe je daarna op de detailpagina.
        </span>
      </div>
      {state?.error && !Object.keys(fe).length && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
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
            <CheckChip
              key={o.value}
              name={name}
              value={o.value}
              label={o.label}
              defaultChecked={selected.includes(o.value)}
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}
