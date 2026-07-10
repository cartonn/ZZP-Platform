import {
  rosterCapacityHeadline,
  type RosterCapacitySummary,
} from "@/lib/franchise/roster-capacity";
import { StatCard } from "@/components/ui/stat-card";

/**
 * Capaciteitsoverzicht voor de bemiddelaar boven het ZZP'er-roster. Antwoordt op "wie kan ik nu aan
 * het werk zetten?" met de vrij-inzetbare capaciteit als hoofdmaat (klikbaar → filtert het roster op
 * `?idle=1`), naast wie nu is ingezet en wie aandacht vraagt vóór plaatsing. Presentationeel — al het
 * telwerk gebeurt server-side in `summarizeRosterCapacity`.
 */
export function RosterCapacityStrip({ summary }: { summary: RosterCapacitySummary }) {
  if (summary.total === 0) return null;

  const headline = rosterCapacityHeadline(summary);

  return (
    <div className="space-y-3">
      {headline && <p className="text-sm text-muted-foreground">{headline}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Vrij inzetbaar"
          value={summary.idleReady}
          sub="beschikbaar zonder opdracht"
          tone={summary.idleReady > 0 ? "success" : "default"}
          href={summary.idleReady > 0 ? "/franchise/zzpers?idle=1" : undefined}
        />
        <StatCard label="Nu ingezet" value={summary.placed} sub="lopende opdracht" />
        <StatCard
          label="Aandacht nodig"
          value={summary.needsAttention}
          sub="vóór plaatsing"
          tone={summary.needsAttention > 0 ? "warning" : "default"}
        />
        <StatCard label="Niet beschikbaar" value={summary.unavailable} sub="bewust offline" />
      </div>
    </div>
  );
}
