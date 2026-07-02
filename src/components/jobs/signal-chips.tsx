// Gedeelde presentatie-primitieven voor de opdrachtgever-signaalblokken op de
// opdracht-detailpagina (betaalgedrag, annuleringsgedrag, reactiebereidheid) en de
// level-kaarten (jouw kans, bereik). Eén bron voor de toon→badge-vertaling voorkomt
// dat de blokken onderling driften; de domein-specifieke labels/drempels blijven
// in de blokken zelf.

import { Badge } from "@/components/ui/badge";
import { getTranslator } from "@/lib/i18n/server";

/**
 * Gemeenschappelijke toon-schaal van de gedragssignalen. Structureel gelijk aan
 * ReliabilityTone / ResponsivenessTone / PaymentTone — die blijven als domeintypes
 * bestaan en zijn hieraan toewijsbaar.
 */
export type BehaviorTone = "good" | "neutral" | "warning" | "unknown";

const TONE_VARIANT: Record<BehaviorTone, "success" | "muted" | "warning" | "default"> = {
  good: "success",
  neutral: "default",
  warning: "warning",
  unknown: "muted",
};

const TONE_LABEL: Record<BehaviorTone, string> = {
  good: "Goed",
  neutral: "Gemiddeld",
  warning: "Let op",
  unknown: "Onbekend",
};

/** Badge met de vaste toon→variant/label-taal van de gedragsblokken (servercomponent). */
export async function BehaviorToneBadge({ tone }: { tone: BehaviorTone }) {
  const { t } = await getTranslator();
  return <Badge variant={TONE_VARIANT[tone]}>{t(TONE_LABEL[tone])}</Badge>;
}

/**
 * Compacte dot+label-chip voor de level-kaarten. De aanroeper levert de dot-kleur
 * (bv. "bg-success") en het label; deze chip regelt alleen de vaste opmaak.
 */
export function LevelChip({ dotClass, label }: { dotClass: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className={`size-2 rounded-full ${dotClass}`} aria-hidden />
      {label}
    </span>
  );
}
