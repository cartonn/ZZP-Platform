"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { SIGNING_ERASURE_REASONS } from "@/lib/signing-erasure";
import { plural } from "@/lib/plural";

/** The server rechecks shared evidence and requires the same explicit decision. */
export function AnonymizeButton({
  action,
  evidenceCount = 0,
}: {
  action: (formData: FormData) => Promise<void>;
  evidenceCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();
  const reasonId = useId();
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    cancelRef.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) setOpen(false);
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
      trigger?.focus();
    };
  }, [open, pending]);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      await action(formData);
      setOpen(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Afhandelen is niet gelukt. Probeer opnieuw.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="destructive"
        size="sm"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Verzoek afhandelen
      </Button>
      {open && (
        <div
          ref={dialogRef}
          className="hs-overlay fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <button
            type="button"
            aria-label="Afhandeling sluiten"
            disabled={pending}
            data-hs-feedback="none"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl">
            <h2 id={titleId} className="text-base font-semibold">
              Verwijderverzoek zorgvuldig afhandelen
            </h2>
            <p id={descId} className="mt-2 text-sm text-muted-foreground">
              Naam, e-mail, profiel, certificaten en documenten worden verwijderd. Facturen blijven
              bewaard vanwege de fiscale bewaarplicht. Deze actie kan niet worden teruggedraaid.
            </p>
            <form action={submit} className="mt-4 space-y-4">
              {evidenceCount > 0 && (
                <fieldset
                  disabled={pending}
                  className="space-y-3 rounded-lg border border-warning/30 bg-warning/10 p-4"
                >
                  <legend className="px-1 text-sm font-semibold">
                    Gezamenlijk ondertekenbewijs
                  </legend>
                  <p className="text-sm">
                    Dit account is partij bij{" "}
                    {plural(
                      evidenceCount,
                      "vastgelegd bewijsdossier",
                      "vastgelegde bewijsdossiers",
                    )}
                    . Beoordeel eerst de bewaarbehoefte, eventuele geschillen en de rechten van
                    beide partijen. Zonder besluit blijft het verwijderverzoek open.
                  </p>
                  <label htmlFor={reasonId} className="block text-sm font-medium">
                    Reden voor bewijsverwijdering
                  </label>
                  <Select id={reasonId} name="evidenceErasureReason" required defaultValue="">
                    <option value="" disabled>
                      Kies de uitkomst van je beoordeling
                    </option>
                    {Object.entries(SIGNING_ERASURE_REASONS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      name="eraseContractEvidence"
                      required
                      className="mt-1 size-4 shrink-0 accent-primary"
                    />
                    <span>
                      Ik heb de belangen en bewaarbehoefte van beide partijen beoordeeld. Ik
                      bevestig dat de oorspronkelijke PDF, documentversie en handtekeningen van{" "}
                      <strong>beide partijen</strong> onomkeerbaar mogen worden verwijderd.
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Moet het bewijs nog bewaard blijven? Sluit dit venster en laat het verzoek open
                    voor verdere beoordeling.
                  </p>
                </fieldset>
              )}
              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
                >
                  {error}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  ref={cancelRef}
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => setOpen(false)}
                >
                  Verzoek openlaten
                </Button>
                <Button type="submit" variant="danger" disabled={pending}>
                  {pending ? "Bezig met afhandelen…" : "Onomkeerbaar anonimiseren"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
