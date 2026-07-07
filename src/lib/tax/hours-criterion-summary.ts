// Urencriterium-kaart voor /inzicht (ZZP'er). Haalt de directe uren (goedgekeurde uren-prestaties)
// + indirecte uren van het lopende belastingjaar op — exact dezelfde aggregaten als de proactieve
// herinnering (hours-criterion-reminder-task.ts) — en laat de pure `hoursCriterion` beslissen over
// voortgang/prognose. Gepoort op IB_VOORBEREIDING, net als de nudge: de kaart verschijnt alleen voor
// wie het instrument heeft (geen kaart die op een paywall eindigt). Geen geldstroom, geen mutatie.

import { prisma } from "@/lib/db";
import { userHasEntitlement } from "@/lib/entitlement-guard";
import { hoursCriterion, type HoursCriterion } from "@/lib/tax/hours-criterion";
import { URENCRITERIUM_HOURS } from "@/lib/tax/config";

export { URENCRITERIUM_HOURS };

export interface HoursCriterionSummary extends HoursCriterion {
  year: number;
  /** true = de ZZP'er heeft dit jaar nog geen enkel uur geboekt (directe + indirecte = 0). */
  noActivity: boolean;
  /** Eén uitlegzin, afhankelijk van de stand (gehaald / op koers / achter). */
  hint: string;
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
  return `Nog ${criterion.remainingHours} uur tot de zelfstandigenaftrek. Registreer je indirecte uren (acquisitie, administratie, scholing, reistijd) om je aftrek veilig te stellen.`;
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
    hint: hoursCriterionHint(criterion),
  };
}
