import { Badge } from "@/components/ui/badge";
import { type ComplianceStatus } from "@/lib/matching";

const MAP: Record<ComplianceStatus, { label: string; variant: "success" | "warning" | "danger" }> = {
  COMPLIANT: { label: "Voldoet aan eisen", variant: "success" },
  WARNING: { label: "Aandachtspunt", variant: "warning" },
  NON_COMPLIANT: { label: "Voldoet niet", variant: "danger" },
};

export function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  const s = MAP[status] ?? MAP.NON_COMPLIANT;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
