"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { saveCredential, type CredentialState } from "./actions";

const TYPES = [
  ["VOG", "VOG (Verklaring Omtrent Gedrag)"],
  ["DIPLOMA", "Diploma"],
  ["CERTIFICATE", "Certificaat"],
  ["INSURANCE", "Verzekering"],
  ["LICENSE", "Licentie"],
  ["OTHER", "Overig"],
] as const;

export interface CredentialFormInitial {
  id?: string;
  type: string;
  title: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  visibility: string;
  hasDocument: boolean;
  documentId?: string | null;
}

export function CredentialForm({ initial }: { initial: CredentialFormInitial }) {
  const [state, formAction, isPending] = useActionState<CredentialState, FormData>(
    saveCredential,
    undefined,
  );
  const fe = state?.fieldErrors ?? {};
  const [type, setType] = useState(initial.type);
  const isEdit = !!initial.id;

  return (
    <form action={formAction} className="space-y-5">
      {initial.id && <input type="hidden" name="credentialId" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="type" required error={fe.type}>
          <Select id="type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Titel" htmlFor="title" required error={fe.title}>
          <Input
            id="title"
            name="title"
            defaultValue={initial.title}
            required
            maxLength={160}
            placeholder="bijv. VOG 2026"
          />
        </Field>
        <Field label="Uitgever" htmlFor="issuer" error={fe.issuer}>
          <Input
            id="issuer"
            name="issuer"
            defaultValue={initial.issuer}
            placeholder="bijv. Justis, ROC, NEN"
          />
        </Field>
        <div />
        <Field label="Uitgiftedatum" htmlFor="issuedAt" error={fe.issuedAt}>
          <Input id="issuedAt" name="issuedAt" type="date" defaultValue={initial.issuedAt} />
        </Field>
        <Field
          label="Vervaldatum"
          htmlFor="expiresAt"
          error={fe.expiresAt}
          hint="Leeg = verloopt niet."
        >
          <Input id="expiresAt" name="expiresAt" type="date" defaultValue={initial.expiresAt} />
        </Field>
      </div>

      <Field
        label={isEdit ? "Bewijsstuk vervangen" : "Bewijsstuk"}
        htmlFor="document"
        required={!isEdit}
        error={fe.document}
        hint="PDF, PNG, JPEG of WEBP, max 10 MB. Documenten zijn privé."
      >
        <div className="space-y-2">
          {isEdit && initial.hasDocument && initial.documentId && (
            <a
              href={`/api/documents/${initial.documentId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm text-foreground underline-offset-4 hover:underline"
            >
              Huidig bewijsstuk bekijken
            </a>
          )}
          <Input
            id="document"
            name="document"
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            required={!isEdit}
            className="h-auto py-1.5"
          />
          {isEdit && (
            <p className="text-xs text-muted-foreground">
              Een nieuw bewijsstuk zet een al beoordeeld certificaat terug naar &quot;in
              beoordeling&quot;.
            </p>
          )}
        </div>
      </Field>

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium">Zichtbaarheid op je publieke profiel</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="visibility"
            value="PRIVATE"
            defaultChecked={initial.visibility !== "PUBLIC"}
          />{" "}
          Privé
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="visibility"
            value="PUBLIC"
            defaultChecked={initial.visibility === "PUBLIC"}
          />{" "}
          Openbaar
        </label>
      </fieldset>

      {state?.error && !Object.keys(fe).length && (
        <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Opslaan…" : isEdit ? "Wijzigingen opslaan" : "Certificaat toevoegen"}
      </Button>
    </form>
  );
}
