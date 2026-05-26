import { Badge } from "@/components/ui/badge";
import { isOverdue } from "@/lib/invoices";
import { type InvoiceStatus } from "@/lib/enums";

const MAP: Record<InvoiceStatus, { label: string; variant: "muted" | "default" | "success" | "warning" | "danger" }> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SENT: { label: "Verzonden", variant: "default" },
  PAID: { label: "Betaald", variant: "success" },
  OVERDUE: { label: "Verlopen", variant: "danger" },
  CANCELLED: { label: "Geannuleerd", variant: "muted" },
};

/** Toont de afgeleide status: een SENT-factuur over de vervaldatum is VERLOPEN. */
export function InvoiceStatusBadge({ status, dueAt }: { status: InvoiceStatus; dueAt: Date | null }) {
  const effective: InvoiceStatus = isOverdue({ status, dueAt }) ? "OVERDUE" : status;
  const s = MAP[effective];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
