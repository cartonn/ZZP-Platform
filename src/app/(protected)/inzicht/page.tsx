import { type Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Clock,
  CreditCard,
  Gauge,
  Handshake,
  Receipt,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Building2,
} from "lucide-react";
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
} from "@/lib/revenue-trend";
import { formatEuro } from "@/lib/invoices";
import { plural } from "@/lib/plural";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RevenueTrendCard } from "@/components/insight/revenue-trend-card";
import { BiSection, KpiTile, GaugeRing, TrendBadge } from "@/components/insight/bi";

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
    <div className="space-y-8">
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
    <div className="space-y-8">
      <BiSection icon={Receipt} title="Omzet">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiTile
            icon={Receipt}
            label="Betaald"
            value={formatEuro(s.revenuePaidCents)}
            tone="success"
            badge={<TrendBadge deltaPct={trend.deltaPct} />}
          />
          <KpiTile
            icon={CreditCard}
            label="Openstaand"
            value={formatEuro(s.revenueOpenCents)}
            sub="verstuurd, nog niet betaald"
          />
        </div>
        <RevenueTrendCard
          trend={trend}
          title="Omzet per maand"
          emptyDescription="Zodra er facturen lopen in je bemiddeling, zie je hier de omzet per maand."
        />
      </BiSection>

      <BiSection icon={Briefcase} title="Diensten">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiTile
            icon={Briefcase}
            label="Open diensten"
            value={s.openJobs}
            sub="nog in te vullen"
            href="/franchise/diensten"
            tone={s.openJobs > 0 ? "warning" : "default"}
          />
          <KpiTile
            icon={Handshake}
            label="Lopende samenwerkingen"
            value={s.activeCollaborations}
            href="/franchise/samenwerkingen"
          />
          <GaugeRing
            value={s.fillRate}
            label="Vulgraad"
            sub={`${s.filledJobs} vervuld`}
            tone={rateTone(s.fillRate)}
          />
        </div>
      </BiSection>

      <BiSection icon={Users} title="Roster">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiTile
            icon={Users}
            label="ZZP'ers"
            value={s.rosterFreelancers}
            href="/franchise/zzpers"
          />
          <KpiTile
            icon={Building2}
            label="Opdrachtgevers"
            value={s.companies}
            href="/franchise/opdrachtgevers"
          />
          <GaugeRing
            value={s.engageabilityRate}
            label="Inzetbaar"
            sub={`${s.engageableFreelancers} van ${s.rosterFreelancers}`}
            tone={rateTone(s.engageabilityRate)}
          />
        </div>
      </BiSection>

      <BiSection icon={Building2} title="Per opdrachtgever">
        {withActivity.length === 0 ? (
          <Card>
            <EmptyState
              icon={Building2}
              title="Nog geen activiteit"
              description="Zodra je diensten uitzet en facturen lopen, zie je hier de omzet en vulgraad per opdrachtgever."
            />
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {withActivity.map((r) => (
                <div key={r.companyId} className="space-y-2 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium">{r.name}</p>
                    <span className="font-mono text-sm font-medium tabular-nums">
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
                      {r.filledJobs}/{r.totalJobs} vervuld · {r.fillRate}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </BiSection>
    </div>
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
  return (
    <div className="space-y-8">
      <BiSection icon={Receipt} title="Verdiensten">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiTile
            icon={Receipt}
            label="Betaald"
            value={formatEuro(s.earnedCents)}
            tone="success"
            badge={<TrendBadge deltaPct={trend.deltaPct} />}
          />
          <KpiTile
            icon={CreditCard}
            label="Openstaand"
            value={formatEuro(s.pendingCents)}
            sub="verstuurd, nog niet betaald"
          />
          <KpiTile icon={Clock} label="Goedgekeurde uren" value={s.approvedHours} sub="totaal" />
        </div>
        <RevenueTrendCard
          trend={trend}
          title="Omzet per maand"
          emptyDescription="Zodra je facturen verstuurt, zie je hier je omzet per maand."
        />
      </BiSection>

      <BiSection icon={Briefcase} title="Werk">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiTile
            icon={Handshake}
            label="Lopende samenwerkingen"
            value={s.activeCollaborations}
            href="/samenwerkingen"
          />
          <KpiTile
            icon={Briefcase}
            label="Afgeronde samenwerkingen"
            value={s.completedCollaborations}
          />
        </div>
      </BiSection>

      <BiSection icon={Gauge} title="Leverbetrouwbaarheid">
        {quality === null || quality.tone === "INSUFFICIENT" ? (
          <Card>
            <EmptyState
              icon={Gauge}
              title="Nog geen betrouwbaarheidssignaal"
              description="Zodra je urenstaten en opleveringen zijn goedgekeurd, zie je hier hoe vaak je werk in één keer akkoord is en hoe snel het wordt goedgekeurd."
            />
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <GaugeRing
                value={quality.firstTimeRightRate}
                label="In één keer akkoord"
                sub="van je goedgekeurde prestaties"
                tone={rateTone(quality.firstTimeRightRate, 90, 70)}
              />
              <KpiTile
                icon={Clock}
                label="Gem. goedkeuringstijd"
                value={
                  quality.avgApprovalDays != null
                    ? `${quality.avgApprovalDays} ${quality.avgApprovalDays === 1 ? "dag" : "dagen"}`
                    : "—"
                }
                sub="van indienen tot akkoord"
              />
              <KpiTile
                icon={ShieldCheck}
                label="Beoordeling"
                value={DELIVERY_TONE_LABEL[quality.tone]}
                sub={`${quality.approvedPerformances} goedgekeurde prestaties`}
                tone={
                  quality.tone === "EXCELLENT"
                    ? "success"
                    : quality.tone === "DEVELOPING"
                      ? "warning"
                      : "default"
                }
              />
            </div>
            {quality.correctedPerformances > 0 && (
              <p className="text-xs text-muted-foreground">
                {quality.correctedPerformances}{" "}
                {quality.correctedPerformances === 1 ? "prestatie werd" : "prestaties werden"} na
                een correctie alsnog goedgekeurd.
              </p>
            )}
          </>
        )}
      </BiSection>

      <BiSection icon={TrendingUp} title="Activiteit">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiTile
            icon={TrendingUp}
            label="Reacties"
            value={s.applicationsTotal}
            sub={`${s.applicationsAccepted} geaccepteerd`}
            href="/reacties"
          />
          <GaugeRing
            value={s.winRate}
            label="Gewonnen"
            sub="geaccepteerd van je reacties"
            tone={rateTone(s.winRate, 50, 25)}
          />
          {s.avgMatchScore != null ? (
            <GaugeRing
              value={s.avgMatchScore}
              label="Gem. match-score"
              sub="over je reacties"
              tone="accent"
            />
          ) : (
            <KpiTile icon={Target} label="Gem. match-score" value="—" sub="over je reacties" />
          )}
        </div>
      </BiSection>

      {membership.enabled && (
        <BiSection icon={CreditCard} title="Platformabonnement">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiTile
              icon={CreditCard}
              label="Deze maand"
              value={membership.billedThisMonth ? formatEuro(membership.monthlyTotalCents) : "—"}
              sub={
                membership.billedThisMonth
                  ? "incl. btw — je had werk deze maand"
                  : "geen werk deze maand, dus geen bijdrage"
              }
              tone={membership.billedThisMonth ? "default" : "success"}
            />
            <KpiTile
              icon={Receipt}
              label="Openstaand"
              value={formatEuro(membership.openCents)}
              sub={
                membership.openMonths > 0
                  ? `${plural(membership.openMonths, "maand", "maanden")} nog te voldoen`
                  : "niets openstaand"
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Het platformabonnement is {formatEuro(membership.monthlyTotalCents)} per maand (incl.
            btw) en geldt alleen in maanden waarin je werkt.
          </p>
        </BiSection>
      )}
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
    <div className="space-y-8">
      <BiSection icon={Receipt} title="Uitgaven">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiTile
            icon={Receipt}
            label="Betaald"
            value={formatEuro(s.spentCents)}
            tone="success"
            badge={<TrendBadge deltaPct={trend.deltaPct} />}
          />
          <KpiTile
            icon={CreditCard}
            label="Openstaand"
            value={formatEuro(s.openCents)}
            sub="ontvangen, nog niet betaald"
          />
        </div>
        <RevenueTrendCard
          trend={trend}
          title="Uitgaven per maand"
          emptyDescription="Zodra je facturen ontvangt, zie je hier je uitgaven per maand."
        />
      </BiSection>

      <BiSection icon={Briefcase} title="Opdrachten">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiTile icon={Briefcase} label="Geplaatst" value={s.publishedJobs} href="/opdrachten" />
          <KpiTile
            icon={Handshake}
            label="Lopende samenwerkingen"
            value={s.activeCollaborations}
            href="/samenwerkingen"
          />
          <GaugeRing
            value={s.fillRate}
            label="Vervullingsgraad"
            sub={`${s.filledJobs} vervuld`}
            tone={rateTone(s.fillRate)}
          />
        </div>
      </BiSection>

      <BiSection icon={ShieldCheck} title="Compliance">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <GaugeRing
            value={s.complianceRate}
            label="Inzetten zonder waarschuwing"
            sub={`${s.compliantPlacements} van ${s.activeCollaborations} actief`}
            tone={
              s.complianceRate >= 100 ? "success" : s.complianceRate >= 80 ? "warning" : "danger"
            }
          />
        </div>
      </BiSection>
    </div>
  );
}
