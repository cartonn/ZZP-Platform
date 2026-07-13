// Bindt de betaal-webhook (en toekomstige status-schrijvers) aan de expliciete overgangsmap
// (CLAUDE.md architectuurregel 3: statusovergangen via een expliciete map). Pure functie, geen I/O —
// los unit-getest — zodat de webhook-route geen niet-HTTP-symbolen hoeft te exporteren (Next.js
// weigert dat op een route-module).

import { SUBSCRIPTION_TRANSITIONS, type SubscriptionStatus } from "@/lib/enums";

/**
 * Is `to` een toegestane vervolgstatus vanaf `from` volgens `SUBSCRIPTION_TRANSITIONS`?
 * Fail-closed: een onbekende/ongeldige bronstatus levert geen enkele geldige overgang op. Zo blijft
 * elke schrijver gebonden aan één bron van waarheid; wordt de map ooit aangescherpt (bv. CANCELLED →
 * ACTIVE verwijderd zodat een herspeelde/late 'paid'-webhook een geannuleerd abonnement niet
 * stilzwijgend heractiveert), dan respecteert een pad dat deze helper gebruikt dat automatisch.
 */
export function canSubscriptionTransition(from: string, to: SubscriptionStatus): boolean {
  return (SUBSCRIPTION_TRANSITIONS[from as SubscriptionStatus] ?? []).includes(to);
}
