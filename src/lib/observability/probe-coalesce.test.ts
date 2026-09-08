import { afterEach, describe, expect, it, vi } from "vitest";
import { coalesceProbe, __resetProbeCoalesceForTests } from "./probe-coalesce";

/** Een handmatig te settelen promise, zodat we het in-flight-venster exact controleren. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  __resetProbeCoalesceForTests();
});

describe("coalesceProbe", () => {
  it("roept fn één keer aan voor gelijktijdige aanroepers met dezelfde sleutel", async () => {
    const gate = deferred<number>();
    const fn = vi.fn(() => gate.promise);

    const a = coalesceProbe("k", fn);
    const b = coalesceProbe("k", fn);

    // Beide joiners delen exact dezelfde in-flight promise (geen tweede DB-checkout).
    expect(fn).toHaveBeenCalledTimes(1);

    gate.resolve(42);
    await expect(a).resolves.toBe(42);
    await expect(b).resolves.toBe(42);
  });

  it("start een verse probe zodra de vorige is beslecht (geen stale caching)", async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("eerste")
      .mockResolvedValueOnce("tweede");

    await expect(coalesceProbe("k", fn)).resolves.toBe("eerste");
    await expect(coalesceProbe("k", fn)).resolves.toBe("tweede");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("propageert een fout naar alle joiners en geeft de sleutel daarna vrij", async () => {
    const gate = deferred<number>();
    const failing = vi.fn(() => gate.promise);

    const a = coalesceProbe("k", failing);
    const b = coalesceProbe("k", failing);
    expect(failing).toHaveBeenCalledTimes(1);

    const boom = new Error("db weg");
    gate.reject(boom);
    await expect(a).rejects.toBe(boom);
    await expect(b).rejects.toBe(boom);

    // Na de fout is de sleutel vrij: een nieuwe aanroep herstart (fail-closed blijft actueel).
    const recovered = vi.fn(() => Promise.resolve(7));
    await expect(coalesceProbe("k", recovered)).resolves.toBe(7);
    expect(recovered).toHaveBeenCalledTimes(1);
  });

  it("houdt verschillende sleutels onafhankelijk", async () => {
    const fnA = vi.fn(() => Promise.resolve("a"));
    const fnB = vi.fn(() => Promise.resolve("b"));

    const [a, b] = await Promise.all([coalesceProbe("a", fnA), coalesceProbe("b", fnB)]);
    expect(a).toBe("a");
    expect(b).toBe("b");
    expect(fnA).toHaveBeenCalledTimes(1);
    expect(fnB).toHaveBeenCalledTimes(1);
  });

  it("lekt de sleutel niet wanneer fn synchroon werpt", async () => {
    const throwing = () => {
      throw new Error("synchrone fout");
    };
    await expect(coalesceProbe("k", throwing)).rejects.toThrow("synchrone fout");

    // De map is weer leeg: een volgende aanroep draait normaal.
    await expect(coalesceProbe("k", () => Promise.resolve("ok"))).resolves.toBe("ok");
  });
});
