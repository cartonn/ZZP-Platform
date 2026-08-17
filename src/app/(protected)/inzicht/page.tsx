import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Clock,
  Coins,
  Download,
  Gauge,
  PieChart,
  Target,
  TrendingUp,
  Building2,
  Users,
  UserPlus,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireActor, type Actor } from "@/lib/authz";
import { type UserRole } from "@/lib/enums";
import { computeTenantFee } from "@/lib/tenant-fee";
import { buildTenantFeeTrend, type TenantFeeTrend } from "@/lib/tenant-fee-trend";
import { getTenantPlacementsTrend, type PlacementsTrend } from "@/lib/placements-trend";
import { getFreelancerStats } from "@/lib/freelancer-stats";
import { getFreelancerMembership } from "@/lib/freelancer-membership";
import { getDeliveryQuality, DELIVERY_TONE_LABEL } from "@/lib/collaboration-quality";
import { getClientStats } from "@/lib/client-stats";
import { getClientSpendBreakdown } from "@/lib/client-spend-breakdown";
import { getFreelancerRevenueBreakdown } from "@/lib/freelancer-revenue-breakdown";
import { getClientTimeToFill, getTenantTimeToFill } from "@/lib/time-to-fill";
import { getTenantStats, getTenantCompanyBreakdown } from "@/lib/tenant-stats";
import {
  getFreelancerRevenueTrend,
  getClientRevenueTrend,
  getTenantRevenueTrend,
  type RevenueTrend,
} from "@/lib/revenue-trend";
import { formatEuro } from "@/lib/invoices";
import { cn } from "@/lib/utils";
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
import {
  GaugeRing,
  DonutChart,
  BiWidget,
  BiStatList,
  BarSeries,
  RevenueHero,
} from "@/components/insight/bi";
import { getFreelancerProfitTrend, type ProfitTrend } from "@/lib/profit-trend";
import { getFreelancerWorkedHoursTrend, type WorkedHoursTrend } from "@/lib/worked-hours-trend";
import {
  getFreelancerHourlyRateTrend,
  getClientHourlyRateTrend,
  type HourlyRateTrend,
} from "@/lib/hourly-rate-trend";
import {
  getHoursCriterionSummary,
  type HoursCriterionSummary,
} from "@/lib/tax/hours-criterion-summary";
import { UrencriteriumProgress } from "@/components/tax/urencriterium-progress";

export const metadata: Metadata = { title: "Inzicht · Handslag" };

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

