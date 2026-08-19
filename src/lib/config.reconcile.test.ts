// Unit-tests voor de reconcile-config-parsers: default bij leeg/ongeldig, clamp naar het veilige bereik.

import { describe, it, expect } from "vitest";
import {
  parseSubscriptionReconcileAfterMinutes,
  parseSubscriptionReconcileMaxBatch,
  SUBSCRIPTION_RECONCILE_AFTER_MINUTES_DEFAULT,
  SUBSCRIPTION_RECONCILE_AFTER_MINUTES_MIN,
  SUBSCRIPTION_RECONCILE_AFTER_MINUTES_MAX,
  SUBSCRIPTION_RECONCILE_MAX_BATCH_DEFAULT,
  SUBSCRIPTION_RECONCILE_MAX_BATCH_MIN,
  SUBSCRIPTION_RECONCILE_MAX_BATCH_MAX,
} from "@/lib/config";

describe("parseSubscriptionReconcileAfterMinutes", () => {
  it("valt terug op de default bij leeg/ongeldig", () => {
    for (const raw of [undefined, "", "  ", "abc", "0", "-5"]) {
      expect(parseSubscriptionReconcileAfterMinutes(raw)).toBe(
        SUBSCRIPTION_RECONCILE_AFTER_MINUTES_DEFAULT,
      );
    }
  });

  it("klemt naar het veilige bereik en rondt af", () => {
    expect(parseSubscriptionReconcileAfterMinutes("1")).toBe(
      SUBSCRIPTION_RECONCILE_AFTER_MINUTES_MIN,
    );
    expect(parseSubscriptionReconcileAfterMinutes("99999")).toBe(
      SUBSCRIPTION_RECONCILE_AFTER_MINUTES_MAX,
    );
    expect(parseSubscriptionReconcileAfterMinutes("45.9")).toBe(45);
  });
});

describe("parseSubscriptionReconcileMaxBatch", () => {
  it("valt terug op de default bij leeg/ongeldig", () => {
    for (const raw of [undefined, "", "abc", "0", "-1"]) {
      expect(parseSubscriptionReconcileMaxBatch(raw)).toBe(
        SUBSCRIPTION_RECONCILE_MAX_BATCH_DEFAULT,
      );
    }
  });

  it("klemt naar het veilige bereik", () => {
    expect(parseSubscriptionReconcileMaxBatch("1")).toBe(SUBSCRIPTION_RECONCILE_MAX_BATCH_MIN);
    expect(parseSubscriptionReconcileMaxBatch("99999")).toBe(SUBSCRIPTION_RECONCILE_MAX_BATCH_MAX);
    expect(parseSubscriptionReconcileMaxBatch("50")).toBe(50);
  });
});
