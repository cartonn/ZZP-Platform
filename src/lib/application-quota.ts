// Reactie-quotum van een ZZP'er — puur en deterministisch, geen I/O.
//
// Het planmaximum op reacties is een **maandquotum**, geen levenslange teller: een gratis ZZP'er
// die vijf keer heeft gereageerd moet volgende maand weer kunnen reageren. De periode volgt de
// burgerlijke kalendermaand in **Europe/Amsterdam** — dezelfde basis als de fiscale periode-helpers
// (`administration/fiscal-calendar.ts`) en de trend-modules, zodat er geen tweede tijdzone-waarheid
// ontstaat. Op een UTC-server zou een reactie van 1 januari 00:30 NL anders nog in december vallen.
//
// De DB-kolom heet historisch `Plan.maxApplications`; de betekenis is sinds deze module
// "maximum aantal reacties per kalendermaand" (`maxApplicationsPerMonth` in de code). De kolom is
// bewust NIET hernoemd: dat kost een migratie + seed-impact zonder functioneel verschil.

import {
  amsterdamCivilDayStart,
  fiscalMonthOf,
  fiscalYearOf,
} from "@/lib/administration/fiscal-calendar";
import { formatDateShortNl } from "@/lib/format-date";

/** Conventie (gedeeld met `canApply`): een negatief maximum betekent onbeperkt. */
export const UNLIMITED_APPLICATIONS = -1;

/** Het planmaximum zoals het quotum het leest. `maxApplicationsPerMonth` maakt de eenheid expliciet. */
export interface ApplicationQuotaPlan {
  /** Maximum aantal nieuwe reacties per kalendermaand; -1 = onbeperkt. */
  maxApplicationsPerMonth: number;
}

export interface ApplicationQuota {
  /** Het geldende maximum per maand; -1 = onbeperkt. */
  limit: number;
  /** Reacties die deze maand al zijn verbruikt. */
  used: number;
  /** Wat er deze maand nog over is; `null` bij een onbeperkt plan. */
  remaining: number | null;
  /** Het instant waarop de teller op nul gaat: middernacht (NL) van de volgende maand. */
  resetsAt: Date;
  /** True als er deze maand niet meer gereageerd mag worden. */
  reached: boolean;
}

/**
 * Start-instant (inclusief) van de kalendermaand waarin `now` valt, in Amsterdamse burgerlijke tijd.
 * Bedoeld als ondergrens op `createdAt` (opgeslagen als UTC-instant).
 */
export function applicationPeriodStart(now: Date): Date {
  return amsterdamCivilDayStart(fiscalYearOf(now), fiscalMonthOf(now) + 1, 1);
}

/**
 * Start-instant van de VOLGENDE kalendermaand — exclusieve bovengrens van de periode én het moment
 * waarop het quotum reset. De 1e van een maand valt nooit op een zomertijd-omschakeldag (laatste
 * zondag van maart/oktober), dus de offset-correctie in `amsterdamCivilDayStart` is hier exact.
 */
export function applicationPeriodEnd(now: Date): Date {
  const year = fiscalYearOf(now);
  const month = fiscalMonthOf(now) + 1; // 1–12
  return month === 12
    ? amsterdamCivilDayStart(year + 1, 1, 1)
    : amsterdamCivilDayStart(year, month + 1, 1);
}

/**
 * Het quotum van deze kalendermaand. `usedThisMonth` telt alleen reacties die in de lopende periode
 * zijn aangemaakt (de aanroeper begrenst de query met `applicationPeriodStart`); de teller is dus
 * geen levenslange som. Server-side waarheid (CLAUDE.md regel 1) — de UI toont dit alleen.
 */
export function applicationQuota({
  plan,
  usedThisMonth,
  now,
}: {
  plan: ApplicationQuotaPlan;
  usedThisMonth: number;
  now: Date;
}): ApplicationQuota {
  const limit = plan.maxApplicationsPerMonth;
  const used = Math.max(0, usedThisMonth);
  const resetsAt = applicationPeriodEnd(now);
  if (limit < 0)
    return { limit: UNLIMITED_APPLICATIONS, used, remaining: null, resetsAt, reached: false };
  const remaining = Math.max(0, limit - used);
  return { limit, used, remaining, resetsAt, reached: remaining === 0 };
}

/**
 * De gebruikersmelding bij een bereikt maandquotum. Eén bron van waarheid zodat de fast-fail en de
 * atomische her-telling in `applications-create.ts` niet uit elkaar lopen.
 */
export function applicationLimitMessage(limit: number, resetsAt: Date): string {
  return `Je hebt deze maand het maximum van ${limit} reacties bereikt; op ${formatDateShortNl(resetsAt)} begint een nieuwe periode.`;
}
