import { Badge } from "@/components/ui/badge";
import { type CredentialStatus } from "@/lib/enums";

const MAP: Record<
  CredentialStatus,
  { label: string; variant: "muted" | "default" | "success" | "warning" | "danger" }
> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SUBMITTED: { label: "In beoordeling", variant: "default" },
  VERIFIED: { label: "Geverifieerd", variant: "success" },
  REJECTED: { label: "Afgewezen", variant: "danger" },
  EXPIRED: { label: "Verlopen", variant: "warning" },
};

export function CredentialStatusBadge({ status }: { status: CredentialStatus }) {
  const s = MAP[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
