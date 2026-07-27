import {
  rosterDormancyHeadline,
  type RosterDormancySummary,
} from "@/lib/franchise/roster-dormancy";
import { StatCard } from "@/components/ui/stat-card";

/**
 * Re-engagement-overzicht voor de bemiddelaar boven het ZZP'er-roster. Antwoordt op "wie van mijn
 * bench koelt af?" met het aantal stilgevallen (klikbaar → filtert het roster op `?dormant=1`) en
 * afkoelende vakmensen. Presentationeel — al het telwerk gebeurt server-side in
 * `summarizeRosterDormancy`. Rendert niets wanneer geen enkele bench-vakmens afkoelt: dan hoeft de
 * bemiddelaar niets te zien (rust boven ruis, DESIGN.md).
 */
export function RosterDormancyStrip({ summary }: { summary: RosterDormancySummary }) {
  if (summary.dormant === 0 && summary.cooling === 0) return null;

  const headline = rosterDormancyHeadline(summary);
  const dormantHref = "/franchise/zzpers?dormant=1";

  return (
    <div className="space-y-3">
      {headline && <p className="text-sm text-muted-foreground">{headline}</p>}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Stilgevallen"
          value={summary.dormant}
          sub="lang niet ingelogd — benader"
          tone={summary.dormant > 0 ? "warning" : "default"}
          href={summary.dormant > 0 ? dormantHref : undefined}
        />
        <StatCard
          label="Koelt af"
          value={summary.cooling}
          sub="houd contact"
          tone="default"
          href={summary.cooling > 0 ? dormantHref : undefined}
        />
      </div>
    </div>
  );
}
