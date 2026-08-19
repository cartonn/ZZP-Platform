import { type Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Handshake } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { hasExportableSchedule } from "@/lib/calendar/exportable";
import { AgendaSubscribe } from "@/components/agenda/agenda-subscribe";
import { agendaFeedPath } from "@/lib/calendar/feed-token";
import { COLLABORATION_TRANSITIONS } from "@/lib/collaborations";
import { invoiceableCollaborationsWhere } from "@/lib/invoices";
import { completionBlockReason } from "@/lib/cascade/completion";
import { assessCollaborationCredentials, type CredentialAlert } from "@/lib/collaboration-alerts";
import { assessCollaborationDba, jobDbaIndicators, DBA_LEVEL_LABEL } from "@/lib/dba-monitor";
import { CREDENTIAL_TYPE_LABEL } from "@/lib/credentials";
import { type FreelancerCredential } from "@/lib/matching";
import { type CollaborationStatus, type ContractStatus, type CredentialType } from "@/lib/enums";
import { type PerformanceState, type InvoiceLifecycleState } from "@/lib/lifecycles";
import { cascadeStage, isPerformanceNewerThanInvoice } from "@/lib/cascade/stage";
import { assessCancellation } from "@/lib/cancellation";
import { pageArgs, splitPage } from "@/lib/pagination";
import { withParams } from "@/components/admin/base-path";
import {
  COLLAB_STATUS_FILTER_LABEL,
  COLLAB_STATUS_FILTER_ORDER,
  collaborationStatusWhere,
  parseCollaborationStatusFilter,
  summarizeCollaborationStatusGroups,
} from "@/lib/collaboration-status-filter";
import { getOwnReliabilityForClient } from "@/lib/data/client-reliability";
import { ReliabilityReputationCard } from "@/components/administratie/reliability-reputation-card";
import { CancelCollaborationForm } from "@/components/collaborations/cancel-form";
import { CredentialReminderButton } from "@/components/collaborations/credential-reminder-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { changeCollaborationStatus, signContractFromList } from "../actions";
import { formatDateShortNl } from "@/lib/format-date";

export const metadata: Metadata = { title: "Samenwerkingen · Handslag" };

const STATUS: Record<
  CollaborationStatus,
  { label: string; variant: "default" | "success" | "muted" | "danger" }
> = {
  PROPOSED: { label: "Voorgesteld", variant: "default" },
  ACTIVE: { label: "Actief", variant: "success" },
  COMPLETED: { label: "Afgerond", variant: "muted" },
  CANCELLED: { label: "Geannuleerd", variant: "danger" },
};

const ACTION_LABEL: Record<CollaborationStatus, string> = {
  PROPOSED: "Terug naar voorstel",
  ACTIVE: "Markeer als actief",
  COMPLETED: "Markeer als afgerond",
  CANCELLED: "Annuleren",
};

function fmt(d: Date | null) {
  return d ? formatDateShortNl(d) : null;
}

/** Compliance-melding voor op de kaart, zonder opdrachttitel (die staat er al boven). */
function alertPhrase(a: CredentialAlert, name: string, isClient: boolean): string {
  const t = (list: CredentialType[]) => list.map((x) => CREDENTIAL_TYPE_LABEL[x]).join(", ");
  if (a.missing.length > 0)
    return isClient
      ? `${name} mist een vereist certificaat: ${t(a.missing)}.`
      : `Je mist een vereist certificaat: ${t(a.missing)}.`;
  if (a.expired.length > 0)
    return isClient
      ? `Certificaat van ${name} is verlopen: ${t(a.expired)}.`
      : `Je ${t(a.expired)} is verlopen.`;
  if (a.expiringSoon.length > 0)
    return isClient
      ? `Certificaat van ${name} verloopt binnenkort: ${t(a.expiringSoon)}.`
      : `Je ${t(a.expiringSoon)} verloopt binnenkort.`;
  return isClient
    ? `Certificaat van ${name} is in beoordeling: ${t(a.inReview)}.`
    : `Je ${t(a.inReview)} is in beoordeling.`;
}

