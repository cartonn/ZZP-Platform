import { type Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Download } from "lucide-react";
import { requireActor } from "@/lib/authz";
import {
  approvablePerformances,
  getPrestatiesForClient,
  summarizePendingApprovalValue,
} from "@/lib/prestaties";
import { formatEuro } from "@/lib/invoices";
import { formatDateShortNl, formatDateRangeNl } from "@/lib/format-date";
import {
  PERFORMANCE_APPROVAL_STALE_DAYS,
  daysWaiting,
  summarizePerformanceApproval,
  waitingLabel,
} from "@/lib/performance-approval";
import {
  DELIVERY_MIN_SAMPLE,
  DELIVERY_TONE_LABEL,
  type DeliveryTone,
} from "@/lib/collaboration-quality";
import {
  clientReliabilityCaption,
  getClientDeliveryReliability,
} from "@/lib/client-delivery-reliability";
import { insufficientSampleNotice } from "@/lib/sample-size";
import { groupSubmittedForBulkApproval } from "@/lib/prestaties-bulk";
import { BulkApprovePanel } from "./bulk-approve-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Uren goedkeuren · ZZP Platform" };

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

const RELIABILITY_TONE_VARIANT: Record<DeliveryTone, "success" | "warning" | "muted"> = {
  EXCELLENT: "success",
  RELIABLE: "success",
  DEVELOPING: "warning",
  INSUFFICIENT: "muted",
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
          eyebrow="Het observatorium · prestaties"
          title="Uren goedkeuren"
          description="Het overzicht van in te dienen uren en opleveringen is er voor opdrachtgevers."
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
  const [allPrestaties, reliability] = await Promise.all([
    getPrestatiesForClient(actor.id),
    getClientDeliveryReliability(actor.id),
  ]);
  const prestaties = filterStatus
    ? allPrestaties.filter((p) => p.status === filterStatus)
    : allPrestaties;

  // Onder de minimum-steekproef spreekt een prominent percentage de "Te weinig gegevens"-badge tegen:
  // toon dan alleen hoeveel prestaties er nog nodig zijn voor een betrouwbaar beeld.
  const reliabilityNotice = insufficientSampleNotice(
    reliability.approvedPerformances,
    DELIVERY_MIN_SAMPLE,
    { singular: "goedgekeurde prestatie", plural: "goedgekeurde prestaties" },
  );

  const now = Date.now();
  // Een prestatie van een BEVROREN (disputed) samenwerking is niet goed te keuren: `approvePerformance`
  // weigert server-side (`assertNotDisputed`), en de nav-badge/`/acties`/cascade sluiten disputed al uit.
  // Tel 'm daarom óók hier niet als "wacht op goedkeuring" en houd 'm buiten de bulk-groepen — anders
  // toont dit scherm als enige oppervlak een niet-verdwijnende, niet-uitvoerbare actie (DOEL-1b-tegenspraak).
  const submitted = approvablePerformances(allPrestaties);
  const pendingCount = submitted.length;
  const pendingValue = summarizePendingApprovalValue(allPrestaties);
  const queue = summarizePerformanceApproval(submitted, now);
  // Samenwerkingen met ≥2 ingediende urenstaten kunnen in één keer worden goedgekeurd; bij één
  // volstaat de bestaande "Keuren →"-link. Losstaand van het statusfilter (bulk werkt altijd op de
  // volledige ingediende set, niet op het gefilterde overzicht). Disputed prestaties uitgesloten.
  const bulkGroups = groupSubmittedForBulkApproval(
    allPrestaties.filter((p) => !p.disputed),
    now,
    PERFORMANCE_APPROVAL_STALE_DAYS,
  );

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.13em] text-primary">
            Het observatorium · prestaties
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Uren goedkeuren</h1>
          <p className="text-sm text-muted-foreground">
            Urenstaten en opleveringen van jouw ZZP&apos;ers — overzicht over alle samenwerkingen.
            {pendingCount > 0 && (
              <span className="ml-1 font-medium text-foreground">
                {pendingCount} wacht op jouw goedkeuring.
              </span>
            )}
          </p>
          {pendingValue.totalCents > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              ≈{" "}
              <span className="font-medium text-foreground">
                {formatEuro(pendingValue.totalCents)}
              </span>{" "}
              aan uren wacht op goedkeuring — goedkeuren geeft dit vrij voor facturatie.
              {pendingValue.withoutAmount > 0 &&
                ` (${pendingValue.withoutAmount} zonder tarief nog niet meegerekend)`}
            </p>
          )}
          {queue.staleCount > 0 && (
            <p className="mt-1 text-xs font-medium text-warning">
              {queue.staleCount} {queue.staleCount === 1 ? "urenstaat wacht" : "urenstaten wachten"}{" "}
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

      {bulkGroups.length > 0 && <BulkApprovePanel groups={bulkGroups} />}

      {reliability.approvedPerformances > 0 && (
        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Leverbetrouwbaarheid van je ZZP&apos;ers</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {clientReliabilityCaption(reliability)}
              </p>
            </div>
            <Badge variant={RELIABILITY_TONE_VARIANT[reliability.tone]}>
              {DELIVERY_TONE_LABEL[reliability.tone]}
            </Badge>
          </div>
          {reliabilityNotice ? (
            // Onder de minimum-steekproef geen misleidend percentage; alleen wat er nog nodig is.
            <p className="text-sm text-muted-foreground">{reliabilityNotice}.</p>
          ) : (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">In één keer akkoord</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {reliability.firstTimeRightRate}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Gecorrigeerd</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {reliability.correctedPerformances}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Goedgekeurde urenstaten</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {reliability.approvedPerformances}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Afgeronde samenwerkingen</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {reliability.completedCollaborations}
                </dd>
              </div>
            </dl>
          )}
        </Card>
      )}

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
          title="Geen urenstaten gevonden"
          description={
            filterStatus
              ? "Er zijn geen urenstaten met deze status. Pas het filter aan."
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
                  <Badge variant={p.disputed ? "danger" : statusInfo.variant}>
                    {p.disputed ? "In dispuut" : statusInfo.label}
                  </Badge>
                  {/* Een bevroren (disputed) prestatie biedt geen "Keuren →": goedkeuren faalt server-side
                      tot het dispuut is opgelost. Wijs naar de samenwerking om het dispuut te behandelen. */}
                  <Link
                    href={`/samenwerkingen/${p.collaborationId}`}
                    className={
                      p.status === "SUBMITTED" && !p.disputed
                        ? "text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                        : "text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                    }
                  >
                    {p.disputed
                      ? "Dispuut behandelen →"
                      : p.status === "SUBMITTED"
                        ? "Keuren →"
                        : "Naar samenwerking →"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {allPrestaties.length > 0 && (
        <footer className="text-xs text-muted-foreground">
          {allPrestaties.length} urenstaat{allPrestaties.length !== 1 ? "/oplevering(en)" : ""} in
          totaal
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
