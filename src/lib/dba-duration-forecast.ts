// DBA-duurdrempel-vooruitblik: waarschuw *voordat* een lopende samenwerking een duurdrempel
// (verhoogd/hoog risico) passeert, zodat er tijdig een evaluatie gepland kan worden — de
// "next best action"-gedachte toegepast op schijnzelfstandigheid. Complementair aan de reactieve
// signalering in `dba-monitor.ts` (die pas vuurt zodra de drempel al gekruist is).
//
// HARD (Besluit 2): dit is signalering ter informatie, geen juridisch advies. De teksten blijven
// rustig en niet-alarmerend en dragen dezelfde disclaimer als de reactieve signalen. Pure functies,
// deterministisch en `now`-geïnjecteerd; geen I/O.

import { DBA_THRESHOLDS } from "@/lib/config";
import { type DbaThresholds } from "@/lib/platform-config";
import { monthsBetween, type DbaSignalLevel } from "@/lib/dba-monitor";

/** Standaard-venster: alleen vooruitblikken zodra de kruising binnen dit aantal dagen valt. */
export const DBA_DURATION_FORECAST_LEAD_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface DbaDurationForecast {
  /** De duurdrempel (maanden) die de samenwerking op het punt staat te passeren. */
  thresholdMonths: number;
  /** Risiconiveau dat vanaf de kruising gaat gelden (`VERHOOGD` bij de eerste, `HOOG` bij de sterke). */
  level: DbaSignalLevel;
  /** Kalenderdatum waarop `monthsBetween(start, datum)` voor het eerst `thresholdMonths` bereikt. */
  crossingDate: Date;
  /** Hele dagen vanaf `now` tot de kruising (≥ 0). */
  daysUntil: number;
  /** Rustige, niet-alarmerende melding met vooruitblik-strekking. */
  message: string;
}

/**
 * De vroegste kalenderdatum D waarop `monthsBetween(start, D) >= thresholdMonths`. Consistent met de
 * dag-correctie in `monthsBetween`: bestaat de startdag niet in de doelmaand (bv. de 31e in februari),
 * dan wordt de drempel pas op de 1e van de volgende maand bereikt.
 */
export function dbaThresholdCrossingDate(start: Date, thresholdMonths: number): Date {
  const year = start.getFullYear();
  const month = start.getMonth();
  const day = start.getDate();
  // Aantal dagen in de doelmaand (dag 0 van de maand erna = laatste dag van de doelmaand).
  const daysInTargetMonth = new Date(year, month + thresholdMonths + 1, 0).getDate();
  if (day <= daysInTargetMonth) {
    return new Date(year, month + thresholdMonths, day);
  }
  // Startdag bestaat niet in de doelmaand → drempel bereikt op de 1e van de maand daarna.
  return new Date(year, month + thresholdMonths + 1, 1);
}

/** Rustige leadtijd-omschrijving ("vandaag" / "morgen" / "over N dagen" / "over N weken"). */
export function describeDbaForecastLead(daysUntil: number): string {
  if (daysUntil <= 0) return "vandaag";
  if (daysUntil === 1) return "morgen";
  if (daysUntil < 14) return `over ${daysUntil} dagen`;
  const weeks = Math.round(daysUntil / 7);
  return `over ${weeks} ${weeks === 1 ? "week" : "weken"}`;
}

interface ThresholdStep {
  months: number;
  level: DbaSignalLevel;
}

/**
 * Bepaalt of een lopende samenwerking binnenkort een duurdrempel passeert. Kiest de *eerstvolgende*
 * nog-niet-gepasseerde drempel (verhoogd vóór hoog) en meldt 'm alleen wanneer de kruising binnen
 * `leadDays` valt. Geeft `null` als er geen startdatum is, alle drempels al gepasseerd zijn, of de
 * eerstvolgende kruising nog buiten het venster ligt.
 *
 * Werkt bewust op één `startDate`: dat is dezelfde bron als de reactieve assessment op de
 * samenwerking-detailpagina — vooruitblik en signaal blijven zo consistent op één scherm.
 */
export function forecastDbaDurationCrossing(
  startDate: Date | null,
  now: Date = new Date(),
  thresholds?: DbaThresholds,
  leadDays: number = DBA_DURATION_FORECAST_LEAD_DAYS,
): DbaDurationForecast | null {
  if (!startDate) return null;
  const t = thresholds ?? DBA_THRESHOLDS;

  // Drempels oplopend, gededupliceerd op maandwaarde (bij gelijke waarden wint het hoogste niveau).
  const byMonths = new Map<number, DbaSignalLevel>();
  const consider = (months: number, level: DbaSignalLevel) => {
    if (!Number.isFinite(months) || months <= 0) return;
    const existing = byMonths.get(months);
    if (existing === "HOOG") return; // hoog blijft hoog
    byMonths.set(months, level);
  };
  consider(t.durationSignalMonths, "VERHOOGD");
  consider(t.durationStrongSignalMonths, "HOOG");
  const steps: ThresholdStep[] = [...byMonths.entries()]
    .map(([months, level]) => ({ months, level }))
    .sort((a, b) => a.months - b.months);
  if (steps.length === 0) return null;

  const current = monthsBetween(startDate, now);
  // Eerstvolgende drempel die nog niet is gepasseerd.
  const next = steps.find((s) => current < s.months);
  if (!next) return null; // alle drempels al bereikt → reactief signaal dekt dit

  const crossingDate = dbaThresholdCrossingDate(startDate, next.months);
  const daysUntil = Math.max(0, Math.ceil((crossingDate.getTime() - now.getTime()) / MS_PER_DAY));
  if (daysUntil > leadDays) return null; // nog buiten het vooruitblik-venster

  const lead = describeDbaForecastLead(daysUntil);
  const riskPhrase =
    next.level === "HOOG"
      ? "geldt een hoog risicosignaal — overweeg nu een interne beoordeling"
      : "geldt een verhoogd risicosignaal — plan tijdig een evaluatie";
  const message =
    `Deze samenwerking bereikt ${lead} de grens van ${next.months} maanden onafgebroken inzet. ` +
    `Vanaf dan ${riskPhrase}.`;

  return { thresholdMonths: next.months, level: next.level, crossingDate, daysUntil, message };
}
