import { Badge } from "@/components/ui/badge";
import { type JobStatus } from "@/lib/enums";

const MAP: Record<JobStatus, { label: string; variant: "muted" | "success" | "default" }> = {
  DRAFT: { label: "Concept", variant: "muted" },
  PUBLISHED: { label: "Gepubliceerd", variant: "success" },
  CLOSED: { label: "Gesloten", variant: "default" },
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const s = MAP[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
