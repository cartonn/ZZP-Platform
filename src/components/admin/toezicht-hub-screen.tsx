import Link from "next/link";
import { type PlatformStats } from "@/lib/admin-stats";
import { normalizeAuditFilters } from "@/lib/admin";
import { plural } from "@/lib/plural";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatsPanel } from "@/components/admin/stats-panel";
import { BewakingPanel } from "@/components/admin/bewaking-panel";
import { DbaPanel } from "@/components/admin/dba-panel";
import { AvgPanel } from "@/components/admin/avg-panel";
import { AuditPanel } from "@/components/admin/audit-panel";
import { EventStreamPanel } from "@/components/admin/event-stream-panel";

const TABS = [
  { key: "statistieken", label: "Statistieken" },
  { key: "bewaking", label: "Platform-bewaking" },
  { key: "dba", label: "DBA-monitor" },
  { key: "cascade", label: "Cascade-events" },
  { key: "audit", label: "Audit log" },
  { key: "avg", label: "Verwerkingsregister" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Toezicht-hub (kopkaart + tabs + tabinhoud), gemodelleerd op ProfileScreen / BemiddelingHubScreen.
 * Consolideert de toezicht-overzichten (statistieken, platform-bewaking, DBA-monitor, cascade-events,
 * audit-log, verwerkingsregister) achter één ?tab=-navigatie. ADMIN-only — de route gate't via requireRole.
 * Alleen het ACTIEVE tabpaneel wordt server-side gerenderd, zodat enkel die data laadt. De resterende
 * searchParams (cursor/filter) stromen door naar het actieve paneel met basePath
 * `/admin/toezicht?tab=<tab>`, zodat paginatie/filter-links binnen de hub blijven.
 */
export function ToezichtHubScreen({
  stats,
  tab: rawTab,
  searchParams,
}: {
  stats: PlatformStats;
  tab?: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const tab: TabKey = TABS.find((t) => t.key === rawTab)?.key ?? "statistieken";
  const basePath = `/admin/toezicht?tab=${tab}`;

  const tabHref = (key: TabKey) =>
    key === "statistieken" ? "/admin/toezicht" : `/admin/toezicht?tab=${key}`;

  const subtitle = ["Platform-overzicht", "live berekend uit verifieerbare signalen"].join(" · ");

  return (
    <div className="space-y-6">
      {/* Platformkop — Warmte-ontwerp: platform-avatar, titel + badge, subtitel, kerncijfers. */}
      <Card>
        <CardContent className="space-y-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-5">
            <div
              aria-hidden
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-xl font-semibold text-primary sm:size-20 sm:text-2xl"
            >
              Z
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="break-words font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Platform-overzicht
                </h1>
                <Badge variant="accent">Handslag</Badge>
                {stats.disputes.open > 0 && (
                  <Badge variant="danger">
                    {plural(stats.disputes.open, "open dispuut", "open disputen")}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-sm text-muted-foreground">
                  {plural(stats.users.total, "gebruiker", "gebruikers")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plural(
                    stats.collaborations.active,
                    "lopende samenwerking",
                    "lopende samenwerkingen",
                  )}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plural(stats.disputes.open, "open dispuut", "open disputen")}
                </span>
                {stats.verificationQueue.pending > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {plural(
                      stats.verificationQueue.pending,
                      "verificatie in wachtrij",
                      "verificaties in wachtrij",
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs — server-gerenderd via ?tab=, geen client-JS nodig. */}
      <nav
        aria-label="Toezichtsecties"
        className="flex flex-wrap gap-1 border-b border-border text-sm"
      >
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabHref(t.key)}
            aria-current={tab === t.key ? "page" : undefined}
            className={
              tab === t.key
                ? "focus-ring -mb-px border-b-2 border-primary px-3 py-2 font-medium text-foreground"
                : "focus-ring -mb-px border-b-2 border-transparent px-3 py-2 text-muted-foreground hover:text-foreground"
            }
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Alleen het actieve tabpaneel rendert — zo laadt enkel die data server-side. */}
      {tab === "statistieken" && <StatsPanel stats={stats} />}
      {tab === "bewaking" && <BewakingPanel />}
      {tab === "dba" && <DbaPanel niveau={first(searchParams.niveau)} basePath={basePath} />}
      {tab === "cascade" && (
        <EventStreamPanel categorie={first(searchParams.categorie)} basePath={basePath} />
      )}
      {tab === "audit" && (
        <AuditPanel filters={normalizeAuditFilters(searchParams)} basePath={basePath} />
      )}
      {tab === "avg" && <AvgPanel grond={first(searchParams.grond)} basePath={basePath} />}
    </div>
  );
}
