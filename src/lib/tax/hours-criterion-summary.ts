// Urencriterium-kaart voor /inzicht (ZZP'er). Haalt de directe uren (goedgekeurde uren-prestaties)
// + indirecte uren van het lopende belastingjaar op — exact dezelfde aggregaten als de proactieve
// herinnering (hours-criterion-reminder-task.ts) — en laat de pure `hoursCriterion` beslissen over
// voortgang/prognose. Gepoort op IB_VOORBEREIDING, net als de nudge: de kaart verschijnt alleen voor
// wie het instrument heeft (geen kaart die op een paywall eindigt). Geen geldstroom, geen mutatie.

import { prisma } from "@/lib/db";
import { userHasEntitlement } from "@/lib/entitlement-guard";
import { hoursCriterion, type HoursCriterion } from "@/lib/tax/hours-criterion";
import { hoursCriterionCheckpoint } from "@/lib/hours-criterion-reminder";
import { URENCRITERIUM_HOURS } from "@/lib/tax/config";

export { URENCRITERIUM_HOURS };

/**
 * Haalbaarheid van het criterium op het benodigde resttempo:
 * - `gehaald` — de grens is al bereikt;
 * - `op-koers` — de lineaire prognose haalt de grens (huidig tempo volstaat);
 * - `haalbaar` — achter, maar met een rustig weektempo nog in te lopen;
 * - `ambitieus` — achter; vergt een fors weektempo;
 * - `onhaalbaar` — dit jaar realistisch niet meer te halen (geen weken meer of >40 u/week nodig).
 */
export type HoursPaceFeasibility = "gehaald" | "op-koers" | "haalbaar" | "ambitieus" | "onhaalbaar";

export interface HoursCriterionSummary extends HoursCriterion {
  year: number;
  /** true = de ZZP'er heeft dit jaar nog geen enkel uur geboekt (directe + indirecte = 0). */
  noActivity: boolean;
  /** Haalbaarheidsoordeel op basis van het benodigde resttempo. */
  feasibility: HoursPaceFeasibility;
  /** Eén uitlegzin, afhankelijk van de stand (gehaald / op koers / achter + tempo). */
  hint: string;
}

/** Bovengrenzen (uur/week) voor de haalbaarheidsclassificatie bij achterstand. */
const HOURS_PER_WEEK_COMFORTABLE = 25;
const HOURS_PER_WEEK_MAX = 40;

/**
 * Vertaalt de urencriterium-stand naar een haalbaarheidsoordeel op het benodigde weektempo.
 * Pure functie — los testbaar. Een al-gehaald criterium is `gehaald`, een prognose die de grens
 * haalt `op-koers`; anders bepaalt `hoursPerWeekNeeded` (t.o.v. de resterende weken) of het nog
 * rustig (`haalbaar`), fors (`ambitieus`) of dit jaar niet meer (`onhaalbaar`) is.
 */
export function hoursPaceFeasibility(criterion: HoursCriterion): HoursPaceFeasibility {
  if (criterion.met) return "gehaald";
  if (criterion.projectedMet) return "op-koers";
  if (criterion.weeksRemaining <= 0 || criterion.hoursPerWeekNeeded > HOURS_PER_WEEK_MAX) {
    return "onhaalbaar";
  }
  if (criterion.hoursPerWeekNeeded > HOURS_PER_WEEK_COMFORTABLE) return "ambitieus";
  return "haalbaar";
}

/**
 * Voortgangspercentage (0–100, afgerond) uit de basispunten van de urencriterium-berekening.
 * Pure functie — los testbaar. Gecapt op 100 zodra het criterium gehaald is.
 */
export function hoursProgressPercent(criterion: HoursCriterion): number {
  return Math.round(criterion.progressBps / 100);
}

/**
 * De uitlegzin bij de stand: gehaald → aftrek veiliggesteld; op koers → prognose haalt de grens;
 * anders → wat er nog resteert. Pure functie zodat de kaart en de tekst los testbaar zijn.
 */
