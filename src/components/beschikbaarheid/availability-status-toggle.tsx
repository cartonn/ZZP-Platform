"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AVAILABILITY_STATUS_OPTIONS,
  type SelectableAvailability,
} from "@/lib/availability-status";
import { setAvailabilityStatus } from "@/app/(protected)/beschikbaarheid/actions";

const TONE_ACTIVE: Record<"success" | "warning" | "muted", string> = {
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/15 text-warning",
  muted: "border-border bg-muted text-foreground",
};

/**
 * Één-klik statustoggle voor de persistente beschikbaarheidsstatus van de ZZP'er. De server is
 * de waarheid: `current` komt uit het profiel; bij een klik muteert de server-action en pushen
 * we de nieuwe status optimistisch, met terugrol bij een fout. Geen dode knoppen — elke knop
 * schrijft echt.
 */
export function AvailabilityStatusToggle({ current }: { current: SelectableAvailability | null }) {
  const [status, setStatus] = useState<SelectableAvailability | null>(current);
  const [pendingValue, setPendingValue] = useState<SelectableAvailability | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeHint = AVAILABILITY_STATUS_OPTIONS.find((o) => o.value === status)?.hint;

  function choose(value: SelectableAvailability) {
    if (value === status || isPending) return;
    const previous = status;
    setError(null);
    setPendingValue(value);
    setStatus(value); // optimistisch
    startTransition(async () => {
      const res = await setAvailabilityStatus(value);
      setPendingValue(null);
      if (!res.ok) {
        setStatus(previous); // terugrol
        setError(res.error);
      }
    });
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Beschikbaarheidsstatus"
        className="flex flex-col gap-2 sm:flex-row"
      >
        {AVAILABILITY_STATUS_OPTIONS.map((o) => {
          const active = o.value === status;
          const loading = isPending && pendingValue === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={isPending}
              onClick={() => choose(o.value)}
              className={cn(
                "focus-ring flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-70",
                active
                  ? TONE_ACTIVE[o.tone]
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40",
              )}
            >
              {loading ? (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              ) : active ? (
                <Check className="size-4 shrink-0" aria-hidden />
              ) : null}
              {o.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
        {error ?? activeHint ?? "Kies je huidige status voor opdrachtgevers."}
      </p>
    </div>
  );
}
