"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { FileInput } from "@/components/ui/file-input";
import { Select } from "@/components/ui/select";
import { credentialRecoveryNotice } from "@/lib/credentials";
import { type CredentialStatus } from "@/lib/enums";
import { saveCredential, type CredentialState } from "./actions";

type CredentialAction = (prev: CredentialState, formData: FormData) => Promise<CredentialState>;

const TYPES = [
  ["VOG", "VOG (Verklaring Omtrent Gedrag)"],
  ["DIPLOMA", "Diploma"],
  ["CERTIFICATE", "Certificaat"],
  ["INSURANCE", "Verzekering"],
  ["LICENSE", "Licentie"],
  ["OTHER", "Overig"],
] as const;

// Type-afhankelijke voorbeelden houden de invulhulp concreet: het veld "titel" en "uitgever"
// tonen een passend voorbeeld bij het gekozen documenttype. Onbekende types vallen terug op default.
const PLACEHOLDERS: Record<string, { title: string; issuer: string }> = {
  VOG: { title: "bijv. VOG 2026", issuer: "bijv. Justis" },
  DIPLOMA: { title: "bijv. HBO Verpleegkunde", issuer: "bijv. Fontys" },
  INSURANCE: { title: "bijv. AVB-polis 2026", issuer: "bijv. Centraal Beheer" },
};
const DEFAULT_PLACEHOLDER = { title: "bijv. VOG 2026", issuer: "bijv. Justis, ROC, NEN" };

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
  /** Huidige status — stuurt de herstel-contextbanner bij REJECTED/EXPIRED. */
  status?: string;
  /** Afwijzingsreden, getoond in de herstelbanner bij REJECTED. */
  rejectionReason?: string | null;
}

export function CredentialForm({
  initial,
  action,
  onResolved,
}: {
  initial: CredentialFormInitial;
  /** Server-actie; standaard saveCredential (met redirect). Het Actiecentrum geeft saveCredentialInline. */
  action?: CredentialAction;
  /** Vuurt na een geslaagde opslag — gebruikt door het Actiecentrum (drawer sluiten + doorvloeien). */
  onResolved?: () => void;
}) {
  const [state, formAction, isPending] = useActionState<CredentialState, FormData>(
    action ?? saveCredential,
    undefined,
  );
  useEffect(() => {
    if (state?.ok) onResolved?.();
  }, [state, onResolved]);
  const fe = state?.fieldErrors ?? {};
  const [type, setType] = useState(initial.type);
  const placeholder = PLACEHOLDERS[type] ?? DEFAULT_PLACEHOLDER;
  const isEdit = !!initial.id;
  const recovery = initial.status
    ? credentialRecoveryNotice(initial.status as CredentialStatus)
    : null;

  return (
    <form action={formAction} className="space-y-5">
      {initial.id && <input type="hidden" name="credentialId" value={initial.id} />}

      {recovery && (
        <div
          className={`rounded-md px-3 py-2.5 text-sm ${
            recovery.tone === "danger" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"
          }`}
        >
          <p className="font-medium">{recovery.title}</p>
          {initial.status === "REJECTED" && initial.rejectionReason && (
            <p className="mt-0.5">Reden: {initial.rejectionReason}</p>
          )}
          <p className="mt-0.5">{recovery.message}</p>
        </div>
      )}

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
            placeholder={placeholder.title}
          />
        </Field>
        <Field label="Uitgever" htmlFor="issuer" error={fe.issuer}>
          <Input
            id="issuer"
            name="issuer"
            defaultValue={initial.issuer}
            placeholder={placeholder.issuer}
          />
        </Field>
        <div />
        <Field label="Uitgiftedatum" htmlFor="issuedAt" error={fe.issuedAt}>
          <DateInput id="issuedAt" name="issuedAt" defaultValue={initial.issuedAt} />
        </Field>
        <Field
          label="Vervaldatum"
          htmlFor="expiresAt"
          error={fe.expiresAt}
          hint="Leeg = verloopt niet."
        >
          <DateInput id="expiresAt" name="expiresAt" defaultValue={initial.expiresAt} />
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
          {/* Bewaarbeleid vooraf benoemen: bij een VOG verdwijnt het bestand na de controle en
              blijft alleen "gezien + datum" staan. Server-side afgedwongen (credential-evidence-
              policy.ts); deze tekst legt uit wat er gebeurt, hij beslist niets. */}
          {type === "VOG" && (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Je VOG wordt na de controle verwijderd. We bewaren alleen dat hij is gezien, door wie
              en op welke datum.
            </p>
          )}
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
          <FileInput
            id="document"
            name="document"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            required={!isEdit}
            capture
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
