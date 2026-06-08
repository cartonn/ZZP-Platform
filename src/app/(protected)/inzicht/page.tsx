import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { BarChart3, Briefcase, Receipt, ShieldCheck, TrendingUp } from "lucide-react";
import { requireActor } from "@/lib/authz";
import { type UserRole } from "@/lib/enums";
import { getFreelancerStats } from "@/lib/freelancer-stats";
import { getClientStats } from "@/lib/client-stats";
import { formatEuro } from "@/lib/invoices";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Inzicht"
        description="Je cijfers in één overzicht — verdiensten, werk en activiteit."
      />
      {role === "FREELANCER" ? (
        <FreelancerInzicht userId={actor.id} />
      ) : role === "CLIENT" ? (
        <ClientInzicht userId={actor.id} />
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

async function FreelancerInzicht({ userId }: { userId: string }) {
  const s = await getFreelancerStats(userId);
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
