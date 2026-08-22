import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock de heartbeat-opslag: de decorator registreert succes/mislukking via deze twee functies.
const recordSuccess = vi.fn(async () => {});
const recordFailure = vi.fn(async () => {});
vi.mock("@/lib/observability/billing-delivery-heartbeat", () => ({
  recordBillingDeliverySuccess: recordSuccess,
  recordBillingDeliveryFailure: recordFailure,
}));

import { RecordingPaymentProvider } from "./recording-payment-provider";
import type { CheckoutInput, CheckoutResult, PaymentProvider, PaymentStatus } from "./provider";

const CHECKOUT: CheckoutInput = {
  userId: "u1",
  planKey: "pro",
  amountCents: 1500,
  description: "Pro",
  returnUrl: "https://app.example/terug",
  webhookUrl: "https://app.example/api/billing/webhook",
};

/** Configureerbare fake provider: laat elke methode slagen of falen. */
class FakeProvider implements PaymentProvider {
  readonly name = "stripe";
  calls: string[] = [];
  constructor(private readonly fail = false) {}

  async startCheckout(): Promise<CheckoutResult> {
    this.calls.push("startCheckout");
    if (this.fail) throw new Error("ProviderDown");
    return { redirectUrl: "https://pay.example/x", providerRef: "pi_1" };
  }
  async paymentStatus(): Promise<PaymentStatus> {
    this.calls.push("paymentStatus");
    if (this.fail) throw new Error("ProviderDown");
    return "paid";
  }
  async resolveWebhookRef(): Promise<string | null> {
    this.calls.push("resolveWebhookRef");
    return "pi_1";
  }
  async classifyWebhookAuth(): Promise<"ok" | "invalid" | "not-applicable"> {
    this.calls.push("classifyWebhookAuth");
    return "ok";
  }
  async checkConnectivity(): Promise<void> {
    this.calls.push("checkConnectivity");
    if (this.fail) throw new Error("ProviderDown");
  }
}

describe("RecordingPaymentProvider — aflever-heartbeat-registratie", () => {
  beforeEach(() => {
    recordSuccess.mockClear();
    recordFailure.mockClear();
  });

  it("registreert succes na startCheckout en geeft het resultaat ongewijzigd door", async () => {
    const rec = new RecordingPaymentProvider(new FakeProvider());
    const out = await rec.startCheckout(CHECKOUT);
    expect(out).toEqual({ redirectUrl: "https://pay.example/x", providerRef: "pi_1" });
    expect(recordSuccess).toHaveBeenCalledWith("stripe");
    expect(recordFailure).not.toHaveBeenCalled();
  });

  it("registreert succes na paymentStatus en checkConnectivity", async () => {
    const rec = new RecordingPaymentProvider(new FakeProvider());
    await expect(rec.paymentStatus("pi_1")).resolves.toBe("paid");
    await rec.checkConnectivity();
    expect(recordSuccess).toHaveBeenCalledTimes(2);
    expect(recordFailure).not.toHaveBeenCalled();
  });

  it("registreert mislukking en her-gooit de originele fout bij startCheckout", async () => {
    const rec = new RecordingPaymentProvider(new FakeProvider(true));
    await expect(rec.startCheckout(CHECKOUT)).rejects.toThrow("ProviderDown");
    expect(recordFailure).toHaveBeenCalledWith("stripe");
    expect(recordSuccess).not.toHaveBeenCalled();
  });

  it("registreert mislukking en her-gooit bij paymentStatus en checkConnectivity", async () => {
    const rec = new RecordingPaymentProvider(new FakeProvider(true));
    await expect(rec.paymentStatus("pi_1")).rejects.toThrow("ProviderDown");
    await expect(rec.checkConnectivity()).rejects.toThrow("ProviderDown");
    expect(recordFailure).toHaveBeenCalledTimes(2);
  });

  it("laat classifyWebhookAuth ongeregistreerd door (inkomende observability, geen uitgaande call)", async () => {
    const rec = new RecordingPaymentProvider(new FakeProvider());
    await expect(rec.classifyWebhookAuth("raw", new Headers())).resolves.toBe("ok");
    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordFailure).not.toHaveBeenCalled();
  });

  it("laat resolveWebhookRef ongeregistreerd door (geen uitgaande call, mag nooit throwen)", async () => {
    const rec = new RecordingPaymentProvider(new FakeProvider());
    await expect(rec.resolveWebhookRef("raw", new Headers())).resolves.toBe("pi_1");
    expect(recordSuccess).not.toHaveBeenCalled();
    expect(recordFailure).not.toHaveBeenCalled();
  });

  it("spiegelt de naam van de inner-provider", () => {
    const rec = new RecordingPaymentProvider(new FakeProvider());
    expect(rec.name).toBe("stripe");
  });
});
