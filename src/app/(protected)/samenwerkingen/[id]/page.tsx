import { type Metadata } from "next";
import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  ClipboardList,
  Banknote,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { assessCollaborationDba, jobDbaIndicators, DBA_LEVEL_LABEL } from "@/lib/dba-monitor";
import { type PerformanceState, type InvoiceLifecycleState } from "@/lib/lifecycles";
import { computeOrt, resolveOrtRates, type OrtSegment } from "@/lib/ort";
import { ORT_CATEGORY_LABEL, ORT_SECTORS, ORT_SECTOR_LABEL, type OrtCategory } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  signContractAction,
  approvePerformanceAction,
  rejectPerformanceAction,
  editAndResubmitPerformanceAction,
  submitInvoiceAction,
  approveInvoiceAction,
  rejectInvoiceAction,
  confirmPaymentAction,
  creditInvoiceAction,
  openDisputeAction,
  resolveDisputeAction,
} from "./actions";
import { PerformanceForm } from "./performance-form";
import { performanceFormDefaults } from "@/lib/performance-form";
import { OrtProfileForm } from "./ort-profile-form";
import { formatDateShortNl } from "@/lib/format-date";

export const metadata: Metadata = { title: "Werkproces · ZZP Platform" };

const PERF_STATUS: Record<
  PerformanceState,
  { label: string; variant: "muted" | "warning" | "success" | "danger" }
> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SUBMITTED: { label: "Ter goedkeuring", variant: "warning" },
  APPROVED: { label: "Goedgekeurd", variant: "success" },
  REJECTED: { label: "Afgekeurd", variant: "danger" },
};

const INV_STATUS: Record<
  InvoiceLifecycleState,
  { label: string; variant: "muted" | "warning" | "success" | "danger" }
> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SUBMITTED: { label: "Ingediend", variant: "warning" },
  APPROVED: { label: "Goedgekeurd", variant: "success" },
  PAID: { label: "Betaald", variant: "success" },
  PROCESSED: { label: "Verwerkt", variant: "muted" },
  REJECTED: { label: "Afgekeurd", variant: "danger" },
  OVERDUE: { label: "Te laat", variant: "danger" },
  CREDITED: { label: "Gecrediteerd", variant: "danger" },
};

function fmt(d: Date | null) {
  return d ? formatDateShortNl(d) : null;
}

function parseOrtSegments(json: string | null | undefined): OrtSegment[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as OrtSegment[];
  } catch {
    return [];
  }
}

