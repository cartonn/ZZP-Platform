import { CircleAlert, Wallet } from "lucide-react";
import { type Actor } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { formatEuro } from "@/lib/invoices";
import {
  buildPaymentObligations,
  type ObligationItem,
  type ObligationStage,
} from "@/lib/payment-obligations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

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
 * die nog goedgekeurd moeten worden. Alleen CLIENT (de route/hub gate't rol). Laadt zelf zijn data,
 * rendert geen eigen paginakop — de route en de Administratie-hub leveren de titel.
 */
export async function VerplichtingenPanel({ actor }: { actor: Actor }) {
  // Scope direct op de tegenpartij (`counterpartyUserId` = de opdrachtgever op de cascade-factuur),
  // dezelfde gezaghebbende sleutel als signals/pending-tasks, met de dedicated index
  // [counterpartyUserId, lifecycleStatus] i.p.v. een join door collaboration → company → user.
  const include = {
    collaboration: {
      select: {
        job: { select: { title: true } },
        freelancer: { select: { user: { select: { name: true } } } },
      },
    },
  } as const;

  // Cap: een prognose over de eerstvolgende ~200 openstaande facturen is ruim voldoende;
  // dichtstbijzijnde vervaldag eerst zodat de meest urgente verplichting nooit buiten de cap valt.
  // DRAFT valt weg: een concept is nog niet naar de opdrachtgever verstuurd en dus geen verplichting.
  const [scheduled, overdueNoDue] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        counterpartyUserId: actor.id,
        lifecycleStatus: { in: ["SUBMITTED", "APPROVED", "OVERDUE"] },
      },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }, { id: "asc" }],
      take: 200,
      include,
    }),
    // Vangnet: een OVERDUE-factuur zónder vervaldag sorteert door `nulls: "last"` achteraan en kan
    // bij veel openstaande facturen buiten de cap vallen — terwijl een te-late verplichting juist
    // het meest urgent is. Haal die gericht (en begrensd) op zodat ze nooit onzichtbaar wordt.
    prisma.invoice.findMany({
      where: { counterpartyUserId: actor.id, lifecycleStatus: "OVERDUE", dueAt: null },
      orderBy: { id: "asc" },
      take: 200,
      include,
    }),
  ]);

  // Samenvoegen + dedupliceren op factuur-id (de OVERDUE-vangnet-query kan overlappen met de hoofdset).
  const invoices = [
    ...new Map([...scheduled, ...overdueNoDue].map((inv) => [inv.id, inv])).values(),
  ];

  const items: ObligationItem[] = invoices.map((inv) => ({
    invoiceId: inv.id,
    stage: inv.lifecycleStatus as ObligationStage,
    netCents: inv.subtotalCents ?? 0,
    vatCents: inv.vatCents ?? 0,
    grossCents: inv.totalCents,
    dueDate: inv.dueAt,
    counterpartyName: inv.collaboration?.freelancer.user.name ?? "—",
    number: inv.partyInvoiceNumber ?? null,
    jobTitle: inv.collaboration?.job.title ?? null,
  }));

  const obligations = buildPaymentObligations(items, new Date());
  const hasItems = items.length > 0;

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
              {bucket.items.map((item) => (
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
                  </div>
                  <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                    {formatEuro(item.grossCents)}
                  </span>
                </div>
              ))}
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
