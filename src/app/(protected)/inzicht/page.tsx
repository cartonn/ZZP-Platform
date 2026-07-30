import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Coins,
  Gauge,
  PieChart,
  Target,
  Building2,
  Timer,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireActor, type Actor } from "@/lib/authz";
import { type UserRole } from "@/lib/enums";
import { computeTenantFee } from "@/lib/tenant-fee";
import { getFreelancerStats } from "@/lib/freelancer-stats";
import { getFreelancerMembership } from "@/lib/freelancer-membership";
import { getDeliveryQuality, DELIVERY_TONE_LABEL } from "@/lib/collaboration-quality";
import { getClientStats } from "@/lib/client-stats";
import { getClientTimeToFill, getTenantTimeToFill } from "@/lib/time-to-fill";
import { getTenantStats, getTenantCompanyBreakdown } from "@/lib/tenant-stats";
import {
  getFreelancerRevenueTrend,
  getClientRevenueTrend,
  getTenantRevenueTrend,
  type RevenueTrend,
} from "@/lib/revenue-trend";
import { formatEuro } from "@/lib/invoices";
import { plural } from "@/lib/plural";
import { summarizeClientApplications } from "@/lib/client-application-funnel";
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
import {
  getHoursCriterionSummary,
  hoursProgressPercent,
  type HoursCriterionSummary,
  type HoursPaceFeasibility,
} from "@/lib/tax/hours-criterion-summary";
import { Badge } from "@/components/ui/badge";

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
      <PageHeader eyebrow="Het observatorium" title="Inzicht" description={description} />
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

