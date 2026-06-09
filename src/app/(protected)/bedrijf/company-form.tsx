"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FileInput } from "@/components/ui/file-input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateCompanyProfile, type CompanyState } from "./actions";
import { FormStatus } from "@/components/ui/form-status";

export interface CompanyFormInitial {
  name: string;
  description: string;
  website: string;
  location: string;
  industryId: string;
  logoKey: string | null;
}

export function CompanyForm({
  initial,
  industries,
  onResolved,
}: {
  initial: CompanyFormInitial;
  industries: { id: string; name: string }[];
  /** Vuurt na een geslaagde opslag — gebruikt door het Actiecentrum (drawer sluiten + doorvloeien). */
  onResolved?: () => void;
}) {
  const [state, formAction, isPending] = useActionState<CompanyState, FormData>(
    updateCompanyProfile,
    undefined,
  );
  useEffect(() => {
    if (state?.ok) onResolved?.();
  }, [state, onResolved]);
  const fe = state?.fieldErrors ?? {};
  const [industryId, setIndustryId] = useState(initial.industryId);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Bedrijfsnaam" htmlFor="name" required error={fe.name}>
            <Input id="name" name="name" defaultValue={initial.name} required maxLength={160} />
          </Field>
        </div>
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
        <Field label="Locatie" htmlFor="location" error={fe.location}>
          <Input
            id="location"
            name="location"
            defaultValue={initial.location}
            placeholder="Utrecht"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field
            label="Website"
            htmlFor="website"
            error={fe.website}
            hint="Volledige URL, bijv. https://bedrijf.nl"
          >
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={initial.website}
              placeholder="https://"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Omschrijving" htmlFor="description" error={fe.description}>
            <Textarea
              id="description"
              name="description"
              defaultValue={initial.description}
              rows={4}
              maxLength={2000}
            />
          </Field>
        </div>
      </div>

      <Field label="Logo" htmlFor="logo" error={fe.logo} hint="PNG, JPEG of WEBP, max 10 MB.">
        <div className="flex items-center gap-3">
          {initial.logoKey && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/media/${initial.logoKey}`}
              alt="Huidig logo"
              className="size-12 shrink-0 rounded-md border border-border object-cover"
            />
          )}
          <FileInput id="logo" name="logo" accept="image/png,image/jpeg,image/webp" />
        </div>
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Opslaan…" : "Bedrijfsprofiel opslaan"}
        </Button>
        <FormStatus success={state?.ok && "Opgeslagen."} />
        {state?.error && !Object.keys(fe).length && (
          <span role="alert" className="text-sm text-danger">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
