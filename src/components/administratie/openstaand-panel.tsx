import Link from "next/link";
import { Wallet } from "lucide-react";
import { type Actor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import {
  buildAgingReport,
  type OpenInvoice,
  AGING_BUCKETS,
  type AgingBucketKey,
} from "@/lib/administration/aging";
import { buildPayoutForecastMap, effectivePayoutDate } from "@/lib/administration/payout-forecast";
import { isInvoiceOutstanding } from "@/lib/administration/outstanding";
import { buildReminderEligibilityMap } from "@/lib/administration/openstaand-reminders";
import { type ManualReminderEligibility } from "@/lib/manual-payment-reminder";
import { type InvoiceLifecycleState } from "@/lib/lifecycles";
import { type PayoutForecast } from "@/lib/invoice-payment-forecast";
import { InlinePaymentReminderButton } from "@/components/invoices/inline-payment-reminder-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

function bucketVariant(key: AgingBucketKey): "muted" | "warning" | "danger" {
  if (key === "d61_90" || key === "d90plus") return "danger";
  if (key === "d0_30" || key === "d31_60") return "warning";
  return "muted";
}

interface OpenInvoicesResult {
  open: OpenInvoice[];
  /** Verwachte-betaaldatum per factuur-id (alleen ZZP'er). Leeg voor opdrachtgever. */
  forecasts: Map<string, PayoutForecast>;
  /** Handmatige-herinnering-eligibility per factuur-id (alleen ZZP'er/crediteur). Leeg voor opdrachtgever. */
  reminderEligibility: Map<string, ManualReminderEligibility>;
}

async function fetchOpenInvoices(
  actorId: string,
  isFreelancer: boolean,
): Promise<OpenInvoicesResult> {
  const where = isFreelancer
    ? { collaboration: { freelancer: { userId: actorId } } }
    : { collaboration: { company: { userId: actorId } } };

  // Voor de ZZP'er ook de eigen betaalde facturen laden: daaruit leiden we het betaalgedrag per
  // opdrachtgever af en projecteren we de realistische betaaldatum (privacy — enkel eigen historie).
  const [invoices, paidRows] = await Promise.all([
    // unbounded-allow: eigen facturen — voedt het volledige openstaand-saldo, afkappen zou dat
    // bedrag vervalsen
    prisma.invoice.findMany({
      where,
      include: {
        collaboration: {
          select: {
            job: { select: { title: true } },
            company: { select: { id: true, name: true } },
            freelancer: { select: { id: true, user: { select: { name: true } } } },
          },
        },
      },
    }),
    isFreelancer
      ? prisma.invoice.findMany({
          where: { collaboration: { freelancer: { userId: actorId } }, status: "PAID" },
          orderBy: { updatedAt: "desc" },
          take: 300,
          select: {
            issuedAt: true,
            dueAt: true,
            updatedAt: true,
            collaboration: { select: { company: { select: { id: true } } } },
          },
        })
      : Promise.resolve([]),
  ]);

  // Canonieke openstaand-regel (één bron van waarheid, gedeeld met de CSV-export en 9 andere
  // consumenten) — nooit de literal-arrays hier inline dupliceren: dat laat het scherm en het
  // dashboard-getal uiteenlopen zodra de regel in outstanding.ts verandert.
  const outstanding = invoices.filter(isInvoiceOutstanding);

  const open = outstanding.map((inv) => {
    const isCascade = inv.lifecycleStatus != null;
    // Partij-nummer als dat is toegekend (elke losse factuur + cascade ná indienen); anders het
    // globale nummer (oude losse factuur van vóór de partij-nummering).
    const number = inv.partyInvoiceNumber ?? inv.number;
    const counterpartyName = isFreelancer
      ? (inv.collaboration?.company.name ?? "—")
      : (inv.collaboration?.freelancer.user.name ?? "—");
    const counterpartyId = isFreelancer
      ? (inv.collaboration?.company.id ?? null)
      : (inv.collaboration?.freelancer.id ?? null);
    return {
      id: inv.id,
      number,
      counterpartyName,
      counterpartyId,
      jobTitle: inv.collaboration?.job.title ?? null,
      dueAt: inv.dueAt,
      amountCents: inv.totalCents,
      collaborationId: inv.collaborationId,
      isCascade,
    };
  });

  const forecasts = isFreelancer
    ? buildPayoutForecastMap(
        outstanding.map((inv) => ({
          id: inv.id,
          companyId: inv.collaboration?.company.id ?? null,
          issuedAt: inv.issuedAt,
          dueAt: inv.dueAt,
        })),
        paidRows.map((row) => ({
          companyId: row.collaboration?.company.id ?? null,
          issuedAt: row.issuedAt,
          dueAt: row.dueAt,
          paidAt: row.updatedAt,
        })),
      )
    : new Map<string, PayoutForecast>();

  // Handmatige-herinnering-eligibility per openstaande post (alleen ZZP'er/crediteur): de nudge staat
  // zo direct in de debiteurenlijst i.p.v. alleen op het factuurdetail. De afkoelperiode leunt op de
  // laatste herinnering uit het auditlogboek — dezelfde bron van waarheid als het detail. De echte
  // gate (rol + ownership + cooldown) blijft in `sendPaymentReminder`; dit bepaalt of de knop mag.
  let reminderEligibility = new Map<string, ManualReminderEligibility>();
  if (isFreelancer && outstanding.length > 0) {
    const ids = outstanding.map((inv) => inv.id);
    // unbounded-allow: herinnerlogs voor de openstaande facturen van één gebruiker (id-set-query)
    const reminderLogs = await prisma.auditLog.findMany({
      where: { action: "INVOICE_REMINDER_SENT", entityType: "Invoice", entityId: { in: ids } },
      orderBy: { createdAt: "desc" },
      select: { entityId: true, createdAt: true },
    });
    const lastReminderAtById = new Map<string, Date>();
    for (const log of reminderLogs) {
      if (log.entityId && !lastReminderAtById.has(log.entityId))
        lastReminderAtById.set(log.entityId, log.createdAt);
    }
    reminderEligibility = buildReminderEligibilityMap(
      outstanding.map((inv) => ({
        id: inv.id,
        status: inv.status,
        lifecycleStatus: inv.lifecycleStatus as InvoiceLifecycleState | null,
        issuedAt: inv.issuedAt,
        dueAt: inv.dueAt,
      })),
      lastReminderAtById,
    );
  }

  return { open, forecasts, reminderEligibility };
}

/**
 * Openstaand-paneel: openstaande facturen van de actor, gerangschikt naar ouderdom (rol-bewust).
 * ADMIN heeft geen eigen openstaande posten. Laadt zelf zijn data, rendert geen eigen paginakop.
 */
export async function OpenstaandPanel({ actor }: { actor: Actor }) {
  const isAdmin = actor.role === "ADMIN";
  const isFreelancer = actor.role === "FREELANCER";

  if (isAdmin) {
    return (
      <Card>
        <EmptyState
          icon={Wallet}
          title="Geen openstaande posten"
          description="Beheerders hebben geen eigen openstaande posten."
        />
      </Card>
    );
  }

  const {
    open: openInvoices,
    forecasts,
    reminderEligibility,
  } = await fetchOpenInvoices(actor.id, isFreelancer);
  const now = new Date();
  const report = buildAgingReport(openInvoices, now);

  // Vooruitblik: nog niet vervallen facturen die binnen 7 dagen binnenkomen. Voor de ZZP'er telt de
  // realistische verwachte-betaaldatum (betaalgedrag van de opdrachtgever) i.p.v. enkel de
  // contractuele vervaldag — geld van een structureel trage opdrachtgever valt zo niet te vroeg in
  // "deze week". Géén garantie/incasso (geld blijft PENDING).
  const weekAhead = new Date(now.getTime() + 7 * 86_400_000);
  const upcoming = report.rows.filter((r) => {
    if (r.daysOverdue > 0) return false;
    const eff = effectivePayoutDate(r.id, r.dueAt, forecasts);
    return eff != null && eff <= weekAhead;
  });
  const upcomingCents = upcoming.reduce((sum, r) => sum + r.amountCents, 0);

  return (
    <div className="space-y-6">
      {report.rows.length > 0 && (
        <div className="flex justify-end">
          <a
            href="/api/administratie/openstaand"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Openstaand CSV
          </a>
        </div>
      )}

      {report.rows.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="flex-1">
              <CardContent className="space-y-1 p-4">
                <p className="text-xs text-muted-foreground">Totaal openstaand</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatEuro(report.totalOpenCents)}
                </p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="space-y-1 p-4">
                <p className="text-xs text-muted-foreground">Waarvan te laat</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatEuro(report.overdueCents)}
                </p>
                {report.overdueCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {report.overdueCount} {report.overdueCount === 1 ? "post" : "posten"}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="space-y-1 p-4">
                <p className="text-xs text-muted-foreground">
                  {isFreelancer ? "Binnenkomend deze week" : "Te betalen deze week"}
                </p>
                <p className="text-lg font-semibold tabular-nums">{formatEuro(upcomingCents)}</p>
                <p className="text-xs text-muted-foreground">
                  {upcoming.length > 0
                    ? isFreelancer
                      ? `${plural(upcoming.length, "post", "posten")} verwacht binnen 7 dagen`
                      : `${plural(upcoming.length, "post", "posten")} met vervaldatum binnen 7 dagen`
                    : isFreelancer
                      ? "niets verwacht binnen 7 dagen"
                      : "geen vervaldatum binnen 7 dagen"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {AGING_BUCKETS.map((b) => (
                    <th
                      key={b.key}
                      className="px-4 py-2 text-left text-xs font-medium text-muted-foreground"
                    >
                      {b.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {report.buckets.map((bucket) => (
                    <td key={bucket.key} className="px-4 py-3 tabular-nums">
                      <p className="font-semibold">{formatEuro(bucket.totalCents)}</p>
                      <p className="text-xs text-muted-foreground">
                        {bucket.count} {bucket.count === 1 ? "post" : "posten"}
                      </p>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {report.relations.length > 1 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                {isFreelancer ? "Per opdrachtgever" : "Per ZZP'er"}
              </h2>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {report.relations.map((relation) => (
                  <div
                    key={relation.counterpartyId ?? relation.counterpartyName}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{relation.counterpartyName}</p>
                        {relation.overdueCount > 0 && (
                          <Badge variant={bucketVariant(relation.worstBucket)}>
                            {plural(relation.overdueCount, "te late post", "te late posten")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {plural(relation.count, "openstaande post", "openstaande posten")}
                        {relation.overdueCents > 0
                          ? ` · waarvan ${formatEuro(relation.overdueCents)} te laat`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatEuro(relation.totalOpenCents)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {report.rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title="Geen openstaande posten"
            description={
              isFreelancer
                ? "Je hebt geen openstaande facturen om te ontvangen."
                : "Je hebt geen openstaande facturen om te betalen."
            }
          />
        </Card>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {report.rows.map((row) => {
            const href =
              row.isCascade && row.collaborationId
                ? `/samenwerkingen/${row.collaborationId}`
                : `/facturen/${row.id}`;
            const canRemind = reminderEligibility.get(row.id)?.eligible === true;
            return (
              <div
                key={row.id}
                className="card-interactive relative flex items-center justify-between gap-4 px-4 py-3"
              >
                {/* Stretched-link overlay: de hele rij navigeert naar het detail, terwijl de
                    herinner-knop (pointer-events-auto) een eigen actie behoudt — geen genest
                    interactief element in een anchor. */}
                <Link
                  href={href}
                  aria-label={`Bekijk factuur ${row.number} · ${row.counterpartyName}`}
                  className="focus-ring absolute inset-0 rounded-lg"
                >
                  <span className="sr-only">Bekijk factuur</span>
                </Link>
                <div className="pointer-events-none min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium tabular-nums">{row.number}</p>
                    <Badge variant={bucketVariant(row.bucket)}>
                      {AGING_BUCKETS.find((b) => b.key === row.bucket)?.label}
                    </Badge>
                    {(() => {
                      if (row.daysOverdue > 0) {
                        return (
                          <span className="text-xs text-danger">
                            {plural(row.daysOverdue, "dag", "dagen")} te laat
                          </span>
                        );
                      }
                      const forecast = forecasts.get(row.id);
                      if (forecast) {
                        return (
                          <span className="text-xs text-muted-foreground">
                            verwacht betaald rond {formatDateShortNl(forecast.expectedAt)}
                            {forecast.daysAfterDue != null && forecast.daysAfterDue > 0
                              ? ` · doorgaans ${plural(forecast.daysAfterDue, "dag", "dagen")} na de vervaldag`
                              : " · op basis van eerdere betalingen"}
                          </span>
                        );
                      }
                      return (
                        row.dueAt && (
                          <span className="text-xs text-muted-foreground">
                            verwacht rond {formatDateShortNl(row.dueAt)}
                          </span>
                        )
                      );
                    })()}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.counterpartyName}
                    {row.jobTitle ? ` · ${row.jobTitle}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="pointer-events-none text-sm font-semibold tabular-nums">
                    {formatEuro(row.amountCents)}
                  </span>
                  {canRemind && (
                    <span className="pointer-events-auto relative">
                      <InlinePaymentReminderButton invoiceId={row.id} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
