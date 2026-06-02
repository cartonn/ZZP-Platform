"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type TriggerVariant = "destructive" | "secondary" | "ghost";
type Size = "xs" | "sm" | "md";

/**
 * Destructieve actie achter een bevestigingsdialoog. De trigger is rustig (`destructive`); de
 * eigenlijke uitvoering gebeurt pas via de solide `danger`-knop ín de dialoog (zie DESIGN.md).
 *
 * Het onderliggende server-action-form wordt pas gesubmit ná bevestigen, dus geen one-click delete.
 * Hand-rolled overlay (zelfde patroon als de command-palette) — geen extra dependency.
 */
export function ConfirmButton({
  action,
  children,
  title,
  description,
  confirmLabel = "Verwijderen",
  cancelLabel = "Annuleren",
  triggerVariant = "destructive",
  size = "sm",
  className,
  "aria-label": ariaLabel,
}: {
  /** De (gebonden) server-action — exact het type van het `action`-attribuut op een <form>. */
  action: React.ComponentProps<"form">["action"];
  /** Inhoud van de trigger-knop (bv. <Trash2/> Verwijderen). */
  children: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  triggerVariant?: TriggerVariant;
  size?: Size;
  className?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // Focus de bevestigknop en sluit op Escape.
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={size}
        className={className}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50" role="alertdialog" aria-modal="true" aria-label={title}>
          <button
            type="button"
            aria-label={`${title} — sluiten`}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative mx-auto mt-[20vh] w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-xl">
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
                {cancelLabel}
              </Button>
              {/* Pas hier submit het server-action-form — ná de bevestiging. */}
              <form action={action}>
                <Button ref={confirmRef} type="submit" variant="danger" size="sm">
                  {confirmLabel}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
