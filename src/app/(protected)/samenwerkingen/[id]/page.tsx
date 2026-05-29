import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, ClipboardList, Banknote } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { assessCollaborationDba, jobDbaIndicators, DBA_LEVEL_LABEL } from "@/lib/dba-monitor";
import { type PerformanceState, type InvoiceLifecycleState } from "@/lib/lifecycles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  signContractAction,
  logAndSubmitPerformanceAction,
  approvePerformanceAction,
  rejectPerformanceAction,
  submitInvoiceAction,
  approveInvoiceAction,
  rejectInvoiceAction,
  confirmPaymentAction,
  creditInvoiceAction,
  openDisputeAction,
  resolveDisputeAction,
} from "./actions";

export const metadata: Metadata = { title: "Werkproces · ZZP Platform" };

const PERF_STATUS: Record<PerformanceState, { label: string; variant: "muted" | "warning" | "success" | "danger" }> = {
  DRAFT: { label: "Concept", variant: "muted" },
  SUBMITTED: { label: "Ter goedkeuring", variant: "warning" },
  APPROVED: { label: "Goedgekeurd", variant: "success" },
  REJECTED: { label: "Afgekeurd", variant: "danger" },
};

const INV_STATUS: Record<InvoiceLifecycleState, { label: string; variant: "muted" | "warning" | "success" | "danger" }> = {
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
  return d ? d.toISOString().slice(0, 10) : null;
}

