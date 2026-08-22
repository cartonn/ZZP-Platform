// Betaal-seam: koppeling met een betaalprovider voor de abonnementen. Zelfde driver-patroon
// als de verifiers/mail: een interface + een veilige no-op default (instant activeren, voor
// dev/demo) + echte implementaties (Mollie, Stripe), pluggable via env (BILLING_PROVIDER).
// Geen geld uit het WERKproces via het platform (Besluit 1); dit is uitsluitend de abonnementsfee.

import { RecordingPaymentProvider } from "@/lib/billing/recording-payment-provider";
import { verifyStripeSignature } from "@/lib/billing/stripe-signature";
import { fetchWithTimeout, resolveHttpTimeoutMs } from "@/lib/services/fetch-timeout";

export interface CheckoutInput {
  userId: string;
  planKey: string;
  amountCents: number;
  description: string;
  /** Waar de gebruiker naartoe terugkeert na betalen. */
  returnUrl: string;
  /** Waar de provider de betaalstatus naartoe pusht. */
  webhookUrl: string;
}

export interface CheckoutResult {
  /** Redirect-URL naar de betaalpagina, of null = direct geactiveerd (mock/gratis). */
  redirectUrl: string | null;
  /** Provider-referentie (bv. Mollie payment id) voor latere statuscontrole. */
  providerRef: string | null;
}

/** Genormaliseerde uitkomst van een statuscontrole/webhook. */
export type PaymentStatus = "paid" | "open" | "failed";

/**
 * Fout uit een connectiviteitszelftest (checkConnectivity). Draagt een bewust veilig opgesteld
 * bericht — alleen provider-naam + HTTP-status/contract, nooit een sleutel/endpoint — zodat de
 * admin-zelftest het rechtstreeks mag tonen (parity met VerifierRequestError). Onbekende fouten
 * (netwerk/abort) worden door de zelftest tot hun error-NAAM teruggebracht, niet hun bericht.
 */
export class BillingConnectivityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingConnectivityError";
  }
}

export interface PaymentProvider {
  readonly name: string;
  /** Start een betaling; null redirect = direct geactiveerd (geen externe stap). */
  startCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Haalt de status van een eerder gestarte betaling op (na webhook-ping). */
  paymentStatus(providerRef: string): Promise<PaymentStatus>;
  /**
   * Haalt de provider-referentie (payment-/session-id) uit een binnengekomen webhook-request en
   * verifieert waar nodig de authenticiteit (Stripe-handtekening). `null` = negeren: geen match,
   * ongeldige handtekening of een event dat ons niet aangaat. De webhook-route haalt daarna de
   * gezaghebbende status alsnog server-side op via `paymentStatus`. Mag nooit throwen op ongeldige
   * invoer — een aanvaller mag geen 500 kunnen forceren.
   */
  resolveWebhookRef(rawBody: string, headers: Headers): Promise<string | null>;
  /**
   * Connectiviteitszelftest (admin-only, /admin/systeemstatus). Doet een **read-only**,
   * geauthenticeerde round-trip tegen de provider — bewijst bereikbaarheid + geldige sleutel
   * **zonder** een betaling/checkout aan te maken (geen geldverplaatsing). Resolvet bij succes,
   * werpt een `BillingConnectivityError` (veilig bericht) bij een HTTP-/contractfout of een andere
   * fout bij netwerkproblemen. De no-op-provider heeft niets te testen (resolvet meteen).
   */
  checkConnectivity(): Promise<void>;
}

/** Leest het Mollie-`id`-veld uit een webhook-body (x-www-form-urlencoded of JSON). */
function readMollieWebhookId(rawBody: string): string | null {
  try {
    const fromForm = new URLSearchParams(rawBody).get("id");
    if (fromForm) return fromForm;
  } catch {
    // val door naar JSON
  }
  try {
    const parsed = JSON.parse(rawBody) as { id?: unknown };
    if (typeof parsed.id === "string" && parsed.id) return parsed.id;
  } catch {
    // geen bruikbare id
  }
  return null;
}

/**
 * Default-provider: geen externe betaling. Activeert direct (redirectUrl null), zodat de demo en
 * gratis plannen werken. Een echte provider vervangt dit via getPaymentProvider().
 */
export class NoopPaymentProvider implements PaymentProvider {
  readonly name = "noop";
  async startCheckout(): Promise<CheckoutResult> {
    return { redirectUrl: null, providerRef: null };
  }
  async paymentStatus(): Promise<PaymentStatus> {
    return "paid";
  }
  async resolveWebhookRef(): Promise<string | null> {
    return null; // geen externe webhook bij de no-op provider
  }
  async checkConnectivity(): Promise<void> {
    // Geen externe provider: niets te testen. De zelftest meldt dit eerlijk als "niets getest".
  }
}

