/**
 * Maanddoel (maandelijks inkomensdoel) voor de ZZP'er — pure domeinlogica.
 *
 * Geen I/O, geen imports uit prisma/next. Alle bedragen in centen (integers),
 * zodat afronding deterministisch blijft. De server bepaalt de status; de UI toont
 * alleen wat hier wordt uitgerekend.
 */

/** Maximaal maanddoel: onder het int4-plafond en ruim boven elk realistisch ZZP-maandinkomen. */
export const MONTHLY_INCOME_GOAL_MAX_EUROS = 999_999;
export const MONTHLY_INCOME_GOAL_MAX_CENTS = MONTHLY_INCOME_GOAL_MAX_EUROS * 100;

export type IncomeGoalStatus = "none" | "achieved" | "on_track" | "behind";

export interface IncomeGoalInput {
  /** Ingesteld maanddoel in centen, of null als er geen doel is. */
  goalCents: number | null;
  /** Deze maand al gefactureerd (omzet, non-DRAFT facturen) in centen. */
  realizedCents: number;
  /** Nog te versturen concepten (DRAFT-facturen) in centen — verwacht bovenop gerealiseerd. */
  expectedCents: number;
}

export interface IncomeGoalSummary {
  goalCents: number | null;
  realizedCents: number;
  expectedCents: number;
  /** realized + expected. */
  projectedCents: number;
  /** Nog te gaan tot het doel op basis van het gerealiseerde: max(0, goal - realized). */
  remainingCents: number;
  /** Voortgang gerealiseerd t.o.v. doel, afgerond en geklemd op 0..100; null zonder doel. */
  realizedPct: number | null;
  /** Voortgang geprojecteerd (realized+expected) t.o.v. doel, geklemd 0..100; null zonder doel. */
  projectedPct: number | null;
  status: IncomeGoalStatus;
}

/** Maak een bedrag in centen schoon: niet-eindig of negatief → 0, anders naar hele centen. */
function sanitizeCents(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

/**
 * Klem een waarde binnen [min, max].
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Reken een maanddoel om naar een voortgangsoverzicht.
 *
 * Zonder geldig (positief, eindig) doel is de status "none" en zijn de percentages null.
 */
export function summarizeIncomeGoal(input: IncomeGoalInput): IncomeGoalSummary {
  const realizedCents = sanitizeCents(input.realizedCents);
  const expectedCents = sanitizeCents(input.expectedCents);
  const projectedCents = realizedCents + expectedCents;

  const hasGoal =
    input.goalCents !== null && Number.isFinite(input.goalCents) && (input.goalCents as number) > 0;

  if (!hasGoal) {
    return {
      goalCents: null,
      realizedCents,
      expectedCents,
      projectedCents,
      remainingCents: 0,
      realizedPct: null,
      projectedPct: null,
      status: "none",
    };
  }

  const goalCents = Math.floor(input.goalCents as number);
  const remainingCents = Math.max(0, goalCents - realizedCents);
  const realizedPct = clamp(Math.round((realizedCents / goalCents) * 100), 0, 100);
  const projectedPct = clamp(Math.round((projectedCents / goalCents) * 100), 0, 100);

  let status: IncomeGoalStatus;
  if (realizedCents >= goalCents) {
    status = "achieved";
  } else if (projectedCents >= goalCents) {
    status = "on_track";
  } else {
    status = "behind";
  }

  return {
    goalCents,
    realizedCents,
    expectedCents,
    projectedCents,
    remainingCents,
    realizedPct,
    projectedPct,
    status,
  };
}

/** Toon-signaal voor de glance-chip; komt overeen met de dashboard-`ActionTone`. */
export type IncomeGoalGlanceTone = "success" | "warning" | "primary";

export interface IncomeGoalGlance {
  /** Compacte chip rechtsboven de KPI, bv. "72% doel". */
  delta: string;
  /** Contextregel onder de KPI, bv. "Nog € 840,00 tot je maanddoel". */
  hint: string;
  tone: IncomeGoalGlanceTone;
}

/**
 * Compacte doel-glance voor onder/naast de "Deze maand gefactureerd"-KPI op het dashboard.
 *
 * Geeft `null` zonder ingesteld doel (status "none") — dan houdt de KPI zijn normale
 * maand-op-maand-signaal. `formatEuro` wordt geïnjecteerd zodat deze module puur en
 * import-vrij blijft; het percentage komt uit `realizedPct` (server-berekend, geklemd 0..100).
 */
export function incomeGoalGlance(
  summary: IncomeGoalSummary,
  formatEuro: (cents: number) => string,
): IncomeGoalGlance | null {
  if (summary.status === "none" || summary.realizedPct === null || summary.goalCents === null) {
    return null;
  }
  const delta = `${summary.realizedPct}% doel`;
  switch (summary.status) {
    case "achieved":
      return {
        delta,
        hint: `Maanddoel van ${formatEuro(summary.goalCents)} gehaald`,
        tone: "success",
      };
    case "on_track":
      return {
        delta,
        hint: "Met je openstaande concepten haal je je doel",
        tone: "success",
      };
    case "behind":
    default:
      return {
        delta,
        hint: `Nog ${formatEuro(summary.remainingCents)} tot je maanddoel`,
        tone: "warning",
      };
  }
}

/**
 * Kalender-tempo van het maanddoel: weegt de dag-van-de-maand mee zodat een geruststellend
 * "op koers" niet louter uit `realized + concepten ≥ doel` volgt. Vergelijkt het gerealiseerde
 * met wat een gelijkmatig tempo op deze dag opgeleverd zou hebben.
 */
export type IncomeGoalPaceState = "ahead" | "on_track" | "behind";

export interface IncomeGoalPace {
  /** Dag van de maand (1..31, UTC). */
  dayOfMonth: number;
  /** Aantal dagen in deze maand (28..31). */
  daysInMonth: number;
  /** Resterende dagen ná vandaag (0 op de laatste dag). */
  daysRemaining: number;
  /** Bedrag dat een gelijkmatig tempo op deze dag opgeleverd zou hebben (centen). */
  expectedByNowCents: number;
  /** realized − expectedByNow: positief = voor op schema, negatief = achter. */
  deltaCents: number;
  /** Nog te gaan tot het doel op basis van het gerealiseerde (centen). */
  remainingToGoalCents: number;
  /** Benodigd tempo voor de rest van de maand om het doel te halen (centen/week). */
  neededPerWeekCents: number;
  state: IncomeGoalPaceState;
  tone: IncomeGoalGlanceTone;
}

/** Tolerantieband rond het gelijkmatige tempo (10%) voordat "voor"/"achter" oordeelt. */
const PACE_TOLERANCE_BPS = 1000;

/**
 * Bereken het kalender-tempo voor een maanddoel. Geeft `null` wanneer er geen doel is (`none`)
 * of het doel al gehaald is (`achieved`) — dan zegt de statusregel al genoeg en is een tempo-
 * oordeel ruis. `now` wordt geïnjecteerd (deterministisch, los testbaar); alle datumrekenkunde
 * in UTC, consistent met de rest van de codebase.
 */
export function incomeGoalPace(
  summary: IncomeGoalSummary,
  now: Date = new Date(),
): IncomeGoalPace | null {
  if (summary.status === "none" || summary.status === "achieved" || summary.goalCents === null) {
    return null;
  }

  const goalCents = summary.goalCents;
  const realizedCents = summary.realizedCents;
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const dayOfMonth = now.getUTCDate();
  // Dag 0 van de vólgende maand = laatste dag van deze maand.
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);

  // Gelijkmatig tempo: het deel van het doel dat na `dayOfMonth` dagen geboekt zou moeten zijn.
  const elapsedFraction = clamp(dayOfMonth / daysInMonth, 0, 1);
  const expectedByNowCents = Math.round(goalCents * elapsedFraction);
  const deltaCents = realizedCents - expectedByNowCents;
  const remainingToGoalCents = Math.max(0, goalCents - realizedCents);

  // Weken tot het maandeinde (minstens één dag), zodat het benodigde weektempo eindig blijft.
  const weeksRemaining = Math.max(daysRemaining, 1) / 7;
  const neededPerWeekCents = Math.round(remainingToGoalCents / weeksRemaining);

  const band = Math.round((expectedByNowCents * PACE_TOLERANCE_BPS) / 10000);
  let state: IncomeGoalPaceState;
  if (deltaCents > band) {
    state = "ahead";
  } else if (deltaCents < -band) {
    state = "behind";
  } else {
    state = "on_track";
  }

  const tone: IncomeGoalGlanceTone =
    state === "ahead" ? "success" : state === "behind" ? "warning" : "primary";

  return {
    dayOfMonth,
    daysInMonth,
    daysRemaining,
    expectedByNowCents,
    deltaCents,
    remainingToGoalCents,
    neededPerWeekCents,
    state,
    tone,
  };
}

