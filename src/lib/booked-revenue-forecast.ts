// Geboekte-omzet-vooruitblik (booked-revenue runway) voor de ZZP'er. Alle bestaande prognoses zijn
// *receivables* — geld voor werk dat al geleverd is (income-forecast.ts, cashflow-forecast.ts,
// invoice-payment-forecast.ts). Deze functie kijkt de andere kant op: hoeveel inkomen zit er al
// vást in lopende (ACTIVE) samenwerkingen, en wanneer droogt dat op? Dat beantwoordt de vraag die
// een ZZP'er 's ochtends stelt — "hoe lang is m'n agenda gevuld en wat komt er binnen?" — die de
// factuurgedreven prognose niet kan beantwoorden (benchmark Malt/Temper tonen "geboekt" naast
// "gefactureerd"; wij maakten dat expliciet en server-side).
//
// Puur en deterministisch — geen I/O. Server-side is de waarheid (CLAUDE.md regel 1): de client
// toont het signaal, berekent het nooit zelf. De schatting per dag = `rate × WORK_HOURS_PER_DAY`
// (het gangbare voltijd-anker, ook door effective-rate.ts gebruikt) over de resterende geplande
// weekdagen; het is nadrukkelijk een prognose, geen factuur.

import { type Weekday } from "@/lib/enums";
import { WORK_HOURS_PER_DAY } from "@/lib/effective-rate";

const DAY_MS = 86_400_000;

/**
 * Horizon-plafond (kalenderdagen vooruit): een corrupt of extreem verre einddatum mag de iteratie
 * niet laten ontsporen. ~2 jaar is ruim voorbij elke realistische samenwerkingsduur; verder vooruit
 * is de dag-voor-dag-schatting toch betekenisloos.
 */
const MAX_HORIZON_DAYS = 730;

/** getDay() (0=zondag..6=zaterdag) → Weekday-code. */
const JS_DAY_TO_WEEKDAY: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** Standaard-werkpatroon wanneer een samenwerking geen `weekdays` heeft vastgelegd: ma–vr. */
const DEFAULT_WEEKDAYS: Weekday[] = ["MON", "TUE", "WED", "THU", "FRI"];

/** Eén lopende samenwerking, zoals de loader hem al heeft opgehaald + `weekdays` geparseerd. */
export interface BookedCollaborationInput {
  /** Uurtarief-snapshot in hele euro's (Collaboration.rate); null = geen vast tarief → geen schatting. */
  rate: number | null;
  startDate: Date | null;
  endDate: Date | null;
  /** Reeds geparseerd (parseWeekdays); lege lijst = niet vastgelegd → val terug op ma–vr. */
  weekdays: Weekday[];
  counterpartyName: string;
  jobTitle: string | null;
}

/** Eén maand-emmer op de vooruitblik-tijdlijn. */
export interface BookedRevenueMonthBucket {
  /** "YYYY-MM" (lokale kalendermaand) — stabiel sorteerbaar. */
  key: string;
  /** Nederlands label, bv. "september 2026". */
  label: string;
  cents: number;
}

export interface BookedRevenueForecast {
  /** Resterende geboekte (nog te leveren) waarde in centen — som over alle bijdragende samenwerkingen. */
  totalBookedCents: number;
  /** Maanden vooruit met geboekte waarde (oplopend); maanden zonder waarde worden weggelaten. */
  months: BookedRevenueMonthBucket[];
  /** Laatste einddatum waarop nog geboekt werk staat; null als er niets bijdraagt. */
  runwayUntil: Date | null;
  /** Kalenderdagen van vandaag tot `runwayUntil` (>= 0); null als `runwayUntil` null is. */
  runwayDays: number | null;
  /** Aantal samenwerkingen dat waarde bijdraagt (rate > 0, ≥1 geplande dag in de toekomst). */
  contributingCount: number;
  /** Lopende samenwerkingen met tarief maar zónder einddatum (doorlopend) — apart gemeld, niet geschat. */
  openEndedCount: number;
}

