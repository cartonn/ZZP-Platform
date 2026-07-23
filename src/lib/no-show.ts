// No-show-regels (productbesluit eigenaar 12-6-2026, concurrentie-backlog punt 6 deel 2):
// de melder (opdrachtgever/franchiser) registreert een no-show met reden; de admin beoordeelt
// gegrond/ongegrond. Alleen ONGEGRONDE no-shows tellen mee. Bij NO_SHOW_LIMIT verschijnt een
// uitschrijf-taak in de admin-wachtrij — uitschrijving is altijd een handmatige adminbeslissing
// (User.status → SUSPENDED), nooit automatisch.

import { plural } from "@/lib/plural";

export const NO_SHOW_LIMIT = 3;

export interface NoShowStanding {
  /** Aantal ongegronde no-shows. */
  unjustified: number;
  /** Hoeveel ongegronde no-shows er nog bij kunnen vóór de grens; 0 = grens bereikt. */
  remaining: number;
  /** Grens bereikt → uitschrijf-taak voor de admin. */
  atLimit: boolean;
}

export function noShowStanding(
  unjustifiedCount: number,
  limit: number = NO_SHOW_LIMIT,
): NoShowStanding {
  const unjustified = Math.max(0, unjustifiedCount);
  return {
    unjustified,
    remaining: Math.max(0, limit - unjustified),
    atLimit: unjustified >= limit,
  };
}

/**
 * UTC-dagvenster `[gte, lt)` voor de dag waarop `occurredOn` valt. Gebruikt door de
 * same-day-dedup in `reportNoShow`: één missie kan op één dag maar één keer worden gemeld,
 * ongeacht of de melder een kale datum (`yyyy-mm-dd` → middernacht UTC) of een geknutselde
 * POST met tijdcomponent stuurt. Puur en tijdzone-deterministisch (UTC), los testbaar.
 */
export function noShowOccurredOnDayRange(occurredOn: Date): { gte: Date; lt: Date } {
  const gte = new Date(
    Date.UTC(occurredOn.getUTCFullYear(), occurredOn.getUTCMonth(), occurredOn.getUTCDate()),
  );
  const lt = new Date(gte);
  lt.setUTCDate(lt.getUTCDate() + 1);
  return { gte, lt };
}

export type NoShowNoticeTone = "warning" | "danger";

export interface NoShowNotice extends NoShowStanding {
  /** "warning" onder de grens (nog te herstellen), "danger" bij de grens (uitschrijving in beraad). */
  tone: NoShowNoticeTone;
  title: string;
  detail: string;
}

/**
 * Passief historie-signaal voor de ZZP'er: ongegronde no-shows zijn blijvende historie (het
 * oordeel is een adminbeslissing) — er is geen ZZP-actie die dit "afhandelt". Daarom hoort dit
 * NIET thuis als openstaande next-action (die zou nooit verdwijnen en botst met de belofte
 * "afgehandelde acties verdwijnen vanzelf"), maar als passieve melding op het dashboard.
 * Retourneert `null` wanneer er niets te melden is (geen ongegronde no-shows).
 */
export function noShowStandingNotice(
  unjustifiedCount: number,
  limit: number = NO_SHOW_LIMIT,
): NoShowNotice | null {
  const standing = noShowStanding(unjustifiedCount, limit);
  if (standing.unjustified <= 0) return null;
  if (standing.atLimit) {
    return {
      ...standing,
      tone: "danger",
      title: "Grens ongegronde no-shows bereikt",
      detail: "Een beheerder beoordeelt of je account wordt uitgeschreven van het platform.",
    };
  }
  return {
    ...standing,
    tone: "warning",
    title: `${plural(standing.unjustified, "ongegronde no-show", "ongegronde no-shows")} geregistreerd`,
    detail: `Nog ${plural(standing.remaining, "melding", "meldingen")} vóór uitschrijving van het platform.`,
  };
}
