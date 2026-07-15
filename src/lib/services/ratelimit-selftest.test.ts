import { describe, expect, it, vi } from "vitest";
import {
  inactiveRateLimitReport,
  runRateLimitSelfTest,
  type RateLimitProbeExec,
} from "@/lib/services/ratelimit-selftest";

const KEY = "rl:selftest:probe-1";

/**
 * In-memory fake die de Upstash-pipeline nabootst voor de commando's die de zelftest gebruikt:
 * INCR, PEXPIRE ... NX, PTTL, DEL, EXISTS. Genoeg om de round-trip deterministisch te draaien.
 */
function memoryExec(): RateLimitProbeExec & { keys: Map<string, { count: number; ttl: number }> } {
  const keys = new Map<string, { count: number; ttl: number }>();
  const exec = (async (commands: (string | number)[][]) => {
    return commands.map((cmd) => {
      const [op, key] = cmd as [string, string, ...unknown[]];
      const entry = keys.get(key);
      switch (op) {
        case "INCR": {
          const next = (entry?.count ?? 0) + 1;
          keys.set(key, { count: next, ttl: entry?.ttl ?? -1 });
          return next;
        }
        case "PEXPIRE": {
          if (!entry) return 0;
          // NX: alleen zetten wanneer er nog geen TTL is.
          if (entry.ttl > 0) return 0;
          entry.ttl = Number(cmd[2]);
          return 1;
        }
        case "PTTL":
          return entry ? entry.ttl : -2;
        case "DEL": {
          const existed = keys.delete(key);
          return existed ? 1 : 0;
        }
        case "EXISTS":
          return keys.has(key) ? 1 : 0;
        default:
          throw new Error(`onbekend commando ${op}`);
      }
    });
  }) as RateLimitProbeExec & { keys: Map<string, { count: number; ttl: number }> };
  exec.keys = keys;
  return exec;
}

describe("runRateLimitSelfTest", () => {
  it("slaagt op de volledige round-trip en laat geen probe-key achter", async () => {
    const exec = memoryExec();
    const report = await runRateLimitSelfTest({ exec, storeMode: "upstash", probeKey: KEY });

    expect(report.ok).toBe(true);
    expect(report.active).toBe(true);
    expect(report.storeMode).toBe("upstash");
    expect(report.probeKey).toBe(KEY);
    expect(report.steps.map((s) => s.key)).toEqual(["connect", "expire", "delete", "cleanup"]);
    expect(report.steps.every((s) => s.ok)).toBe(true);
    expect(exec.keys.size).toBe(0);
  });

  it("faalt en stopt wanneer INCR een fout werpt (secret-vrije detail)", async () => {
    const exec = vi.fn(async () => {
      throw Object.assign(new Error("fetch failed to https://xxx.upstash.io token=abc"), {
        name: "AbortError",
      });
    }) as unknown as RateLimitProbeExec;

    const report = await runRateLimitSelfTest({ exec, storeMode: "upstash", probeKey: KEY });

    expect(report.ok).toBe(false);
    expect(report.active).toBe(true);
    expect(report.steps).toHaveLength(1);
    expect(report.steps.at(0)).toMatchObject({ key: "connect", ok: false });
    // Alleen de error-NAAM lekt, nooit het bericht (endpoint/token).
    expect(report.steps.at(0)?.detail).toBe("AbortError");
    expect(report.steps.at(0)?.detail).not.toContain("upstash.io");
    expect(report.steps.at(0)?.detail).not.toContain("token");
  });

  it("faalt wanneer INCR geen geldig getal teruggeeft", async () => {
    const exec = (async () => [null]) as RateLimitProbeExec;
    const report = await runRateLimitSelfTest({ exec, storeMode: "upstash", probeKey: KEY });

    expect(report.ok).toBe(false);
    expect(report.steps).toHaveLength(1);
    expect(report.steps.at(0)?.key).toBe("connect");
  });

  it("faalt wanneer de venster-TTL niet landt (PTTL ≤ 0) en ruimt de key op", async () => {
    const exec = memoryExec();
    // PEXPIRE wordt overgeslagen → PTTL blijft -1; de key is wél aangemaakt door INCR.
    const wrapped = (async (commands: (string | number)[][]) => {
      const patched = commands.map((c) => (c[0] === "PEXPIRE" ? ["EXISTS", c[1]] : c));
      return exec(patched as (string | number)[][]);
    }) as RateLimitProbeExec;

    const report = await runRateLimitSelfTest({
      exec: wrapped,
      storeMode: "upstash",
      probeKey: KEY,
    });

    expect(report.ok).toBe(false);
    expect(report.steps.map((s) => s.key)).toEqual(["connect", "expire"]);
    expect(report.steps.at(1)?.ok).toBe(false);
    // Vangnet ruimde de door INCR aangemaakte key op.
    expect(exec.keys.size).toBe(0);
  });

  it("faalt wanneer de key na DEL nog bestaat (EXISTS ≠ 0)", async () => {
    const exec = memoryExec();
    const wrapped = (async (commands: (string | number)[][]) => {
      // DEL wordt genegeerd zodat de key blijft staan → cleanup-check faalt.
      const patched = commands.map((c) => (c[0] === "DEL" ? ["PTTL", c[1]] : c));
      return exec(patched as (string | number)[][]);
    }) as RateLimitProbeExec;

    const report = await runRateLimitSelfTest({
      exec: wrapped,
      storeMode: "upstash",
      probeKey: KEY,
    });

    expect(report.ok).toBe(false);
    // DEL geeft nu een TTL (getal ≠ 1) → delete-stap faalt al vóór cleanup.
    expect(report.steps.map((s) => s.key)).toEqual(["connect", "expire", "delete"]);
    expect(report.steps.at(-1)).toMatchObject({ key: "delete", ok: false });
  });

  it("markeert een inactieve (memory) store zonder iets te testen", () => {
    const report = inactiveRateLimitReport("memory");
    expect(report.active).toBe(false);
    expect(report.ok).toBe(true);
    expect(report.storeMode).toBe("memory");
    expect(report.steps).toHaveLength(0);
    expect(report.probeKey).toBe("");
  });
});
