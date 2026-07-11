import {
  credentialComplianceHeadline,
  type CredentialComplianceSummary,
} from "@/lib/franchise/credential-compliance";
import { StatCard } from "@/components/ui/stat-card";

/**
 * Compliance-overzicht voor de bemiddelaar boven het ZZP'er-roster. Antwoordt op "houd ik mijn pool
 * compliant?" met het aantal vakmensen met een verlopen (klikbaar → filtert het roster op `?alerts=1`)
 * of aflopend certificaat als hoofdmaat, naast wie op orde is. Presentationeel — al het telwerk gebeurt
 * server-side in `summarizeCredentialCompliance`. Rendert niets wanneer geen enkel certificaat aandacht
 * vraagt: de bemiddelaar hoeft dan niets te zien (rust boven ruis, DESIGN.md).
 */
export function CredentialComplianceStrip({ summary }: { summary: CredentialComplianceSummary }) {
  if (summary.total === 0 || summary.flagged === 0) return null;

  const headline = credentialComplianceHeadline(summary);
  const alertsHref = "/franchise/zzpers?alerts=1";

  return (
    <div className="space-y-3">
      {headline && <p className="text-sm text-muted-foreground">{headline}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Verlopen"
          value={summary.expired}
          sub="vernieuw met spoed"
          tone={summary.expired > 0 ? "danger" : "default"}
          href={summary.expired > 0 ? alertsHref : undefined}
        />
        <StatCard
          label="Loopt binnenkort af"
          value={summary.expiringSoon}
          sub="plan vernieuwing"
          tone={summary.expiringSoon > 0 ? "warning" : "default"}
          href={summary.expiringSoon > 0 ? alertsHref : undefined}
        />
        <StatCard label="Op orde" value={summary.clear} sub="geen vervalsignaal" tone="success" />
      </div>
    </div>
  );
}
