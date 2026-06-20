import { Badge } from "@/components/ui/badge";
import { type ApplicationStatus } from "@/lib/enums";

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

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const s = MAP[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  NEW: "Nieuw",
  VIEWED: "Bekeken",
  SHORTLIST: "Shortlist",
  ACCEPTED: "Geaccepteerd",
  REJECTED: "Afgewezen",
  WITHDRAWN: "Ingetrokken",
};
