import { CalendarClock, CircleAlert, TrendingUp, Wallet } from "lucide-react";
import { type Actor } from "@/lib/authz";
import { getObligationItemsForClient } from "@/lib/data/payment-obligations";
import { formatEuro } from "@/lib/invoices";
import {
  buildPaymentObligations,
  summarizeDueThisWeek,
  type ObligationItem,
  type ObligationStage,
} from "@/lib/payment-obligations";
import {
  chargesByInvoiceId,
  summarizeObligationOverdueCharges,
} from "@/lib/payment-obligation-charges";
import { shouldShowCreditorSummary, summarizeCreditors } from "@/lib/creditor-summary";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CreditorSummaryCard } from "@/components/administratie/creditor-summary-card";

type BadgeVariant = "muted" | "warning" | "danger" | "success";

function stageVariant(stage: ObligationStage): BadgeVariant {
  switch (stage) {
    case "OVERDUE":
      return "danger";
    case "APPROVED":
      return "success";
    case "SUBMITTED":
      return "warning";
  }
}

function stageLabel(stage: ObligationStage): string {
  switch (stage) {
    case "SUBMITTED":
      return "Goed te keuren";
    case "APPROVED":
      return "Te betalen";
    case "OVERDUE":
      return "Te laat";
  }
}

function formatNlDate(date: Date): string {
  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Verplichtingen-paneel: wat de opdrachtgever nog moet betalen op een tijdlijn, inclusief facturen
 * die nog goedgekeurd moeten worden. Alleen CLIENT (de route/hub gate't rol). Laadt zelf zijn data
 * tenzij de aanroeper de items al heeft opgehaald (`items`), rendert geen eigen paginakop — de route
 * en de Administratie-hub leveren de titel.
 */
export async function VerplichtingenPanel({
  actor,
  items,
}: {
  actor: Actor;
  items?: ObligationItem[];
}) {
  // Defense-in-depth (CLAUDE.md regel 1: server-side is de waarheid, geen client-side-only gating).
  // Dit paneel laadt en toont de betaalverplichtingen van een OPDRACHTGEVER (CLIENT). De route en de
  // Administratie-hub gate'n de rol al, maar een herbruikbaar servercomponent dat CLIENT-financiën
  // ophaalt hoort zichzelf te gaten — anders zou een toekomstige derde aanroeper (of een regressie in
  // de hub-allowlist) de data onder de verkeerde "wie moet ik betalen"-lens tonen. Non-CLIENT → niets.
  if (actor.role !== "CLIENT") return null;

  const obligationItems = items ?? (await getObligationItemsForClient(actor.id));

  const now = new Date();
  const obligations = buildPaymentObligations(obligationItems, now);
  const dueThisWeek = summarizeDueThisWeek(obligationItems, now);
  const creditors = summarizeCreditors(obligationItems, now);
  const overdueCharges = summarizeObligationOverdueCharges(obligationItems, now);
  const chargesById = chargesByInvoiceId(overdueCharges);
  const hasItems = obligationItems.length > 0;

  if (!hasItems) {
    return (
      <Card>
        <EmptyState
          icon={Wallet}
          title="Geen openstaande verplichtingen"
          description="Zodra een ZZP'er een factuur indient, verschijnt hier wat je nog moet betalen."
          action={{ label: "Naar facturen", href: "/facturen" }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Samenvattingsstrip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Goed te keuren
            </p>
            <p className="font-mono text-base font-semibold tabular-nums">
              {formatEuro(obligations.awaitingApprovalGrossCents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ingepland
            </p>
            <p className="font-mono text-base font-semibold tabular-nums">
              {formatEuro(obligations.scheduledGrossCents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Te laat
            </p>
            <p className="font-mono text-base font-semibold tabular-nums text-danger">
              {formatEuro(obligations.overdueGrossCents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Totaal openstaand
            </p>
            <p className="font-mono text-base font-semibold tabular-nums">
              {formatEuro(obligations.totalGrossCents)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deze week — het actiegerichte cashflow-venster: op tijd betalen beschermt je betaalreputatie. */}
      {dueThisWeek.count > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <p className="text-foreground">
            <span className="font-semibold tabular-nums">{formatEuro(dueThisWeek.grossCents)}</span>{" "}
            te betalen deze week{" "}
            <span className="text-muted-foreground">
              ({dueThisWeek.count} {dueThisWeek.count === 1 ? "factuur" : "facturen"})
            </span>
            . Betaal op tijd om je betaalreputatie sterk te houden.
          </p>
        </div>
      )}

      {/* Oplopende extra kosten op te late facturen — self-interest-nudge: eerst deze afbetalen. */}
      {overdueCharges.hasCharges && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
          <TrendingUp className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <div className="space-y-0.5">
            <p className="text-foreground">
              Over je te late{" "}
              {overdueCharges.count === 1 ? "factuur" : `${overdueCharges.count} facturen`} loopt nu{" "}
              <span className="font-semibold tabular-nums">
                {formatEuro(overdueCharges.totalExtraCents)}
              </span>{" "}
              aan extra kosten op. Betaal deze eerst om verder oplopen te stoppen.
            </p>
            <p className="text-xs text-muted-foreground">
              Wettelijke handelsrente ({formatEuro(overdueCharges.totalInterestCents)}) plus
              incassokosten ({formatEuro(overdueCharges.totalCollectionCostsCents)}) die een
              ZZP&apos;er bij verzuim mag claimen (art. 6:119a BW en WIK). Bedragen zijn indicatief.
            </p>
          </div>
        </div>
      )}

      {/* Te betalen per leverancier — "aan wie moet ik betalen?" */}
      {shouldShowCreditorSummary(creditors) && <CreditorSummaryCard summary={creditors} />}

      {/* Buckets */}
      <div className="space-y-6">
        {obligations.buckets.map((bucket) => (
          <section key={bucket.key} className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {bucket.label}
              </h2>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {formatEuro(bucket.grossCents)}
              </span>
            </div>
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {bucket.items.map((item) => {
                const charges = chargesById.get(item.invoiceId);
                return (
                  <div
                    key={item.invoiceId}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{item.counterpartyName}</p>
                        <Badge variant={stageVariant(item.stage)}>{stageLabel(item.stage)}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        {item.jobTitle && <span className="truncate">{item.jobTitle}</span>}
                        {item.number && <span className="font-mono">{item.number}</span>}
                        {item.dueDate && <span>{formatNlDate(item.dueDate)}</span>}
                      </div>
                      {charges && (
                        <p className="mt-0.5 text-xs font-medium text-danger">
                          +{formatEuro(charges.totalWithChargesCents - item.grossCents)} rente &amp;
                          incassokosten · {charges.daysOverdue}{" "}
                          {charges.daysOverdue === 1 ? "dag" : "dagen"} te laat
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                      {formatEuro(item.grossCents)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* BTW-hint */}
      {obligations.totalVatCents > 0 && (
        <p className="text-xs text-muted-foreground">
          Hiervan is{" "}
          <span className="font-medium tabular-nums">{formatEuro(obligations.totalVatCents)}</span>{" "}
          BTW — die kun je terugvorderen als voorbelasting.
        </p>
      )}

      {/* Disclaimer */}
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Dit is een prognose op basis van de ingediende facturen. Hieraan kun je geen rechten
        ontlenen op de werkelijke betaaldatum.
      </p>
    </div>
  );
}