/** Middernacht (00:00 lokaal) van de kalenderdag waarin `d` valt. */
function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** "YYYY-MM" uit de lokale kalenderdatum. */
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
}

/**
 * Bouwt de geboekte-omzet-vooruitblik uit de lopende samenwerkingen van één ZZP'er.
 *
 * Meetellen doet een samenwerking alleen met een positief tarief. Zónder einddatum is de waarde
 * onbegrensd (doorlopend) → we schatten hem niet, maar melden hem apart (`openEndedCount`). Met een
 * einddatum in de toekomst tellen we per resterende geplande weekdag `rate × WORK_HOURS_PER_DAY`
 * (in centen) op in de maand-emmer van die dag. Het venster loopt van vandaag (of de latere
 * startdatum) t/m de einddatum, geplafonneerd op {@link MAX_HORIZON_DAYS} tegen corrupte data.
 */
export function buildBookedRevenueForecast(
  collaborations: BookedCollaborationInput[],
  now: Date,
): BookedRevenueForecast {
  const startOfToday = startOfLocalDay(now);
  const horizonEnd = new Date(startOfToday.getTime() + MAX_HORIZON_DAYS * DAY_MS);

  const monthCents = new Map<string, { label: string; cents: number }>();
  let totalBookedCents = 0;
  let contributingCount = 0;
  let openEndedCount = 0;
  let runwayUntil: Date | null = null;

  for (const collab of collaborations) {
    if (collab.rate == null || collab.rate <= 0) continue;

    if (collab.endDate == null) {
      // Doorlopend: geen begrensde waarde te schatten, maar wel relevant om te melden.
      openEndedCount += 1;
      continue;
    }

    const endDay = startOfLocalDay(collab.endDate);
    if (endDay.getTime() < startOfToday.getTime()) continue; // volledig in het verleden

    // Venster start op de latere van vandaag / de startdatum; einde op de einddatum, geplafonneerd.
    const rangeStart =
      collab.startDate != null &&
      startOfLocalDay(collab.startDate).getTime() > startOfToday.getTime()
        ? startOfLocalDay(collab.startDate)
        : startOfToday;
    const rangeEnd = endDay.getTime() > horizonEnd.getTime() ? horizonEnd : endDay;
    if (rangeStart.getTime() > rangeEnd.getTime()) continue; // start ná (geplafonneerd) einde

    const pattern = collab.weekdays.length > 0 ? collab.weekdays : DEFAULT_WEEKDAYS;
    const patternSet = new Set(pattern);
    const dayValueCents = Math.round(collab.rate * WORK_HOURS_PER_DAY * 100);

    let contributed = false;
    for (
      let cursor = new Date(rangeStart);
      cursor.getTime() <= rangeEnd.getTime();
      cursor.setDate(cursor.getDate() + 1)
    ) {
      // getDay() is altijd 0-6, dus de index is gegarandeerd binnen de vaste 7-tabel.
      if (!patternSet.has(JS_DAY_TO_WEEKDAY[cursor.getDay()]!)) continue;
      const key = monthKey(cursor);
      const bucket = monthCents.get(key) ?? { label: monthLabel(cursor), cents: 0 };
      bucket.cents += dayValueCents;
      monthCents.set(key, bucket);
      totalBookedCents += dayValueCents;
      contributed = true;
    }

    if (contributed) {
      contributingCount += 1;
      // Runway = de verste einddatum waarop nog geboekt werk staat (de échte einddatum, niet de
      // geplafonneerde horizon — de ZZP'er ziet z'n werkelijke laatste geboekte dag).
      if (runwayUntil == null || endDay.getTime() > runwayUntil.getTime()) {
        runwayUntil = endDay;
      }
    }
  }

  const months = [...monthCents.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, { label, cents }]) => ({ key, label, cents }));

  const runwayDays =
    runwayUntil == null
      ? null
      : Math.max(0, Math.round((runwayUntil.getTime() - startOfToday.getTime()) / DAY_MS));

  return { totalBookedCents, months, runwayUntil, runwayDays, contributingCount, openEndedCount };
}