export default async function WerkprocesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireActor();

  const col = await prisma.collaboration.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, title: true, dbaDirectSupervision: true, dbaEmbedded: true, dbaFixedSchedule: true } },
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
    if (isClient && submitted > 0) todo.push(`${submitted} ingediende prestatie(s) wachten op je goedkeuring.`);
    const draftInv = col.invoices.filter((i) => i.lifecycleStatus === "DRAFT").length;
    if (isFreelancer && draftInv > 0) todo.push(`${draftInv} concept-factuur(en) klaar om in te dienen.`);
    const submittedInv = col.invoices.filter((i) => i.lifecycleStatus === "SUBMITTED").length;
    if (isClient && submittedInv > 0) todo.push(`${submittedInv} factuur(en) wachten op je goedkeuring.`);
    const approvedInv = col.invoices.filter((i) => i.lifecycleStatus === "APPROVED").length;
    if (isFreelancer && approvedInv > 0) todo.push(`${approvedInv} goedgekeurde factuur(en): markeer de ontvangst zodra je bent betaald.`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/samenwerkingen" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Samenwerkingen
        </Link>
      </div>

      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{col.job.title}</h1>
          <Badge variant={active ? "success" : col.status === "COMPLETED" ? "muted" : "default"}>
            {col.status === "PROPOSED" ? "Voorgesteld" : col.status === "ACTIVE" ? "Actief" : col.status === "COMPLETED" ? "Afgerond" : "Geannuleerd"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Werkproces met {counterparty} · betaling verloopt rechtstreeks; het platform houdt alleen de status bij.</p>
      </header>

      {todo.length > 0 && (
        <Card>
          <CardContent className="space-y-1 py-4">
            <p className="text-sm font-medium">Aan zet</p>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {todo.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Dispuut: bevroren cascade tot opgelost (§4 zijpad) */}
      {col.disputedAt ? (
        <Card>
          <CardContent className="space-y-2 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-danger">Dispuut open — werkproces bevroren</span>
              <Badge variant="danger">Bevroren</Badge>
            </div>
            {col.disputeReason && <p className="text-sm text-muted-foreground">{col.disputeReason}</p>}
            <p className="text-xs text-muted-foreground">Het platform bemiddelt. Acties zijn geblokkeerd tot het dispuut is opgelost.</p>
            {actor.role === "ADMIN" && (
              <form action={resolveDisputeAction.bind(null, col.id)}>
                <Button type="submit" size="sm">Dispuut oplossen</Button>
              </form>
            )}
          </CardContent>
        </Card>
      ) : (
        active && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Probleem melden / dispuut openen</summary>
            <form action={openDisputeAction.bind(null, col.id)} className="mt-2 flex items-center gap-2">
              <input name="reason" required placeholder="Toelichting" className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs" />
              <Button type="submit" size="sm" variant="secondary">Dispuut openen</Button>
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
              <Badge variant={dba.level === "HOOG" ? "warning" : "muted"}>{DBA_LEVEL_LABEL[dba.level]}</Badge>
            </div>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {dba.signals.map((s) => <li key={s.key}>{s.message}</li>)}
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
              <p className="text-sm text-muted-foreground">Onderteken om uren of opleveringen te kunnen vastleggen.</p>
            </div>
            <form action={signContractAction.bind(null, col.id)}>
              <Button type="submit" size="sm">Contract ondertekenen</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Prestaties: urenstaat / oplevering */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-semibold">Uren & opleveringen</h2>
        </div>

        {active && isFreelancer && (
          <Card>
            <CardContent className="py-4">
              <form action={logAndSubmitPerformanceAction.bind(null, col.id)} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block text-muted-foreground">Type</span>
                    <select name="type" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="HOURS">Urenstaat (uurtarief)</option>
                      <option value="MILESTONE">Oplevering (vast bedrag)</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-muted-foreground">Uren (bij uurtarief)</span>
                    <input name="hours" type="number" step="0.25" min="0" placeholder="bv. 8" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-muted-foreground">Bedrag € (bij oplevering)</span>
                    <input name="amount" type="number" step="0.01" min="0" placeholder="bv. 2500" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-muted-foreground">Titel oplevering</span>
                    <input name="milestoneTitle" type="text" maxLength={120} placeholder="bv. Mijlpaal 1" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted-foreground">Omschrijving</span>
                  <input name="description" type="text" maxLength={500} placeholder="Periode of toelichting" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </label>
                <Button type="submit" size="sm">Indienen ter goedkeuring</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {col.performances.length === 0 ? (
          <Card><EmptyState icon={ClipboardList} title="Nog geen uren of opleveringen" description="De ZZP'er dient uren of een oplevering in zodra de opdracht loopt." /></Card>
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
                          <span className="font-medium">{p.type === "HOURS" ? "Urenstaat" : p.milestoneTitle || "Oplevering"}</span>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.type === "HOURS"
                            ? `${p.hours ?? 0} uur${p.rateCents ? ` × ${formatEuro(p.rateCents)}` : ""}`
                            : p.amountCents != null ? formatEuro(p.amountCents) : ""}
                          {p.description ? ` · ${p.description}` : ""}
                        </p>
                        {p.status === "REJECTED" && p.rejectionReason && (
                          <p className="text-xs text-danger">Afgekeurd: {p.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                    {isClient && p.status === "SUBMITTED" && (
                      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                        <form action={approvePerformanceAction.bind(null, p.id, col.id)}>
                          <Button type="submit" size="sm">Goedkeuren</Button>
                        </form>
                        <form action={rejectPerformanceAction.bind(null, p.id, col.id)} className="flex items-center gap-2">
                          <input name="reason" required placeholder="Reden afkeuren" className="rounded-md border border-input bg-background px-2 py-1.5 text-xs" />
                          <Button type="submit" size="sm" variant="danger">Afkeuren</Button>
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
          <Card><EmptyState icon={FileText} title="Nog geen facturen" description="Na goedkeuring van een prestatie ontstaat automatisch een concept-factuur." /></Card>
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
                          <span className="font-medium">{inv.partyInvoiceNumber ?? "Concept-factuur"}</span>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatEuro(inv.subtotalCents ?? 0)} excl. + {formatEuro(inv.vatCents ?? 0)} btw = {formatEuro(inv.totalCents)} incl.
                          {fmt(inv.dueAt) ? ` · vervalt ${fmt(inv.dueAt)}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
                      {isFreelancer && inv.lifecycleStatus === "DRAFT" && (
                        <form action={submitInvoiceAction.bind(null, inv.id, col.id)}>
                          <Button type="submit" size="sm">Indienen</Button>
                        </form>
                      )}
                      {isClient && inv.lifecycleStatus === "SUBMITTED" && (
                        <>
                          <form action={approveInvoiceAction.bind(null, inv.id, col.id)}>
                            <Button type="submit" size="sm">Goedkeuren</Button>
                          </form>
                          <form action={rejectInvoiceAction.bind(null, inv.id, col.id)} className="flex items-center gap-2">
                            <input name="reason" required placeholder="Reden afkeuren" className="rounded-md border border-input bg-background px-2 py-1.5 text-xs" />
                            <Button type="submit" size="sm" variant="danger">Afkeuren</Button>
                          </form>
                        </>
                      )}
                      {(isFreelancer || isClient) && inv.lifecycleStatus === "APPROVED" && (
                        <form action={confirmPaymentAction.bind(null, inv.id, col.id)} className="flex items-center gap-2">
                          <Banknote className="size-4 text-muted-foreground" aria-hidden />
                          <Button type="submit" size="sm">Betaling ontvangen</Button>
                        </form>
                      )}
                      {(inv.lifecycleStatus === "PAID" || inv.lifecycleStatus === "PROCESSED") && (
                        <span className="text-xs text-muted-foreground">Betaling geregistreerd.</span>
                      )}
                      {isFreelancer && ["APPROVED", "PAID", "PROCESSED", "OVERDUE"].includes(inv.lifecycleStatus ?? "") && (
                        <form action={creditInvoiceAction.bind(null, inv.id, col.id)} className="flex items-center gap-2">
                          <input name="reason" required placeholder="Reden creditering" className="rounded-md border border-input bg-background px-2 py-1.5 text-xs" />
                          <Button type="submit" size="sm" variant="secondary">Crediteren</Button>
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