function formatUren(hours: number): string {
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded.toLocaleString("nl-NL", { maximumFractionDigits: 1 })} u`;
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
 * Urencriterium-kaart (1.225 uur → zelfstandigenaftrek): voortgangsbalk + één uitlegzin, met een
 * deep-link naar de indirecte-uren-registratie. De stand komt server-side uit
 * `getHoursCriterionSummary` (hergebruikt de bestaande telling); de voortgang zelf rendert de gedeelde
 * `UrencriteriumProgress` (ook gebruikt op /ontzorgd/uren) zodat beide oppervlakken niet driften.
 */
function WinstPerMaandCard({ trend }: { trend: ProfitTrend }) {
  if (!trend.hasData) {
    return (
      <BiWidget title="Winst per maand">
        <EmptyState
          icon={Coins}
          title="Nog geen winstcijfers"
          description="Zodra je facturen en uitgaven geboekt zijn, zie je hier je winst — omzet min kosten — per maand."
        />
      </BiWidget>
    );
  }
  const profitTone = trend.totalProfitCents >= 0 ? "success" : "warning";
  return (
    <BiWidget
      title="Winst per maand"
      action={
        <Link
          href="/ontzorgd"
          className="focus-ring inline-flex items-center gap-1 rounded text-sm font-medium text-primary hover:underline"
        >
          Naar ontzorgd
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Winst · laatste {trend.months} maanden
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-tight">
              {formatEuro(trend.totalProfitCents)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              omzet − kosten per maand · indicatief
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Omzet</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">
                {formatEuro(trend.totalRevenueCents)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Kosten</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">
                {formatEuro(trend.totalCostCents)}
              </p>
            </div>
          </div>
        </div>
        <BarSeries
          data={trend.series.map((m) => ({ key: m.key, label: m.label, value: m.profitCents }))}
          formatValue={formatEuro}
          height={132}
          tone={profitTone}
          label="Winst per maand"
        />
      </div>
    </BiWidget>
  );
}

/**
 * Gewerkte-uren-per-maand kaart: de operationele tegenhanger van "Winst per maand". Toont hoevéél de
 * ZZP'er per maand heeft gewerkt (goedgekeurde uren-prestaties), zodat drukke/rustige maanden zichtbaar
 * worden. De cijfers komen uit `buildWorkedHoursTrend` (zelfde maand-bucketing als de geldtrends),
 * server-side berekend. Alleen uren — geen bedragen.
 */
function GewerkteUrenPerMaandCard({ trend }: { trend: WorkedHoursTrend }) {
  if (!trend.hasData) {
    return (
      <BiWidget title="Gewerkte uren per maand">
        <EmptyState
          icon={Clock}
          title="Nog geen gewerkte uren"
          description="Zodra je uren zijn goedgekeurd, zie je hier hoeveel je per maand hebt gewerkt."
        />
      </BiWidget>
    );
  }
  return (
    <BiWidget
      title="Gewerkte uren per maand"
      action={
        <Link
          href="/diensten"
          className="focus-ring inline-flex items-center gap-1 rounded text-sm font-medium text-primary hover:underline"
        >
          Naar diensten
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Gewerkt · laatste {trend.months} maanden
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-tight">
              {formatUren(trend.totalHours)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">goedgekeurde uren per maand</p>
          </div>
          {trend.deltaPct !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Deze maand vs. vorige</p>
              <p
                className={cn(
                  "mt-0.5 font-mono text-lg font-semibold tabular-nums",
                  trend.deltaPct >= 0 ? "text-success" : "text-warning",
                )}
              >
                {trend.deltaPct >= 0 ? "+" : ""}
                {formatPercent(trend.deltaPct)}
              </p>
            </div>
          )}
        </div>
        <BarSeries
          data={trend.series.map((m) => ({ key: m.key, label: m.label, value: m.hours }))}
          formatValue={formatUren}
          height={132}
          tone="accent"
          label="Gewerkte uren per maand"
        />
      </div>
    </BiWidget>
  );
}

/** Uurtarief in centen → "€ 80/u" (nl-NL, hele euro's; tarieven zijn in de praktijk rond). */
function formatEuroPerHour(cents: number): string {
  return `${formatEuro(cents)}/u`;
}

/**
 * Gemiddeld-uurtarief-per-maand voor de ZZP'er: de tarief-tegenhanger van de winst-/uren-trends. Toont
 * het naar uren gewogen gemiddelde uurtarief per maand, zodat zichtbaar wordt of het tarief over tijd
 * stijgt of erodeert. De cijfers komen uit `buildHourlyRateTrend` (zelfde APPROVED HOURS-prestaties +
 * `rateCents`-snapshot en dezelfde maand-bucketing als de geldtrends), server-side berekend.
 */
function GemiddeldUurtariefPerMaandCard({
  trend,
  title = "Gemiddeld uurtarief per maand",
  emptyDescription = "Zodra je uren tegen een uurtarief zijn goedgekeurd, zie je hier hoe je gemiddelde uurtarief zich per maand ontwikkelt.",
  caption = "naar gewerkte uren gewogen · excl. toeslagen",
  deltaTone = "earner",
}: {
  trend: HourlyRateTrend;
  title?: string;
  emptyDescription?: string;
  caption?: string;
  /** "earner": stijging = groen (ZZP'er verdient meer). "neutral": richting is geen waardeoordeel (opdrachtgever-kosten). */
  deltaTone?: "earner" | "neutral";
}) {
  if (!trend.hasData || trend.averageRateCents === null) {
    return (
      <BiWidget title={title}>
        <EmptyState
          icon={TrendingUp}
          title="Nog geen tariefcijfers"
          description={emptyDescription}
        />
      </BiWidget>
    );
  }
  return (
    <BiWidget title={title}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Gemiddeld · laatste {trend.months} maanden
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-tight">
              {formatEuroPerHour(trend.averageRateCents)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
          </div>
          {trend.deltaPct !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Deze maand vs. vorige</p>
              <p
                className={cn(
                  "mt-0.5 font-mono text-lg font-semibold tabular-nums",
                  deltaTone === "neutral"
                    ? "text-foreground"
                    : trend.deltaPct >= 0
                      ? "text-success"
                      : "text-warning",
                )}
              >
                {trend.deltaPct >= 0 ? "+" : ""}
                {formatPercent(trend.deltaPct)}
              </p>
            </div>
          )}
        </div>
        <BarSeries
          data={trend.series.map((m) => ({
            key: m.key,
            label: m.label,
            value: m.rateCents ?? 0,
          }))}
          formatValue={formatEuroPerHour}
          height={132}
          tone="accent"
          label="Gemiddeld uurtarief per maand"
        />
      </div>
    </BiWidget>
  );
}

/**
 * Fee-per-maand trend voor de bemiddelaar: spiegel van de ZZP'er "Winst per maand". Toont de fee die
 * de bemiddelaar over het doorgezette volume verdient, per maand — zijn kern-P&L over tijd. De cijfers
 * komen uit `buildTenantFeeTrend` (puur: omzettrend × fee-percentage), server-side berekend.
 */
function FeePerMaandCard({ trend }: { trend: TenantFeeTrend }) {
  if (!trend.hasData) {
    return (
      <BiWidget title="Fee per maand">
        <EmptyState
          icon={Coins}
          title="Nog geen fee-cijfers"
          description="Zodra er volume via je bemiddeling loopt, zie je hier je fee per maand."
        />
      </BiWidget>
    );
  }
  return (
    <BiWidget title="Fee per maand">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Fee · laatste {trend.months} maanden
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-tight">
              {formatEuro(trend.totalFeeCents)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              over {formatEuro(trend.totalVolumeCents)} doorgezet volume · indicatief
            </p>
          </div>
          {trend.deltaPct !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Laatste maand</p>
              <p
                className={`mt-0.5 font-mono text-lg font-semibold tabular-nums ${
                  trend.deltaPct >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {trend.deltaPct >= 0 ? "+" : ""}
                {formatPercent(trend.deltaPct)}
              </p>
            </div>
          )}
        </div>
        <BarSeries
          data={trend.series.map((m) => ({ key: m.key, label: m.label, value: m.feeCents }))}
          formatValue={formatEuro}
          height={132}
          tone="success"
          label="Fee per maand"
        />
      </div>
    </BiWidget>
  );
}

