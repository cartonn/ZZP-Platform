import { type Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { requireRole } from "@/lib/authz";
import { getPlatformStats } from "@/lib/admin-stats";
import { StatsPanel } from "@/components/admin/stats-panel";

export const metadata: Metadata = { title: "Platform statistieken · ZZP Platform" };

export default async function StatistiekenPage() {
  await requireRole("ADMIN");
  const stats = await getPlatformStats();

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

      <StatsPanel stats={stats} />
    </div>
  );
}
