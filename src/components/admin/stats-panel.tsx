import Link from "next/link";
import {
  Users,
  Handshake,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Gavel,
  PenLine,
} from "lucide-react";
import { type PlatformStats, approvalRate, sharePercent, formatStatsEuro } from "@/lib/admin-stats";
import { VERIFICATION_STALE_DAYS } from "@/lib/verification-queue";
import { CONTRACT_SIGNING_STALE_DAYS } from "@/lib/contract-signing";
import { DISPUTE_URGENCY_THRESHOLDS } from "@/lib/disputes";
import { Card, CardContent } from "@/components/ui/card";
import {
  BiSection,
  KpiTile,
  GaugeRing,
  DistributionBars,
  DonutChart,
  BiWidget,
} from "@/components/insight/bi";
import { toDonutData, COLLABORATION_SEGMENTS } from "@/lib/status-breakdown";

/**
 * Statistieken-paneel: platform-brede kerncijfers (gebruikers, samenwerkingen, prestaties,
 * facturen, certificaten, disputen) in de BI-kit — KPI-tegels, verdeelbalken en een
 * gauge-ring. Pure presentatie; de aanroeper levert de reeds berekende stats. Geen eigen
 * paginakop; de route en de hub leveren de titel.
 */
export function StatsPanel({ stats }: { stats: PlatformStats }) {
  const perfDecided = stats.performances.approved + stats.performances.rejected;
  const perfApprovalPct = approvalRate(stats.performances.approved, perfDecided);

  return (
    <div className="space-y-8">
      {/* Gebruikers */}
      <BiSection icon={Users} title="Gebruikers">
        <div className="grid gap-4 lg:grid-cols-3">
          <KpiTile icon={Users} label="Totaal" value={stats.users.total} href="/admin/gebruikers" />
          <KpiTile
            label="Geschorst"
            value={stats.users.suspended}
            tone={stats.users.suspended > 0 ? "warning" : "default"}
            sub={stats.users.suspended === 0 ? "Niemand geschorst" : "Toegang ingetrokken"}
            href="/admin/gebruikers"
          />
          <Card>
            <CardContent className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Verdeling per rol
              </p>
              <DistributionBars
                total={stats.users.total}
                items={[
                  { label: "ZZP'ers", value: stats.users.freelancers, tone: "accent" },
                  { label: "Opdrachtgevers", value: stats.users.clients, tone: "success" },
                  { label: "Bemiddelaars", value: stats.users.franchisers, tone: "warning" },
                  { label: "Beheerders", value: stats.users.admins, tone: "default" },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </BiSection>

      {/* Samenwerkingen */}
      <BiSection icon={Handshake} title="Samenwerkingen">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiTile
              icon={Handshake}
              label="Totaal"
              value={stats.collaborations.total}
              href="/admin/samenwerkingen"
            />
            <KpiTile
              label="Actief"
              value={stats.collaborations.active}
              tone={stats.collaborations.active > 0 ? "success" : "default"}
              sub={`${sharePercent(stats.collaborations.active, stats.collaborations.total)}% van totaal`}
              href="/admin/samenwerkingen"
            />
            <KpiTile
              label="Voorgesteld"
              value={stats.collaborations.proposed}
              tone={stats.collaborations.proposed > 0 ? "warning" : "default"}
              sub="wacht op acceptatie"
              href="/admin/samenwerkingen"
            />
            <KpiTile
              label="Met dispuut"
              value={stats.collaborations.disputed}
              tone={stats.collaborations.disputed > 0 ? "danger" : "default"}
              sub="cascade staat stil"
              href="/admin/disputen"
            />
          </div>
          {stats.collaborations.total > 0 ? (
            <BiWidget title="Verdeling per status">
              <DonutChart
                data={toDonutData(
                  {
                    PROPOSED: stats.collaborations.proposed,
                    ACTIVE: stats.collaborations.active,
                    COMPLETED: stats.collaborations.completed,
                    CANCELLED: stats.collaborations.cancelled,
                  },
                  COLLABORATION_SEGMENTS,
                )}
                centerLabel="totaal"
              />
            </BiWidget>
          ) : null}
        </div>
      </BiSection>

      {/* Contract-ondertekening (cascade-stap A) */}
      <BiSection icon={PenLine} title="Contract-ondertekening">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiTile
            icon={PenLine}
            label="Wacht op ondertekening"
            value={stats.contractSigning.pending}
            tone={stats.contractSigning.pending > 0 ? "warning" : "success"}
            sub={
              stats.contractSigning.pending === 0
                ? "Geen voorstellen open"
                : "Voorgesteld — nog niet getekend"
            }
            href="/admin/samenwerkingen"
          />
          <KpiTile
            label="Langst open"
            value={
              stats.contractSigning.pending === 0 ? "—" : `${stats.contractSigning.oldestDays} d`
            }
            tone={
              stats.contractSigning.oldestDays >= CONTRACT_SIGNING_STALE_DAYS
                ? "warning"
                : "default"
            }
            sub={stats.contractSigning.pending === 0 ? "Geen wachtenden" : "Oudste voorstel"}
            href="/admin/samenwerkingen"
          />
          <KpiTile
            label="Te lang open"
            value={stats.contractSigning.staleCount}
            tone={stats.contractSigning.staleCount > 0 ? "warning" : "success"}
            sub={`${CONTRACT_SIGNING_STALE_DAYS}+ dagen niet getekend`}
            href="/admin/samenwerkingen"
          />
        </div>
      </BiSection>

      {/* Prestaties */}
      <BiSection icon={ClipboardList} title="Prestaties (urenstaten & opleveringen)">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile icon={ClipboardList} label="Totaal" value={stats.performances.total} />
          <KpiTile
            label="Ter goedkeuring"
            value={stats.performances.pending}
            tone={stats.performances.pending > 0 ? "warning" : "default"}
            href="/admin/samenwerkingen"
          />
          <KpiTile
            label="Goedgekeurd"
            value={stats.performances.approved}
            tone={stats.performances.approved > 0 ? "success" : "default"}
          />
          <GaugeRing
            value={perfApprovalPct}
            label="Goedkeuringspercentage"
            sub={`${stats.performances.approved} van ${perfDecided}`}
            tone={perfDecided === 0 ? "default" : perfApprovalPct >= 80 ? "success" : "warning"}
          />
        </div>
      </BiSection>

      {/* Facturen */}
      <BiSection icon={FileText} title="Facturen">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            icon={FileText}
            label="Totaal"
            value={stats.invoices.total}
            sub={`${stats.invoices.cascadeCount} via werkproces`}
          />
          <KpiTile
            label="Wacht op verwerking"
            value={stats.invoices.pendingApproval}
            tone={stats.invoices.pendingApproval > 0 ? "warning" : "default"}
          />
          <KpiTile
            label="Verwerkt"
            value={stats.invoices.processed}
            tone={stats.invoices.processed > 0 ? "success" : "default"}
          />
          <KpiTile
            label="Totaal verwerkt"
            value={formatStatsEuro(stats.invoices.totalProcessedCents)}
            sub="excl. BTW"
          />
        </div>
      </BiSection>

      {/* Verificaties */}
      <BiSection icon={ShieldCheck} title="Certificaten">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiTile
            icon={ShieldCheck}
            label="Wachtrij verificaties"
            value={stats.verificationQueue.pending}
            tone={stats.verificationQueue.pending > 0 ? "warning" : "success"}
            sub={stats.verificationQueue.pending === 0 ? "Wachtrij leeg" : "Wacht op beoordeling"}
            href="/admin/verificaties"
          />
          <KpiTile
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
          <KpiTile
            label="Te lang in wachtrij"
            value={stats.verificationQueue.staleCount}
            tone={stats.verificationQueue.staleCount > 0 ? "warning" : "success"}
            sub={`${VERIFICATION_STALE_DAYS}+ dagen onbehandeld`}
            href="/admin/verificaties"
          />
        </div>
      </BiSection>

      {/* Disputen */}
      <BiSection icon={Gavel} title="Disputen">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiTile
            icon={Gavel}
            label="Open disputen"
            value={stats.disputes.open}
            tone={stats.disputes.open > 0 ? "danger" : "success"}
            sub={stats.disputes.open === 0 ? "Geen open disputen" : "Cascade staat stil"}
            href="/admin/disputen"
          />
          <KpiTile
            label="Langst open"
            value={stats.disputes.open === 0 ? "—" : `${stats.disputes.oldestAgeDays} d`}
            tone={
              stats.disputes.oldestAgeDays >= DISPUTE_URGENCY_THRESHOLDS.urgentDays
                ? "danger"
                : stats.disputes.oldestAgeDays >= DISPUTE_URGENCY_THRESHOLDS.raisedDays
                  ? "warning"
                  : "default"
            }
            sub={stats.disputes.open === 0 ? "Geen open disputen" : "Oudste dispuut"}
            href="/admin/disputen"
          />
          <KpiTile
            label="Urgent"
            value={stats.disputes.urgentCount}
            tone={
              stats.disputes.open === 0
                ? "default"
                : stats.disputes.urgentCount > 0
                  ? "danger"
                  : "success"
            }
            sub={`${DISPUTE_URGENCY_THRESHOLDS.urgentDays}+ dagen open`}
            href="/admin/disputen"
          />
        </div>
      </BiSection>

      {stats.disputes.open > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Er {stats.disputes.open === 1 ? "is" : "zijn"} {stats.disputes.open} open{" "}
            {stats.disputes.open === 1 ? "dispuut" : "disputen"} die bemiddeling vragen
            {stats.disputes.urgentCount > 0
              ? ` — ${stats.disputes.urgentCount} ${
                  stats.disputes.urgentCount === 1 ? "ervan is" : "ervan zijn"
                } urgent`
              : ""}
            .{" "}
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
