import { Badge } from "@/components/ui/badge";
import { type Availability } from "@/lib/enums";

const MAP: Record<
  Exclude<Availability, "UNKNOWN">,
  { label: string; variant: "success" | "warning" | "muted" }
> = {
  AVAILABLE: { label: "Beschikbaar", variant: "success" },
  LIMITED: { label: "Beperkt beschikbaar", variant: "warning" },
  UNAVAILABLE: { label: "Niet beschikbaar", variant: "muted" },
};

/** Toont de beschikbaarheidsstatus. Bij UNKNOWN tonen we niets (rustig houden). */
export function AvailabilityBadge({ status }: { status: Availability }) {
  if (status === "UNKNOWN") return null;
  const s = MAP[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
