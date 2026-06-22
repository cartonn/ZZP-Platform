import { Badge } from "@/components/ui/badge";
import { type ApplicationStatus } from "@/lib/enums";
import { getTranslator } from "@/lib/i18n/server";

const MAP: Record<
  ApplicationStatus,
  { label: string; variant: "muted" | "default" | "success" | "warning" | "danger" }
> = {
  NEW: { label: "Nieuw", variant: "default" },
  VIEWED: { label: "Bekeken", variant: "muted" },
  SHORTLIST: { label: "Shortlist", variant: "warning" },
  ACCEPTED: { label: "Geaccepteerd", variant: "success" },
  REJECTED: { label: "Afgewezen", variant: "danger" },
  WITHDRAWN: { label: "Ingetrokken", variant: "muted" },
};

export async function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const s = MAP[status];
  const { t } = await getTranslator();
  return <Badge variant={s.variant}>{t(s.label)}</Badge>;
}

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  NEW: "Nieuw",
  VIEWED: "Bekeken",
  SHORTLIST: "Shortlist",
  ACCEPTED: "Geaccepteerd",
  REJECTED: "Afgewezen",
  WITHDRAWN: "Ingetrokken",
};