/** Aantal plaatsingen → "3 plaatsingen" (nl-NL, correct enkel-/meervoud). */
function formatPlacements(count: number): string {
  return plural(count, "plaatsing", "plaatsingen");
}

/**
 * Plaatsingen-per-maand voor de bemiddelaar: de operationele doorzet-tegenhanger van de geld-trends
 * ("Doorgezet volume" / "Fee per maand"). Toont hoevéél nieuwe samenwerkingen per maand tot stand
 * kwamen — de kern-throughput van een bemiddeling. De cijfers komen uit `buildPlacementsTrend`
 * (zelfde maand-bucketing als de geldtrends), server-side berekend. Alleen tellingen — geen bedragen.
 */
function PlaatsingenPerMaandCard({ trend }: { trend: PlacementsTrend }) {
  if (!trend.hasData) {
    return (
      <BiWidget title="Plaatsingen per maand">
        <EmptyState
          icon={UserPlus}
          title="Nog geen plaatsingen"
          description="Zodra je samenwerkingen tot stand komen, zie je hier hoeveel plaatsingen je per maand realiseert."
        />
      </BiWidget>
    );
  }
  return (
    <BiWidget title="Plaatsingen per maand">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Plaatsingen · laatste {trend.months} maanden
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-tight">
              {trend.totalCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">nieuwe samenwerkingen per maand</p>
          </div>
          {trend.deltaPct !== null && (
            <div>
              <p className="text-xs text-muted-foreground">Deze maand vs. vorige</p>
              <p
                className={cn(
                  "mt-0.5 font-mono text-lg font-semibold tabular-nums",
                  trend.deltaPct >= 0 ? "text-success" : "text-warning",
                )}
              >
                {trend.deltaPct >= 0 ? "+" : ""}
                {formatPercent(trend.deltaPct)}
              </p>
            </div>
          )}
        </div>
        <BarSeries
          data={trend.series.map((m) => ({ key: m.key, label: m.label, value: m.count }))}
          formatValue={formatPlacements}
          height={132}
          tone="accent"
          label="Plaatsingen per maand"
        />
      </div>
    </BiWidget>
  );
}

/**
 * Omzet per opdrachtgever voor de ZZP'er: de inverse van de opdrachtgever-kaart "Per ZZP'er". Toont
 * welk deel van de betaalde omzet van welke klant komt — een afhankelijkheidssignaal (te veel omzet bij
 * één opdrachtgever is een bedrijfsrisico). De cijfers komen uit `getFreelancerRevenueBreakdown`
 * (dezelfde bron als `earnedCents` → geen drift), server-side berekend. Alleen eigen facturen.
 */
function OmzetPerOpdrachtgeverWidget({
  breakdown,
}: {
  breakdown: Awaited<ReturnType<typeof getFreelancerRevenueBreakdown>>;
}) {
  return (
    <BiWidget title="Omzet per opdrachtgever">
      {breakdown.rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nog geen omzet"
          description="Zodra facturen betaald zijn, zie je hier van welke opdrachtgevers je omzet komt."
        />
      ) : (
        <div className="space-y-3">
          {breakdown.concentrationPct != null &&
            breakdown.rows.length >= 2 &&
            breakdown.concentrationPct >= 50 && (
              <p className="text-xs text-muted-foreground">
                Eén opdrachtgever is goed voor {breakdown.concentrationPct}% van je omzet.
              </p>
            )}
          {breakdown.rows.map((r) => (
            <div key={r.companyId} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-medium">{r.name}</p>
                <span className="shrink-0 font-mono text-sm font-medium tabular-nums">
                  {formatEuro(r.paidCents)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(r.sharePct > 0 ? 3 : 0, r.sharePct)}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {r.sharePct}% · {plural(r.placements, "samenwerking", "samenwerkingen")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </BiWidget>
  );
}

function UrencriteriumCard({ summary }: { summary: HoursCriterionSummary }) {
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
      <UrencriteriumProgress summary={summary} />
    </BiWidget>
  );
}

async function FreelancerInzicht({ userId }: { userId: string }) {
  const [
    s,
    membership,
    trend,
    quality,
    hoursCriterion,
    profitTrend,
    workedHours,
    hourlyRate,
    revenueByClient,
  ] = await Promise.all([
    getFreelancerStats(userId),
    getFreelancerMembership(userId),
    getFreelancerRevenueTrend(userId),
    getDeliveryQuality(userId),
    getHoursCriterionSummary(userId),
    getFreelancerProfitTrend(userId),
    getFreelancerWorkedHoursTrend(userId),
    getFreelancerHourlyRateTrend(userId),
    getFreelancerRevenueBreakdown(userId),
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

      <WinstPerMaandCard trend={profitTrend} />

      <GewerkteUrenPerMaandCard trend={workedHours} />

      <GemiddeldUurtariefPerMaandCard trend={hourlyRate} />

      <OmzetPerOpdrachtgeverWidget breakdown={revenueByClient} />

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
  const [s, trend, timeToFill, spend, hourlyRate] = await Promise.all([
    getClientStats(userId),
    getClientRevenueTrend(userId),
    getClientTimeToFill(userId),
    getClientSpendBreakdown(userId),
    getClientHourlyRateTrend(userId),
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

      <BiWidget title="Per ZZP'er">
        {spend.rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nog geen uitgaven"
            description="Zodra facturen betaald zijn, zie je hier je uitgaven per ZZP'er."
          />
        ) : (
          <div className="space-y-3">
            {spend.concentrationPct != null &&
              spend.rows.length >= 2 &&
              spend.concentrationPct >= 50 && (
                <p className="text-xs text-muted-foreground">
                  Eén ZZP&apos;er is goed voor {spend.concentrationPct}% van je uitgaven.
                </p>
              )}
            {spend.rows.map((r) => (
              <div key={r.freelancerId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium">{r.name}</p>
                  <span className="shrink-0 font-mono text-sm font-medium tabular-nums">
                    {formatEuro(r.paidCents)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(r.sharePct > 0 ? 3 : 0, r.sharePct)}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {r.sharePct}% · {plural(r.placements, "samenwerking", "samenwerkingen")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </BiWidget>

      <GemiddeldUurtariefPerMaandCard
        trend={hourlyRate}
        title="Gemiddeld betaald uurtarief per maand"
        caption="naar afgenomen uren gewogen · excl. toeslagen"
        emptyDescription="Zodra uren tegen een uurtarief zijn goedgekeurd, zie je hier hoe het gemiddelde uurtarief dat je betaalt zich per maand ontwikkelt."
        deltaTone="neutral"
      />
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
  const [s, byCompany, trend, tenant, timeToFill, placements] = await Promise.all([
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
    getTenantPlacementsTrend(actor),
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
  const feeTrend = buildTenantFeeTrend(trend, feePercent);
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

      {feeSet && <FeePerMaandCard trend={feeTrend} />}

      <PlaatsingenPerMaandCard trend={placements} />

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

      <BiWidget
        title="Per opdrachtgever"
        action={
          withActivity.length > 0 ? (
            <Link
              href="/franchise/opdrachtgevers/export"
              prefetch={false}
              className="focus-ring inline-flex items-center gap-1 rounded text-sm font-medium text-primary hover:underline"
            >
              <Download className="size-3.5" aria-hidden />
              Exporteer (CSV)
            </Link>
          ) : undefined
        }
      >
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
