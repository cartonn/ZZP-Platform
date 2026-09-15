import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findPlan, upsert, createAudit, checkout } = vi.hoisted(() => ({
  findPlan: vi.fn(),
  upsert: vi.fn(),
  createAudit: vi.fn(),
  checkout: vi.fn(),
}));
vi.mock("@/lib/authz", () => ({ requireActor: async () => ({ id: "owner" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/public-url", () => ({ publicOrigin: async () => "https://example.test" }));
vi.mock("@/lib/audit", () => ({ auditData: (data: unknown) => data }));
vi.mock("@/lib/billing/provider", () => ({
  getPaymentProvider: () => ({ startCheckout: checkout }),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    plan: { findUnique: findPlan },
    subscription: { upsert },
    auditLog: { create: createAudit },
  },
}));

import { changeSubscription } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("DEPLOYMENT_STAGE", "production");
  vi.stubEnv("BILLING_PROVIDER", "noop");
  findPlan.mockResolvedValue({ id: "plan-pro", name: "Zelf-doen", priceCents: 1900 });
  checkout.mockResolvedValue({ redirectUrl: null, providerRef: null });
});
afterEach(() => vi.unstubAllEnvs());

describe("subscription purchase availability", () => {
  it("cannot activate a paid plan through a forged POST while payments are unavailable", async () => {
    await expect(changeSubscription("PRO")).rejects.toThrow("Betaalde abonnementen");
    expect(checkout).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
    expect(createAudit).not.toHaveBeenCalled();
  });

  it("does not sell the unavailable managed service even with a payment provider", async () => {
    vi.stubEnv("BILLING_PROVIDER", "mollie");
    await expect(changeSubscription("BUSINESS")).rejects.toThrow("dienstverlening");
    expect(checkout).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("preserves explicitly configured demo upgrades without collecting money", async () => {
    vi.stubEnv("DEPLOYMENT_STAGE", "demo");
    vi.stubEnv("BILLING_PROVIDER", "mollie");
    await changeSubscription("PRO");
    expect(checkout).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ status: "ACTIVE" }) }),
    );
  });

  it("keeps a free account available without a payment provider", async () => {
    findPlan.mockResolvedValue({ id: "plan-free", name: "Gratis", priceCents: 0 });
    await changeSubscription("FREE");
    expect(checkout).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalled();
  });

  it("rejects an incomplete real checkout instead of treating it as payment", async () => {
    vi.stubEnv("BILLING_PROVIDER", "mollie");
    await expect(changeSubscription("PRO")).rejects.toThrow("Betaalpagina");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects a checkout link without a provider reference", async () => {
    vi.stubEnv("BILLING_PROVIDER", "stripe");
    checkout.mockResolvedValue({ redirectUrl: "https://payments.example.test", providerRef: null });
    await expect(changeSubscription("PRO")).rejects.toThrow("Betaalpagina");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("keeps a real checkout pending until the provider confirms payment", async () => {
    vi.stubEnv("BILLING_PROVIDER", "mollie");
    checkout.mockResolvedValue({
      redirectUrl: "https://payments.example.test/checkout",
      providerRef: "payment-1",
    });
    await changeSubscription("PRO");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: "PENDING", providerRef: "payment-1" }),
      }),
    );
  });
});
