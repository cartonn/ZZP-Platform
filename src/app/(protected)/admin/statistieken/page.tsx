import { type Metadata } from "next";
import { BarChart3, TrendingUp } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { getPlatformStats } from "@/lib/admin-stats";
import { getPlatformRevenueTrend } from "@/lib/revenue-trend";
import { StatsPanel } from "@/components/admin/stats-panel";
import { RevenueTrendCard } from "@/components/insight/revenue-trend-card";
import { BiSection } from "@/components/insight/bi";

export const metadata: Metadata = { title: "Platform statistieken · ZZP Platform" };

export default async function StatistiekenPage() {
  await requireRole("ADMIN");
  const [stats, throughput] = await Promise.all([getPlatformStats(), getPlatformRevenueTrend()]);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-muted-foreground" aria-hidden />
          <h1 className="text-xl font-semibold tracking-tight">Platform statistieken</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Actueel overzicht van gebruikers, samenwerkingen en administratie op het platform.
        </p>
      </header>

      <BiSection icon={TrendingUp} title="Doorzet">
        <RevenueTrendCard
          trend={throughput}
          title="Gefactureerd volume per maand"
          emptyDescription="Zodra er facturen via een samenwerking lopen, verschijnt hier het gefactureerde volume per maand."
        />
        <p className="text-xs text-muted-foreground">
          Totaal bedrag dat via het platform wordt gefactureerd (doorzet, incl. BTW) — geen
          platform-inkomsten; het platform boekt zelf niets.
        </p>
      </BiSection>

      <StatsPanel stats={stats} />
    </div>
  );
}