export default async function SamenwerkingenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const sp = await searchParams;
  const cursor = typeof sp.cursor === "string" ? sp.cursor : null;
  const statusFilter = parseCollaborationStatusFilter(
    typeof sp.status === "string" ? sp.status : undefined,
  );

  const ownerWhere = {
    OR: [{ company: { userId: actor.id } }, { freelancer: { userId: actor.id } }],
  };

  // Pill-tellingen over de volledige (ongefilterde) eigen lijst — één goedkope groupBy op de
  // geïndexeerde relatie, niet per pagina.
  const statusCounts = await prisma.collaboration.groupBy({
    by: ["status"],
    where: ownerWhere,
    _count: { _all: true },
  });
  const groupCounts = summarizeCollaborationStatusGroups(statusCounts);

  const rows = await prisma.collaboration.findMany({
    where: { ...ownerWhere, ...collaborationStatusWhere(statusFilter) },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    ...pageArgs(cursor),
    include: {
      job: {
        select: {
          id: true,
          title: true,
          dbaDirectSupervision: true,
          dbaEmbedded: true,
          dbaFixedSchedule: true,
          credentialRequirements: { where: { required: true }, select: { credentialType: true } },
        },
      },
      company: { select: { name: true, userId: true } },
      freelancer: {
        select: {
          userId: true,
          user: { select: { name: true } },
          credentials: { select: { type: true, status: true, expiresAt: true } },
        },
      },
      // Laatste prestatie + cascade-factuur om de werkproces-fase op de kaart te tonen
      // (zelfde afleiding als de dashboard-kaarten).
      performances: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, createdAt: true },
      },
      invoices: {
        where: { lifecycleStatus: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { lifecycleStatus: true, createdAt: true },
      },
      // Blokkerende afgekeurde prestatie ongewindowd (parity met /acties + de cascadebadge): een
      // oudere REJECTED-prestatie telt ook als een nieuwere 'm uit het `take: 1`-venster duwt.
      _count: { select: { performances: { where: { status: "REJECTED" } } } },
    },
  });

  const { items: collaborations, nextCursor } = splitPage(rows);

  // Welke samenwerkingen lenen zich voor een LOSSE factuur (niet in de cascade)? Zelfde regel als
  // /facturen/nieuw — anders loopt de "Factuur opstellen"-knop dood op een lege keuzelijst zodra de
  // ZZP'er uren heeft ingediend (dan loopt facturatie via het werkproces).
  // ID-set-query voor factureerbare samenwerkingen; geen volledige lijst
  const invoiceableIds = new Set(
    // unbounded-allow: ID-set-query voor factureerbare samenwerkingen; geen volledige lijst
    (
      await prisma.collaboration.findMany({
        where: invoiceableCollaborationsWhere(actor.id),
        select: { id: true },
      })
    ).map((c) => c.id),
  );

  // Afronden-rem: voor welke samenwerkingen mag "Markeer als afgerond" worden aangeboden? Niet
  // zolang er nog open geld is (een niet-afgewikkelde factuur) of een ingediende prestatie op
  // goedkeuring wacht — de server zou de knop anders weigeren. We tonen dan de reden i.p.v. een dode
  // knop. Server blijft de waarheid (zie changeCollaborationStatus). Bulk-query, geen N+1.
  const collabIds = collaborations.map((c) => c.id);
  const [invoiceRows, pendingPerfRows] = await Promise.all([
    // unbounded-allow: factuurstatus-snapshot per zichtbare samenwerking (afronden-rem); page-begrensd
    prisma.invoice.findMany({
      where: { collaborationId: { in: collabIds } },
      select: { collaborationId: true, lifecycleStatus: true, status: true },
    }),
    prisma.performance.groupBy({
      by: ["collaborationId"],
      where: { collaborationId: { in: collabIds }, status: "SUBMITTED" },
      _count: { _all: true },
    }),
  ]);
  const invoicesByCollab = new Map<string, { lifecycleStatus: string | null; status: string }[]>();
  for (const r of invoiceRows) {
    if (!r.collaborationId) continue;
    const list = invoicesByCollab.get(r.collaborationId) ?? [];
    list.push({ lifecycleStatus: r.lifecycleStatus, status: r.status });
    invoicesByCollab.set(r.collaborationId, list);
  }
  const submittedPerfByCollab = new Map(
    pendingPerfRows.map((r) => [r.collaborationId, r._count._all]),
  );

  // Toon de agenda-export alleen wanneer er echt een geplande, actieve samenwerking is (geen dode
  // knop): status ACTIVE met een startdatum én vastgelegde weekdagen.
  const canExportAgenda = hasExportableSchedule(collaborations);

  // Betrouwbaarheidsreputatie-spiegel voor de opdrachtgever: dezelfde annulerings-cijfers die ZZP'ers
  // over hem zien op de opdracht-detailpagina, terug naar hemzelf als zelfverbeter-nudge. Sluit aan bij
  // de betaal- (/verplichtingen) en reactiereputatie-spiegel (/kandidaten). Alleen voor de opdrachtgever.
  const ownReliability =
    actor.role === "CLIENT" ? await getOwnReliabilityForClient(actor.id) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Het samenspel"
        title="Samenwerkingen"
        description="Voorgestelde en lopende samenwerkingen."
        action={
          canExportAgenda ? <AgendaSubscribe feedPath={agendaFeedPath(actor.id)} /> : undefined
        }
      />

      {ownReliability && <ReliabilityReputationCard reliability={ownReliability} />}

      {groupCounts.all === 0 ? (
        <Card>
          <EmptyState
            icon={Handshake}
            title="Nog geen samenwerkingen"
            description="Een opdrachtgever stelt een samenwerking voor vanuit een geaccepteerde reactie."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {COLLAB_STATUS_FILTER_ORDER.map((group) => {
              const active = statusFilter === group;
              return (
                <Link
                  key={group}
                  href={
                    group === "all"
                      ? "/samenwerkingen"
                      : withParams("/samenwerkingen", { status: group })
                  }
                  aria-current={active ? "page" : undefined}
                  className={[
                    "focus-ring inline-flex items-center rounded-md border px-3 py-1 text-sm transition-colors",
                    active
                      ? "border-accent-foreground/20 bg-accent text-accent-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  ].join(" ")}
                >
                  {COLLAB_STATUS_FILTER_LABEL[group]} ({groupCounts[group]})
                </Link>
              );
            })}
          </div>

          {collaborations.length === 0 && cursor ? (
            <Card>
              <EmptyState
                icon={Handshake}
                title="Geen verdere samenwerkingen"
                description="Je hebt alle samenwerkingen bekeken."
              />
            </Card>
          ) : collaborations.length === 0 ? (
            <Card>
              <EmptyState
                icon={Handshake}
                title="Geen samenwerkingen met deze status"
                description="Pas het filter aan om meer samenwerkingen te zien."
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {collaborations.map((c) => {
                const status = c.status as CollaborationStatus;
                const isClient = c.company.userId === actor.id;
                const counterparty = isClient ? c.freelancer.user.name : c.company.name;
                const completionBlock = completionBlockReason({
                  otherInvoices: invoicesByCollab.get(c.id) ?? [],
                  submittedPerformances: submittedPerfByCollab.get(c.id) ?? 0,
                });

                const requiredTypes = c.job.credentialRequirements.map(
                  (r) => r.credentialType as CredentialType,
                );
                const credentials: FreelancerCredential[] = c.freelancer.credentials.map((cr) => ({
                  type: cr.type as CredentialType,
                  status: cr.status as FreelancerCredential["status"],
                  expiresAt: cr.expiresAt,
                }));
                // Een open dispuut bevriest het werkproces: toon dan geen compliance-actiebadge naast
                // de "Dispuut — werkproces bevroren"-fase (dezelfde disputedAt-invariant als /acties).
                const alert =
                  requiredTypes.length > 0 &&
                  (status === "ACTIVE" || status === "PROPOSED") &&
                  c.disputedAt === null
                    ? assessCollaborationCredentials(requiredTypes, credentials)
                    : null;
                const showAlert = alert && alert.status !== "COMPLIANT";
                const urgent = alert?.status === "NON_COMPLIANT";
                const dba =
                  status === "ACTIVE"
                    ? assessCollaborationDba({
                        collaborationId: c.id,
                        startDate: c.startDate,
                        ...jobDbaIndicators(c.job),
                      })
                    : null;
                return (
                  <Card key={c.id}>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <Link
                              href={`/opdrachten/${c.job.id}`}
                              className="min-w-0 truncate font-medium underline-offset-4 hover:underline"
                            >
                              {c.job.title}
                            </Link>
                            <span className="flex shrink-0 items-center gap-2">
                              <Badge variant={STATUS[status].variant}>{STATUS[status].label}</Badge>
                              {dba && dba.level !== "LAAG" && (
                                <Badge
                                  variant={dba.level === "HOOG" ? "warning" : "muted"}
                                  title="DBA-aandachtspunt — geen juridisch oordeel"
                                >
                                  {DBA_LEVEL_LABEL[dba.level]}
                                </Badge>
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">Met {counterparty}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {c.rate != null && (
                          <span className="font-mono text-sm font-semibold text-foreground">
                            € {c.rate}
                            <span className="font-sans text-xs font-normal text-muted-foreground">
                              /uur
                            </span>
                          </span>
                        )}
                        {fmt(c.startDate) && <span>Start: {fmt(c.startDate)}</span>}
                        {fmt(c.endDate) && <span>Eind: {fmt(c.endDate)}</span>}
                      </div>

                      {/* Werkproces-fase — zelfde afleiding als de dashboard-kaarten: waar staat het,
                      wie is aan zet, met voortgang. Terminale statussen volstaan met een stille link. */}
                      {status === "PROPOSED" || status === "ACTIVE" ? (
                        (() => {
                          const stage = cascadeStage({
                            viewer: isClient ? "CLIENT" : "FREELANCER",
                            collaborationId: c.id,
                            collaborationStatus: status,
                            contractStatus: c.contractStatus as ContractStatus,
                            disputed: c.disputedAt !== null,
                            latestPerformanceStatus: (c.performances[0]?.status ??
                              null) as PerformanceState | null,
                            hasRejectedPerformance: c._count.performances > 0,
                            latestInvoiceStatus: (c.invoices[0]?.lifecycleStatus ??
                              null) as InvoiceLifecycleState | null,
                            performanceNewerThanInvoice: isPerformanceNewerThanInvoice(
                              c.performances[0]?.createdAt ?? null,
                              c.invoices[0]?.createdAt ?? null,
                            ),
                          });
                          return (
                            <Link
                              href={stage.cta.href}
                              className="focus-ring block rounded-md border border-border px-3 py-2.5 transition-colors hover:bg-muted/40"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm">{stage.label}</span>
                                {stage.youAreUp && <Badge variant="accent">Aan zet</Badge>}
                              </div>
                              <div className="mt-2 flex items-center gap-3">
                                <Progress
                                  value={Math.round((stage.step / stage.totalSteps) * 100)}
                                  className="h-1.5 flex-1"
                                />
                                <span className="shrink-0 text-xs text-muted-foreground">
                                  Stap {stage.step} van {stage.totalSteps}
                                </span>
                              </div>
                            </Link>
                          );
                        })()
                      ) : (
                        <div>
                          <Link
                            href={`/samenwerkingen/${c.id}`}
                            className="focus-ring text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                          >
                            Werkproces bekijken →
                          </Link>
                        </div>
                      )}

                      {showAlert &&
                        alert &&
                        (() => {
                          // Handelingsperspectief bij een gat: de opdrachtgever kan de ZZP'er
                          // gericht herinneren het ontbrekende/verlopen certificaat aan te leveren.
                          const reminderType = alert.missing[0] ?? alert.expired[0] ?? null;
                          return (
                            <div
                              className={`rounded-md border px-3 py-2 text-xs ${
                                urgent
                                  ? "border-danger/30 bg-danger/10 text-danger"
                                  : "border-warning/30 bg-warning/10 text-warning"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="size-4 shrink-0" aria-hidden />
                                <span>
                                  {alertPhrase(alert, counterparty, isClient)}
                                  {!isClient && (
                                    <>
                                      {" "}
                                      <Link
                                        href="/certificaten"
                                        className="font-medium underline underline-offset-2"
                                      >
                                        Bijwerken
                                      </Link>
                                    </>
                                  )}
                                </span>
                              </div>
                              {isClient && reminderType && (
                                <CredentialReminderButton
                                  collaborationId={c.id}
                                  type={reminderType}
                                />
                              )}
                            </div>
                          );
                        })()}

                      {(COLLABORATION_TRANSITIONS[status].length > 0 ||
                        (!isClient && invoiceableIds.has(c.id))) && (
                        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                          {/* Activeren kan alleen door het contract te ondertekenen — niet als losse
                          statuswijziging. Voor PROPOSED tonen we daarom "Contract ondertekenen". */}
                          {status === "PROPOSED" &&
                            (urgent ? (
                              <span className="text-xs font-medium text-danger">
                                {isClient
                                  ? "Ondertekenen kan pas als de ZZP'er aan de certificaateisen voldoet."
                                  : "Ondertekenen kan pas als je aan de certificaateisen voldoet."}
                              </span>
                            ) : (
                              <form action={signContractFromList.bind(null, c.id)}>
                                <Button type="submit" size="sm" variant="primary">
                                  Contract ondertekenen
                                </Button>
                              </form>
                            ))}
                          {COLLABORATION_TRANSITIONS[status]
                            .filter((to) => !(status === "PROPOSED" && to === "ACTIVE"))
                            .map((to) => {
                              if (to === "COMPLETED" && completionBlock)
                                return (
                                  <span key={to} className="text-xs font-medium text-danger">
                                    {completionBlock}
                                  </span>
                                );
                              if (to === "CANCELLED") {
                                // Annuleren vraagt een reden; de 7-dagen-kostenregel (opdrachtgever)
                                // wordt getoond — de server legt het oordeel vast.
                                const cancelTerms = assessCancellation({
                                  byClient: isClient,
                                  active: status === "ACTIVE",
                                  startDate: c.startDate,
                                  now: new Date(),
                                });
                                return (
                                  <CancelCollaborationForm
                                    key={to}
                                    collaborationId={c.id}
                                    chargeable={cancelTerms.chargeable}
                                    freeUntilLabel={
                                      cancelTerms.freeUntil ? fmt(cancelTerms.freeUntil) : null
                                    }
                                  />
                                );
                              }
                              return (
                                <form
                                  key={to}
                                  action={changeCollaborationStatus.bind(null, c.id, to)}
                                >
                                  <Button type="submit" size="sm" variant="secondary">
                                    {ACTION_LABEL[to]}
                                  </Button>
                                </form>
                              );
                            })}
                          {!isClient && invoiceableIds.has(c.id) && (
                            <Button asChild variant="secondary" size="sm">
                              <Link href="/facturen/nieuw">Factuur opstellen</Link>
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center">
          <Button asChild variant="secondary">
            <Link
              href={withParams("/samenwerkingen", {
                cursor: nextCursor,
                ...(statusFilter === "all" ? {} : { status: statusFilter }),
              })}
            >
              Meer laden
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
