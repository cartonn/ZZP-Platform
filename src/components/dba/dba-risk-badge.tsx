import { Badge } from "@/components/ui/badge";
import { type DbaRisk } from "@/lib/dba";

const MAP: Record<DbaRisk, { label: string; variant: "success" | "warning" | "danger" }> = {
  LAAG: { label: "Laag DBA-risico", variant: "success" },
  MIDDEN: { label: "Midden DBA-risico", variant: "warning" },
  HOOG: { label: "Hoog DBA-risico", variant: "danger" },
};

export function DbaRiskBadge({ level }: { level: DbaRisk }) {
  const s = MAP[level];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
