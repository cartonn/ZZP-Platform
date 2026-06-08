import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type EngageabilityStatus } from "@/lib/engageability";

const MAP: Record<
  EngageabilityStatus,
  { label: string; variant: "success" | "warning" | "danger"; Icon: typeof ShieldCheck }
> = {
  ACTIEF: { label: "Inzetbaar", variant: "success", Icon: ShieldCheck },
  AANDACHT: { label: "Aandacht nodig", variant: "warning", Icon: ShieldAlert },
  INACTIEF: { label: "Nog niet inzetbaar", variant: "danger", Icon: ShieldX },
};

/** Toont de inzetbaarheidsstatus als statuschip met icoon (kleur nooit het enige signaal). */
export function EngageabilityBadge({ status }: { status: EngageabilityStatus }) {
  const s = MAP[status];
  return (
    <Badge variant={s.variant} className="inline-flex items-center gap-1">
      <s.Icon className="size-3.5" aria-hidden />
      {s.label}
    </Badge>
  );
}
