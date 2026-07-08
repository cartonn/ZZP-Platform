"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { REJECTION_REASONS } from "@/lib/rejection-reason";

/**
 * Afwijs-dialoog met een optionele, constructieve reden. De opdrachtgever kan een reden kiezen die
 * de ZZP'er als feedback te zien krijgt op /reacties — geen black-box afwijzing meer. De reden is
 * optioneel: laat "Geen reden opgeven" staan om zoals vanouds zonder reden af te wijzen.
 *
 * Zelfde bevestig-patroon als ConfirmButton (hand-rolled overlay, focus-trap, Escape), maar met een
 * <select name="reason"> ín het form zodat de gekozen code als FormData naar de server-action gaat.
 */
export type RejectDialogLabels = {
  trigger: string;
  title: string;
  description: string;
  reasonLabel: string;
  noReason: string;
  confirm: string;
  cancel: string;
};

export function RejectApplicationDialog({
  action,
  labels,
}: {
  /** De (gebonden) server-action; het geselecteerde reason-veld komt mee als FormData. */
  action: React.ComponentProps<"form">["action"];
  labels: RejectDialogLabels;
}) {
  const [open, setOpen] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const selectId = useId();
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

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="destructive"
        size="sm"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {labels.trigger}
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
            aria-label={`${labels.title} — sluiten`}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative mx-auto mt-[20vh] w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-xl">
            <h2 id={titleId} className="text-sm font-semibold tracking-tight">
              {labels.title}
            </h2>
            <p id={descId} className="mt-1.5 text-sm text-muted-foreground">
              {labels.description}
            </p>
            <form action={action}>
              <label htmlFor={selectId} className="mt-4 block text-sm font-medium">
                {labels.reasonLabel}
              </label>
              <select
                id={selectId}
                name="reason"
                defaultValue=""
                className="focus-ring mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">{labels.noReason}</option>
                {REJECTION_REASONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="mt-5 flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
                  {labels.cancel}
                </Button>
                <Button ref={confirmRef} type="submit" variant="danger" size="sm">
                  {labels.confirm}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
