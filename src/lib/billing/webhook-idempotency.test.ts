import { describe, it, expect } from "vitest";
import { webhookEventKey, isUniqueConstraintError } from "@/lib/billing/webhook-idempotency";

describe("webhookEventKey", () => {
  it("combineert paymentRef en status tot één sleutel", () => {
    expect(webhookEventKey("tr_123", "paid")).toBe("tr_123:paid");
    expect(webhookEventKey("cs_test_abc", "failed")).toBe("cs_test_abc:failed");
  });

  it("geeft verschillende sleutels voor dezelfde betaling in verschillende statussen", () => {
    // open → paid zijn twee legitieme events die elk één keer verwerkt moeten worden.
    expect(webhookEventKey("tr_1", "open")).not.toBe(webhookEventKey("tr_1", "paid"));
  });

  it("geeft een identieke sleutel voor een herspeeld event (zelfde ref + status)", () => {
    expect(webhookEventKey("tr_1", "paid")).toBe(webhookEventKey("tr_1", "paid"));
  });
});

describe("isUniqueConstraintError", () => {
  it("herkent een Prisma P2002-fout", () => {
    expect(isUniqueConstraintError({ code: "P2002" })).toBe(true);
  });

  it("negeert andere Prisma-foutcodes", () => {
    expect(isUniqueConstraintError({ code: "P2025" })).toBe(false);
  });

  it("is veilig bij niet-object-invoer", () => {
    expect(isUniqueConstraintError(null)).toBe(false);
    expect(isUniqueConstraintError(undefined)).toBe(false);
    expect(isUniqueConstraintError("P2002")).toBe(false);
    expect(isUniqueConstraintError(new Error("boom"))).toBe(false);
  });
});
