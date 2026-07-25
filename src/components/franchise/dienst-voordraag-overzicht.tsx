import { UserCheck } from "lucide-react";
import {
  type VoordraagOverview,
  voordraagVerdict,
  voordraagContextParts,
} from "@/lib/franchise/dienst-voordraag-overzicht";
import { StatCard } from "@/components/ui/stat-card";

/**
 * Voordraag-overzicht boven de "Voordragen uit je roster"-lijst op de dienst-detailpagina. Antwoordt op
 * "kan ik deze dienst nu uit mijn roster vullen, of moet ik werven?": direct voordraagbaar als hoofdmaat,
 * naast de pooldiepte (geschikte matches) en het hele roster. Presentationeel — al het telwerk gebeurt
 * server-side in `summarizeVoordraagOverview`.
 */
export function DienstVoordraagOverzicht({ overview }: { overview: VoordraagOverview }) {
  if (overview.total === 0) return null;

  const verdict = voordraagVerdict(overview);
  const context = voordraagContextParts(overview);

  const headlineTone =
    verdict.tone === "success"
      ? "text-success"
      : verdict.tone === "warning"
        ? "text-warning"
        : "text-muted-foreground";

  return (
    <div className="space-y-3">
      <p className={`flex items-center gap-1.5 text-sm font-medium ${headlineTone}`}>
        <UserCheck className="size-4 shrink-0" aria-hidden />
        {verdict.headline}
      </p>
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Direct voordraagbaar"
          value={overview.readyToPropose}
          sub="nu, uit je roster"
          tone={overview.readyToPropose > 0 ? "success" : "default"}
        />
        <StatCard label="Geschikte matches" value={overview.strongMatches} sub="match ≥ 60%" />
        <StatCard label="In je roster" value={overview.total} sub="vakmensen" />
      </div>
      {context.length > 0 && <p className="text-xs text-muted-foreground">{context.join(" · ")}</p>}
    </div>
  );
}