/**
 * Uitlegzin voor het kalender-tempo. `formatEuro` wordt geïnjecteerd zodat de module puur en
 * import-vrij blijft (spiegelt `incomeGoalGlance`).
 */
export function incomeGoalPaceHint(
  pace: IncomeGoalPace,
  formatEuro: (cents: number) => string,
): string {
  const day = `dag ${pace.dayOfMonth}/${pace.daysInMonth}`;
  switch (pace.state) {
    case "ahead":
      return `Je loopt voor op schema — na ${day} zou een gelijkmatig tempo ${formatEuro(pace.expectedByNowCents)} zijn.`;
    case "on_track":
      return `Op koers voor de tijd van de maand — na ${day} lig je rond het gelijkmatige tempo (${formatEuro(pace.expectedByNowCents)}).`;
    case "behind":
    default: {
      const achterstand = formatEuro(Math.abs(pace.deltaCents));
      if (pace.daysRemaining === 0) {
        return `De maand is bijna om en je zit ${achterstand} onder het gelijkmatige tempo.`;
      }
      const dagen = pace.daysRemaining === 1 ? "dag" : "dagen";
      return `Je loopt ${achterstand} achter op het gelijkmatige tempo — houd ≈ ${formatEuro(pace.neededPerWeekCents)}/week aan in de resterende ${pace.daysRemaining} ${dagen} om je doel te halen.`;
    }
  }
}

/** Korte NL koptekst per status voor de kaart. */
export function incomeGoalHeadline(summary: IncomeGoalSummary): string {
  switch (summary.status) {
    case "achieved":
      return "Maanddoel gehaald.";
    case "on_track":
      return "Op koers — met je openstaande concepten haal je je doel.";
    case "behind":
      return "Nog niet op koers voor je maanddoel.";
    case "none":
    default:
      return "Stel een maanddoel in om je voortgang te volgen.";
  }
}
