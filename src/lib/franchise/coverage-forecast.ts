// Vooruitkijkende dekkingsprognose voor de franchiser — pure logica (geen I/O). Waar de huidige
// vulgraad laat zien wat er nú open staat, kijkt deze prognose vooruit: welke roosterweken dreigen
// onderbezet doordat gepubliceerde diensten met een aanstaande startdatum nog geen actieve plaatsing
// hebben. Zo kan de franchiser ingrijpen (ZZP'ers benaderen, tarief bijstellen) vóór een week stilvalt.
//
// De server levert de gepubliceerde diensten met startdatum + vulstatus; deze helper bucket ze
// deterministisch per ISO-week binnen een horizon, telt de dekking per week en signaleert de eerste
// week met een dekkingsgat. Diensten zonder startdatum kunnen niet ingeroosterd worden en vallen apart.

import { startOfIsoWeek } from "@/lib/week-overview";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

/** Standaardhorizon: vier weken vooruit dekt de gangbare zorgrooster-planning. */
export const COVERAGE_HORIZON_WEEKS = 4;

export interface CoverageDienstInput {
  jobId: string;
  /** Startdatum van de dienst, of null als (nog) niet gepland. */
  startDate: Date | null;
  /** Een dienst is "gevuld" zodra er een actieve samenwerking op loopt. */
  filled: boolean;
}

export interface CoverageWeek {
  /** Maandag 00:00:00.000 UTC van de ISO-week. */
  weekStart: Date;
  /** 0 = deze week, 1 = volgende week, … */
  weekOffset: number;
  /** Gepubliceerde diensten die deze week starten. */
  total: number;
  /** Daarvan gevuld (actieve plaatsing). */
  filled: number;
  /** Daarvan nog open — het dekkingsgat. */
  open: number;
  /** Vulgraad in procenten (afgerond), of null als er geen diensten deze week starten. */
  fillRate: number | null;
}

export interface CoverageForecast {
  /** Weken binnen de horizon met ≥ 1 startende dienst, oplopend op weekOffset. */
  weeks: CoverageWeek[];
  /** Aantal weken vooruit dat de prognose beslaat. */
  horizonWeeks: number;
  /** Totaal aantal gepubliceerde diensten dat binnen de horizon start. */
  totalWithinHorizon: number;
  /** Daarvan nog open binnen de horizon. */
  openWithinHorizon: number;
  /** Vroegste weekOffset met een open dienst, of null als alles binnen de horizon gevuld is. */
  firstGapWeekOffset: number | null;
  /** Diensten die ná de horizon starten (samenvatting, niet per week uitgesplitst). */
  laterTotal: number;
  /** Daarvan nog open. */
  laterOpen: number;
  /** Gepubliceerde open diensten zónder startdatum — kunnen niet ingeroosterd worden. */
  undatedOpen: number;
}

/**
 * Bouwt de dekkingsprognose over de komende `horizonWeeks` ISO-weken vanaf `now`. Alleen
 * gepubliceerde diensten horen in de invoer; concept/gesloten diensten tellen niet mee in de dekking
 * (de aanroeper filtert die eruit). Diensten met een startdatum vóór de huidige week zijn verleden en
 * worden genegeerd — die staan al in de huidige-vulgraad/at-risk-signalering. Muteert de invoer niet.
 */
export function buildCoverageForecast(
  diensten: readonly CoverageDienstInput[],
  now: Date = new Date(),
  horizonWeeks: number = COVERAGE_HORIZON_WEEKS,
): CoverageForecast {
  const horizon = Math.max(1, Math.floor(horizonWeeks));
  const thisWeekStart = startOfIsoWeek(now).getTime();

  // Per weekOffset binnen de horizon de tellingen verzamelen.
  const buckets = new Map<number, { total: number; filled: number; open: number }>();
  let laterTotal = 0;
  let laterOpen = 0;
  let undatedOpen = 0;

  for (const d of diensten) {
    if (d.startDate === null) {
      if (!d.filled) undatedOpen += 1;
      continue;
    }
    const offset = Math.floor((startOfIsoWeek(d.startDate).getTime() - thisWeekStart) / WEEK_MS);
    if (offset < 0) continue; // verleden start — al gedekt door de huidige-vulgraad-signalering
    if (offset >= horizon) {
      laterTotal += 1;
      if (!d.filled) laterOpen += 1;
      continue;
    }
    const bucket = buckets.get(offset) ?? { total: 0, filled: 0, open: 0 };
    bucket.total += 1;
    if (d.filled) bucket.filled += 1;
    else bucket.open += 1;
    buckets.set(offset, bucket);
  }

  const weeks: CoverageWeek[] = [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekOffset, b]) => ({
      weekStart: new Date(thisWeekStart + weekOffset * WEEK_MS),
      weekOffset,
      total: b.total,
      filled: b.filled,
      open: b.open,
      fillRate: b.total > 0 ? Math.round((b.filled / b.total) * 100) : null,
    }));

  const totalWithinHorizon = weeks.reduce((sum, w) => sum + w.total, 0);
  const openWithinHorizon = weeks.reduce((sum, w) => sum + w.open, 0);
  const firstGapWeekOffset = weeks.find((w) => w.open > 0)?.weekOffset ?? null;

  return {
    weeks,
    horizonWeeks: horizon,
    totalWithinHorizon,
    openWithinHorizon,
    firstGapWeekOffset,
    laterTotal,
    laterOpen,
    undatedOpen,
  };
}
