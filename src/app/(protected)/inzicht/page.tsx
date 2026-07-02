import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, Gauge, PieChart, Target, Building2 } from "lucide-react";
import { requireActor, type Actor } from "@/lib/authz";
import { type UserRole } from "@/lib/enums";
import { getFreelancerStats } from "@/lib/freelancer-stats";
import { getFreelancerMembership } from "@/lib/freelancer-membership";
import { getDeliveryQuality, DELIVERY_TONE_LABEL } from "@/lib/collaboration-quality";
import { getClientStats } from "@/lib/client-stats";
import { getTenantStats, getTenantCompanyBreakdown } from "@/lib/tenant-stats";
import {
  getFreelancerRevenueTrend,
  getClientRevenueTrend,
  getTenantRevenueTrend,
  type RevenueTrend,
} from "@/lib/revenue-trend";
import { formatEuro } from "@/lib/invoices";
import { plural } from "@/lib/plural";
import {
  toDonutData,
  type DonutDatum,
  COLLABORATION_SEGMENTS,
  APPLICATION_SEGMENTS,
} from "@/lib/status-breakdown";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { GaugeRing, DonutChart, BiWidget, BiStatList, RevenueHero } from "@/components/insight/bi";

export const metadata: Metadata = { title: "Inzicht · ZZP Platform" };

export default async function InzichtPage() {
  const actor = await requireActor();
  const role = actor.role as UserRole;

  // Admins hebben hun eigen platform-brede statistieken.
  if (role === "ADMIN") redirect("/admin/statistieken");

  const description =
    role === "FRANCHISER"
      ? "De cijfers van je bemiddeling — omzet, vulgraad, roster en samenwerkingen."
      : "Je cijfers in één overzicht — verdiensten, werk en activiteit.";

  return (
    <div className="space-y-6">
      <PageHeader title="Inzicht" description={description} />
      {role === "FREELANCER" ? (
        <FreelancerInzicht userId={actor.id} />
      ) : role === "CLIENT" ? (
        <ClientInzicht userId={actor.id} />
      ) : role === "FRANCHISER" ? (
        <FranchiserInzicht actor={actor} />
      ) : (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="Geen inzicht beschikbaar"
            description="Voor deze rol is nog geen cijferoverzicht ingericht."
          />
        </Card>
      )}
    </div>
  );
}

function rateTone(pct: number, good = 80, ok = 50): "success" | "warning" | "default" {
  return pct >= good ? "success" : pct >= ok ? "warning" : "default";
}

function bars(trend: RevenueTrend) {
  return trend.series.map((m) => ({ key: m.key, label: m.label, value: m.cents }));
}

/** Donut-widget met lege staat als er nog geen tellingen zijn. */
function StatusDonutWidget({
  title,
  data,
  centerLabel,
  emptyText,
}: {
  title: string;
  data: DonutDatum[];
  centerLabel: string;
  emptyText: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <BiWidget title={title}>
      {total === 0 ? (
        <EmptyState icon={PieChart} title="Nog geen verdeling" description={emptyText} />
      ) : (
        <DonutChart data={data} centerLabel={centerLabel} />
      )}
    </BiWidget>
  );
}

