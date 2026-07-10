import { clientHealthHeadline, type ClientHealthSummary } from "@/lib/franchise/client-health";
import { StatCard } from "@/components/ui/stat-card";

/**
 * Relatiegezondheid-overzicht voor de bemiddelaar boven de klantenlijst. Antwoordt op "welke klant
 * verdient nu mijn aandacht?" met de stilgevallen klanten als hoofdmaat (klikbaar → filtert de lijst
 * op `?status=aandacht`), naast wie nu werk plaatst en wie recent maar rustig is. Presentationeel —
 * al het telwerk gebeurt server-side in `summarizeClientHealth`.
 */
export function ClientHealthStrip({ summary }: { summary: ClientHealthSummary }) {
  if (summary.total === 0) return null;

  const headline = clientHealthHeadline(summary);

  return (
    <div className="space-y-3">
      {headline && <p className="text-sm text-muted-foreground">{headline}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Stilgevallen"
          value={summary.attention}
          sub="benader voor vervolg"
          tone={summary.attention > 0 ? "warning" : "default"}
          href={summary.attention > 0 ? "/franchise/opdrachtgevers?status=aandacht" : undefined}
        />
        <StatCard
          label="Plaatst nu"
          value={summary.active}
          sub="open opdracht of lopende inzet"
          tone={summary.active > 0 ? "success" : "default"}
        />
        <StatCard label="Rustig" value={summary.quiet} sub="recent, nog geen plaatsing" />
      </div>
    </div>
  );
}
