import { Activity } from "lucide-react";
import { type ActivitySignal, activityItems } from "@/lib/activity-signal";
import { type UserRole } from "@/lib/enums";

/**
 * Compacte live-signaalbalk op het dashboard: geanonimiseerde, echte platformcijfers die
 * liquiditeit tonen (werk voor de ZZP'er, aanbod voor de opdrachtgever). Rendert niets als er
 * geen relevante activiteit is — een leeg signaal voegt niets toe.
 */
export function ActivitySignalBar({ signal, role }: { signal: ActivitySignal; role: UserRole }) {
  const items = activityItems(signal, role);
  if (items.length === 0) return null;

  return (
    <p
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
      aria-label="Platformactiviteit"
    >
      <Activity className="size-3.5 text-primary" aria-hidden />
      {items.map((item, i) => (
        <span key={item.label} className="inline-flex items-center gap-1">
          {i > 0 && (
            <span aria-hidden className="text-border">
              ·
            </span>
          )}
          <span className="font-medium tabular-nums text-foreground">
            {item.value.toLocaleString("nl-NL")}
          </span>
          {item.label}
        </span>
      ))}
    </p>
  );
}
