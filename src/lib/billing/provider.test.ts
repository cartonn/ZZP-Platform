import { describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  BillingConnectivityError,
  NoopPaymentProvider,
  MolliePaymentProvider,
  StripePaymentProvider,
  normalizeMollieStatus,
  normalizeStripeStatus,
} from "@/lib/billing/provider";
import { HttpTimeoutError } from "@/lib/services/fetch-timeout";

/**
 * Fake fetch die nooit vanzelf oplost, maar wel op `init.signal` naar 'abort' luistert en dan
 * afwijst met een AbortError — precies zoals de echte `fetch` doet bij een afgebroken request.
 */
function hangingFetch(): typeof fetch {
  const impl = (_url: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      if (signal) {
        signal.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      }
    });
  return impl as unknown as typeof fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const checkout = {
  userId: "u1",
  planKey: "BUSINESS",
  amountCents: 9900,
  description: "abonnement",
  returnUrl: "https://app.test/abonnement",
  webhookUrl: "https://app.test/api/billing/webhook",
};

describe("NoopPaymentProvider", () => {
  it("activeert direct (geen redirect)", async () => {
    const p = new NoopPaymentProvider();
    const r = await p.startCheckout();
    expect(r.redirectUrl).toBeNull();
    expect(await p.paymentStatus()).toBe("paid");
    expect(await p.resolveWebhookRef()).toBeNull();
  });

  it("checkConnectivity is een no-op (niets extern te testen)", async () => {
    const p = new NoopPaymentProvider();
    await expect(p.checkConnectivity()).resolves.toBeUndefined();
  });
});

describe("normalizeMollieStatus", () => {
  it("mapt Mollie-statussen naar onze set", () => {
    expect(normalizeMollieStatus("paid")).toBe("paid");
    expect(normalizeMollieStatus("open")).toBe("open");
    expect(normalizeMollieStatus("pending")).toBe("open");
    expect(normalizeMollieStatus("canceled")).toBe("failed");
    expect(normalizeMollieStatus("expired")).toBe("failed");
    expect(normalizeMollieStatus(undefined)).toBe("failed");
  });
});

describe("MolliePaymentProvider", () => {
  it("maakt een betaling en geeft de checkout-URL + id terug", async () => {
    const fetchImpl = vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
      Promise.resolve(
        jsonResponse({
          id: "tr_123",
          _links: { checkout: { href: "https://pay.mollie.test/tr_123" } },
        }),
      ),
    );
    const p = new MolliePaymentProvider("test_key", fetchImpl as unknown as typeof fetch);
    const r = await p.startCheckout(checkout);
    expect(r.providerRef).toBe("tr_123");
    expect(r.redirectUrl).toBe("https://pay.mollie.test/tr_123");
    // Bedrag wordt als "99.00" EUR meegegeven.
    const init = fetchImpl.mock.calls[0]![1]!;
    const body = JSON.parse(init.body as string);
    expect(body.amount).toEqual({ currency: "EUR", value: "99.00" });
    expect(body.metadata).toMatchObject({ userId: "u1", planKey: "BUSINESS" });
  });

  it("zonder API-sleutel faalt het helder", async () => {
    const p = new MolliePaymentProvider(undefined);
    await expect(p.startCheckout(checkout)).rejects.toThrow(/niet geconfigureerd/);
  });

  it("paymentStatus haalt de status op en normaliseert", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ status: "paid" }));
    const p = new MolliePaymentProvider("k", fetchImpl as unknown as typeof fetch);
    expect(await p.paymentStatus("tr_123")).toBe("paid");
  });

  it("werpt bij een niet-ok status van Mollie", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 401));
    const p = new MolliePaymentProvider("k", fetchImpl as unknown as typeof fetch);
    await expect(p.startCheckout(checkout)).rejects.toThrow(/mislukte/);
  });

  it("resolveWebhookRef leest het id uit form- én JSON-body", async () => {
    const p = new MolliePaymentProvider("k");
    expect(await p.resolveWebhookRef("id=tr_9")).toBe("tr_9");
    expect(await p.resolveWebhookRef(JSON.stringify({ id: "tr_json" }))).toBe("tr_json");
    expect(await p.resolveWebhookRef("")).toBeNull();
    expect(await p.resolveWebhookRef("geenid")).toBeNull();
  });

  it("werpt HttpTimeoutError als de fetch blijft hangen", async () => {
    const p = new MolliePaymentProvider("k", hangingFetch(), 20);
    await expect(p.startCheckout(checkout)).rejects.toBeInstanceOf(HttpTimeoutError);
  });

  it("paymentStatus werpt HttpTimeoutError bij een hangende fetch", async () => {
    const p = new MolliePaymentProvider("k", hangingFetch(), 20);
    await expect(p.paymentStatus("tr_123")).rejects.toBeInstanceOf(HttpTimeoutError);
  });

  it("checkConnectivity doet een read-only GET /methods en slaagt bij 200", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ _embedded: { methods: [] } }));
    const p = new MolliePaymentProvider("k", fetchImpl as unknown as typeof fetch);
    await expect(p.checkConnectivity()).resolves.toBeUndefined();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toContain("/v2/methods");
    expect(init?.method ?? "GET").toBe("GET"); // geen betaling aangemaakt
  });

  it("checkConnectivity werpt BillingConnectivityError met alleen een status bij een niet-ok antwoord", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 401));
    const p = new MolliePaymentProvider("k", fetchImpl as unknown as typeof fetch);
    await expect(p.checkConnectivity()).rejects.toBeInstanceOf(BillingConnectivityError);
    await p.checkConnectivity().catch((e: unknown) => {
      expect((e as Error).message).toBe("Mollie: connectiviteitscontrole mislukte (status 401).");
    });
  });
});