async function FreelancerInzicht({ userId }: { userId: string }) {
  const [s, membership, trend, quality] = await Promise.all([
    getFreelancerStats(userId),
    getFreelancerMembership(userId),
    getFreelancerRevenueTrend(userId),
    getDeliveryQuality(userId),
  ]);
  if (!s) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          title="Nog geen profiel"
          description="Maak je ZZP-profiel compleet; je cijfers verschijnen hier zodra je aan de slag bent."
        />
      </Card>
    );
  }
  const hasQuality = quality !== null && quality.tone !== "INSUFFICIENT";
  return (
    <div className="space-y-4">
      <RevenueHero
        label="Betaalde omzet"
        value={formatEuro(s.earnedCents)}
        deltaPct={trend.deltaPct}
        caption="totaal ontvangen · trend per maand"
        bars={bars(trend)}
        formatValue={formatEuro}
        secondary={[
          { label: "Openstaand", value: formatEuro(s.pendingCents) },
          { label: "Goedgekeurde uren", value: String(s.approvedHours) },
          { label: "Reacties", value: `${s.applicationsTotal}` },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusDonutWidget
          title="Status van je reacties"
          data={toDonutData(s.applicationsByStatus, APPLICATION_SEGMENTS)}
          centerLabel="reacties"
          emptyText="Zodra je op opdrachten reageert, zie je hier de verdeling per status."
        />
        <BiWidget title="Activiteit">
          <div className="grid grid-cols-2 gap-4">
            <GaugeRing
              bare
              size={108}
              value={s.winRate}
              label="Gewonnen"
              sub="van je reacties"
              tone={rateTone(s.winRate, 50, 25)}
            />
            {s.avgMatchScore != null ? (
              <GaugeRing
                bare
                size={108}
                value={s.avgMatchScore}
                label="Match-score"
                sub="gemiddeld"
                tone="accent"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 text-center">
                <Target className="size-5 text-muted-foreground" aria-hidden />
                <p className="font-mono text-2xl font-semibold">—</p>
                <p className="text-sm font-medium">Match-score</p>
              </div>
            )}
          </div>
        </BiWidget>
        <BiWidget title="Leverbetrouwbaarheid">
          {hasQuality ? (
            <div className="space-y-4">
              <GaugeRing
                bare
                value={quality.firstTimeRightRate}
                label="In één keer akkoord"
                sub="van je goedgekeurde prestaties"
                tone={rateTone(quality.firstTimeRightRate, 90, 70)}
              />
              <BiStatList
                items={[
                  {
                    label: "Gem. goedkeuringstijd",
                    value:
                      quality.avgApprovalDays != null
                        ? `${quality.avgApprovalDays} ${quality.avgApprovalDays === 1 ? "dag" : "dagen"}`
                        : "—",
                  },
                  {
                    label: "Beoordeling",
                    value: DELIVERY_TONE_LABEL[quality.tone],
                    sub: `${quality.approvedPerformances} goedgekeurde prestaties`,
                    tone:
                      quality.tone === "EXCELLENT"
                        ? "success"
                        : quality.tone === "DEVELOPING"
                          ? "warning"
                          : "default",
                  },
                ]}
              />
            </div>
          ) : (
            <EmptyState
              icon={Gauge}
              title="Nog geen signaal"
              description="Zodra je urenstaten en opleveringen zijn goedgekeurd, zie je hier hoe vaak je werk in één keer akkoord is."
            />
          )}
        </BiWidget>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusDonutWidget
          title="Je samenwerkingen"
          data={toDonutData(s.collaborationsByStatus, COLLABORATION_SEGMENTS)}
          centerLabel="totaal"
          emptyText="Zodra je samenwerkingen lopen, zie je hier de verdeling per status."
        />
        {membership.enabled && (
          <BiWidget
            title="Platformabonnement"
            className="lg:col-span-2"
            action={
              <Link
                href="/abonnement"
                className="focus-ring inline-flex items-center gap-1 rounded text-sm font-medium text-primary hover:underline"
              >
                Bekijk abonnement
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            }
          >
            <BiStatList
              items={[
                {
                  label: "Deze maand",
                  value: membership.billedThisMonth
                    ? formatEuro(membership.monthlyTotalCents)
                    : "—",
                  sub: membership.billedThisMonth
                    ? "incl. btw — je had werk deze maand"
                    : "geen werk deze maand, dus geen bijdrage",
                  tone: membership.billedThisMonth ? "default" : "success",
                },
                {
                  label: "Openstaand abonnement",
                  value: formatEuro(membership.openCents),
                  sub:
                    membership.openMonths > 0
                      ? `${plural(membership.openMonths, "maand", "maanden")} nog te voldoen`
                      : "niets openstaand",
                },
              ]}
            />
          </BiWidget>
        )}
      </div>
    </div>
  );
}

async function ClientInzicht({ userId }: { userId: string }) {
  const [s, trend] = await Promise.all([getClientStats(userId), getClientRevenueTrend(userId)]);
  if (!s) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          title="Nog geen bedrijfsprofiel"
          description="Vul je bedrijfsprofiel aan; je cijfers verschijnen hier zodra je opdrachten plaatst."
        />
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <RevenueHero
        label="Uitgaven"
        value={formatEuro(s.spentCents)}
        deltaPct={trend.deltaPct}
        caption="totaal betaald · trend per maand"
        bars={bars(trend)}
        formatValue={formatEuro}
        secondary={[
          { label: "Openstaand", value: formatEuro(s.openCents) },
          { label: "Geplaatst", value: `${s.publishedJobs}` },
          { label: "Lopend", value: `${s.activeCollaborations}` },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusDonutWidget
          title="Samenwerkingen per status"
          data={toDonutData(s.collaborationsByStatus, COLLABORATION_SEGMENTS)}
          centerLabel="totaal"
          emptyText="Zodra er samenwerkingen lopen, zie je hier de verdeling per status."
        />
        <BiWidget title="Opdrachten">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <GaugeRing
              bare
              value={s.fillRate}
              label="Vervullingsgraad"
              sub={`${s.filledJobs} van ${s.publishedJobs} vervuld`}
              tone={rateTone(s.fillRate)}
            />
            <div className="w-full">
              <BiStatList
                items={[
                  { label: "Geplaatst", value: s.publishedJobs, href: "/opdrachten" },
                  { label: "Vervuld", value: `${s.filledJobs}/${s.publishedJobs}` },
                  {
                    label: "Lopende samenwerkingen",
                    value: s.activeCollaborations,
                    href: "/samenwerkingen",
                  },
                ]}
              />
            </div>
          </div>
        </BiWidget>
        <BiWidget title="Compliance">
          <GaugeRing
            bare
            value={s.complianceRate}
            label="Zonder waarschuwing"
            sub={`${s.compliantPlacements} van ${s.activeCollaborations} actief`}
            tone={
              s.complianceRate >= 100 ? "success" : s.complianceRate >= 80 ? "warning" : "danger"
            }
          />
        </BiWidget>
      </div>
    </div>
  );
}

async function FranchiserInzicht({ actor }: { actor: Actor }) {
  const [s, byCompany, trend] = await Promise.all([
    getTenantStats(actor),
    getTenantCompanyBreakdown(actor),
    getTenantRevenueTrend(actor),
  ]);
  if (!s) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          title="Nog geen bemiddeling"
          description="Zodra je bemiddeling is ingericht, verschijnen hier de cijfers van je regio."
        />
      </Card>
    );
  }
  const withActivity = byCompany.filter((r) => r.totalJobs > 0 || r.revenuePaidCents > 0);
  return (
    <div className="space-y-4">
      <RevenueHero
        label="Betaalde omzet"
        value={formatEuro(s.revenuePaidCents)}
        deltaPct={trend.deltaPct}
        caption="bemiddeling · trend per maand"
        bars={bars(trend)}
        formatValue={formatEuro}
        secondary={[
          { label: "Openstaand", value: formatEuro(s.revenueOpenCents) },
          { label: "Vulgraad", value: `${s.fillRate}%` },
          { label: "Opdrachtgevers", value: `${s.companies}` },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusDonutWidget
          title="Samenwerkingen per status"
          data={toDonutData(s.collaborationsByStatus, COLLABORATION_SEGMENTS)}
          centerLabel="totaal"
          emptyText="Zodra er samenwerkingen lopen, zie je hier de verdeling per status."
        />
        <BiWidget title="Vulgraad">
          <div className="space-y-4">
            <GaugeRing
              bare
              value={s.fillRate}
              label="Diensten vervuld"
              sub={`${s.filledJobs} van ${s.totalJobs}`}
              tone={rateTone(s.fillRate)}
            />
            <BiStatList
              items={[
                {
                  label: "Open diensten",
                  value: s.openJobs,
                  href: "/franchise/diensten",
                  tone: s.openJobs > 0 ? "warning" : "default",
                },
                {
                  label: "Lopende samenwerkingen",
                  value: s.activeCollaborations,
                  href: "/franchise/samenwerkingen",
                },
              ]}
            />
          </div>
        </BiWidget>
        <BiWidget title="Roster">
          <div className="space-y-4">
            <GaugeRing
              bare
              value={s.engageabilityRate}
              label="Inzetbaar"
              sub={`${s.engageableFreelancers} van ${s.rosterFreelancers}`}
              tone={rateTone(s.engageabilityRate)}
            />
            <BiStatList
              items={[
                { label: "ZZP'ers", value: s.rosterFreelancers, href: "/franchise/zzpers" },
                { label: "Opdrachtgevers", value: s.companies, href: "/franchise/opdrachtgevers" },
              ]}
            />
          </div>
        </BiWidget>
      </div>

      <BiWidget title="Per opdrachtgever">
        {withActivity.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nog geen activiteit"
            description="Zodra je diensten uitzet en facturen lopen, zie je hier omzet en vulgraad per opdrachtgever."
          />
        ) : (
          <div className="space-y-3">
            {withActivity.map((r) => (
              <div key={r.companyId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium">{r.name}</p>
                  <span className="shrink-0 font-mono text-sm font-medium tabular-nums">
                    {formatEuro(r.revenuePaidCents)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(r.fillRate > 0 ? 3 : 0, r.fillRate)}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {r.filledJobs}/{r.totalJobs} · {r.fillRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </BiWidget>
    </div>
  );
}
