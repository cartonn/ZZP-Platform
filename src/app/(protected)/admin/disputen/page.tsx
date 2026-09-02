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
import {
  parseDisputeFilter,
  filterDisputeRows,
  isDisputeFilterActive,
  disputeFilterParams,
} from "@/lib/dispute-filter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Disputen · Handslag" };

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

function filterHref(urgency: DisputeUrgency | null): string {
  const qs = new URLSearchParams(disputeFilterParams(urgency)).toString();
  return qs ? `/admin/disputen?${qs}` : "/admin/disputen";
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring inline-flex items-center rounded-md border px-3 py-1 text-sm transition-colors",
        active
          ? "border-accent-foreground/20 bg-accent text-accent-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </Link>
  );
}

export default async function AdminDisputenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("ADMIN");

  const filter = parseDisputeFilter(await searchParams);
  const rows = await loadDisputeOverview();
  const summary = summarizeDisputes(rows);
  const visible = filterDisputeRows(rows, filter);
  const filterActive = isDisputeFilterActive(filter);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Beheer"
        title="Disputen"
        description="Samenwerkingen met een open dispuut. De samenwerking is bevroren tot het platform bemiddelt en het dispuut oplost."
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
          {/* Urgentiefilter — server-side via de URL (deelbaar/herlaadbaar). De tellingen tonen
              altijd de volledige backlog, ook als er een filter actief is. */}
          <div className="flex flex-wrap gap-1.5">
            <FilterPill href={filterHref(null)} active={!filterActive}>
              Alle ({summary.total})
            </FilterPill>
            {DISPUTE_URGENCY_LEVELS.map((lvl) => (
              <FilterPill key={lvl} href={filterHref(lvl)} active={filter.urgency === lvl}>
                {URGENCY_LABEL[lvl]} ({summary.byUrgency[lvl]})
              </FilterPill>
            ))}
          </div>

          {visible.length === 0 ? (
            <Card>
              <EmptyState
                icon={AlertTriangle}
                title="Geen disputen in dit filter"
                description="Er zijn geen open disputen met dit urgentieniveau."
                action={{ label: "Alle disputen", href: "/admin/disputen" }}
              />
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {filterActive
                  ? `${visible.length} van ${plural(rows.length, "dispuut", "disputen")}`
                  : plural(rows.length, "dispuut", "disputen")}
              </p>

              <div className="space-y-3">
                {visible.map((row) => (
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
                      {row.disputeReason && (
                        <p className="text-sm text-danger">{row.disputeReason}</p>
                      )}
                      <Link
                        href={`/samenwerkingen/${row.collaborationId}`}
                        className="inline-flex text-sm font-medium underline underline-offset-4"
                      >
                        Open samenwerking om te bemiddelen →
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