function OrtBreakdown({
  ortSegments,
  rateCents,
  ortProfile,
  ortCustomRates,
}: {
  ortSegments: OrtSegment[];
  rateCents: number;
  ortProfile?: string | null;
  ortCustomRates?: string | null;
}) {
  const result = computeOrt(
    ortSegments,
    rateCents,
    resolveOrtRates({ ortProfile, ortCustomRates }),
  );
  if (result.lines.length === 0) return null;
  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs font-medium text-muted-foreground">ORT-uitsplitsing</p>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-0.5 font-normal">Categorie</th>
            <th className="py-0.5 text-right font-normal">Uren</th>
            <th className="py-0.5 text-right font-normal">Basis</th>
            <th className="py-0.5 text-right font-normal">Toeslag</th>
            <th className="py-0.5 text-right font-normal">Totaal</th>
          </tr>
        </thead>
        <tbody>
          {result.lines.map((line, i) => (
            <tr key={i} className="border-t border-border/40">
              <td className="py-0.5">
                {line.category === "NORMAL"
                  ? "Regulier"
                  : ORT_CATEGORY_LABEL[line.category as OrtCategory]}
              </td>
              <td className="py-0.5 text-right tabular-nums">{line.hours}</td>
              <td className="py-0.5 text-right tabular-nums">{formatEuro(line.baseCents)}</td>
              <td className="py-0.5 text-right tabular-nums">
                {line.surchargeCents > 0
                  ? `+${formatEuro(line.surchargeCents)} (${Math.round(line.surchargeBps / 100)}%)`
                  : "—"}
              </td>
              <td className="py-0.5 text-right font-medium tabular-nums">
                {formatEuro(line.totalCents)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <td colSpan={4} className="py-0.5 font-medium">
              Subtotaal excl. btw
            </td>
            <td className="py-0.5 text-right font-semibold tabular-nums">
              {formatEuro(result.subtotalCents)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

type ChainStepStatus = "done" | "active" | "waiting" | "error";

interface ChainStep {
  label: string;
  status: ChainStepStatus;
  detail?: string;
}

const STEP_ICON: Record<ChainStepStatus, React.ReactNode> = {
  done: <CheckCircle2 className="size-4 text-success" aria-hidden />,
  active: <Clock className="size-4 text-warning" aria-hidden />,
  waiting: <Circle className="size-4 text-muted-foreground" aria-hidden />,
  error: <XCircle className="size-4 text-danger" aria-hidden />,
};

function buildChainSteps(col: {
  status: string;
  performances: Array<{ status: string }>;
  invoices: Array<{ lifecycleStatus: string | null }>;
}): ChainStep[] {
  const steps: ChainStep[] = [];

  // Stap 1: Contract
  const contractDone = col.status !== "PROPOSED";
  steps.push({
    label: "Contract",
    status: contractDone ? "done" : col.status === "CANCELLED" ? "waiting" : "active",
    detail: contractDone ? "Getekend" : "Wachten op ondertekening",
  });

  // Stap 2: Prestatie (uren / oplevering)
  const perfs = col.performances;
  let perfStatus: ChainStepStatus = "waiting";
  let perfDetail = "Nog geen uren of oplevering ingediend";
  if (!contractDone) {
    perfStatus = "waiting";
    perfDetail = "Volgt na contract";
  } else if (perfs.some((p) => p.status === "APPROVED")) {
    perfStatus = "done";
    perfDetail = "Goedgekeurd";
  } else if (perfs.some((p) => p.status === "SUBMITTED")) {
    perfStatus = "active";
    perfDetail = "Ter goedkeuring";
  } else if (perfs.some((p) => p.status === "REJECTED")) {
    perfStatus = "error";
    perfDetail = "Afgekeurd — nieuw indienen";
  } else if (perfs.length > 0) {
    perfStatus = "active";
    perfDetail = "Concept aangemaakt";
  }
  steps.push({ label: "Prestatie", status: perfStatus, detail: perfDetail });

  // Stap 3: Factuur
  const invs = col.invoices.filter((i) => i.lifecycleStatus);
  let invStatus: ChainStepStatus = "waiting";
  let invDetail = "Volgt na goedkeuring prestatie";
  if (invs.some((i) => ["PAID", "PROCESSED"].includes(i.lifecycleStatus!))) {
    invStatus = "done";
    invDetail = "Betaald";
  } else if (invs.some((i) => i.lifecycleStatus === "APPROVED")) {
    invStatus = "active";
    invDetail = "Goedgekeurd — wachten op betaling";
  } else if (invs.some((i) => i.lifecycleStatus === "SUBMITTED")) {
    invStatus = "active";
    invDetail = "Ter goedkeuring";
  } else if (invs.some((i) => i.lifecycleStatus === "REJECTED")) {
    invStatus = "error";
    invDetail = "Afgekeurd";
  } else if (invs.some((i) => i.lifecycleStatus === "OVERDUE")) {
    invStatus = "error";
    invDetail = "Vervallen — betaling te laat";
  } else if (invs.some((i) => i.lifecycleStatus === "DRAFT")) {
    invStatus = "active";
    invDetail = "Concept — nog niet ingediend";
  }
  steps.push({ label: "Factuur", status: invStatus, detail: invDetail });

  // Stap 4: Betaling
  const paid = invs.some((i) => ["PAID", "PROCESSED"].includes(i.lifecycleStatus!));
  const invApproved = invs.some((i) => i.lifecycleStatus === "APPROVED");
  steps.push({
    label: "Betaling",
    status: paid ? "done" : invApproved ? "active" : "waiting",
    detail: paid
      ? "Ontvangen"
      : invApproved
        ? "Wachten op betaling"
        : "Volgt na factuurgoedkeuring",
  });

  return steps;
}

export default async function WerkprocesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireActor();

  const col = await prisma.collaboration.findUnique({
    where: { id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          dbaDirectSupervision: true,
          dbaEmbedded: true,
          dbaFixedSchedule: true,
        },
      },
      company: { select: { name: true, userId: true } },
      freelancer: { select: { userId: true, user: { select: { name: true } } } },
      performances: { orderBy: { createdAt: "desc" } },
      invoices: { where: { lifecycleStatus: { not: null } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!col) notFound();

  const isClient = col.company.userId === actor.id;
  const isFreelancer = col.freelancer.userId === actor.id;
  if (!isClient && !isFreelancer && actor.role !== "ADMIN") notFound();

  const counterparty = isClient ? col.freelancer.user.name : col.company.name;
  const active = col.status === "ACTIVE";

  // DBA-monitoring (§6): rustig signaleren, mét disclaimer; geen juridisch oordeel (Besluit 2).
  const dba = assessCollaborationDba(
    { collaborationId: col.id, startDate: col.startDate, ...jobDbaIndicators(col.job) },
    new Date(),
  );

  // "Aan zet": wat moet déze rol nu doen?
  const todo: string[] = [];
  if (col.status === "PROPOSED") todo.push("Onderteken het contract om de opdracht te starten.");
  if (active) {
    const submitted = col.performances.filter((p) => p.status === "SUBMITTED").length;
    if (isClient && submitted > 0)
      todo.push(`${submitted} ingediende prestatie(s) wachten op je goedkeuring.`);
    const draftInv = col.invoices.filter((i) => i.lifecycleStatus === "DRAFT").length;
    if (isFreelancer && draftInv > 0)
      todo.push(`${draftInv} concept-factuur(en) klaar om in te dienen.`);
    const submittedInv = col.invoices.filter((i) => i.lifecycleStatus === "SUBMITTED").length;
    if (isClient && submittedInv > 0)
      todo.push(`${submittedInv} factuur(en) wachten op je goedkeuring.`);
    const approvedInv = col.invoices.filter((i) => i.lifecycleStatus === "APPROVED").length;
    if (isFreelancer && approvedInv > 0)
      todo.push(
        `${approvedInv} goedgekeurde factuur(en): markeer de ontvangst zodra je bent betaald.`,
      );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/samenwerkingen"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Samenwerkingen
        </Link>
      </div>

      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{col.job.title}</h1>
          <Badge variant={active ? "success" : col.status === "COMPLETED" ? "muted" : "default"}>
            {col.status === "PROPOSED"
              ? "Voorgesteld"
              : col.status === "ACTIVE"
                ? "Actief"
                : col.status === "COMPLETED"
                  ? "Afgerond"
                  : "Geannuleerd"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Werkproces met {counterparty} · betaling verloopt rechtstreeks; het platform houdt alleen
          de status bij.
        </p>
        <Link
          href={`/samenwerkingen/${col.id}/dossier`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ShieldCheck className="size-4" aria-hidden /> Compliance-dossier
        </Link>
      </header>

      {/* Cascade-keten: visuele voortgang van contract t/m betaling */}
      {col.status !== "CANCELLED" &&
        (() => {
          const steps = buildChainSteps(col);
          return (
            <Card>
              <CardContent className="py-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Voortgang
                </p>
                <ol className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-0">
                  {steps.map((step, i) => (
                    <li
                      key={step.label}
                      className="flex items-start gap-2 sm:flex-1 sm:flex-col sm:items-center sm:text-center"
                    >
                      <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
                        {STEP_ICON[step.status]}
                        <span
                          className={`text-xs font-medium ${step.status === "waiting" ? "text-muted-foreground" : "text-foreground"}`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {step.detail && (
                        <span className="text-xs text-muted-foreground sm:mt-0.5">
                          {step.detail}
                        </span>
                      )}
                      {i < steps.length - 1 && (
                        <span className="hidden sm:absolute sm:block" aria-hidden />
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          );
        })()}

      {todo.length > 0 && (
        <Card>
          <CardContent className="space-y-1 py-4">
            <p className="text-sm font-medium">Aan zet</p>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {todo.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Dispuut: bevroren cascade tot opgelost (§4 zijpad) */}
      {col.disputedAt ? (
        <Card>
          <CardContent className="space-y-2 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-danger">
                Dispuut open — werkproces bevroren
              </span>
              <Badge variant="danger">Bevroren</Badge>
            </div>
            {col.disputeReason && (
              <p className="text-sm text-muted-foreground">{col.disputeReason}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Het platform bemiddelt. Acties zijn geblokkeerd tot het dispuut is opgelost.
            </p>
            {actor.role === "ADMIN" && (
              <form action={resolveDisputeAction.bind(null, col.id)}>
                <Button type="submit" size="sm">
                  Dispuut oplossen
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      ) : (
        active && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Probleem melden / dispuut openen
            </summary>
            <form
              action={openDisputeAction.bind(null, col.id)}
              className="mt-2 flex items-center gap-2"
            >
              <input
                name="reason"
                required
                placeholder="Toelichting"
                className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
              />
              <Button type="submit" size="sm" variant="secondary">
                Dispuut openen
              </Button>
            </form>
          </details>
        )
      )}

      {/* DBA-signalering — rustig, niet-alarmerend, altijd met disclaimer */}
      {active && dba.signals.length > 0 && (
        <Card>
          <CardContent className="space-y-2 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Aandachtspunt inzet</span>
              <Badge variant={dba.level === "HOOG" ? "warning" : "muted"}>
                {DBA_LEVEL_LABEL[dba.level]}
              </Badge>
            </div>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {dba.signals.map((s) => (
                <li key={s.key}>{s.message}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{dba.disclaimer}</p>
          </CardContent>
        </Card>
      )}

      {/* Contract */}
      {col.status === "PROPOSED" && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm font-medium">Contract</p>
              <p className="text-sm text-muted-foreground">
                Onderteken om uren of opleveringen te kunnen vastleggen.
              </p>
            </div>
            <form action={signContractAction.bind(null, col.id)}>
              <Button type="submit" size="sm">
                Contract ondertekenen
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ORT-sectorprofiel — bepaalt de onregelmatigheidstoeslagen (zorg). Opdrachtgever/admin stelt in. */}
      {(active || col.status === "PROPOSED") &&
        (isClient || actor.role === "ADMIN" ? (
          <Card>
            <CardContent className="space-y-2 py-4">
              <div>
                <p className="text-sm font-medium">ORT-profiel (onregelmatigheidstoeslagen)</p>
                <p className="text-xs text-muted-foreground">
                  Bepaalt de toeslagen voor avond/nacht/weekend/feestdag. Kies de CAO-sector of
                  maatwerk; standaard = geen specifieke CAO.
                </p>
              </div>
              <OrtProfileForm
                collaborationId={col.id}
                ortProfile={col.ortProfile}
                ortCustomRates={col.ortCustomRates}
              />
              <p className="text-xs text-muted-foreground">
                De percentages zijn richtwaarden per CAO-categorie; controleer ze met de geldende
                CAO van de opdrachtgever.
              </p>
            </CardContent>
          </Card>
        ) : (
          col.ortProfile && (
            <p className="text-xs text-muted-foreground">
              ORT-profiel:{" "}
              <span className="font-medium text-foreground">
                {ORT_SECTOR_LABEL[col.ortProfile as (typeof ORT_SECTORS)[number]] ?? col.ortProfile}
              </span>
            </p>
          )
        ))}

      {/* Prestaties: urenstaat / oplevering */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-semibold">Uren & opleveringen</h2>
        </div>

        {active && isFreelancer && (
          <PerformanceForm
            collaborationId={col.id}
            rateCents={col.rate != null ? col.rate * 100 : null}
            ortProfile={col.ortProfile}
            ortCustomRates={col.ortCustomRates}
          />
        )}

        {col.performances.length === 0 ? (
          <Card>
            <EmptyState
              icon={ClipboardList}
              title="Nog geen uren of opleveringen"
              description="De ZZP'er dient uren of een oplevering in zodra de opdracht loopt."
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {col.performances.map((p) => {
              const st = PERF_STATUS[p.status as PerformanceState];
              return (
                <Card key={p.id}>
                  <CardContent className="space-y-2 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {p.type === "HOURS" ? "Urenstaat" : p.milestoneTitle || "Oplevering"}
                          </span>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {p.type === "HOURS"
                            ? `${p.hours ?? 0} uur${p.rateCents ? ` × ${formatEuro(p.rateCents)}` : ""}${p.periodStart && p.periodEnd ? ` · ${fmt(p.periodStart)} t/m ${fmt(p.periodEnd)}` : ""}`
                            : p.amountCents != null
                              ? formatEuro(p.amountCents)
                              : ""}
                          {p.description ? ` · ${p.description}` : ""}
                        </p>
                        {p.status === "REJECTED" && p.rejectionReason && (
                          <p className="text-xs text-danger">Afgekeurd: {p.rejectionReason}</p>
                        )}
                        {p.type === "HOURS" &&
                          p.rateCents &&
                          (() => {
                            const segs = parseOrtSegments(p.ortSegments);
                            return segs.length > 0 ? (
                              <OrtBreakdown
                                ortSegments={segs}
                                rateCents={p.rateCents}
                                ortProfile={col.ortProfile}
                                ortCustomRates={col.ortCustomRates}
                              />
                            ) : null;
                          })()}
                      </div>
                    </div>
                    {isFreelancer && p.status === "REJECTED" && (
                      <details className="border-t border-border pt-2">
                        <summary className="focus-ring cursor-pointer text-sm font-medium text-foreground hover:text-foreground">
                          Corrigeer en dien opnieuw in
                        </summary>
                        <div className="mt-3">
                          <PerformanceForm
                            collaborationId={col.id}
                            rateCents={col.rate != null ? col.rate * 100 : null}
                            ortProfile={col.ortProfile}
                            ortCustomRates={col.ortCustomRates}
                            action={editAndResubmitPerformanceAction.bind(null, p.id, col.id)}
                            submitLabel="Corrigeer en dien opnieuw in"
                            defaults={performanceFormDefaults(p)}
                          />
                        </div>
                      </details>
                    )}
                    {isClient && p.status === "SUBMITTED" && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                        <form action={approvePerformanceAction.bind(null, p.id, col.id)}>
                          <Button type="submit" size="sm">
                            Goedkeuren
                          </Button>
                        </form>
                        <form
                          action={rejectPerformanceAction.bind(null, p.id, col.id)}
                          className="flex items-center gap-2"
                        >
                          <input
                            name="reason"
                            required
                            placeholder="Reden afkeuren"
                            className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                          />
                          <Button type="submit" size="sm" variant="destructive">
                            Afkeuren
                          </Button>
                        </form>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Facturen (afgeleid uit goedgekeurde prestaties) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-semibold">Facturen</h2>
        </div>

        {col.invoices.length === 0 ? (
          <Card>
            <EmptyState
              icon={FileText}
              title="Nog geen facturen"
              description="Na goedkeuring van een prestatie ontstaat automatisch een concept-factuur."
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {col.invoices.map((inv) => {
              const st = INV_STATUS[(inv.lifecycleStatus ?? "DRAFT") as InvoiceLifecycleState];
              return (
                <Card key={inv.id}>
                  <CardContent className="space-y-2 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {inv.partyInvoiceNumber ?? "Concept-factuur"}
                          </span>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatEuro(inv.subtotalCents ?? 0)} excl. +{" "}
                          {formatEuro(inv.vatCents ?? 0)} btw = {formatEuro(inv.totalCents)} incl.
                          {fmt(inv.dueAt) ? ` · vervalt ${fmt(inv.dueAt)}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                      {isFreelancer &&
                        (inv.lifecycleStatus === "DRAFT" || inv.lifecycleStatus === "REJECTED") && (
                          <form action={submitInvoiceAction.bind(null, inv.id, col.id)}>
                            <Button type="submit" size="sm">
                              {inv.lifecycleStatus === "REJECTED"
                                ? "Corrigeer en dien opnieuw in"
                                : "Indienen"}
                            </Button>
                          </form>
                        )}
                      {isClient && inv.lifecycleStatus === "SUBMITTED" && (
                        <>
                          <form action={approveInvoiceAction.bind(null, inv.id, col.id)}>
                            <Button type="submit" size="sm">
                              Goedkeuren
                            </Button>
                          </form>
                          <form
                            action={rejectInvoiceAction.bind(null, inv.id, col.id)}
                            className="flex items-center gap-2"
                          >
                            <input
                              name="reason"
                              required
                              placeholder="Reden afkeuren"
                              className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                            />
                            <Button type="submit" size="sm" variant="destructive">
                              Afkeuren
                            </Button>
                          </form>
                        </>
                      )}
                      {(isFreelancer || isClient) && inv.lifecycleStatus === "APPROVED" && (
                        <form
                          action={confirmPaymentAction.bind(null, inv.id, col.id)}
                          className="flex items-center gap-2"
                        >
                          <Banknote className="size-4 text-muted-foreground" aria-hidden />
                          <Button type="submit" size="sm">
                            Betaling ontvangen
                          </Button>
                        </form>
                      )}
                      {(inv.lifecycleStatus === "PAID" || inv.lifecycleStatus === "PROCESSED") && (
                        <span className="text-xs text-muted-foreground">
                          Betaling geregistreerd.
                        </span>
                      )}
                      {isFreelancer &&
                        ["APPROVED", "PAID", "PROCESSED", "OVERDUE"].includes(
                          inv.lifecycleStatus ?? "",
                        ) && (
                          <form
                            action={creditInvoiceAction.bind(null, inv.id, col.id)}
                            className="flex items-center gap-2"
                          >
                            <input
                              name="reason"
                              required
                              placeholder="Reden creditering"
                              className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                            />
                            <Button type="submit" size="sm" variant="secondary">
                              Crediteren
                            </Button>
                          </form>
                        )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
