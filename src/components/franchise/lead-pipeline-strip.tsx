import { type LeadPipelineSummary } from "@/lib/lead-pipeline";
import { plural } from "@/lib/plural";
import { StatCard } from "@/components/ui/stat-card";

/**
 * Acquisitie-pijplijn-samenvatting voor de bemiddelaar boven het lead-overzicht. Antwoordt op "waar
 * staat mijn acquisitie en wat vraagt nu actie?" met signalen die de per-stadium-tabs niet geven: de
 * actieve pijplijn, het aandachtssignaal (stille + te-laat opgevolgde leads) en de conversieratio.
 * Presentationeel — al het telwerk gebeurt server-side in `summarizeLeadPipeline`.
 */
export function LeadPipelineStrip({ summary }: { summary: LeadPipelineSummary }) {
  if (summary.total === 0) return null;

  const attentionParts: string[] = [];
  if (summary.stale > 0) attentionParts.push(`${summary.stale} stil`);
  if (summary.overdueFollowUps > 0) {
    attentionParts.push(`${summary.overdueFollowUps} te laat opgevolgd`);
  }
  const attentionSub = attentionParts.length > 0 ? attentionParts.join(" · ") : "alles opgevolgd";

  const conversionSub =
    summary.conversionRate != null
      ? `${summary.conversionRate}% van beslist`
      : summary.decided > 0
        ? "nog te weinig beslist"
        : "nog niets beslist";

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="Actieve pijplijn"
        value={summary.active}
        sub={`${summary.byStatus.KOUD} koud · ${summary.byStatus.WARM} warm`}
      />
      <StatCard
        label="Aandacht nodig"
        value={summary.attention}
        sub={attentionSub}
        tone={summary.attention > 0 ? "warning" : "success"}
      />
      <StatCard
        label="Klant geworden"
        value={summary.won}
        sub={conversionSub}
        tone={summary.won > 0 ? "success" : "default"}
      />
      <StatCard
        label="Totaal in beeld"
        value={summary.total}
        sub={plural(summary.byStatus.NO_DEAL, "afgevallen", "afgevallen")}
      />
    </div>
  );
}
