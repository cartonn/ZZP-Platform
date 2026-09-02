import { type Metadata } from "next";
import Link from "next/link";
import { Clock, Download, Upload } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { getDienstenForFreelancer } from "@/lib/diensten";
import { summarizeDiensten, hasDienstenSummary } from "@/lib/diensten-summary";
import { formatEuro } from "@/lib/invoices";
import { formatDateRangeNl } from "@/lib/format-date";
import {
  countPerformancesAwaitingAttention,
  performanceWaitLabel,
  summarizePerformanceWait,
} from "@/lib/performance-wait";
import { plural } from "@/lib/plural";
import { cn } from "@/lib/utils";
import { DienstenSummaryStrip } from "@/components/diensten/diensten-summary-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitHoursMenu, type ActiveCollaborationOption } from "./submit-hours-menu";

export const metadata: Metadata = { title: "Urenstaten · Handslag" };

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
      <div className="space-y-6">
        <PageHeader title="Urenstaten" description="Het urenstaten-overzicht is er voor ZZP'ers." />
        <Card>
          <EmptyState
            icon={Clock}
            title="Alleen voor ZZP'ers"
            description="Je ingediende urenstaten en opleveringen bekijk je hier als ZZP'er. Ga terug naar je dashboard voor jouw overzicht."
            action={{ label: "Naar dashboard", href: "/dashboard" }}
          />
        </Card>
      </div>
    );
  }

  const { status: filterStatus = "" } = await searchParams;
  const [allDiensten, activeCollabRows] = await Promise.all([
    getDienstenForFreelancer(actor.id),
    // Actieve samenwerkingen bepalen waar een urenstaat kán worden ingediend — het indienformulier
    // staat op het samenwerkingsdetail (uren-sectie). Hier alleen routeren, geen indien-logica.
    prisma.collaboration.findMany({
      where: { freelancer: { userId: actor.id }, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, job: { select: { title: true } }, company: { select: { name: true } } },
    }),
  ]);
  const diensten = filterStatus
    ? allDiensten.filter((d) => d.status === filterStatus)
    : allDiensten;

  // Samenvatting over de VOLLEDIGE set (niet de gefilterde view): wat wacht op goedkeuring, wat is
  // goedgekeurd, en wat er nog van de ZZP'er zelf nodig is. Pure afleiding, geen extra query.
  const summary = summarizeDiensten(allDiensten);

  // Ingediende urenstaten die al langer dan gebruikelijk op goedkeuring wachten (blokkeren stil de
  // facturatie). Over de VOLLEDIGE set, zodat het signaal niet wegvalt door een statusfilter.
  const awaitingAttention = countPerformancesAwaitingAttention(allDiensten);

  const activeCollaborations: ActiveCollaborationOption[] = activeCollabRows.map((c) => ({
    id: c.id,
    jobTitle: c.job.title,
    companyName: c.company.name,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Urenstaten</h1>
          <p className="text-sm text-muted-foreground">
            Alle urenstaten en opleveringen die je hebt ingediend of in concept hebt staan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Primaire ingang: een urenstaat indienen. Het indienformulier zelf staat op het
              samenwerkingsdetail (uren-sectie); deze knop routeert daarheen (of laat kiezen). */}
          <SubmitHoursMenu collaborations={activeCollaborations} />
          {allDiensten.length > 0 && (
            <Button asChild size="sm" variant="ghost">
              <a href="/diensten/export">
                <Download className="mr-1.5 size-4" aria-hidden />
                Exporteren
              </a>
            </Button>
          )}
          <Button asChild size="sm" variant="ghost">
            <Link href="/diensten/importeer">
              <Upload className="mr-1.5 size-4" aria-hidden />
              Importeren
            </Link>
          </Button>
        </div>
      </header>

      {hasDienstenSummary(summary) && <DienstenSummaryStrip summary={summary} />}

      {awaitingAttention > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-primary">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            {plural(awaitingAttention, "urenstaat wacht", "urenstaten wachten")} al langer dan
            gebruikelijk op goedkeuring. Zolang die niet goedgekeurd is, kun je er niet voor
            factureren — stoot de opdrachtgever gerust even aan.
          </p>
        </div>
      )}

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
                <span
                  className={
                    active
                      ? "ml-1 tabular-nums opacity-70"
                      : "ml-1 tabular-nums text-muted-foreground/70"
                  }
                >
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
          title="Geen urenstaten gevonden"
          description={
            filterStatus
              ? "Er zijn geen urenstaten met deze status. Pas het filter aan of importeer nieuwe urenstaten."
              : "Je hebt nog geen urenstaten ingediend. Begin via een samenwerking of importeer bestaande urenstaten."
          }
          action={{ label: "Urenstaten importeren", href: "/diensten/importeer" }}
        />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {diensten.map((d) => {
            const statusInfo = STATUS_MAP[d.status] ?? {
              label: d.status,
              variant: "muted" as const,
            };
            const wait = summarizePerformanceWait(d);
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
                  {wait && (
                    <p
                      className={cn(
                        "mt-1 flex items-center gap-1 text-xs",
                        wait.attention ? "font-medium text-primary" : "text-muted-foreground",
                      )}
                    >
                      <Clock className="size-3 shrink-0" aria-hidden />
                      {performanceWaitLabel(wait)}
                    </p>
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
          {allDiensten.length} urenstaat{allDiensten.length !== 1 ? "/oplevering(en)" : ""} in
          totaal.
        </footer>
      )}
    </div>
  );
}
