import { type Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Users,
  Building2,
  CreditCard,
} from "lucide-react";
import { requireActor, type Actor } from "@/lib/authz";
import { type UserRole } from "@/lib/enums";
import { getFreelancerStats } from "@/lib/freelancer-stats";
import { getFreelancerMembership } from "@/lib/freelancer-membership";
import { getClientStats } from "@/lib/client-stats";
import { getTenantStats, getTenantCompanyBreakdown } from "@/lib/tenant-stats";
import { formatEuro } from "@/lib/invoices";
import { plural } from "@/lib/plural";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Inzicht · ZZP Platform" };

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <Icon className="size-4 text-muted-foreground" aria-hidden />
      <span>{title}</span>
    </div>
  );
}

export default async function InzichtPage() {
  const actor = await requireActor();
  const role = actor.role as UserRole;

  // Admins hebben hun eigen platform-brede statistieken.
  if (role === "ADMIN") redirect("/admin/statistieken");

  const description =
    role === "FRANCHISER"
      ? "De cijfers van je franchise — omzet, vulgraad, roster en samenwerkingen."
      : "Je cijfers in één overzicht — verdiensten, werk en activiteit.";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
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

async function FranchiserInzicht({ actor }: { actor: Actor }) {
  const [s, byCompany] = await Promise.all([
    getTenantStats(actor),
    getTenantCompanyBreakdown(actor),
  ]);
  if (!s) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          title="Nog geen franchise"
          description="Zodra je franchise is ingericht, verschijnen hier de cijfers van je regio."
        />
      </Card>
    );
  }
  const withActivity = byCompany.filter((r) => r.totalJobs > 0 || r.revenuePaidCents > 0);
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SectionHeader icon={Receipt} title="Omzet" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Betaald" value={formatEuro(s.revenuePaidCents)} tone="success" />
          <StatCard
            label="Openstaand"
            value={formatEuro(s.revenueOpenCents)}
            sub="verstuurd, nog niet betaald"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader icon={Briefcase} title="Diensten" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Open diensten"
            value={s.openJobs}
            sub="nog in te vullen"
            href="/franchise/diensten"
            tone={s.openJobs > 0 ? "warning" : "default"}
          />
          <StatCard label="Vervuld" value={s.filledJobs} sub={`${s.fillRate}% vulgraad`} />
          <StatCard
            label="Lopende samenwerkingen"
            value={s.activeCollaborations}
            href="/franchise/samenwerkingen"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader icon={Users} title="Roster" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="ZZP'ers" value={s.rosterFreelancers} href="/franchise/zzpers" />
          <StatCard
            label="Inzetbaar"
            value={s.engageableFreelancers}
            sub={`${s.engageabilityRate}% van je roster`}
            tone={
              s.engageabilityRate >= 80
                ? "success"
                : s.engageabilityRate >= 50
                  ? "warning"
                  : "default"
            }
          />
          <StatCard label="Opdrachtgevers" value={s.companies} href="/franchise/opdrachtgevers" />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader icon={Building2} title="Per opdrachtgever" />
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
                <div
                  key={r.companyId}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.filledJobs}/{r.totalJobs} diensten vervuld · {r.fillRate}% vulgraad
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatEuro(r.revenuePaidCents)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

async function FreelancerInzicht({ userId }: { userId: string }) {
  const [s, membership] = await Promise.all([
    getFreelancerStats(userId),
    getFreelancerMembership(userId),
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
      <section className="space-y-3">
        <SectionHeader icon={Receipt} title="Verdiensten" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Betaald" value={formatEuro(s.earnedCents)} tone="success" />
          <StatCard
            label="Openstaand"
            value={formatEuro(s.pendingCents)}
            sub="verstuurd, nog niet betaald"
          />
          <StatCard label="Goedgekeurde uren" value={s.approvedHours} sub="totaal" />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader icon={Briefcase} title="Werk" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Lopende samenwerkingen"
            value={s.activeCollaborations}
            href="/samenwerkingen"
          />
          <StatCard label="Afgeronde samenwerkingen" value={s.completedCollaborations} />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader icon={TrendingUp} title="Activiteit" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Reacties"
            value={s.applicationsTotal}
            sub={`${s.applicationsAccepted} geaccepteerd`}
            href="/reacties"
          />
          <StatCard
            label="Gewonnen"
            value={`${s.winRate}%`}
            tone={s.winRate >= 50 ? "success" : "default"}
            sub="geaccepteerd van je reacties"
          />
          <StatCard
            label="Gem. match-score"
            value={s.avgMatchScore != null ? `${s.avgMatchScore}%` : "—"}
            sub="over je reacties"
          />
        </div>
      </section>

      {membership.enabled && (
        <section className="space-y-3">
          <SectionHeader icon={CreditCard} title="Platformabonnement" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Deze maand"
              value={membership.billedThisMonth ? formatEuro(membership.monthlyTotalCents) : "—"}
              sub={
                membership.billedThisMonth
                  ? "incl. btw — je had werk deze maand"
                  : "geen werk deze maand, dus geen bijdrage"
              }
              tone={membership.billedThisMonth ? "default" : "success"}
            />
            <StatCard
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
        </section>
      )}
    </div>
  );
}

async function ClientInzicht({ userId }: { userId: string }) {
  const s = await getClientStats(userId);
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
      <section className="space-y-3">
        <SectionHeader icon={Receipt} title="Uitgaven" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Betaald" value={formatEuro(s.spentCents)} tone="success" />
          <StatCard
            label="Openstaand"
            value={formatEuro(s.openCents)}
            sub="ontvangen, nog niet betaald"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader icon={Briefcase} title="Opdrachten" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Geplaatst" value={s.publishedJobs} href="/opdrachten" />
          <StatCard label="Vervuld" value={s.filledJobs} sub={`${s.fillRate}% vervullingsgraad`} />
          <StatCard
            label="Lopende samenwerkingen"
            value={s.activeCollaborations}
            href="/samenwerkingen"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader icon={ShieldCheck} title="Compliance" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Inzetten zonder waarschuwing"
            value={`${s.complianceRate}%`}
            tone={
              s.complianceRate >= 100 ? "success" : s.complianceRate >= 80 ? "warning" : "danger"
            }
            sub={`${s.compliantPlacements} van ${s.activeCollaborations} actief`}
          />
        </div>
      </section>
    </div>
  );
}
