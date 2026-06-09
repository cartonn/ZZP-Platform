import { type Metadata } from "next";
import Link from "next/link";
import { Clock, Download, Upload } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { getDienstenForFreelancer } from "@/lib/diensten";
import { formatEuro } from "@/lib/invoices";
import { formatDateRangeNl } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Diensten · ZZP Platform" };

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "success" | "muted" | "danger" }
> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SUBMITTED: { label: "Ter goedkeuring", variant: "default" },
  APPROVED: { label: "Goedgekeurd", variant: "success" },
  REJECTED: { label: "Afgekeurd", variant: "danger" },
};

const FILTER_LABELS: Record<string, string> = {
  "": "Alle",
  DRAFT: "Concept",
  SUBMITTED: "Ter goedkeuring",
  APPROVED: "Goedgekeurd",
  REJECTED: "Afgekeurd",
};

export default async function DienstenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const actor = await requireActor();
  if (actor.role !== "FREELANCER") {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-muted-foreground">Alleen beschikbaar voor ZZP&apos;ers.</p>
      </div>
    );
  }

  const { status: filterStatus = "" } = await searchParams;
  const allDiensten = await getDienstenForFreelancer(actor.id);
  const diensten = filterStatus
    ? allDiensten.filter((d) => d.status === filterStatus)
    : allDiensten;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Diensten</h1>
          <p className="text-sm text-muted-foreground">
            Alle urenstaaten en opleveringen die je hebt ingediend of in concept hebt staan.
          </p>
        </div>
        <div className="flex gap-2">
          {allDiensten.length > 0 && (
            <Button asChild size="sm" variant="secondary">
              <a href="/diensten/export">
                <Download className="mr-1.5 size-4" aria-hidden />
                Exporteren
              </a>
            </Button>
          )}
          <Button asChild size="sm" variant="secondary">
            <Link href="/diensten/importeer">
              <Upload className="mr-1.5 size-4" aria-hidden />
              Importeren
            </Link>
          </Button>
        </div>
      </header>

      {/* Statusfilter */}
      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Filter op status">
        {Object.entries(FILTER_LABELS).map(([val, label]) => {
          const active = val === filterStatus;
          const href = val ? `/diensten?status=${val}` : "/diensten";
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
              {val === "" && allDiensten.length > 0 && (
                <span className="ml-1 tabular-nums text-muted-foreground/70">
                  ({allDiensten.length})
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {diensten.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Geen diensten gevonden"
          description={
            filterStatus
              ? "Er zijn geen diensten met deze status. Pas het filter aan of importeer nieuwe diensten."
              : "Je hebt nog geen diensten ingediend. Begin via een samenwerking of importeer bestaande diensten."
          }
          action={{ label: "Diensten importeren", href: "/diensten/importeer" }}
        />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {diensten.map((d) => {
            const statusInfo = STATUS_MAP[d.status] ?? {
              label: d.status,
              variant: "muted" as const,
            };
            return (
              <div key={d.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium">{d.jobTitle}</span>
                    <span className="text-xs text-muted-foreground">{d.companyName}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{formatDateRangeNl(d.periodStart, d.periodEnd)}</span>
                    {d.type === "HOURS" && d.hours != null && (
                      <span>
                        {d.hours.toLocaleString("nl-NL")} u{d.hasOrt && " · ORT"}
                      </span>
                    )}
                    {d.subtotalCents != null && (
                      <span className="font-medium text-foreground">
                        {formatEuro(d.subtotalCents)}
                      </span>
                    )}
                    {d.description && (
                      <span className="max-w-xs truncate italic">{d.description}</span>
                    )}
                  </div>
                  {d.rejectionReason && (
                    <p className="mt-1 text-xs text-danger">Reden afkeuring: {d.rejectionReason}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  <Link
                    href={`/samenwerkingen/${d.collaborationId}`}
                    className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Naar samenwerking →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {allDiensten.length > 0 && (
        <footer className="text-xs text-muted-foreground">
          {allDiensten.length} dienst{allDiensten.length !== 1 ? "en" : ""} in totaal.
        </footer>
      )}
    </div>
  );
}
