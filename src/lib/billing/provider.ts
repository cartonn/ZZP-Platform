// Betaal-seam: koppeling met een betaalprovider voor de abonnementen. Zelfde driver-patroon
// als de verifiers/mail: een interface + een veilige no-op default (instant activeren, voor
// dev/demo) + een echte Mollie-implementatie, pluggable via env (BILLING_PROVIDER=mollie).
// Geen geld uit het WERKproces via het platform (Besluit 1); dit is uitsluitend de abonnementsfee.

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

export interface PaymentProvider {
  readonly name: string;
  /** Start een betaling; null redirect = direct geactiveerd (geen externe stap). */
  startCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Haalt de status van een eerder gestarte betaling op (na webhook-ping). */
  paymentStatus(providerRef: string): Promise<PaymentStatus>;
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
  ) {}

  private auth() {
    if (!this.apiKey) {
      throw new Error("Mollie is niet geconfigureerd (stel MOLLIE_API_KEY in via env).");
    }
    return { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" };
  }

  async startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const res = await this.fetchImpl(`${this.base}/payments`, {
      method: "POST",
      headers: this.auth(),
      body: JSON.stringify({
        amount: { currency: "EUR", value: (input.amountCents / 100).toFixed(2) },
        description: input.description,
        redirectUrl: input.returnUrl,
        webhookUrl: input.webhookUrl,
        metadata: { userId: input.userId, planKey: input.planKey },
      }),
    });
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
    const res = await this.fetchImpl(`${this.base}/payments/${encodeURIComponent(providerRef)}`, {
      headers: this.auth(),
    });
    if (!res.ok) throw new Error(`Mollie: status ophalen mislukte (status ${res.status}).`);
    const json = (await res.json()) as { status?: string };
    return normalizeMollieStatus(json.status);
  }
}

/** Mapt Mollie-statussen naar onze genormaliseerde set. */
export function normalizeMollieStatus(status: string | undefined): PaymentStatus {
  if (status === "paid") return "paid";
  if (status === "open" || status === "pending" || status === "authorized") return "open";
  return "failed"; // canceled | expired | failed | onbekend
}

let cached: PaymentProvider | null = null;

/** Actieve betaalprovider. Default = noop (instant); Mollie via BILLING_PROVIDER=mollie. */
export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  cached =
    process.env.BILLING_PROVIDER === "mollie"
      ? new MolliePaymentProvider(process.env.MOLLIE_API_KEY)
      : new NoopPaymentProvider();
  return cached;
}
