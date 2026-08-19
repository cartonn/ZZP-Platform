// Betaal-webhook: de provider (Mollie/Stripe) pingt dit endpoint zodra de betaalstatus wijzigt.
// De actieve provider haalt de referentie uit de request (en verifieert bij Stripe de handtekening);
// we halen daarna de status gezaghebbend op en activeren het PENDING-abonnement bij 'paid' (of zetten
// het op PAST_DUE bij 'failed'). Geen geheimen in de respons; altijd 200 zodat de provider niet blijft
// herproberen op een verwerkte/onbekende ping. Elke activatie wordt geaudit.

import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/billing/provider";
import { billingWebhookRateLimiter } from "@/lib/rate-limit";
import { clientIpFromRequest } from "@/lib/client-ip";
import { applyResolvedPaymentStatus } from "@/lib/billing/apply-payment-status";

export const dynamic = "force-dynamic";

// Body-limiet: een Stripe/Mollie-webhook-payload is klein (ruim onder 64 KB). Het endpoint is
// publiek en ongeauthenticeerd; zonder byte-grens kan een aanvaller — binnen de per-IP
// count-rate-limit — alsnog arbitrair grote bodies sturen die eerst volledig in het geheugen
// worden gebufferd (Stripe-handtekeningverificatie vereist de exacte rauwe body) vóór er iets
// wordt afgewezen. Cap parity met /api/csp-report + /api/client-error (OWASP A05, CWE-400 DoS).
const MAX_BODY_BYTES = 64 * 1024;

export async function POST(request: Request): Promise<Response> {
  // Rate-limit vóór álle werk (body-read, provider-call, DB-lookup): een ongeauthenticeerde flood
  // mag geen uitgaande provider-calls of DB-I/O veroorzaken. Bij overschrijding bewust 200 (geen
  // 429): 429 zou de provider tot een retry-storm aanzetten en throttle-info lekken. De drempel
  // ligt ruim boven een legitieme provider-burst, dus een echte webhook wordt hierdoor niet gemist.
  const rl = await billingWebhookRateLimiter.check(clientIpFromRequest(request));
  if (!rl.allowed) return new Response("ok", { status: 200 });

  // Byte-grens vóór het bufferen van de body. De Content-Length-header (indien aanwezig) laat een
  // overmaatse body afwijzen zónder hem in te lezen; de lengtecheck na het lezen vangt een
  // ontbrekende/onjuiste header af. Bewust 200 (geen 413), consistent met de rest van deze route.
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return new Response("ok", { status: 200 });
  }

  const provider = getPaymentProvider();

  // De rauwe body één keer lezen (Stripe-handtekeningverificatie vereist de exacte, ongeparste body).
  let paymentId: string | null;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return new Response("ok", { status: 200 });
    paymentId = await provider.resolveWebhookRef(raw, request.headers);
  } catch {
    return new Response("ok", { status: 200 }); // niets te doen / ongeldige of niet-geverifieerde ping
  }
  if (!paymentId) return new Response("ok", { status: 200 });

  const sub = await prisma.subscription.findFirst({ where: { providerRef: paymentId } });
  if (!sub) return new Response("ok", { status: 200 });

  let status: "paid" | "open" | "failed";
  try {
    status = await provider.paymentStatus(paymentId);
  } catch {
    return new Response("ok", { status: 200 }); // provider tijdelijk onbereikbaar; geen retry-storm
  }

  // Idempotente statustoepassing via de gedeelde apply-helper (zelfde bron van waarheid als de
  // reconcile-cron). Elk (provider, paymentRef, status)-event wordt exact één keer verwerkt via de
  // ledger-grendel; een herspeeld/dubbel afgeleverd event → inert `duplicate` (geen dubbele mutatie).
  // Provider-agnostisch (Mollie ondertekent niet; de status is hierboven gezaghebbend opgehaald).
  // De apply-helper vangt de idempotentie-schending (P2002) zelf af (→ inert). Een echte (transiënte)
  // DB-fout propageert bewust: de transactie rolde terug (geen ledger-rij), de provider mag het event
  // opnieuw aanbieden en verwerkt het dan alsnog schoon. Consistent met het oude gedrag van deze route.
  await applyResolvedPaymentStatus({
    sub,
    providerName: provider.name,
    paymentId,
    status,
  });

  return new Response("ok", { status: 200 });
}
