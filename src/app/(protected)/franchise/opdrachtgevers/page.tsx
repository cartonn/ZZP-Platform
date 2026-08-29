import { type Metadata } from "next";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { tenantScopeWhere } from "@/lib/tenancy";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateShortNl } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { cn } from "@/lib/utils";
import { ClientHealthStrip } from "@/components/franchise/client-health-strip";
import {
  buildClientActivityInputs,
  classifyClientHealth,
  clientHealthLabel,
  summarizeClientHealth,
  type ClientHealth,
} from "@/lib/franchise/client-health";
import { getPaymentBehaviorForCompanies } from "@/lib/data/payment-behavior";
import { paymentTrustChip, paymentTrustChipBadgeVariant } from "@/lib/payment-behavior";
import {
  clientOutstandingByCompany,
  poolOutstandingTotals,
  poolOverdueAging,
} from "@/lib/franchise/client-outstanding";
import { outstandingInvoiceWhere } from "@/lib/administration/outstanding";
import { formatEuro } from "@/lib/invoices";
import { type AgingBucketKey } from "@/lib/administration/aging";

export const metadata: Metadata = { title: "Opdrachtgevers · Bemiddeling" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** URL-filterwaarde → gezondheidsstatus (of `null` = alle klanten). */
const FILTERS: Record<string, ClientHealth> = {
  aandacht: "attention",
  actief: "active",
  rustig: "quiet",
};

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "aandacht", label: "Stilgevallen" },
  { key: "actief", label: "Plaatst nu" },
  { key: "rustig", label: "Rustig" },
];

/** Zwaarste-bucket → badge-toon; identiek aan de /openstaand-pagina (geen drift). */
function bucketVariant(key: AgingBucketKey): "muted" | "warning" | "danger" {
  if (key === "d61_90" || key === "d90plus") return "danger";
  if (key === "d0_30" || key === "d31_60") return "warning";
  return "muted";
}

/** Compacte ouderdomslabels voor de pool-brede veroudering-uitsplitsing (presentatie, geen logica). */
const SHORT_BUCKET_LABEL: Record<AgingBucketKey, string> = {
  notDue: "Nog niet vervallen",
  d0_30: "1–30 dagen",
  d31_60: "31–60 dagen",
  d61_90: "61–90 dagen",
  d90plus: "90+ dagen",
};

export default async function FranchiseOpdrachtgeversPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requireRole("FRANCHISER");
  const sp = await searchParams;
  const filterKey = typeof sp.status === "string" ? sp.status : undefined;
  const activeFilter = filterKey ? (FILTERS[filterKey] ?? null) : null;

  // unbounded-allow: franchise-tenant-scoped bedrijven; beheerbaar volume
  const companies = await prisma.company.findMany({
    where: tenantScopeWhere(actor),
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
      _count: {
        select: {
          departments: true,
          jobs: true,
          collaborations: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  const ids = companies.map((c) => c.id);

  // Twee gegroepeerde aggregaten (geen N+1) voor het relatiegezondheid-signaal: welke klanten hebben
  // een open opdracht en wanneer plaatsten ze voor het laatst werk. Tenant-gescopet via de klant-ids.
  const [publishedJobs, collabActivity, paymentByCompany, outstandingInvoices] = await Promise.all([
    ids.length
      ? prisma.job.groupBy({
          by: ["companyId"],
          where: { companyId: { in: ids }, status: "PUBLISHED" },
          _count: { _all: true },
          _max: { createdAt: true },
        })
      : Promise.resolve([]),
    ids.length
      ? prisma.collaboration.groupBy({
          by: ["companyId"],
          where: { companyId: { in: ids } },
          _max: { updatedAt: true },
        })
      : Promise.resolve([]),
    // Betaalgedrag-reputatie per opdrachtgever: welke klanten betalen structureel te laat? Voor de
    // bemiddelaar het kernrisicosignaal — trage betalers bedreigen de cashflow van de hele pool ZZP'ers
    // én de eigen fee-inning. De ids zijn al tenant-gescopet (`tenantScopeWhere`), dus de scoping-eis van
    // de batch-loader (defense-in-depth) is voldaan; alleen het geaggregeerde oordeel, geen factuurdata.
    getPaymentBehaviorForCompanies(ids),
    // Openstaande facturen van de pool-ZZP'ers per opdrachtgever: het concrete cashflowsignaal dat de
    // betaalgedrag-reputatie mist — hoeveel staat er nú open bij deze klant en hoeveel is te laat. De
    // facturen lopen via de samenwerking (`collaboration.companyId`); tenant-gescopet via de klant-ids.
    // Canonieke openstaand-regel (`outstandingInvoiceWhere`) → geen drift met /openstaand.
    ids.length
      ? // unbounded-allow: franchise-tenant-scoped openstaande facturen; beheerbaar volume
        prisma.invoice.findMany({
          where: { ...outstandingInvoiceWhere, collaboration: { companyId: { in: ids } } },
          select: {
            totalCents: true,
            dueAt: true,
            collaboration: { select: { companyId: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const now = new Date();
  // Eén genormaliseerde openstaand-invoer, gedeeld door de per-opdrachtgever-rollup én de pool-brede
  // veroudering (zelfde bron → geen drift). Facturen zonder samenwerking (theoretisch) vallen weg.
  const outstandingRows = outstandingInvoices.flatMap((inv) =>
    inv.collaboration
      ? [
          {
            companyId: inv.collaboration.companyId,
            amountCents: inv.totalCents,
            dueAt: inv.dueAt,
          },
        ]
      : [],
  );
  // Openstaand per opdrachtgever via de canonieke aging-motor (drift-vrij met /openstaand).
  const outstandingByCompany = clientOutstandingByCompany(outstandingRows, now);
  const poolOutstanding = poolOutstandingTotals(outstandingByCompany);
  // Pool-brede veroudering van het te late geld: hoe erg is het te laat (recent vs. bijna oninbaar).
  const poolOverdue = poolOverdueAging(outstandingRows, now);
  // Eén bron van waarheid met /acties + de nav-badge: dezelfde pure afleiding van de klant-activiteit.
  const activityByCompany = buildClientActivityInputs(
    companies.map((c) => ({
      id: c.id,
      createdAt: c.createdAt,
      activeCollaborationCount: c._count.collaborations,
    })),
    publishedJobs,
    collabActivity,
  );

  const summary = summarizeClientHealth([...activityByCompany.values()], now);

  const rows = companies
    .map((c) => {
      const activity = activityByCompany.get(c.id)!;
      const behavior = paymentByCompany.get(c.id);
      return {
        company: c,
        health: classifyClientHealth(activity, now),
        lastActivityAt: activity.lastActivityAt,
        // Alleen de beslis-relevante uitersten (op tijd / vaak laat); neutraal/onbekend → null → geen
        // chip, zodat de lijst rustig blijft (dezelfde afspraak als de ZZP'er-opdrachtenlijst).
        paymentChip: behavior ? paymentTrustChip(behavior) : null,
        outstanding: outstandingByCompany.get(c.id) ?? null,
      };
    })
    .filter((r) => (activeFilter ? r.health === activeFilter : true));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="De cockpit · opdrachtgevers"
        title="Opdrachtgevers"
        description="De opdrachtgevers die je in je bemiddeling hebt gebracht, met hun relatiegezondheid."
        action={
          <Button asChild>
            <Link href="/franchise/opdrachtgevers/nieuw">
              <Plus className="size-4" aria-hidden /> Nieuwe opdrachtgever
            </Link>
          </Button>
        }
      />

      {companies.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="Nog geen opdrachtgevers"
            description="Zet je eerste opdrachtgever op — met afdelingen en diensten in één doorloop."
            action={{ label: "Nieuwe opdrachtgever", href: "/franchise/opdrachtgevers/nieuw" }}
          />
        </Card>
      ) : (
        <>
          <ClientHealthStrip summary={summary} />

          {poolOutstanding.totalOpenCents > 0 && (
            <Card className="p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div>
                  <p className="text-xs text-muted-foreground">Openstaand bij de pool</p>
                  <p className="text-lg font-semibold tabular-nums">
                    {formatEuro(poolOutstanding.totalOpenCents)}
                  </p>
                </div>
                {poolOutstanding.overdueCents > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Waarvan{" "}
                    <span className="font-medium text-warning">
                      {formatEuro(poolOutstanding.overdueCents)}
                    </span>{" "}
                    te laat bij{" "}
                    {plural(poolOutstanding.clientsOverdue, "opdrachtgever", "opdrachtgevers")}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Niets te laat</p>
                )}
              </div>
              {/* Veroudering-uitsplitsing: hoe erg is het te late geld — recent (waarschijnlijk inbaar)
                  vs. 90+ dagen (bijna oninbaar). Alleen vervallen buckets met een bedrag, oplopend. */}
              {poolOverdue.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  {poolOverdue.map((bucket) => (
                    <Badge key={bucket.key} variant={bucketVariant(bucket.key)}>
                      {SHORT_BUCKET_LABEL[bucket.key]}: {formatEuro(bucket.totalCents)}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          )}

          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => {
              const isActive =
                tab.key === "alle"
                  ? activeFilter === null
                  : filterKey === tab.key && activeFilter !== null;
              return (
                <Link
                  key={tab.key}
                  href={
                    tab.key === "alle"
                      ? "/franchise/opdrachtgevers"
                      : `/franchise/opdrachtgevers?status=${tab.key}`
                  }
                  className={cn(
                    "focus-ring rounded-full border px-3 py-1 text-sm transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {rows.length === 0 ? (
            <Card>
              <EmptyState
                icon={Building2}
                title="Geen klanten in deze weergave"
                description="Geen opdrachtgevers met deze relatiestatus. Kies een andere weergave."
                action={{ label: "Toon alle", href: "/franchise/opdrachtgevers" }}
              />
            </Card>
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {rows.map(({ company: c, health, lastActivityAt, paymentChip, outstanding }) => {
                const badge = clientHealthLabel(health);
                return (
                  <Link
                    key={c.id}
                    href={`/franchise/opdrachtgevers/${c.id}`}
                    className="card-interactive flex items-start justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{c.name}</p>
                        <Badge variant={badge.tone}>{badge.label}</Badge>
                        {paymentChip && (
                          <Badge variant={paymentTrustChipBadgeVariant(paymentChip)}>
                            {paymentChip.label}
                          </Badge>
                        )}
                        {outstanding && outstanding.overdueCount > 0 && (
                          <Badge variant={bucketVariant(outstanding.worstBucket)}>
                            {formatEuro(outstanding.overdueCents)} te laat
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{c.user.email}</p>
                    </div>
                    <p className="shrink-0 text-right text-xs text-muted-foreground">
                      {outstanding ? (
                        <>
                          <span className="font-medium tabular-nums text-foreground">
                            {formatEuro(outstanding.totalOpenCents)}
                          </span>{" "}
                          openstaand
                          <br />
                        </>
                      ) : null}
                      {plural(c._count.departments, "afdeling", "afdelingen")} ·{" "}
                      {plural(c._count.jobs, "dienst", "diensten")}
                      <br />
                      {lastActivityAt
                        ? `laatst actief ${formatDateShortNl(lastActivityAt)}`
                        : `sinds ${formatDateShortNl(c.createdAt)}`}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
