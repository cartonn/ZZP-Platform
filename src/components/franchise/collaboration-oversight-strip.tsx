import {
  franchiseCollabHeadline,
  type FranchiseCollabOversight,
} from "@/lib/franchise/collaboration-oversight";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

/**
 * Vervolgsignaal-overzicht voor de bemiddelaar boven de samenwerkingenlijst. Antwoordt op "welke
 * lopende plaatsing verdient nu een vervolggesprek?" met de aflopende en verlopen ACTIVE-inzet als
 * hoofdmaat, naast het totaal actieve. Spiegelt `ClientHealthStrip`/`LeadPipelineStrip` qua opbouw;
 * presentationeel — al het telwerk gebeurt server-side in `summarizeFranchiseCollaborations`.
 */
export function CollaborationOversightStrip({ summary }: { summary: FranchiseCollabOversight }) {
  if (summary.total === 0) return null;

  const headline = franchiseCollabHeadline(summary);
  // Het voorstel-stilstaan-signaal verschijnt alleen als er iets stilstaat — een 0-tegel voor iets
  // dat doorgaans nul is voegt ruis toe (DESIGN.md: toon alleen wat telt en actie vraagt).
  const showStalled = summary.stalledProposals > 0;

  return (
    <div className="space-y-3">
      {headline && <p className="text-sm text-muted-foreground">{headline}</p>}
      <div
        className={cn("grid grid-cols-2 gap-3", showStalled ? "sm:grid-cols-4" : "sm:grid-cols-3")}
      >
        {showStalled && (
          <StatCard
            label="Voorstel stilstaand"
            value={summary.stalledProposals}
            sub="wacht op ondertekening"
            tone="warning"
          />
        )}
        <StatCard
          label="Loopt binnenkort af"
          value={summary.endingSoon}
          sub="plan een vervolg"
          tone={summary.endingSoon > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Voorbij einddatum"
          value={summary.overdue}
          sub="benader voor verlenging"
          tone={summary.overdue > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Actief"
          value={summary.active}
          sub="lopende plaatsingen"
          tone={summary.active > 0 ? "success" : "default"}
        />
      </div>
    </div>
  );
}
