"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckChip } from "@/components/ui/check-chip";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateFreelancerProfile, type ProfileState } from "./actions";

const AVAILABILITY = [
  ["AVAILABLE", "Beschikbaar"],
  ["LIMITED", "Beperkt beschikbaar"],
  ["UNAVAILABLE", "Niet beschikbaar"],
  ["UNKNOWN", "Onbekend"],
] as const;
const WORK_MODE = [
  ["REMOTE", "Remote"],
  ["ONSITE", "Op locatie"],
  ["HYBRID", "Hybride"],
] as const;

export interface ProfileFormInitial {
  headline: string;
  bio: string;
  hourlyRate: string;
  location: string;
  availability: string;
  workMode: string;
  languages: string;
  kvkNumber: string;
  btwNumber: string;
  visibility: string;
  skillIds: string[];
  industryIds: string[];
}

export function ProfileForm({
  initial,
  skills,
  industries,
  onResolved,
}: {
  initial: ProfileFormInitial;
  skills: { id: string; name: string }[];
  industries: { id: string; name: string }[];
  /** Vuurt na een geslaagde opslag — gebruikt door het Actiecentrum om de drawer te sluiten + door te vloeien. */
  onResolved?: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ProfileState, FormData>(
    updateFreelancerProfile,
    undefined,
  );
  useEffect(() => {
    if (state?.ok) onResolved?.();
  }, [state, onResolved]);
  const fe = state?.fieldErrors ?? {};
  // Controlled selects: voorkomt dat de weergave terugspringt na de RSC-refresh
  // die een server action triggert (uncontrolled <select> reset-effect).
  const [availability, setAvailability] = useState(initial.availability);
  const [workMode, setWorkMode] = useState(initial.workMode);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label="Functietitel"
            htmlFor="headline"
            error={fe.headline}
            hint="Bijv. Senior Frontend Developer"
          >
            <Input id="headline" name="headline" defaultValue={initial.headline} maxLength={120} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Bio" htmlFor="bio" error={fe.bio}>
            <Textarea id="bio" name="bio" defaultValue={initial.bio} rows={4} maxLength={2000} />
          </Field>
        </div>
        <Field label="Uurtarief (€)" htmlFor="hourlyRate" error={fe.hourlyRate}>
          <Input
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            min={0}
            max={2000}
            defaultValue={initial.hourlyRate}
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
        <Field label="Beschikbaarheid" htmlFor="availability" error={fe.availability}>
          <Select
            id="availability"
            name="availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            {AVAILABILITY.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
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
        <div className="sm:col-span-2">
          <Field
            label="Talen"
            htmlFor="languages"
            error={fe.languages}
            hint="Komma-gescheiden, bijv. nl, en, de"
          >
            <Input
              id="languages"
              name="languages"
              defaultValue={initial.languages}
              placeholder="nl, en"
            />
          </Field>
        </div>
        <Field label="KvK-nummer" htmlFor="kvkNumber" error={fe.kvkNumber}>
          <Input id="kvkNumber" name="kvkNumber" defaultValue={initial.kvkNumber} />
        </Field>
        <Field label="BTW-nummer" htmlFor="btwNumber" error={fe.btwNumber}>
          <Input id="btwNumber" name="btwNumber" defaultValue={initial.btwNumber} />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium">Skills</legend>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen skills beschikbaar.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <CheckChip
                key={s.id}
                name="skillIds"
                value={s.id}
                label={s.name}
                defaultChecked={initial.skillIds.includes(s.id)}
              />
            ))}
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-2 block text-sm font-medium">Branches</legend>
        {industries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen branches beschikbaar.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {industries.map((i) => (
              <CheckChip
                key={i.id}
                name="industryIds"
                value={i.id}
                label={i.name}
                defaultChecked={initial.industryIds.includes(i.id)}
              />
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium">Zichtbaarheid</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="visibility"
            value="PUBLIC"
            defaultChecked={initial.visibility === "PUBLIC"}
          />
          Openbaar — opdrachtgevers kunnen mijn profiel vinden
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="visibility"
            value="PRIVATE"
            defaultChecked={initial.visibility === "PRIVATE"}
          />
          Privé — alleen ik (en beheer) zie mijn profiel
        </label>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Opslaan…" : "Profiel opslaan"}
        </Button>
        {state?.ok && <span className="text-sm text-success">Opgeslagen.</span>}
        {state?.error && !Object.keys(fe).length && (
          <span role="alert" className="text-sm text-danger">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
