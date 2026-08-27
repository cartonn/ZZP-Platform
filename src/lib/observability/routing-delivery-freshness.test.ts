import { describe, expect, it } from "vitest";

import {
  evaluateRoutingDeliveryFreshness,
  routingDeliveryStatusItem,
  type RoutingDeliveryHeartbeatFields,
} from "@/lib/observability/routing-delivery-freshness";

const NOW = new Date("2026-08-27T12:00:00.000Z");
const at = (msOffset: number) => new Date(NOW.getTime() + msOffset);

const fields = (
  override: Partial<RoutingDeliveryHeartbeatFields>,
): RoutingDeliveryHeartbeatFields => ({
  lastAttemptAt: NOW,
  lastOk: true,
  lastSuccessAt: NOW,
  lastFailureAt: null,
  consecutiveFailures: 0,
  driver: "geoapify",
  ...override,
});

describe("evaluateRoutingDeliveryFreshness", () => {
  it("null of geen poging → never (neutraal gezond)", () => {
    expect(evaluateRoutingDeliveryFreshness(null, NOW).status).toBe("never");
    expect(evaluateRoutingDeliveryFreshness(fields({ lastAttemptAt: null }), NOW).status).toBe(
      "never",
    );
  });

  it("laatste lookup geslaagd → ok, teller 0", () => {
    const f = evaluateRoutingDeliveryFreshness(fields({ lastOk: true }), NOW);
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
  });

  it("laatste lookup mislukt → failing met teller en leeftijd", () => {
    const f = evaluateRoutingDeliveryFreshness(
      fields({ lastOk: false, lastFailureAt: at(-45_000), consecutiveFailures: 5 }),
      NOW,
    );
    expect(f.status).toBe("failing");
    expect(f.consecutiveFailures).toBe(5);
    expect(f.failureAgeSeconds).toBe(45);
  });

  it("robuust tegen klok-scheefstand (mislukking in de toekomst → leeftijd 0)", () => {
    const f = evaluateRoutingDeliveryFreshness(
      fields({ lastOk: false, lastFailureAt: at(60_000), consecutiveFailures: 1 }),
      NOW,
    );
    expect(f.failureAgeSeconds).toBe(0);
  });

  it("negatieve/niet-eindige teller wordt 0", () => {
    const f = evaluateRoutingDeliveryFreshness(
      fields({ lastOk: false, lastFailureAt: NOW, consecutiveFailures: -3 }),
      NOW,
    );
    expect(f.consecutiveFailures).toBe(0);
  });

  it("een geslaagde laatste lookup nult de teller ook al stond die hoog", () => {
    const f = evaluateRoutingDeliveryFreshness(
      fields({ lastOk: true, consecutiveFailures: 9 }),
      NOW,
    );
    expect(f.status).toBe("ok");
    expect(f.consecutiveFailures).toBe(0);
  });
});

describe("routingDeliveryStatusItem", () => {
  it("never → ok-niveau, verwijst naar de env-variabele (geen secret-waarde)", () => {
    const item = routingDeliveryStatusItem(evaluateRoutingDeliveryFreshness(null, NOW));
    expect(item.level).toBe("ok");
    expect(item.key).toBe("routing-delivery-heartbeat");
    expect(item.label).toBe("Routing-provider (laatste lookup)");
    // De uitleg noemt de env-VARIABELENAAM (config-hint), nooit een concrete sleutelwaarde.
    expect(item.detail).toContain("ROUTING_PROVIDER=geoapify");
  });

  it("failing → attention-niveau met driver in de modus + verwijzing naar de API-key", () => {
    const item = routingDeliveryStatusItem(
      evaluateRoutingDeliveryFreshness(
        fields({ lastOk: false, lastFailureAt: NOW, consecutiveFailures: 3 }),
        NOW,
      ),
    );
    expect(item.level).toBe("attention");
    expect(item.mode).toContain("geoapify");
    expect(item.detail).toContain("GEOAPIFY_API_KEY");
    expect(item.detail).toContain("3 opeenvolgende mislukkingen");
  });

  it("ok → ok-niveau, operationeel", () => {
    const item = routingDeliveryStatusItem(
      evaluateRoutingDeliveryFreshness(fields({ lastOk: true }), NOW),
    );
    expect(item.level).toBe("ok");
    expect(item.mode).toContain("operationeel");
  });
});
