import { Badge } from "@/components/ui/badge";
import { type ComplianceStatus } from "@/lib/matching";
import { getTranslator } from "@/lib/i18n/server";

const MAP: Record<ComplianceStatus, { label: string; variant: "success" | "warning" | "danger" }> =
  {
    COMPLIANT: { label: "Voldoet aan eisen", variant: "success" },
    WARNING: { label: "Aandachtspunt", variant: "warning" },
    NON_COMPLIANT: { label: "Voldoet niet", variant: "danger" },
  };

export async function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  const s = MAP[status] ?? MAP.NON_COMPLIANT;
  const { t } = await getTranslator();
  return <Badge variant={s.variant}>{t(s.label)}</Badge>;
}
