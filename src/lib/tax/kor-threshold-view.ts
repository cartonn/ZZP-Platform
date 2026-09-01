// Presentatie-mapper voor de KOR-omzetgrensmeter. De `korThresholdProjection` levert de rauwe
// tempo-projectie (status + resterende ruimte + kruis-maand); deze pure functie vertaalt die naar
// één beeld voor het ontzorgd-dashboard: toon-kleur, meterstand, koptekst en toelichting. Puur en
// deterministisch (geen datum/Random), zodat het geheel test- en cachebaar is. INDICATIEF
// (zie TAX_DISCLAIMER) — de KOR-administratie blijft mensenwerk.

import { formatEuro } from "@/lib/invoices";
import { type KorProjection } from "@/lib/tax/kor-projection";

export type KorThresholdTone = "neutral" | "warning" | "danger";

export interface KorThresholdView {
  /** Kleurtoon van de meter/badge. */
  tone: KorThresholdTone;
  /** Meterstand 0–100 (afgekapt op 100 zodra de grens is bereikt/gepasseerd). */
  fractionPct: number;
  /** Korte statusbadge, bv. "Ruim binnen de grens". */
  statusLabel: string;
  /** Eén-regel-koptekst. */
  headline: string;
  /** Toelichting met bedragen/maand. */
  detail: string;
  revenueCents: number;
  thresholdCents: number;
  remainingHeadroomCents: number;
}

/**
 * Bouw de weergave van de KOR-omzetgrensmeter uit de projectie. `approaching` (≥80% en nog onder de
 * grens) wordt door de overview apart bepaald en hier meegegeven zodat meter en next-actions dezelfde
 * drempel gebruiken (één bron van waarheid).
 */
export function korThresholdView(
  projection: KorProjection,
  approaching: boolean,
): KorThresholdView {
  const { revenueCents, thresholdCents, remainingHeadroomCents, usedFraction } = projection;
  const fractionPct = Math.min(100, Math.max(0, Math.round(usedFraction * 100)));
  const crossMonth = projection.projectedCrossMonthLabel;

  const base = {
    fractionPct,
    revenueCents,
    thresholdCents,
    remainingHeadroomCents,
  };

  if (projection.status === "over") {
    return {
      ...base,
      tone: "danger",
      statusLabel: "Grens gepasseerd",
      headline: "KOR-omzetgrens gepasseerd",
      detail: `Je jaaromzet is boven ${formatEuro(thresholdCents)}. Vanaf de overschrijding bereken je BTW; de KOR-vrijstelling geldt dit jaar niet meer.`,
    };
  }

  if (approaching) {
    const monthHint = crossMonth ? ` Op je tempo ga je er rond ${crossMonth} overheen.` : "";
    return {
      ...base,
      tone: "warning",
      statusLabel: "Grens in zicht",
      headline: "Je nadert de KOR-omzetgrens",
      detail: `Nog ${formatEuro(remainingHeadroomCents)} ruimte tot ${formatEuro(thresholdCents)}.${monthHint} Let op de BTW-gevolgen.`,
    };
  }

  if (projection.status === "projected_over" && crossMonth) {
    return {
      ...base,
      tone: "warning",
      statusLabel: "Tempo kruist de grens",
      headline: "Op je huidige tempo kruis je de KOR-grens",
      detail: `Nog ${formatEuro(remainingHeadroomCents)} ruimte, maar op je tempo ga je rond ${crossMonth} over ${formatEuro(thresholdCents)}. Reken vanaf dan op BTW.`,
    };
  }

  return {
    ...base,
    tone: "neutral",
    statusLabel: "Ruim binnen de grens",
    headline: "Ruim binnen de KOR-omzetgrens",
    detail: `Nog ${formatEuro(remainingHeadroomCents)} ruimte tot ${formatEuro(thresholdCents)} jaaromzet.`,
  };
}
