// Bindt de betaal-webhook (en toekomstige status-schrijvers) aan de expliciete overgangsmap
// (CLAUDE.md architectuurregel 3: statusovergangen via een expliciete map). Pure functie, geen I/O —
// los unit-getest — zodat de webhook-route geen niet-HTTP-symbolen hoeft te exporteren (Next.js
// weigert dat op een route-module).

import { SUBSCRIPTION_TRANSITIONS, type SubscriptionStatus } from "@/lib/enums";

/**
 * Is `to` een toegestane vervolgstatus vanaf `from` volgens `SUBSCRIPTION_TRANSITIONS`?
 * Fail-closed: een onbekende/ongeldige bronstatus levert geen enkele geldige overgang op. Zo blijft
 * elke schrijver gebonden aan één bron van waarheid. CANCELLED → ACTIVE is uit de map verwijderd,
 * zodat een herspeelde/late 'paid'-webhook een geannuleerd/verlopen abonnement niet stilzwijgend
 * gratis heractiveert; de webhook respecteert dat automatisch via deze helper.
 */
export function canSubscriptionTransition(from: string, to: SubscriptionStatus): boolean {
  return (SUBSCRIPTION_TRANSITIONS[from as SubscriptionStatus] ?? []).includes(to);
}
