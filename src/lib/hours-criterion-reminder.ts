// Proactieve urencriterium-herinnering — pure planner, deterministisch.
//
// De ontzorgd-hub toont de urencriterium-stand (1.225 uur → zelfstandigenaftrek) al passief, maar een
// ZZP'er die de hub niet bezoekt merkt pas ná afloop dat hij achterliep. Deze planner selecteert
// halverwege (H2) en in het laatste kwartaal (Q4) de ZZP'ers die op hun huidige koers de grens dreigen
// te missen, zodat ze nog kunnen bijsturen (extra opdrachten aannemen of indirecte uren registreren).
// Idempotentie regelt de runner via DomainEvent dedupeKey. Geen geldstroom.
//
// Bewust géén nudge:
//   - vóór juli: te vroeg — de lineaire jaarprognose is dan te ruisgevoelig (een rustige januari laat
//     alles kansloos lijken);
//   - zonder geregistreerde uren: de ZZP'er is (nog) niet aan het werk op het platform — een nudge is ruis;
//   - wie op koers ligt (`projectedMet`) of de grens al haalde: geen actie nodig;
//   - wie er duidelijk niet naar streeft: als de prognose onder ~60% van 1.225 uur ligt is de aftrek dit
//     jaar buiten realistisch bereik en zou een "je haalt het niet"-melding alleen ontmoedigen.

import { hoursCriterion } from "@/lib/tax/hours-criterion";
import { URENCRITERIUM_HOURS } from "@/lib/tax/config";

export type HoursCriterionCheckpoint = "H2" | "Q4";

/**
 * Alleen wanneer de prognose ten minste dit deel (in basispunten van 10.000) van het criterium haalt,
 * is bijsturen realistisch en sturen we een nudge — daaronder streeft de ZZP'er dit jaar duidelijk niet
 * naar de aftrek en zou een melding louter ontmoedigen. 6000 bps = 60% van 1.225 uur (≈735 uur).
 */
export const HOURS_REMINDER_MIN_PROJECTED_BPS = 6000;

export interface HoursCriterionReminderCandidate {
  userId: string;
  /** Directe (declarabele) uren tot nu toe dit jaar, uit goedgekeurde prestaties. */
  directHours: number;
  /** Indirecte uren tot nu toe dit jaar (door de ZZP'er geregistreerd). */
  indirectHours: number;
}

export interface HoursCriterionReminderItem {
  userId: string;
  year: number;
  checkpoint: HoursCriterionCheckpoint;
  remainingHours: number;
  dedupeKey: string;
  notificationType: string;
  title: string;
  body: string;
}

export interface HoursCriterionReminderPlan {
  reminders: HoursCriterionReminderItem[];
}

/**
 * Het herinneringsmoment voor `now`, of `null` wanneer het te vroeg in het jaar is:
 * - juli–september → "H2" (halverwege: nog ruim de tijd om bij te sturen);
 * - oktober–december → "Q4" (laatste kwartaal: laatste kans);
 * - januari–juni → null (te weinig data voor een betrouwbare jaarprognose).
 * Per checkpoint stuurt de runner hooguit één herinnering per ZZP'er per jaar (dedupeKey).
 */
export function hoursCriterionCheckpoint(now: Date): HoursCriterionCheckpoint | null {
  const month = now.getUTCMonth(); // 0-indexed
  if (month >= 9) return "Q4"; // okt, nov, dec
  if (month >= 6) return "H2"; // jul, aug, sep
  return null;
}

function buildBody(checkpoint: HoursCriterionCheckpoint, remainingHours: number): string {
  const lead =
    checkpoint === "Q4"
      ? "Het jaar loopt af en je ligt op koers om de 1.225-uur grens níet te halen."
      : "Op je huidige koers haal je de 1.225-uur grens dit jaar níet.";
  return `${lead} Nog ${remainingHours} uur tot de zelfstandigenaftrek. Neem extra opdrachten aan of registreer je indirecte uren (acquisitie, administratie, scholing, reistijd) om je aftrek veilig te stellen.`;
}

export function planHoursCriterionReminders(
  candidates: readonly HoursCriterionReminderCandidate[],
  now: Date = new Date(),
): HoursCriterionReminderPlan {
  const checkpoint = hoursCriterionCheckpoint(now);
  if (!checkpoint) return { reminders: [] };

  const year = now.getUTCFullYear();
  const reminders: HoursCriterionReminderItem[] = [];

  for (const c of candidates) {
    const directHours = Math.max(0, c.directHours);
    const indirectHours = Math.max(0, c.indirectHours);
    if (directHours + indirectHours === 0) continue; // geen activiteit → geen nudge

    const h = hoursCriterion({ directHours, indirectHours, now });
    if (h.met || h.projectedMet) continue; // gehaald of op koers → geen actie

    const projectedBps = Math.round((h.projectedTotal / URENCRITERIUM_HOURS) * 10000);
    if (projectedBps < HOURS_REMINDER_MIN_PROJECTED_BPS) continue; // buiten realistisch bereik

    reminders.push({
      userId: c.userId,
      year,
      checkpoint,
      remainingHours: h.remainingHours,
      dedupeKey: `hours-criterion-reminder-${c.userId}-${year}-${checkpoint}`,
      notificationType: "HOURS_CRITERION_REMINDER",
      title: `Urencriterium ${year}: nog ${h.remainingHours} uur`,
      body: buildBody(checkpoint, h.remainingHours),
    });
  }

  return { reminders };
}
