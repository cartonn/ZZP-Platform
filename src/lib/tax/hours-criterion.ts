// Urencriterium-monitor (1.225 uur) — pure, deterministisch. Telt directe uren (uit de
// werkstroom) + indirecte uren (acquisitie, administratie, scholing, reistijd) en projecteert
// of het criterium dit jaar gehaald wordt. Het criterium ontsluit zelfstandigen-/startersaftrek.
// Het platform levert bewijsmateriaal; de Belastingdienst beoordeelt.

import { URENCRITERIUM_HOURS } from "@/lib/tax/config";

export interface HoursInput {
  /** Directe (declarabele) uren tot nu toe, uit goedgekeurde prestaties. */
  directHours: number;
  /** Indirecte uren tot nu toe (door de ZZP'er ingevoerd). */
  indirectHours: number;
  /** Huidige datum (voor de prognose op jaarbasis). */
  now: Date;
  /** Start van het belastingjaar; default 1 januari van now's jaar. */
  yearStart?: Date;
}

export interface HoursCriterion {
  directHours: number;
  indirectHours: number;
  totalHours: number;
  targetHours: number; //        1.225
  remainingHours: number; //     resterend tot het criterium (0 als gehaald)
  met: boolean; //               criterium al gehaald
  projectedTotal: number; //     prognose totaal eind jaar (lineair geëxtrapoleerd)
  projectedMet: boolean; //      gaat het op deze koers gehaald worden?
  progressBps: number; //        voortgang 0–10000 (gecapt op 10000)
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Aantal hele dagen tussen twee datums (minimaal 1 om deling door nul te voorkomen). */
function daysElapsed(start: Date, now: Date): number {
  return Math.max(1, Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY));
}

export function hoursCriterion(input: HoursInput): HoursCriterion {
  const directHours = Math.max(0, input.directHours);
  const indirectHours = Math.max(0, input.indirectHours);
  const totalHours = directHours + indirectHours;
  const targetHours = URENCRITERIUM_HOURS;

  const start = input.yearStart ?? new Date(Date.UTC(input.now.getUTCFullYear(), 0, 1));
  const elapsed = daysElapsed(start, input.now);
  const yearEnd = new Date(Date.UTC(input.now.getUTCFullYear(), 11, 31));
  const totalDays = Math.max(elapsed, daysElapsed(start, yearEnd));

  const projectedTotal = Math.round((totalHours / elapsed) * totalDays);
  const progressBps = Math.min(10000, Math.round((totalHours / targetHours) * 10000));

  return {
    directHours,
    indirectHours,
    totalHours,
    targetHours,
    remainingHours: Math.max(0, targetHours - totalHours),
    met: totalHours >= targetHours,
    projectedTotal,
    projectedMet: projectedTotal >= targetHours,
    progressBps,
  };
}
