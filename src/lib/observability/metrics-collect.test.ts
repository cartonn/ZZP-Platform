import { describe, it, expect } from "vitest";
import {
  MIN_METRICS_COLLECT_CONCURRENCY,
  MAX_METRICS_COLLECT_CONCURRENCY,
  DEFAULT_METRICS_COLLECT_CONCURRENCY,
  DEFAULT_METRICS_COLLECT_TIMEOUT_MS,
  resolveMetricsConcurrency,
  resolveMetricsTimeoutMs,
  mapWithConcurrency,
} from "./metrics-collect";

// Wacht `ticks` microtasks — deterministisch (geen echte timers/Date.now/Math.random).
async function afterTicks(ticks: number): Promise<void> {
  for (let i = 0; i < ticks; i++) await Promise.resolve();
}

describe("resolveMetricsConcurrency", () => {
  it("klemt een geldig geheel getal binnen de range", () => {
    expect(resolveMetricsConcurrency("8")).toBe(8);
  });

  it("klemt onder MIN en boven MAX", () => {
    expect(resolveMetricsConcurrency("1")).toBe(MIN_METRICS_COLLECT_CONCURRENCY);
    expect(resolveMetricsConcurrency("999")).toBe(MAX_METRICS_COLLECT_CONCURRENCY);
  });

  it("rondt een niet-geheel getal af en klemt", () => {
    expect(resolveMetricsConcurrency("4.6")).toBe(5);
  });

  it("valt terug op de default bij nul/negatief/leeg/niet-numeriek/off — nooit 0", () => {
    for (const raw of ["0", "-3", "", "abc", "off", undefined]) {
      expect(resolveMetricsConcurrency(raw)).toBe(DEFAULT_METRICS_COLLECT_CONCURRENCY);
    }
  });

  it("respecteert een expliciete (geklemde) fallback", () => {
    expect(resolveMetricsConcurrency(undefined, 10)).toBe(10);
    expect(resolveMetricsConcurrency("bad", 99)).toBe(MAX_METRICS_COLLECT_CONCURRENCY);
    expect(resolveMetricsConcurrency("bad", 0)).toBe(DEFAULT_METRICS_COLLECT_CONCURRENCY);
  });
});

describe("resolveMetricsTimeoutMs", () => {
  it("gebruikt de default wanneer raw ontbreekt", () => {
    expect(resolveMetricsTimeoutMs(undefined)).toBe(DEFAULT_METRICS_COLLECT_TIMEOUT_MS);
  });

  it("schakelt de deadline uit bij 0/off (escape-hatch)", () => {
    expect(resolveMetricsTimeoutMs("0")).toBe(0);
    expect(resolveMetricsTimeoutMs("off")).toBe(0);
  });

  it("klemt numerieke waarden op [250, 30000] (gedelegeerd aan probe-timeout)", () => {
    expect(resolveMetricsTimeoutMs("100")).toBe(250);
    expect(resolveMetricsTimeoutMs("60000")).toBe(30000);
    expect(resolveMetricsTimeoutMs("5000")).toBe(5000);
  });
});

describe("mapWithConcurrency", () => {
  it("behoudt de invoervolgorde ook als latere items eerder afronden", async () => {
    const items = [0, 1, 2, 3, 4];
    // Vroegere index = meer ticks wachten, dus later afronden dan hogere indexen.
    const results = await mapWithConcurrency(items, 5, async (item, index) => {
      await afterTicks(items.length - index);
      return item * 10;
    });
    expect(results).toEqual([0, 10, 20, 30, 40]);
  });

  it("overschrijdt de limiet nooit", async () => {
    const items = Array.from({ length: 12 }, (_, i) => i);
    const limit = 3;
    let active = 0;
    let peak = 0;
    await mapWithConcurrency(items, limit, async (item) => {
      active++;
      peak = Math.max(peak, active);
      expect(active).toBeLessThanOrEqual(limit);
      await afterTicks(2);
      active--;
      return item;
    });
    expect(peak).toBeLessThanOrEqual(limit);
    expect(peak).toBe(limit);
  });

  it("levert [] bij lege invoer", async () => {
    expect(await mapWithConcurrency([], 4, async () => 1)).toEqual([]);
  });

  it("draait alles wanneer limit >= aantal items", async () => {
    const results = await mapWithConcurrency([1, 2, 3], 10, async (n) => n + 1);
    expect(results).toEqual([2, 3, 4]);
  });

  it("coerced limit naar minstens 1", async () => {
    const results = await mapWithConcurrency([1, 2, 3], 0, async (n) => n * 2);
    expect(results).toEqual([2, 4, 6]);
  });

  it("verwerpt de hele aanroep als fn voor een item verwerpt", async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (n) => {
        if (n === 2) throw new Error("boom");
        return n;
      }),
    ).rejects.toThrow("boom");
  });
});
