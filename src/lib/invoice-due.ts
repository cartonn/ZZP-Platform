// Vervaldatum-aftelling voor een (openstaande) factuur — deterministisch en uitlegbaar.
//
// Het facturen-overzicht toont per factuur een statuslabel, maar geen real-time zicht op de
// vervaldatum. Een cascade-factuur die op betaling wacht (lifecycleStatus APPROVED) heeft wél een
// `dueAt`, maar wordt pas "Te laat" zodra de payment-reminders-taak APPROVED -> OVERDUE flipt. Deze
// pure functie leidt het zicht real-time af uit `dueAt`, los van die cron-taak, zodat de partij ziet
// wat aandacht vraagt vóór de status omslaat.
//
// Server-side waarheid: alleen tonen, nooit beslissen. De daadwerkelijke statusovergang blijft de
// verantwoordelijkheid van de payment-reminders-taak (lib/payment-reminders.ts).

import { daysOverdue, daysUntil } from "@/lib/payment-reminders";

/** Vanaf hoeveel dagen vóór de vervaldag de aftelling als "vraagt aandacht" (warning) geldt. */
export const INVOICE_DUE_SOON_DAYS = 7;

export type InvoiceDueTense = "overdue" | "today" | "upcoming";

export interface InvoiceDueStatus {
  tense: InvoiceDueTense;
  /** overdue: hele dagen te laat (>= 0); upcoming: hele dagen tot de vervaldag (>= 1); today: 0. */
  days: number;
  /** Nederlandstalig label voor de chip. */
  label: string;
  /** Badge-variant: danger (te laat), warning (binnenkort/vandaag), muted (verder weg). */
  variant: "danger" | "warning" | "muted";
}

/**
 * Leidt de vervaldatum-status af voor een factuur. Geeft `null` wanneer er niets te tellen valt:
 * de factuur is niet openstaand (betaald/concept/afgekeurd), of er is geen vervaldatum gezet.
 */
export function invoiceDueStatus(
  inv: { dueAt: Date | null; outstanding: boolean },
  now: Date = new Date(),
): InvoiceDueStatus | null {
  if (!inv.outstanding || !inv.dueAt) return null;
  const due = inv.dueAt;

  if (now.getTime() > due.getTime()) {
    const days = daysOverdue(due, now); // >= 0; 0 = binnen 24u ná de vervaldag
    return {
      tense: "overdue",
      days,
      label:
        days === 0 ? "Vervaldag verstreken" : `${days} ${days === 1 ? "dag" : "dagen"} te laat`,
      variant: "danger",
    };
  }

  const days = daysUntil(due, now); // >= 0; 0 = binnen 24u vóór de vervaldag
  if (days === 0) {
    return { tense: "today", days: 0, label: "Vervalt vandaag", variant: "warning" };
  }
  return {
    tense: "upcoming",
    days,
    label: `Vervalt over ${days} ${days === 1 ? "dag" : "dagen"}`,
    variant: days <= INVOICE_DUE_SOON_DAYS ? "warning" : "muted",
  };
}
