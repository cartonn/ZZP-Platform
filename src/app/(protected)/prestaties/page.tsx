import { type Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Download } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { getPrestatiesForClient } from "@/lib/prestaties";
import { formatEuro } from "@/lib/invoices";
import { formatDateShortNl, formatDateRangeNl } from "@/lib/format-date";
import {
  PERFORMANCE_APPROVAL_STALE_DAYS,
  daysWaiting,
  summarizePerformanceApproval,
  waitingLabel,
} from "@/lib/performance-approval";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Prestaties · ZZP Platform" };

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "success" | "muted" | "danger" | "warning" }
> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SUBMITTED: { label: "Ter goedkeuring", variant: "warning" },
  APPROVED: { label: "Goedgekeurd", variant: "success" },
  REJECTED: { label: "Afgekeurd", variant: "danger" },
};

const FILTER_LABELS: Record<string, string> = {
  "": "Alle",
  SUBMITTED: "Ter goedkeuring",
  APPROVED: "Goedgekeurd",
  REJECTED: "Afgekeurd",
};

export default async function PrestatiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const actor = await requireActor();
  if (actor.role !== "CLIENT") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Prestaties"
          description="Het prestatie-overzicht is er voor opdrachtgevers."
        />
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="Alleen voor opdrachtgevers"
            description="Urenstaten en opleveringen van je ZZP'ers bekijk je hier als opdrachtgever. Ga terug naar je dashboard voor jouw overzicht."
            action={{ label: "Naar dashboard", href: "/dashboard" }}
          />
        </Card>
      </div>
    );
  }

  const { status: filterStatus = "" } = await searchParams;
  const allPrestaties = await getPrestatiesForClient(actor.id);
  const prestaties = filterStatus
    ? allPrestaties.filter((p) => p.status === filterStatus)
    : allPrestaties;

  const now = Date.now();
  const submitted = allPrestaties.filter((p) => p.status === "SUBMITTED");
  const pendingCount = submitted.length;
  const queue = summarizePerformanceApproval(submitted, now);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Prestaties</h1>
          <p className="text-sm text-muted-foreground">
            Urenstaten en opleveringen van jouw ZZP&apos;ers — overzicht over alle samenwerkingen.
            {pendingCount > 0 && (
              <span className="ml-1 font-medium text-foreground">
                {pendingCount} wacht op jouw goedkeuring.
              </span>
            )}
          </p>
          {queue.staleCount > 0 && (
            <p className="mt-1 text-xs font-medium text-warning">
              {queue.staleCount} {queue.staleCount === 1 ? "prestatie wacht" : "prestaties wachten"}{" "}
              al {PERFORMANCE_APPROVAL_STALE_DAYS} dagen of langer — langer wachten houdt de
              facturatie tegen.
            </p>
          )}
        </div>
        {allPrestaties.length > 0 && (
          <Button asChild size="sm" variant="secondary">
            <a href="/prestaties/export">
              <Download className="mr-1.5 size-4" aria-hidden />
              Exporteren
            </a>
          </Button>
        )}
      </header>

      {/* Statusfilter */}
      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Filter op status">
        {Object.entries(FILTER_LABELS).map(([val, label]) => {
          const active = val === filterStatus;
          const href = val ? `/prestaties?status=${val}` : "/prestaties";
          const count =
            val === "" ? allPrestaties.length : val === "SUBMITTED" ? pendingCount : null;
          return (
            <Link
              key={val}
              href={href}
              className={
                active
                  ? "rounded-full bg-primary px-3 py-1 text-primary-foreground"
                  : "rounded-full border border-border px-3 py-1 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }
            >
              {label}
              {count != null && count > 0 && (
                <span className="ml-1 tabular-nums text-muted-foreground/70">({count})</span>
              )}
            </Link>
          );
        })}
      </nav>

      {prestaties.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Geen prestaties gevonden"
          description={
            filterStatus
              ? "Er zijn geen prestaties met deze status. Pas het filter aan."
              : "Je ZZP'ers hebben nog geen urenstaten of opleveringen ingediend."
          }
        />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {prestaties.map((p) => {
            const statusInfo = STATUS_MAP[p.status] ?? {
              label: p.status,
              variant: "muted" as const,
            };
            return (
              <div key={p.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">{p.freelancerName}</span>
                    <span className="text-xs text-muted-foreground">{p.jobTitle}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{formatDateRangeNl(p.periodStart, p.periodEnd)}</span>
                    {p.type === "HOURS" && p.hours != null && (
                      <span>
                        {p.hours.toLocaleString("nl-NL")} u{p.hasOrt && " · ORT"}
                      </span>
                    )}
                    {p.type === "MILESTONE" && <span>Milestone</span>}
                    {p.subtotalCents != null && (
                      <span className="font-medium text-foreground">
                        {formatEuro(p.subtotalCents)}
                      </span>
                    )}
                    {p.description && (
                      <span className="max-w-xs truncate italic">{p.description}</span>
                    )}
                  </div>
                  {p.status === "SUBMITTED" &&
                    p.submittedAt &&
                    (() => {
                      const days = daysWaiting(p.submittedAt, now);
                      const stale = days >= PERFORMANCE_APPROVAL_STALE_DAYS;
                      return (
                        <p
                          className={
                            stale
                              ? "mt-0.5 text-xs font-medium text-warning"
                              : "mt-0.5 text-xs text-muted-foreground"
                          }
                        >
                          Ingediend op {formatDateShortNl(p.submittedAt)} · {waitingLabel(days)}
                        </p>
                      );
                    })()}
                  {p.rejectionReason && (
                    <p className="mt-1 text-xs text-danger">Reden afkeuring: {p.rejectionReason}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  <Link
                    href={`/samenwerkingen/${p.collaborationId}`}
                    className={
                      p.status === "SUBMITTED"
                        ? "text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                        : "text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                    }
                  >
                    {p.status === "SUBMITTED" ? "Keuren →" : "Naar samenwerking →"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {allPrestaties.length > 0 && (
        <footer className="text-xs text-muted-foreground">
          {allPrestaties.length} prestatie{allPrestaties.length !== 1 ? "s" : ""} in totaal
          {pendingCount > 0 && (
            <span className="ml-1 font-medium text-foreground">
              · {pendingCount} wacht op goedkeuring
            </span>
          )}
          .
        </footer>
      )}
    </div>
  );
}