export function hoursCriterionHint(criterion: HoursCriterion): string {
  if (criterion.met) {
    return "Je hebt de grens van 1.225 uur gehaald — de zelfstandigenaftrek is dit jaar veiliggesteld.";
  }
  if (criterion.projectedMet) {
    return `Op je huidige koers haal je de grens ruim (prognose ${criterion.projectedTotal} uur). Nog ${criterion.remainingHours} uur te gaan.`;
  }
  const pace = `≈ ${criterion.hoursPerWeekNeeded} uur/week`;
  if (hoursPaceFeasibility(criterion) === "onhaalbaar") {
    return `Nog ${criterion.remainingHours} uur tot de zelfstandigenaftrek — op de resterende weken (${pace}) is dat dit jaar realistisch niet meer te halen. Registreer je indirecte uren (acquisitie, administratie, scholing, reistijd) om zo dicht mogelijk bij de grens te komen.`;
  }
  return `Nog ${criterion.remainingHours} uur tot de zelfstandigenaftrek — houd ${pace} aan tot het eind van het jaar. Registreer ook je indirecte uren (acquisitie, administratie, scholing, reistijd) om je aftrek veilig te stellen.`;
}

/**
 * Verdient de urencriterium-stand een next-action op `/acties`? De kaart op `/inzicht` toont de stand
 * altijd (passief); een next-action mag alléén verschijnen wanneer bijsturen zin heeft en realistisch is
 * — anders is het ruis of ontmoedigend. Pure functie, deterministisch (los testbaar, `now` geïnjecteerd).
 *
 * Gates (spiegelen de proactieve herinnering `hours-criterion-reminder.ts` op één-op-één-momenten):
 *  - alleen in het seizoen H2/Q4 (`hoursCriterionCheckpoint`): jan–jun is de jaarprognose te ruisgevoelig;
 *  - er moet activiteit zijn (`!noActivity`): zonder één geboekt uur is een nudge ruis;
 *  - niet al gehaald en niet op koers (`!met && !projectedMet`): dan is er niets te doen;
 *  - nog realistisch bij te sturen (`feasibility` = `haalbaar`/`ambitieus`): een "je haalt het dit jaar
 *    niet meer"-melding (`onhaalbaar`) op /acties ontmoedigt zonder handelingsperspectief — die laten we weg.
 */
export function hoursCriterionNeedsAction(
  summary: HoursCriterionSummary,
  now: Date = new Date(),
): boolean {
  if (hoursCriterionCheckpoint(now) === null) return false;
  if (summary.noActivity) return false;
  if (summary.met || summary.projectedMet) return false;
  return summary.feasibility === "haalbaar" || summary.feasibility === "ambitieus";
}

/**
 * De urencriterium-stand voor één ZZP'er over het lopende belastingjaar, of `null` als de gebruiker
 * de IB_VOORBEREIDING-feature niet heeft (dan tonen we geen kaart). Server-side; geen mutatie.
 */
export async function getHoursCriterionSummary(
  userId: string,
  now: Date = new Date(),
): Promise<HoursCriterionSummary | null> {
  const entitled = await userHasEntitlement(userId, "IB_VOORBEREIDING");
  if (!entitled) return null;

  const year = now.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

  const [dir, ind] = await Promise.all([
    prisma.performance.aggregate({
      _sum: { hours: true },
      where: {
        status: "APPROVED",
        type: "HOURS",
        collaboration: { freelancer: { userId } },
        approvedAt: { gte: yearStart, lte: yearEnd },
      },
    }),
    prisma.indirectHoursEntry.aggregate({
      _sum: { hours: true },
      where: { userId, workedOn: { gte: yearStart, lte: yearEnd } },
    }),
  ]);

  const directHours = Math.round(dir._sum.hours ?? 0);
  const indirectHours = Math.round(ind._sum.hours ?? 0);
  const criterion = hoursCriterion({ directHours, indirectHours, now });

  return {
    ...criterion,
    year,
    noActivity: directHours + indirectHours === 0,
    feasibility: hoursPaceFeasibility(criterion),
    hint: hoursCriterionHint(criterion),
  };
}
