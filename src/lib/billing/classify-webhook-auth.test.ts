import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import {
  MolliePaymentProvider,
  NoopPaymentProvider,
  StripePaymentProvider,
  type PaymentProvider,
} from "@/lib/billing/provider";

// classifyWebhookAuth is PUUR observability: het classificeert de handtekening-authenticiteit van een
// inkomende webhook (voor de dead-man's-switch op stille handtekening-mislukkingen) zonder de
// control-flow van de webhook-route te raken. Deze test klinkt het contract vast: alleen Stripe met een
// secret produceert "ok"/"invalid"; alle ongetekende kanalen zijn "not-applicable"; het werpt nooit.

const t = 1_700_000_000;
const now = t * 1000;

function stripeSig(raw: string, secret = "whsec_test"): string {
  const sig = createHmac("sha256", secret).update(`${t}.${raw}`, "utf8").digest("hex");
  return `t=${t},v1=${sig}`;
}

const checkoutBody = JSON.stringify({
  type: "checkout.session.completed",
  data: { object: { id: "cs_abc" } },
});

describe("classifyWebhookAuth", () => {
  it("Noop-provider: not-applicable (geen getekend kanaal)", async () => {
    // Als PaymentProvider getypt: de interface-signatuur (2 params) i.p.v. de concrete 0-param-impl,
    // zodat de contract-aanroep met (body, headers) geldig is voor deze ongetekende driver.
    const p: PaymentProvider = new NoopPaymentProvider();
    expect(await p.classifyWebhookAuth("{}", new Headers())).toBe("not-applicable");
  });

  it("Mollie-provider: not-applicable (ondertekent niet)", async () => {
    const p: PaymentProvider = new MolliePaymentProvider("test_key");
    expect(await p.classifyWebhookAuth("id=tr_1", new Headers())).toBe("not-applicable");
  });

  it("Stripe zonder webhook-secret: not-applicable", async () => {
    const p = new StripePaymentProvider("sk", undefined, fetch, now);
    expect(await p.classifyWebhookAuth(checkoutBody, new Headers())).toBe("not-applicable");
  });

  it("Stripe met geldige handtekening: ok", async () => {
    const p = new StripePaymentProvider("sk", "whsec_test", fetch, now);
    const headers = new Headers({ "stripe-signature": stripeSig(checkoutBody) });
    expect(await p.classifyWebhookAuth(checkoutBody, headers)).toBe("ok");
  });

  it("Stripe met een geldig-getekend maar irrelevant event: nog steeds ok (handtekening klopt)", async () => {
    const raw = JSON.stringify({
      type: "payment_intent.created",
      data: { object: { id: "pi_1" } },
    });
    const p = new StripePaymentProvider("sk", "whsec_test", fetch, now);
    const headers = new Headers({ "stripe-signature": stripeSig(raw) });
    expect(await p.classifyWebhookAuth(raw, headers)).toBe("ok");
  });

  it("Stripe met een ongeldige handtekening: invalid (de stille faal van een verkeerd secret)", async () => {
    const p = new StripePaymentProvider("sk", "whsec_test", fetch, now);
    const headers = new Headers({ "stripe-signature": "t=1,v1=deadbeef" });
    expect(await p.classifyWebhookAuth(checkoutBody, headers)).toBe("invalid");
  });

  it("Stripe met de verkeerde secret-sleutel (ander paar): invalid", async () => {
    const p = new StripePaymentProvider("sk", "whsec_test", fetch, now);
    const headers = new Headers({ "stripe-signature": stripeSig(checkoutBody, "whsec_other") });
    expect(await p.classifyWebhookAuth(checkoutBody, headers)).toBe("invalid");
  });

  it("Stripe zonder stripe-signature-header: invalid, werpt niet", async () => {
    const p = new StripePaymentProvider("sk", "whsec_test", fetch, now);
    expect(await p.classifyWebhookAuth(checkoutBody, new Headers())).toBe("invalid");
  });
});
