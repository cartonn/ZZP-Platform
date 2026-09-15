/** Shared server policy for what the subscription page may actually offer. */
export type PurchaseAvailability =
  | { kind: "free" | "demo" | "checkout" }
  | { kind: "unavailable"; reason: string };

export function subscriptionPurchaseAvailability(
  plan: { key: string; priceCents: number },
  env: { DEPLOYMENT_STAGE?: string; BILLING_PROVIDER?: string } = {
    DEPLOYMENT_STAGE: process.env.DEPLOYMENT_STAGE,
    BILLING_PROVIDER: process.env.BILLING_PROVIDER,
  },
): PurchaseAvailability {
  if (!Number.isSafeInteger(plan.priceCents) || plan.priceCents < 0) {
    return { kind: "unavailable", reason: "Dit abonnement is momenteel niet beschikbaar." };
  }
  // Demo selections must never contact a real payment provider, even if one is configured.
  if (env.DEPLOYMENT_STAGE === "demo") return { kind: "demo" };
  if (plan.key === "BUSINESS") {
    return {
      kind: "unavailable",
      reason: "Deze dienstverlening is nog niet beschikbaar. Je kunt het gratis pakket gebruiken.",
    };
  }
  if (plan.priceCents === 0) return { kind: "free" };
  if (env.BILLING_PROVIDER !== "mollie" && env.BILLING_PROVIDER !== "stripe") {
    return {
      kind: "unavailable",
      reason: "Betaalde abonnementen zijn nog niet beschikbaar. Je kunt gratis blijven gebruiken.",
    };
  }
  return { kind: "checkout" };
}