/** Percentage in nl-NL, max één decimaal (bv. "12,5%"). */
function formatPercent(pct: number): string {
  return `${pct.toLocaleString("nl-NL", { maximumFractionDigits: 1 })}%`;
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

/**
 * Urencriterium-kaart (1.225 uur → zelfstandigenaftrek): voortgangsbalk + één uitlegzin.
 * De stand komt server-side uit `getHoursCriterionSummary` (hergebruikt de bestaande telling).
 */
/**
 * Haalbaarheids-pill: alleen bij achterstand (niet gehaald én prognose haalt de grens niet). Vertaalt
 * het benodigde weektempo naar een glanceable oordeel. `gehaald`/`op-koers` tonen geen pill — die
 * standen spreken al positief uit de uitlegzin.
 */
const FEASIBILITY_PILL: Partial<
  Record<HoursPaceFeasibility, { label: string; variant: "accent" | "warning" | "danger" }>
> = {
  haalbaar: { label: "Nog haalbaar", variant: "accent" },
  ambitieus: { label: "Ambitieus tempo", variant: "warning" },
  onhaalbaar: { label: "Dit jaar niet meer", variant: "danger" },
};

function UrencriteriumCard({ summary }: { summary: HoursCriterionSummary }) {
  const pct = hoursProgressPercent(summary);
  const tone = summary.met
    ? "bg-success"
    : summary.projectedMet
      ? "bg-primary"
      : "bg-muted-foreground";
  const pill = summary.noActivity ? undefined : FEASIBILITY_PILL[summary.feasibility];
  return (
    <BiWidget
      title="Urencriterium"
      action={
        <Link
          href="/ontzorgd/uren"
          className="focus-ring inline-flex items-center gap-1 rounded text-sm font-medium text-primary hover:underline"
        >
          Uren registreren
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Timer className="size-4 shrink-0" aria-hidden />
            <span>
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {summary.totalHours.toLocaleString("nl-NL")}
              </span>{" "}
              van {summary.targetHours.toLocaleString("nl-NL")} uur geboekt in {summary.year}
            </span>
          </p>
          <span className="flex shrink-0 items-center gap-2">
            {pill && (
              <Badge variant={pill.variant} className="whitespace-nowrap">
                {pill.label}
              </Badge>
            )}
            <span className="font-mono text-sm tabular-nums text-muted-foreground">{pct}%</span>
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Urencriterium ${summary.year}`}
        >
          <div
            className={`h-full rounded-full ${tone}`}
            style={{ width: `${Math.max(pct > 0 ? 2 : 0, pct)}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {summary.noActivity
            ? "Je hebt dit jaar nog geen uren geboekt. Directe uren tellen mee zodra ze goedgekeurd zijn; registreer daarnaast je indirecte uren voor de aftrek."
            : summary.hint}
        </p>
      </div>
    </BiWidget>
  );
}

async function FreelancerInzicht({ userId }: { userId: string }) {
  const [s, membership, trend, quality, hoursCriterion] = await Promise.all([
    getFreelancerStats(userId),
    getFreelancerMembership(userId),
    getFreelancerRevenueTrend(userId),
    getDeliveryQuality(userId),
    getHoursCriterionSummary(userId),
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

      {hoursCriterion && <UrencriteriumCard summary={hoursCriterion} />}

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
  const [s, trend, timeToFill] = await Promise.all([
    getClientStats(userId),
    getClientRevenueTrend(userId),
    getClientTimeToFill(userId),
  ]);
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
                  ...(timeToFill
                    ? [
                        {
                          label: "Gem. tijd tot plaatsing",
                          value: plural(timeToFill.medianDays, "dag", "dagen"),
                          sub: `snelste ${plural(timeToFill.fastestDays, "dag", "dagen")}`,
                        },
                      ]
                    : []),
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

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusDonutWidget
          title="Kandidaten per status"
          data={toDonutData(s.applicationsByStatus, APPLICATION_SEGMENTS)}
          centerLabel="reacties"
          emptyText="Zodra er op je opdrachten wordt gereageerd, zie je hier de verdeling per status."
        />
        <ClientFunnelWidget
          funnel={summarizeClientApplications(s.applicationsByStatus, {
            oldestNewAt: s.oldestUnreviewedApplicationAt,
          })}
        />
      </div>
    </div>
  );
}

/**
 * Reactie-trechter voor de opdrachtgever: wachten-op-eerste-blik → shortlist → geaccepteerd, plus de
 * aannamekans over de besliste reacties. Voedt op dezelfde telling als de donut ernaast (één bron).
 */
function ClientFunnelWidget({
  funnel,
}: {
  funnel: ReturnType<typeof summarizeClientApplications>;
}) {
  return (
    <BiWidget
      title="Reactie-trechter"
      className="lg:col-span-2"
      action={
        <Link
          href="/kandidaten"
          className="focus-ring inline-flex items-center gap-1 rounded text-sm font-medium text-primary hover:underline"
        >
          Bekijk kandidaten
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      {funnel.total === 0 ? (
        <EmptyState
          icon={Users}
          title="Nog geen reacties"
          description="Zodra ZZP'ers op je opdrachten reageren, zie je hier je kandidaattrechter."
        />
      ) : (
        <BiStatList
          items={[
            {
              label: "Wachten op een eerste blik",
              value: funnel.awaitingFirstLook,
              sub:
                funnel.awaitingFirstLookOldestDays == null
                  ? "nog niet bekeken"
                  : funnel.awaitingFirstLookOldestDays === 0
                    ? "nog niet bekeken · sinds vandaag"
                    : `nog niet bekeken · langst ${plural(funnel.awaitingFirstLookOldestDays, "dag", "dagen")}`,
              tone: funnel.awaitingFirstLookAtRisk
                ? "danger"
                : funnel.awaitingFirstLook > 0
                  ? "warning"
                  : "default",
              href: "/kandidaten",
            },
            { label: "Op shortlist", value: funnel.shortlisted },
            {
              label: "Geaccepteerd",
              value: funnel.accepted,
              tone: funnel.accepted > 0 ? "success" : "default",
            },
            ...(funnel.acceptanceRate != null
              ? [
                  {
                    label: "Aannamekans",
                    value: formatPercent(funnel.acceptanceRate),
                    sub: "van de beoordeelde reacties",
                  },
                ]
              : []),
          ]}
        />
      )}
    </BiWidget>
  );
}

async function FranchiserInzicht({ actor }: { actor: Actor }) {
  const [s, byCompany, trend, tenant, timeToFill] = await Promise.all([
    getTenantStats(actor),
    getTenantCompanyBreakdown(actor),
    getTenantRevenueTrend(actor),
    actor.tenantId
      ? prisma.tenant.findUnique({
          where: { id: actor.tenantId },
          select: { feePercent: true },
        })
      : Promise.resolve(null),
    getTenantTimeToFill(actor),
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
  const feePercent = tenant?.feePercent ?? 0;
  const feeSet = feePercent > 0;
  const feeCents = computeTenantFee(s.revenuePaidCents, feePercent);
  return (
    <div className="space-y-4">
      <RevenueHero
        label="Doorgezet volume"
        value={formatEuro(s.revenuePaidCents)}
        deltaPct={trend.deltaPct}
        caption="betaald via je bemiddeling · trend per maand"
        bars={bars(trend)}
        formatValue={formatEuro}
        secondary={[
          { label: "Openstaand", value: formatEuro(s.revenueOpenCents) },
          { label: "Vulgraad", value: `${s.fillRate}%` },
          { label: "Opdrachtgevers", value: `${s.companies}` },
        ]}
      />

      <BiWidget title="Jouw fee">
        {feeSet ? (
          <BiStatList
            items={[
              {
                label: "Fee over doorgezet volume",
                value: formatEuro(feeCents),
                sub: `${formatPercent(feePercent)} van ${formatEuro(s.revenuePaidCents)}`,
                tone: "success",
              },
              {
                label: "Fee-percentage",
                value: formatPercent(feePercent),
                href: "/franchise/instellingen/bewerken",
                sub: "aanpassen in instellingen",
              },
            ]}
          />
        ) : (
          <EmptyState
            icon={Coins}
            title="Nog geen fee ingesteld"
            description="Stel je fee-percentage in om te zien wat je verdient over het doorgezette volume."
            action={{
              label: "Stel je fee-percentage in",
              href: "/franchise/instellingen/bewerken",
            }}
          />
        )}
      </BiWidget>

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
                ...(timeToFill
                  ? [
                      {
                        label: "Gem. tijd tot plaatsing",
                        value: plural(timeToFill.medianDays, "dag", "dagen"),
                        sub: `snelste ${plural(timeToFill.fastestDays, "dag", "dagen")}`,
                      },
                    ]
                  : []),
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
