import { type Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/authz";
import {
  loadDisputeOverview,
  summarizeDisputes,
  DISPUTE_URGENCY_LEVELS,
  type DisputeUrgency,
} from "@/lib/disputes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateShortNl } from "@/lib/format-date";

export const metadata: Metadata = { title: "Disputen · ZZP Platform" };

function fmt(d: Date | null) {
  return d ? formatDateShortNl(d) : "—";
}

const URGENCY_BADGE_VARIANT: Record<DisputeUrgency, "danger" | "warning" | "muted"> = {
  URGENT: "danger",
  VERHOOGD: "warning",
  NORMAAL: "muted",
};

const URGENCY_LABEL: Record<DisputeUrgency, string> = {
  URGENT: "Urgent",
  VERHOOGD: "Verhoogd",
  NORMAAL: "Normaal",
};

export default async function AdminDisputenPage() {
  await requireRole("ADMIN");

  const rows = await loadDisputeOverview();
  const summary = summarizeDisputes(rows);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Disputen"
        description="Samenwerkingen met een open dispuut. Het werkproces is bevroren tot het platform bemiddelt en het dispuut oplost."
      />

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title="Geen open disputen"
            description="Er zijn op dit moment geen bevroren samenwerkingen."
          />
        </Card>
      ) : (
        <>
          {/* Samenvattingsstrip */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
              Alle ({summary.total})
            </span>
            {DISPUTE_URGENCY_LEVELS.map((lvl) => (
              <span
                key={lvl}
                className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
              >
                {URGENCY_LABEL[lvl]} ({summary.byUrgency[lvl]})
              </span>
            ))}
          </div>

          {/* Lijst */}
          <div className="space-y-3">
            {rows.map((row) => (
              <Card key={row.collaborationId}>
                <CardContent className="space-y-2 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{row.jobTitle}</p>
                    <Badge variant={URGENCY_BADGE_VARIANT[row.urgency]}>
                      {URGENCY_LABEL[row.urgency]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {row.freelancerName} ↔ {row.companyName}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {row.ageDays} {row.ageDays === 1 ? "dag" : "dagen"} open
                    </span>
                    <span>sinds {fmt(row.disputedAt)}</span>
                  </div>
                  {row.disputeReason && <p className="text-sm text-danger">{row.disputeReason}</p>}
                  <Link
                    href={`/samenwerkingen/${row.collaborationId}`}
                    className="inline-flex text-sm font-medium underline underline-offset-4"
                  >
                    Open werkproces om te bemiddelen →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