describe("normalizeStripeStatus", () => {
  it("mapt Stripe checkout-status naar onze set", () => {
    expect(normalizeStripeStatus("complete", "paid")).toBe("paid");
    expect(normalizeStripeStatus("complete", "no_payment_required")).toBe("paid");
    expect(normalizeStripeStatus("open", "unpaid")).toBe("open");
    expect(normalizeStripeStatus("expired", "unpaid")).toBe("failed");
    expect(normalizeStripeStatus(undefined, undefined)).toBe("open");
  });
});

describe("StripePaymentProvider", () => {
  const t = 1_700_000_000;
  const now = t * 1000;

  function stripeSig(raw: string, secret = "whsec_test"): string {
    const sig = createHmac("sha256", secret).update(`${t}.${raw}`, "utf8").digest("hex");
    return `t=${t},v1=${sig}`;
  }

  it("maakt een Checkout Session en geeft url + session-id terug", async () => {
    const fetchImpl = vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
      Promise.resolve(jsonResponse({ id: "cs_123", url: "https://checkout.stripe.test/cs_123" })),
    );
    const p = new StripePaymentProvider(
      "sk_test",
      "whsec_test",
      fetchImpl as unknown as typeof fetch,
    );
    const r = await p.startCheckout(checkout);
    expect(r.providerRef).toBe("cs_123");
    expect(r.redirectUrl).toBe("https://checkout.stripe.test/cs_123");
    const init = fetchImpl.mock.calls[0]![1]!;
    const body = new URLSearchParams(init.body as string);
    // Bedrag in centen, EUR, en de metadata gaat mee.
    expect(body.get("line_items[0][price_data][unit_amount]")).toBe("9900");
    expect(body.get("line_items[0][price_data][currency]")).toBe("eur");
    expect(body.get("metadata[userId]")).toBe("u1");
    expect(body.get("metadata[planKey]")).toBe("BUSINESS");
  });

  it("zonder API-sleutel faalt het helder", async () => {
    const p = new StripePaymentProvider(undefined, "whsec_test");
    await expect(p.startCheckout(checkout)).rejects.toThrow(/niet geconfigureerd/);
  });

  it("paymentStatus haalt de sessie op en normaliseert", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ status: "complete", payment_status: "paid" }),
    );
    const p = new StripePaymentProvider("sk", "whsec_test", fetchImpl as unknown as typeof fetch);
    expect(await p.paymentStatus("cs_123")).toBe("paid");
  });

  it("resolveWebhookRef geeft het session-id bij een geldige handtekening", async () => {
    const raw = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { id: "cs_abc" } },
    });
    const p = new StripePaymentProvider("sk", "whsec_test", fetch, now);
    const headers = new Headers({ "stripe-signature": stripeSig(raw) });
    expect(await p.resolveWebhookRef(raw, headers)).toBe("cs_abc");
  });

  it("resolveWebhookRef weigert een ongeldige handtekening (null, geen throw)", async () => {
    const raw = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { id: "cs_abc" } },
    });
    const p = new StripePaymentProvider("sk", "whsec_test", fetch, now);
    const headers = new Headers({ "stripe-signature": "t=1,v1=deadbeef" });
    expect(await p.resolveWebhookRef(raw, headers)).toBeNull();
  });

  it("resolveWebhookRef negeert niet-checkout-events", async () => {
    const raw = JSON.stringify({
      type: "payment_intent.created",
      data: { object: { id: "pi_1" } },
    });
    const p = new StripePaymentProvider("sk", "whsec_test", fetch, now);
    const headers = new Headers({ "stripe-signature": stripeSig(raw) });
    expect(await p.resolveWebhookRef(raw, headers)).toBeNull();
  });

  it("resolveWebhookRef geeft null zonder webhook-secret", async () => {
    const p = new StripePaymentProvider("sk", undefined, fetch, now);
    expect(await p.resolveWebhookRef("{}", new Headers())).toBeNull();
  });

  it("werpt HttpTimeoutError als de fetch blijft hangen", async () => {
    const p = new StripePaymentProvider("sk", "whsec_test", hangingFetch(), now, 20);
    await expect(p.startCheckout(checkout)).rejects.toBeInstanceOf(HttpTimeoutError);
  });

  it("checkConnectivity doet een read-only GET /balance en slaagt bij 200", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ object: "balance", available: [] }));
    const p = new StripePaymentProvider("sk", "whsec_test", fetchImpl as unknown as typeof fetch);
    await expect(p.checkConnectivity()).resolves.toBeUndefined();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toContain("/v1/balance");
    expect(init?.method ?? "GET").toBe("GET"); // geen Checkout Session aangemaakt
  });

  it("checkConnectivity werpt BillingConnectivityError met alleen een status bij een niet-ok antwoord", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 401));
    const p = new StripePaymentProvider("sk", "whsec_test", fetchImpl as unknown as typeof fetch);
    await expect(p.checkConnectivity()).rejects.toBeInstanceOf(BillingConnectivityError);
  });
});
