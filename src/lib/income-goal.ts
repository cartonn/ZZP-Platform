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
