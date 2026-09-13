"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LockKeyhole, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Seal } from "@/components/ui/seal";
import { SIGNING_CONSENT } from "@/lib/signing-contract";

export type SigningFormState = { error?: string; ok?: true } | undefined;

export function SigningForm({
  action,
  documentHash,
  suggestedName,
  representing,
  pdfUrl,
}: {
  action: (previous: SigningFormState, formData: FormData) => Promise<SigningFormState>;
  documentHash: string;
  suggestedName: string;
  representing: string;
  pdfUrl: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [signerName, setSignerName] = useState(suggestedName);
  const [reviewed, setReviewed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [authority, setAuthority] = useState(false);
  const id = useId();
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const refreshed = useRef(false);

  useEffect(() => {
    if (state?.error) errorRef.current?.focus();
    if (state?.ok && !refreshed.current) {
      refreshed.current = true;
      successRef.current?.focus();
      router.refresh();
    }
  }, [state, router]);

  if (state?.ok) {
    return (
      <Card>
        <CardContent>
          <div
            ref={successRef}
            role="status"
            tabIndex={-1}
            className="focus-ring flex items-start gap-4 rounded-lg"
          >
            <Seal tone="verified" size="lg" />
            <div className="min-w-0 space-y-1">
              <h2 className="font-semibold">Jouw handtekening is opgeslagen</h2>
              <p className="text-sm text-muted-foreground">
                De overeenkomst toont de actuele status en wie er nog moet ondertekenen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-start gap-3">
        <Seal tone="pending" size="lg" />
        <div className="min-w-0 space-y-1">
          <CardTitle>Jouw handtekening</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lees de afspraken, controleer je naam en bevestig met je wachtwoord.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} aria-busy={pending} className="space-y-6">
          <input type="hidden" name="documentHash" value={documentHash} />

          {state?.error && (
            <div
              ref={errorRef}
              role="alert"
              tabIndex={-1}
              className="focus-ring rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
            >
              {state.error}
            </div>
          )}

          <fieldset disabled={pending} className="min-w-0 space-y-4">
            <legend className="mb-3 flex items-baseline gap-3 text-sm font-semibold">
              <span className="font-mono text-xs text-muted-foreground">01</span>
              Controleer de overeenkomst
            </legend>
            <p className="text-sm text-muted-foreground">
              Je ondertekent precies de documentversie die hierboven staat. Bewaar desgewenst eerst
              een kopie.
            </p>
            <Button asChild variant="secondary" className="h-auto min-h-11 whitespace-normal py-2">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                Open document als PDF
                <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                <span className="sr-only">(opent in een nieuw tabblad)</span>
              </a>
            </Button>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm leading-6">
              <input
                type="checkbox"
                name="reviewed"
                value="on"
                checked={reviewed}
                onChange={(event) => setReviewed(event.target.checked)}
                required
                className="focus-ring mt-1 size-4 shrink-0 rounded border-input accent-primary"
              />
              <span>Ik heb de volledige overeenkomst en de afspraken gecontroleerd.</span>
            </label>
          </fieldset>

          <fieldset disabled={pending} className="min-w-0 space-y-4 border-t border-border pt-5">
            <legend className="flex items-baseline gap-3 pr-3 text-sm font-semibold">
              <span className="font-mono text-xs text-muted-foreground">02</span>
              Zet je naam
            </legend>
            <Field
              htmlFor={`${id}-name`}
              label="Je volledige naam"
              hint="Controleer je naam zoals je die bij deze overeenkomst wilt vastleggen."
              required
            >
              <Input
                id={`${id}-name`}
                name="signerName"
                autoComplete="name"
                maxLength={120}
                required
                value={signerName}
                onChange={(event) => setSignerName(event.target.value)}
              />
            </Field>
            <div className="border-b border-border px-1 pb-4 pt-2">
              <p className="text-xs text-muted-foreground">Voorbeeld · nog niet ondertekend</p>
              <p
                aria-hidden="true"
                className="mt-3 min-h-12 break-words font-serif text-3xl italic leading-relaxed text-foreground"
              >
                {signerName.trim() || "Jouw naam"}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Je bevestigt met je eigen account en wachtwoord. Je getypte naam is je elektronische
              handtekening.
            </p>
          </fieldset>

          <fieldset disabled={pending} className="min-w-0 space-y-4 border-t border-border pt-5">
            <legend className="flex items-baseline gap-3 pr-3 text-sm font-semibold">
              <span className="font-mono text-xs text-muted-foreground">03</span>
              Bevestig je ondertekening
            </legend>
            <div className="space-y-1">
              <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm leading-6">
                <input
                  type="checkbox"
                  name="consent"
                  value="on"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  required
                  className="focus-ring mt-1 size-4 shrink-0 rounded border-input accent-primary"
                />
                <span>{SIGNING_CONSENT}</span>
              </label>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm leading-6">
                <input
                  type="checkbox"
                  name="authority"
                  value="on"
                  checked={authority}
                  onChange={(event) => setAuthority(event.target.checked)}
                  required
                  className="focus-ring mt-1 size-4 shrink-0 rounded border-input accent-primary"
                />
                <span className="min-w-0 break-words">
                  Ik ben bevoegd deze overeenkomst namens <strong>{representing}</strong> te
                  ondertekenen.
                </span>
              </label>
            </div>
            <Field
              htmlFor={`${id}-password`}
              label="Je huidige wachtwoord"
              hint="Bevestig dat jij het bent met het wachtwoord van je Handslag-account."
              required
            >
              <Input
                id={`${id}-password`}
                type="password"
                name="password"
                autoComplete="current-password"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={256}
                required
              />
            </Field>
          </fieldset>

          <div className="space-y-3 border-t border-border pt-5">
            <Button
              type="submit"
              disabled={pending}
              className="h-auto min-h-12 w-full whitespace-normal py-3 sm:w-auto"
            >
              <PenLine className="size-4 shrink-0" aria-hidden="true" />
              {pending ? "Handtekening opslaan…" : "Overeenkomst ondertekenen"}
            </Button>
            <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>Je plaatst een gewone elektronische handtekening op deze documentversie.</span>
            </p>
            <p role="status" className="sr-only">
              {pending ? "Je handtekening wordt opgeslagen. Even geduld." : ""}
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
