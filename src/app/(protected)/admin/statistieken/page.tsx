import { type Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Handshake,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { requireRole } from "@/lib/authz";
import { getPlatformStats, approvalRate, sharePercent, formatStatsEuro } from "@/lib/admin-stats";
import { VERIFICATION_STALE_DAYS } from "@/lib/verification-queue";
import { StatCard } from "@/components/ui/stat-card";

export const metadata: Metadata = { title: "Platform statistieken · ZZP Platform" };

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

export default async function StatistiekenPage() {
  await requireRole("ADMIN");
  const stats = await getPlatformStats();

  const perfApprovalPct = approvalRate(
    stats.performances.approved,
    stats.performances.approved + stats.performances.rejected,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-muted-foreground" aria-hidden />
          <h1 className="text-xl font-semibold tracking-tight">Platform statistieken</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Actueel overzicht van gebruikers, samenwerkingen en administratie op het platform.
        </p>
      </header>

      {/* Gebruikers */}
      <section className="space-y-3">
        <SectionHeader icon={Users} title="Gebruikers" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Totaal" value={stats.users.total} href="/admin/gebruikers" />
          <StatCard
            label="ZZP'ers"
            value={stats.users.freelancers}
            sub={`${sharePercent(stats.users.freelancers, stats.users.total)}% van totaal`}
            href="/admin/gebruikers"
          />
          <StatCard
            label="Opdrachtgevers"
            value={stats.users.clients}
            sub={`${sharePercent(stats.users.clients, stats.users.total)}% van totaal`}
            href="/admin/gebruikers"
          />
          <StatCard
            label="Beheerders"
            value={stats.users.admins}
            sub={`${sharePercent(stats.users.admins, stats.users.total)}% van totaal`}
            href="/admin/gebruikers"
          />
          <StatCard
            label="Geschorst"
            value={stats.users.suspended}
            tone={stats.users.suspended > 0 ? "warning" : "default"}
            href="/admin/gebruikers"
          />
        </div>
      </section>

      {/* Samenwerkingen */}
      <section className="space-y-3">
        <SectionHeader icon={Handshake} title="Samenwerkingen" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Totaal"
            value={stats.collaborations.total}
            href="/admin/samenwerkingen"
          />
          <StatCard
            label="Actief"
            value={stats.collaborations.active}
            tone={stats.collaborations.active > 0 ? "success" : "default"}
            href="/admin/samenwerkingen"
          />
          <StatCard
            label="Voorgesteld"
            value={stats.collaborations.proposed}
            tone={stats.collaborations.proposed > 0 ? "warning" : "default"}
            href="/admin/samenwerkingen"
          />
          <StatCard
            label="Open disputen"
            value={stats.openDisputes}
            tone={stats.openDisputes > 0 ? "danger" : "default"}
            href="/admin/disputen"
          />
        </div>
      </section>

      {/* Prestaties */}
      <section className="space-y-3">
        <SectionHeader icon={ClipboardList} title="Prestaties (urenstaaten & opleveringen)" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Totaal" value={stats.performances.total} />
          <StatCard
            label="Ter goedkeuring"
            value={stats.performances.pending}
            tone={stats.performances.pending > 0 ? "warning" : "default"}
            href="/admin/samenwerkingen"
          />
          <StatCard
            label="Goedgekeurd"
            value={stats.performances.approved}
            tone={stats.performances.approved > 0 ? "success" : "default"}
          />
          <StatCard
            label="Goedkeuringspercentage"
            value={`${perfApprovalPct}%`}
            sub={`${stats.performances.approved} van ${stats.performances.approved + stats.performances.rejected}`}
          />
        </div>
      </section>

      {/* Facturen */}
      <section className="space-y-3">
        <SectionHeader icon={FileText} title="Facturen" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Totaal"
            value={stats.invoices.total}
            sub={`${stats.invoices.cascadeCount} via werkproces`}
          />
          <StatCard
            label="Wacht op verwerking"
            value={stats.invoices.pendingApproval}
            tone={stats.invoices.pendingApproval > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Verwerkt"
            value={stats.invoices.processed}
            tone={stats.invoices.processed > 0 ? "success" : "default"}
          />
          <StatCard
            label="Totaal verwerkt"
            value={formatStatsEuro(stats.invoices.totalProcessedCents)}
            sub="excl. BTW"
          />
        </div>
      </section>

      {/* Verificaties */}
      <section className="space-y-3">
        <SectionHeader icon={ShieldCheck} title="Certificaten" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Wachtrij verificaties"
            value={stats.verificationQueue.pending}
            tone={stats.verificationQueue.pending > 0 ? "warning" : "success"}
            sub={stats.verificationQueue.pending === 0 ? "Wachtrij leeg" : "Wacht op beoordeling"}
            href="/admin/verificaties"
          />
          <StatCard
            label="Langst wachtend"
            value={
              stats.verificationQueue.pending === 0
                ? "—"
                : `${stats.verificationQueue.oldestDays} d`
            }
            tone={
              stats.verificationQueue.oldestDays >= VERIFICATION_STALE_DAYS ? "warning" : "default"
            }
            sub={stats.verificationQueue.pending === 0 ? "Geen wachtenden" : "Oudste aanvraag"}
            href="/admin/verificaties"
          />
          <StatCard
            label="Te lang in wachtrij"
            value={stats.verificationQueue.staleCount}
            tone={stats.verificationQueue.staleCount > 0 ? "warning" : "success"}
            sub={`${VERIFICATION_STALE_DAYS}+ dagen onbehandeld`}
            href="/admin/verificaties"
          />
          <StatCard
            label="Open disputen"
            value={stats.openDisputes}
            tone={stats.openDisputes > 0 ? "danger" : "success"}
            sub={stats.openDisputes === 0 ? "Geen open disputen" : "Vergt bemiddeling"}
            href="/admin/disputen"
          />
        </div>
      </section>

      {stats.openDisputes > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Er {stats.openDisputes === 1 ? "is" : "zijn"} {stats.openDisputes} open{" "}
            {stats.openDisputes === 1 ? "dispuut" : "disputen"} die bemiddeling vragen.{" "}
            <Link href="/admin/disputen" className="underline underline-offset-2 hover:opacity-80">
              Bekijk disputen →
            </Link>
          </span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Statistieken worden live berekend. Ververs de pagina voor de meest actuele stand.
      </p>
    </div>
  );
}
