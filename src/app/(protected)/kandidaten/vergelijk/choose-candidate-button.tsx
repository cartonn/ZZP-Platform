"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/lib/use-focus-trap";

/**
 * "Kies <naam>"-knop in de vergelijk-tabel. Voor een compliante kandidaat is dit een gewone,
 * primaire navigatieknop (één klik door). Voldoet de kandidaat níet aan de vereiste certificaten,
 * dan wordt de knop rustig (secondary) en zit er een expliciete bevestigingsstap tussen — geen
 * one-click naar een niet-compliante keuze. Hetzelfde overlay-/focus-patroon als ConfirmButton.
 */
export function ChooseCandidateButton({
  href,
  label,
  nonCompliant,
}: {
  href: string;
  label: string;
  nonCompliant: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  if (!nonCompliant) {
    return (
      <Button asChild size="sm" variant="primary">
        <Link href={href}>{label}</Link>
      </Button>
    );
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="secondary"
        size="sm"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>

      {open && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <button
            type="button"
            aria-label="Sluiten"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative mx-auto mt-[20vh] w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-xl">
            <h2 id={titleId} className="text-sm font-semibold tracking-tight">
              Kandidaat voldoet niet aan de vereisten
            </h2>
            <p id={descId} className="mt-1.5 text-sm text-muted-foreground">
              Deze kandidaat voldoet niet aan de vereiste certificaten — toch verdergaan?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Annuleren
              </Button>
              <Button
                ref={confirmRef}
                type="button"
                variant="primary"
                size="sm"
                onClick={() => router.push(href)}
              >
                Toch verdergaan
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
