import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type TrustLevel } from "@/lib/trust";

const MAP: Record<
  Exclude<TrustLevel, "BASIS">,
  { label: string; variant: "success" | "default" }
> = {
  DEELS: { label: "Deels geverifieerd", variant: "default" },
  VOLLEDIG: { label: "Volledig geverifieerd", variant: "success" },
};

/** Toont het vertrouwensniveau. Voor BASIS (niets geverifieerd) tonen we niets. */
export function TrustBadge({ level, className }: { level: TrustLevel; className?: string }) {
  if (level === "BASIS") return null;
  const s = MAP[level];
  return (
    <Badge variant={s.variant} className={className}>
      <ShieldCheck className="mr-1 size-3" aria-hidden /> {s.label}
    </Badge>
  );
}