/**
 * Echte Mollie-koppeling: maakt een betaling aan (POST /v2/payments) en geeft de checkout-URL
 * terug; de webhook-route controleert later de status (GET /v2/payments/:id). Vereist MOLLIE_API_KEY.
 * Recurring/mandaten zijn een vervolgstap; dit dekt de eerste (eenmalige) abonnementsbetaling.
 */
export class MolliePaymentProvider implements PaymentProvider {
  readonly name = "mollie";
  private readonly base = "https://api.mollie.com/v2";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs: number = resolveHttpTimeoutMs(process.env.BILLING_HTTP_TIMEOUT_MS),
  ) {}

  private auth() {
    if (!this.apiKey) {
      throw new Error("Mollie is niet geconfigureerd (stel MOLLIE_API_KEY in via env).");
    }
    return { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" };
  }

  async startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const res = await fetchWithTimeout(
      `${this.base}/payments`,
      {
        method: "POST",
        headers: this.auth(),
        body: JSON.stringify({
          amount: { currency: "EUR", value: (input.amountCents / 100).toFixed(2) },
          description: input.description,
          redirectUrl: input.returnUrl,
          webhookUrl: input.webhookUrl,
          metadata: { userId: input.userId, planKey: input.planKey },
        }),
      },
      { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "Mollie" },
    );
    if (!res.ok) throw new Error(`Mollie: betaling aanmaken mislukte (status ${res.status}).`);
    const json = (await res.json()) as {
      id?: string;
      _links?: { checkout?: { href?: string } };
    };
    const redirectUrl = json._links?.checkout?.href ?? null;
    if (!json.id || !redirectUrl)
      throw new Error("Mollie: onverwacht antwoord bij aanmaken betaling.");
    return { redirectUrl, providerRef: json.id };
  }

  async paymentStatus(providerRef: string): Promise<PaymentStatus> {
    const res = await fetchWithTimeout(
      `${this.base}/payments/${encodeURIComponent(providerRef)}`,
      { headers: this.auth() },
      { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "Mollie" },
    );
    if (!res.ok) throw new Error(`Mollie: status ophalen mislukte (status ${res.status}).`);
    const json = (await res.json()) as { status?: string };
    return normalizeMollieStatus(json.status);
  }

  // Mollie ondertekent zijn webhook niet: het stuurt enkel het payment-`id` en de ontvanger haalt de
  // status gezaghebbend op bij Mollie. We lezen dus alleen het id uit de body.
  async resolveWebhookRef(rawBody: string): Promise<string | null> {
    return readMollieWebhookId(rawBody);
  }

  // Read-only connectiviteitscontrole: GET /v2/methods lijst de beschikbare betaalmethoden — een
  // idempotente call die de API-sleutel valideert zonder een betaling aan te maken. Een netwerk-/
  // abort-fout propageert onaangeraakt (de zelftest toont dan de error-naam, nooit het bericht).
  async checkConnectivity(): Promise<void> {
    const res = await fetchWithTimeout(
      `${this.base}/methods`,
      { headers: this.auth() },
      { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "Mollie" },
    );
    if (!res.ok) {
      throw new BillingConnectivityError(
        `Mollie: connectiviteitscontrole mislukte (status ${res.status}).`,
      );
    }
  }
}

