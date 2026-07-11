// Effectief/netto uurtarief per opdracht (reistijd-gecorrigeerd). Beslis-signaal voor de ZZP'er die
// een opdracht op afstand overweegt: het gepubliceerde uurtarief zegt niets over de (onbetaalde)
// woon-werk-reis die er elke werkdag omheen zit. Een goedkopere opdracht dichtbij levert netto vaak
// méér op per bestede dag dan een duurdere ver weg. Dit vertaalt de reeds-berekende reistijd naar een
// effectief uurtarief zodat de ZZP'er die afweging in één oogopslag maakt (benchmark Malt/Temper tonen
// het dagtarief zonder de reis-drag zichtbaar te maken).
//
// Puur en deterministisch — geen I/O. Server-side is de waarheid (CLAUDE.md regel 1): de client toont
// het signaal, berekent het nooit zelf. De reistijd komt uit dezelfde routing-schatting die de
// proximity-factor van de matchscore voedt; hier wordt niets extra opgehaald.

/**
 * Standaard werkdag in uren waarover de reis-drag wordt uitgesmeerd. Een langere dag verdunt de drag
 * (dezelfde reis weegt minder zwaar), een kortere versterkt hem. 8 uur is de gangbare voltijd-dag en
 * een eerlijk, neutraal anker; het effect wordt als indicatie gepresenteerd, niet als exacte waarde.
 */
export const WORK_HOURS_PER_DAY = 8;

/**
 * Onder deze enkele-reis-drempel (minuten) is de reis-drag verwaarloosbaar en zou de kaart alleen ruis
 * toevoegen — dan geven we geen signaal (`null`). Boven de drempel loont het om de afweging te tonen.
 */
export const MEANINGFUL_ONE_WAY_MINUTES = 10;

const MINUTES_PER_HOUR = 60;

export interface EffectiveRateInput {
  /** Ondergrens van de tariefband in hele euro's per uur (Job.rateMin); null = niet vermeld. */
  rateMinEuros: number | null;
  /** Bovengrens van de tariefband in hele euro's per uur (Job.rateMax); null = niet vermeld. */
  rateMaxEuros: number | null;
  /** Enkele-reis reistijd in minuten (routing-schatting); null = onbekend/op afstand. */
  oneWayTravelMinutes: number | null;
  /** Werkdag in uren waarover de reis wordt uitgesmeerd; default {@link WORK_HOURS_PER_DAY}. */
  workHoursPerDay?: number;
}

export interface EffectiveRateSummary {
  /** Het representatieve gepubliceerde uurtarief (hele euro's) dat als vertrekpunt is genomen. */
  headlineRateEuros: number;
  /** Het reistijd-gecorrigeerde effectieve uurtarief (hele euro's), afgerond. */
  effectiveHourlyEuros: number;
  /** Onbetaalde reisuren per werkdag (heen én terug), op 1 decimaal. */
  unpaidTravelHoursPerDay: number;
  /** Retour-reistijd in minuten (2× enkele reis). */
  roundTripMinutes: number;
  /** Hoeveel procent het effectieve tarief onder het gepubliceerde tarief ligt (0-100), afgerond. */
  dragPct: number;
  /** Werkdag (uren) waarmee gerekend is — voor transparante presentatie. */
  workHoursPerDay: number;
}

/**
 * Bepaalt het representatieve uurtarief uit de tariefband: het midden bij een volledige band, anders de
 * enige vermelde grens. Geeft `null` als geen van beide vermeld is (dan is er niets om te corrigeren).
 * Negatieve of niet-eindige waarden worden genegeerd (defensief tegen corrupte data).
 */
export function representativeRateEuros(
  rateMinEuros: number | null,
  rateMaxEuros: number | null,
): number | null {
  const min = isValidRate(rateMinEuros) ? rateMinEuros : null;
  const max = isValidRate(rateMaxEuros) ? rateMaxEuros : null;
  if (min != null && max != null) return Math.round((min + max) / 2);
  return min ?? max;
}

function isValidRate(value: number | null): value is number {
  return value != null && Number.isFinite(value) && value > 0;
}

/**
 * Corrigeert het gepubliceerde uurtarief voor de onbetaalde retour-reistijd per werkdag en geeft het
 * effectieve uurtarief + drag terug. Geeft `null` wanneer er geen tarief is, de reistijd onbekend is,
 * of de reis te kort is om betekenisvol te zijn (onder {@link MEANINGFUL_ONE_WAY_MINUTES}). Puur en
 * deterministisch; volledig te unit-testen zonder DB.
 */
export function summarizeEffectiveRate(input: EffectiveRateInput): EffectiveRateSummary | null {
  const headlineRateEuros = representativeRateEuros(input.rateMinEuros, input.rateMaxEuros);
  if (headlineRateEuros == null) return null;

  const oneWay = input.oneWayTravelMinutes;
  if (oneWay == null || !Number.isFinite(oneWay) || oneWay < MEANINGFUL_ONE_WAY_MINUTES)
    return null;

  const workHoursPerDay =
    input.workHoursPerDay != null &&
    Number.isFinite(input.workHoursPerDay) &&
    input.workHoursPerDay > 0
      ? input.workHoursPerDay
      : WORK_HOURS_PER_DAY;

  const roundTripMinutes = oneWay * 2;
  const roundTripHours = roundTripMinutes / MINUTES_PER_HOUR;
  const totalHours = workHoursPerDay + roundTripHours;

  const effectiveHourlyEuros = Math.round((headlineRateEuros * workHoursPerDay) / totalHours);
  const dragPct = Math.round((roundTripHours / totalHours) * 100);
  const unpaidTravelHoursPerDay = Math.round(roundTripHours * 10) / 10;

  return {
    headlineRateEuros,
    effectiveHourlyEuros,
    unpaidTravelHoursPerDay,
    roundTripMinutes,
    dragPct,
    workHoursPerDay,
  };
}
