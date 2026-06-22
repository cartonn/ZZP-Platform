// Presentatie-model voor de Vervalkalender-kaart (ExpiryOverviewCard). De rekenkern leeft in
// credential-expiry-overview.ts; dit vertaalt een ExpiryOverview naar de exacte chips, lijst en
// labels die de kaart toont. Puur en testbaar zonder render-infra (de kaart consumeert dit 1:1).

import { type ExpiryOverview } from "@/lib/credential-expiry-overview";
import { plural } from "@/lib/plural";

/** Maximaal aantal certificaten dat de kaart inline opsomt; de rest valt onder "en nog N". */
export const EXPIRY_CARD_MAX_LISTED = 5;

export type ExpiryChipTone = "danger" | "warning" | "muted";

export interface ExpiryChip {
  count: number;
  label: string;
  tone: ExpiryChipTone;
}

/**
 * Label voor de resterende dagen tot verval. Negatief = al verlopen, 0 = vandaag, anders "over N".
 */
export function expiryDaysLabel(days: number): string {
  if (days < 0) return "verlopen";
  if (days === 0) return "verloopt vandaag";
  return `over ${plural(days, "dag", "dagen")}`;
}

/**
 * Chips per venster. De vensters zijn exclusieve buckets (within60 = 31–60, within90 = 61–90),
 * dus expliciete reeksen i.p.v. een cumulatief "binnen N dagen" — dat laatste zou misleiden.
 * Lege buckets vallen weg.
 */
export function expiryChips(overview: ExpiryOverview): ExpiryChip[] {
  return [
    { count: overview.expired, label: "verlopen", tone: "danger" as const },
    { count: overview.within30, label: "binnen 30 dagen", tone: "warning" as const },
    { count: overview.within60, label: "31–60 dagen", tone: "muted" as const },
    { count: overview.within90, label: "61–90 dagen", tone: "muted" as const },
  ].filter((c) => c.count > 0);
}

/** Hoeveel certificaten ná de inline lijst nog resteren (voor de "en nog N"-regel). */
export function expiryRemaining(overview: ExpiryOverview): number {
  return Math.max(0, overview.total - Math.min(overview.items.length, EXPIRY_CARD_MAX_LISTED));
}

/** Of de kaart zichzelf verbergt (niets binnen de horizon → geen lege ruis). */
export function expiryCardHidden(overview: ExpiryOverview): boolean {
  return overview.total === 0;
}