/**
 * Echte Stripe-koppeling via de HTTP-API (geen SDK-dependency). Maakt een Checkout Session aan
 * (POST /v1/checkout/sessions, x-www-form-urlencoded) en geeft de hosted-checkout-URL + session-id
 * terug; de webhook verifieert de handtekening en de status wordt gezaghebbend opgehaald
 * (GET /v1/checkout/sessions/:id). Vereist STRIPE_API_KEY; de webhookverificatie STRIPE_WEBHOOK_SECRET.
 * Dekt de eerste (eenmalige) abonnementsbetaling; recurring/mandaten zijn een vervolgstap.
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";
  private readonly base = "https://api.stripe.com/v1";

  constructor(
    private readonly apiKey: string | undefined,
    private readonly webhookSecret: string | undefined,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly nowMs?: number,
    private readonly timeoutMs: number = resolveHttpTimeoutMs(process.env.BILLING_HTTP_TIMEOUT_MS),
  ) {}

  private auth() {
    if (!this.apiKey) {
      throw new Error("Stripe is niet geconfigureerd (stel STRIPE_API_KEY in via env).");
    }
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }

  async startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    // Stripe verwacht een positief geheel bedrag in centen; de webhook-URL wordt in het Stripe-
    // dashboard geconfigureerd (mensenwerk), niet per sessie meegegeven.
    const body = new URLSearchParams();
    body.set("mode", "payment");
    body.set("success_url", `${input.returnUrl}?betaling=gelukt`);
    body.set("cancel_url", `${input.returnUrl}?betaling=geannuleerd`);
    body.set("client_reference_id", input.userId);
    body.set("metadata[userId]", input.userId);
    body.set("metadata[planKey]", input.planKey);
    body.set("line_items[0][quantity]", "1");
    body.set("line_items[0][price_data][currency]", "eur");
    body.set("line_items[0][price_data][unit_amount]", String(input.amountCents));
    body.set("line_items[0][price_data][product_data][name]", input.description);

    const res = await fetchWithTimeout(
      `${this.base}/checkout/sessions`,
      {
        method: "POST",
        headers: this.auth(),
        body: body.toString(),
      },
      { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "Stripe" },
    );
    if (!res.ok) throw new Error(`Stripe: sessie aanmaken mislukte (status ${res.status}).`);
    const json = (await res.json()) as { id?: string; url?: string };
    if (!json.id || !json.url) throw new Error("Stripe: onverwacht antwoord bij aanmaken sessie.");
    return { redirectUrl: json.url, providerRef: json.id };
  }

  async paymentStatus(providerRef: string): Promise<PaymentStatus> {
    const res = await fetchWithTimeout(
      `${this.base}/checkout/sessions/${encodeURIComponent(providerRef)}`,
      { headers: this.auth() },
      { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "Stripe" },
    );
    if (!res.ok) throw new Error(`Stripe: status ophalen mislukte (status ${res.status}).`);
    const json = (await res.json()) as { status?: string; payment_status?: string };
    return normalizeStripeStatus(json.status, json.payment_status);
  }

  // Stripe ondertekent elke webhook. We verifiëren de handtekening over de exacte body en halen dan
  // het checkout-session-id uit het event. Alleen checkout.session.*-events gaan ons aan.
  async resolveWebhookRef(rawBody: string, headers: Headers): Promise<string | null> {
    if (!this.webhookSecret) return null;
    const ok = verifyStripeSignature(rawBody, headers.get("stripe-signature"), this.webhookSecret, {
      now: this.nowMs,
    });
    if (!ok) return null;
    let event: { type?: string; data?: { object?: { id?: unknown } } };
    try {
      event = JSON.parse(rawBody);
    } catch {
      return null;
    }
    if (typeof event.type !== "string" || !event.type.startsWith("checkout.session.")) return null;
    const id = event.data?.object?.id;
    return typeof id === "string" && id ? id : null;
  }

  // Read-only connectiviteitscontrole: GET /v1/balance haalt het accountsaldo op — een idempotente
  // call die de secret key valideert zonder een Checkout Session of betaling aan te maken. Een
  // netwerk-/abort-fout propageert onaangeraakt (de zelftest toont dan de error-naam).
  async checkConnectivity(): Promise<void> {
    const res = await fetchWithTimeout(
      `${this.base}/balance`,
      { headers: this.auth() },
      { fetchImpl: this.fetchImpl, timeoutMs: this.timeoutMs, label: "Stripe" },
    );
    if (!res.ok) {
      throw new BillingConnectivityError(
        `Stripe: connectiviteitscontrole mislukte (status ${res.status}).`,
      );
    }
  }
}

/** Mapt de Stripe Checkout Session-status naar onze genormaliseerde set. */
export function normalizeStripeStatus(
  status: string | undefined,
  paymentStatus: string | undefined,
): PaymentStatus {
  if (paymentStatus === "paid" || paymentStatus === "no_payment_required") return "paid";
  if (status === "expired") return "failed";
  return "open"; // status "open" / payment_status "unpaid"
}

/** Mapt Mollie-statussen naar onze genormaliseerde set. */
export function normalizeMollieStatus(status: string | undefined): PaymentStatus {
  if (status === "paid") return "paid";
  if (status === "open" || status === "pending" || status === "authorized") return "open";
  return "failed"; // canceled | expired | failed | onbekend
}

let cached: PaymentProvider | null = null;

/**
 * Actieve betaalprovider. Default = noop (instant); Mollie via BILLING_PROVIDER=mollie, Stripe via
 * BILLING_PROVIDER=stripe. Zonder de bijbehorende secrets faalt de env-validatie al bij boot.
 */
export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  switch (process.env.BILLING_PROVIDER) {
    case "mollie":
      // Wrap de échte provider in de RecordingPaymentProvider zodat elke uitgaande operatie de
      // billing-aflever-heartbeat (dead-man's-switch) voedt. De no-op-provider (default) blijft kaal:
      // die doet geen externe call en is geen productie-kanaal (parity met de lokale disk-storage).
      cached = new RecordingPaymentProvider(new MolliePaymentProvider(process.env.MOLLIE_API_KEY));
      break;
    case "stripe":
      cached = new RecordingPaymentProvider(
        new StripePaymentProvider(process.env.STRIPE_API_KEY, process.env.STRIPE_WEBHOOK_SECRET),
      );
      break;
    default:
      cached = new NoopPaymentProvider();
  }
  return cached;
}
