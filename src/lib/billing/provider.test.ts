import { describe, expect, it, vi } from "vitest";
import {
  NoopPaymentProvider,
  MolliePaymentProvider,
  normalizeMollieStatus,
} from "@/lib/billing/provider";

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
});
