import { describe, it, expect, vi } from "vitest";

import {
  fetchWithTimeout,
  resolveHttpTimeoutMs,
  HttpTimeoutError,
  DEFAULT_HTTP_TIMEOUT_MS,
  MIN_HTTP_TIMEOUT_MS,
  MAX_HTTP_TIMEOUT_MS,
} from "@/lib/services/fetch-timeout";

describe("resolveHttpTimeoutMs", () => {
  it("gebruikt de fallback bij ontbrekende/ongeldige waarde", () => {
    expect(resolveHttpTimeoutMs(undefined)).toBe(DEFAULT_HTTP_TIMEOUT_MS);
    expect(resolveHttpTimeoutMs("")).toBe(DEFAULT_HTTP_TIMEOUT_MS);
    expect(resolveHttpTimeoutMs("abc")).toBe(DEFAULT_HTTP_TIMEOUT_MS);
    expect(resolveHttpTimeoutMs("-5")).toBe(DEFAULT_HTTP_TIMEOUT_MS);
    expect(resolveHttpTimeoutMs(undefined, 2500)).toBe(2500);
  });

  it("parseert en klemt in het veilige bereik", () => {
    expect(resolveHttpTimeoutMs("3000")).toBe(3000);
    expect(resolveHttpTimeoutMs("10")).toBe(MIN_HTTP_TIMEOUT_MS);
    expect(resolveHttpTimeoutMs("999999")).toBe(MAX_HTTP_TIMEOUT_MS);
    expect(resolveHttpTimeoutMs("2500.7")).toBe(2501);
  });
});

describe("fetchWithTimeout", () => {
  it("geeft het antwoord door bij een tijdige respons", async () => {
    const response = new Response("ok", { status: 200 });
    const fetchImpl = vi.fn().mockResolvedValue(response);
    const res = await fetchWithTimeout("https://x.test/y", { method: "GET" }, { fetchImpl });
    expect(res).toBe(response);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    // De helper injecteert een signal.
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.method).toBe("GET");
  });

  it("werpt HttpTimeoutError wanneer de deadline verloopt", async () => {
    // Een fetch die nooit oplost, maar wel op abort reageert.
    const fetchImpl = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const e = new Error("aborted");
            e.name = "AbortError";
            reject(e);
          });
        }),
    ) as unknown as typeof fetch;

    await expect(
      fetchWithTimeout("https://x.test/slow", {}, { fetchImpl, timeoutMs: 20, label: "Mollie" }),
    ).rejects.toBeInstanceOf(HttpTimeoutError);
  });

  it("geeft niet-timeout-netwerkfouten ongewijzigd door", async () => {
    const boom = new Error("kapot netwerk");
    const fetchImpl = vi.fn().mockRejectedValue(boom);
    await expect(
      fetchWithTimeout("https://x.test/err", {}, { fetchImpl, label: "Resend" }),
    ).rejects.toBe(boom);
  });
});
