import { describe, it, expect, vi, afterEach } from "vitest";
import {
  withProbeTimeout,
  resolveProbeTimeoutMs,
  ProbeTimeoutError,
  MIN_PROBE_TIMEOUT_MS,
  MAX_PROBE_TIMEOUT_MS,
  DEFAULT_PROBE_TIMEOUT_MS,
} from "./probe-timeout";

describe("withProbeTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("levert de waarde door als de probe binnen de deadline afrondt", async () => {
    await expect(withProbeTimeout("db", 1_000, async () => "ok")).resolves.toBe("ok");
  });

  it("draait zonder deadline (0) de probe ongewijzigd door", async () => {
    await expect(withProbeTimeout("db", 0, async () => 7)).resolves.toBe(7);
  });

  it("draait zonder deadline (negatief) de probe ongewijzigd door", async () => {
    await expect(withProbeTimeout("db", -5, async () => 7)).resolves.toBe(7);
  });

  it("verwerpt met ProbeTimeoutError bij een hangende probe", async () => {
    vi.useFakeTimers();
    const promise = withProbeTimeout("db", 500, () => new Promise<never>(() => {}));
    const assertion = expect(promise).rejects.toBeInstanceOf(ProbeTimeoutError);
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
  });

  it("propageert een echte probe-fout ongewijzigd (niet als time-out)", async () => {
    await expect(
      withProbeTimeout("db", 1_000, async () => {
        throw new Error("connection refused");
      }),
    ).rejects.toThrow("connection refused");
  });

  it("ruimt de timer op zodat een snel geslaagde probe geen timer laat lopen", async () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const promise = withProbeTimeout("db", 1_000, async () => "done");
    await expect(promise).resolves.toBe("done");
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});

describe("ProbeTimeoutError", () => {
  it("draagt een stabiele naam en een deadline-vermelding", () => {
    const err = new ProbeTimeoutError("readiness", 3_000);
    expect(err.name).toBe("ProbeTimeoutError");
    expect(err.message).toContain("3000");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("resolveProbeTimeoutMs", () => {
  it("valt zonder waarde terug op de default", () => {
    expect(resolveProbeTimeoutMs(undefined)).toBe(DEFAULT_PROBE_TIMEOUT_MS);
  });

  it("valt bij een lege string terug op de default", () => {
    expect(resolveProbeTimeoutMs("   ")).toBe(DEFAULT_PROBE_TIMEOUT_MS);
  });

  it("valt bij een niet-numerieke waarde terug op de default", () => {
    expect(resolveProbeTimeoutMs("snel")).toBe(DEFAULT_PROBE_TIMEOUT_MS);
  });

  it("klemt te lage waarden op het minimum", () => {
    expect(resolveProbeTimeoutMs("1")).toBe(MIN_PROBE_TIMEOUT_MS);
  });

  it("klemt te hoge waarden op het maximum", () => {
    expect(resolveProbeTimeoutMs("99999999")).toBe(MAX_PROBE_TIMEOUT_MS);
  });

  it("neemt een geldige waarde binnen het bereik over", () => {
    expect(resolveProbeTimeoutMs("5000")).toBe(5_000);
  });

  it("valt bij een niet-positieve waarde terug op de default", () => {
    expect(resolveProbeTimeoutMs("0")).toBe(DEFAULT_PROBE_TIMEOUT_MS);
    expect(resolveProbeTimeoutMs("-100")).toBe(DEFAULT_PROBE_TIMEOUT_MS);
  });

  it("gebruikt een meegegeven, geldige fallback", () => {
    expect(resolveProbeTimeoutMs(undefined, 4_000)).toBe(4_000);
  });

  it("klemt ook een meegegeven fallback binnen het bereik", () => {
    expect(resolveProbeTimeoutMs(undefined, 999_999)).toBe(MAX_PROBE_TIMEOUT_MS);
  });
});
