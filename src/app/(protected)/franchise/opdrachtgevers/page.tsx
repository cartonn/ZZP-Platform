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
  classifyClientHealth,
  clientHealthLabel,
  summarizeClientHealth,
  type ClientActivityInput,
  type ClientHealth,
} from "@/lib/franchise/client-health";

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
  const [publishedJobs, collabActivity] = await Promise.all([
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
  ]);

  const publishedByCompany = new Map(publishedJobs.map((g) => [g.companyId, g]));
  const lastCollabByCompany = new Map(collabActivity.map((g) => [g.companyId, g._max.updatedAt]));

  const now = new Date();
  const activityByCompany = new Map<string, ClientActivityInput>();
  for (const c of companies) {
    const pub = publishedByCompany.get(c.id);
    const lastJobAt = pub?._max.createdAt ?? null;
    const lastCollabAt = lastCollabByCompany.get(c.id) ?? null;
    const lastActivityAt =
      lastJobAt && lastCollabAt
        ? lastJobAt > lastCollabAt
          ? lastJobAt
          : lastCollabAt
        : (lastJobAt ?? lastCollabAt);
    activityByCompany.set(c.id, {
      createdAt: c.createdAt,
      publishedJobCount: pub?._count._all ?? 0,
      activeCollaborationCount: c._count.collaborations,
      lastActivityAt,
    });
  }

  const summary = summarizeClientHealth([...activityByCompany.values()], now);

  const rows = companies
    .map((c) => {
      const activity = activityByCompany.get(c.id)!;
      return {
        company: c,
        health: classifyClientHealth(activity, now),
        lastActivityAt: activity.lastActivityAt,
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
              {rows.map(({ company: c, health, lastActivityAt }) => {
                const badge = clientHealthLabel(health);
                return (
                  <Link
                    key={c.id}
                    href={`/franchise/opdrachtgevers/${c.id}`}
                    className="card-interactive flex items-start justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{c.name}</p>
                        <Badge variant={badge.tone}>{badge.label}</Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{c.user.email}</p>
                    </div>
                    <p className="shrink-0 text-right text-xs text-muted-foreground">
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
