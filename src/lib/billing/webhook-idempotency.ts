// Pure helpers voor de idempotentie-grendel van de betaal-webhook. Los van de route-module gehouden
// (Next.js weigert niet-HTTP-exports op een route) en van Prisma-I/O, zodat ze zuiver unit-getest zijn.

import type { PaymentStatus } from "@/lib/billing/provider";

/**
 * Idempotentie-sleutel voor één verwerkt webhook-event: `<paymentRef>:<status>`.
 * De status hoort in de sleutel — één betaling doorloopt legitiem meerdere statussen
 * (open → paid), elk een eigen event dat we één keer moeten verwerken; alléén op de
 * paymentRef keyen zou het tweede (echte) event als duplicaat wegvangen. Een herspeeld
 * event mét dezelfde (paymentRef, status) is daarentegen exact wat we willen negeren.
 */
export function webhookEventKey(paymentRef: string, status: PaymentStatus): string {
  return `${paymentRef}:${status}`;
}

/**
 * Is dit een Prisma unieke-constraint-schending (P2002)? Zo ja, dan hebben we dit event al
 * verwerkt en mag de webhook het inert overslaan. We inspecteren alleen het `code`-veld zodat
 * we niet aan een specifieke Prisma-runtime-errorklasse hoeven te koppelen.
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
