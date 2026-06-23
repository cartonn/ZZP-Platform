import { Badge } from "@/components/ui/badge";
import { type JobStatus } from "@/lib/enums";
import { getTranslator } from "@/lib/i18n/server";

const MAP: Record<JobStatus, { label: string; variant: "muted" | "success" | "default" }> = {
  DRAFT: { label: "Concept", variant: "muted" },
  PUBLISHED: { label: "Gepubliceerd", variant: "success" },
  CLOSED: { label: "Gesloten", variant: "default" },
};

export async function JobStatusBadge({ status }: { status: JobStatus }) {
  const s = MAP[status];
  const { t } = await getTranslator();
  return <Badge variant={s.variant}>{t(s.label)}</Badge>;
}
