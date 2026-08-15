import {
  franchiseCollabHeadline,
  type FranchiseCollabOversight,
} from "@/lib/franchise/collaboration-oversight";
import { StatCard } from "@/components/ui/stat-card";

/**
 * Vervolgsignaal-overzicht voor de bemiddelaar boven de samenwerkingenlijst. Antwoordt op "welke
 * lopende plaatsing verdient nu een vervolggesprek?" met de aflopende en verlopen ACTIVE-inzet als
 * hoofdmaat, naast het totaal actieve. Spiegelt `ClientHealthStrip`/`LeadPipelineStrip` qua opbouw;
 * presentationeel — al het telwerk gebeurt server-side in `summarizeFranchiseCollaborations`.
 */
export function CollaborationOversightStrip({ summary }: { summary: FranchiseCollabOversight }) {
  if (summary.total === 0) return null;

  const headline = franchiseCollabHeadline(summary);

  return (
    <div className="space-y-3">
      {headline && <p className="text-sm text-muted-foreground">{headline}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
