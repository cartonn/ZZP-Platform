import { describe, expect, it, vi, afterEach } from "vitest";
import {
  verifyViaHttp,
  resolveVerifyRetries,
  verifyRetryDelayMs,
  DEFAULT_VERIFY_RETRIES,
  MAX_VERIFY_RETRIES,
  VERIFY_RETRY_BASE_DELAY_MS,
  VERIFY_RETRY_MAX_DELAY_MS,
  VerifierNotConfiguredError,
  VerifierRequestError,
} from "@/lib/services/http-verify";
import { DuoDiplomaVerifier } from "@/lib/services/diploma-verifier";
import { BigRegisterVerifier } from "@/lib/services/big-verifier";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Geen echte backoff-vertraging in de tests. */
const noSleep = async () => {};

const baseCfg = {
  name: "TEST",
  baseUrl: "https://api.example.test",
  apiKey: "secret",
  path: "/verify",
  // Standaard in de tests: geen retry + geen slaap, tenzij een test het expliciet aanzet.
  retries: 0,
  sleepImpl: noSleep,
};

describe("verifyViaHttp", () => {
  it("werpt VerifierNotConfiguredError zonder basis-URL of sleutel", async () => {
    await expect(verifyViaHttp({ ...baseCfg, baseUrl: undefined }, {})).rejects.toBeInstanceOf(
      VerifierNotConfiguredError,
    );
    await expect(verifyViaHttp({ ...baseCfg, apiKey: undefined }, {})).rejects.toBeInstanceOf(
      VerifierNotConfiguredError,
    );
  });

  it("POST met bearer-auth naar het juiste pad; geeft het gevalideerde antwoord terug", async () => {
    const fetchImpl = vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
      Promise.resolve(jsonResponse({ verified: true, message: "ok" })),
    );
    const res = await verifyViaHttp(
      { ...baseCfg, fetchImpl: fetchImpl as unknown as typeof fetch },
      { code: "X" },
    );
    expect(res.verified).toBe(true);
    expect(res.message).toBe("ok");
    const call = fetchImpl.mock.calls[0]!;
    expect(call[0]).toBe("https://api.example.test/verify");
    expect(call[1]?.method).toBe("POST");
    expect(call[1]?.headers).toMatchObject({ Authorization: "Bearer secret" });
  });

  it("werpt VerifierRequestError bij een niet-200-status", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ verified: true }, 502));
    await expect(verifyViaHttp({ ...baseCfg, fetchImpl }, {})).rejects.toBeInstanceOf(
      VerifierRequestError,
    );
  });

  it("werpt VerifierRequestError als het antwoord niet aan het contract voldoet", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: "ja" }));
    await expect(verifyViaHttp({ ...baseCfg, fetchImpl }, {})).rejects.toBeInstanceOf(
      VerifierRequestError,
    );
  });
});

describe("verifyViaHttp — retry + backoff bij transiënte fouten", () => {
  it("herhaalt een transiënte 5xx en slaagt zodra het endpoint herstelt", async () => {
    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call += 1;
      return call < 3 ? jsonResponse({ verified: true }, 503) : jsonResponse({ verified: true });
    });
    const sleep = vi.fn(async () => {});
    const res = await verifyViaHttp(
      { ...baseCfg, fetchImpl: fetchImpl as unknown as typeof fetch, retries: 2, sleepImpl: sleep },
      {},
    );
    expect(res.verified).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenNthCalledWith(1, VERIFY_RETRY_BASE_DELAY_MS);
    expect(sleep).toHaveBeenNthCalledWith(2, VERIFY_RETRY_BASE_DELAY_MS * 2);
  });

  it("herhaalt tot de retry-limiet en werpt dan VerifierRequestError", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ verified: true }, 500));
    await expect(
      verifyViaHttp({ ...baseCfg, fetchImpl, retries: 2, sleepImpl: noSleep }, {}),
    ).rejects.toBeInstanceOf(VerifierRequestError);
    // 1 initiële poging + 2 retries = 3 aanroepen.
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("herhaalt een 429 (rate-limit)", async () => {
    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call += 1;
      return call < 2 ? jsonResponse({ verified: true }, 429) : jsonResponse({ verified: true });
    });
    const res = await verifyViaHttp(
      {
        ...baseCfg,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        retries: 3,
        sleepImpl: noSleep,
      },
      {},
    );
    expect(res.verified).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("herhaalt een netwerkfout (fetch reject) en slaagt daarna", async () => {
    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call += 1;
      if (call === 1) throw new TypeError("network down");
      return jsonResponse({ verified: false });
    });
    const res = await verifyViaHttp(
      {
        ...baseCfg,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        retries: 1,
        sleepImpl: noSleep,
      },
      {},
    );
    expect(res.verified).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("herhaalt NIET bij een 4xx (verkeerde auth/verzoek)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ verified: true }, 401));
    await expect(
      verifyViaHttp({ ...baseCfg, fetchImpl, retries: 3, sleepImpl: noSleep }, {}),
    ).rejects.toBeInstanceOf(VerifierRequestError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("herhaalt NIET bij een contract-mismatch (permanente fout)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: "ja" }));
    await expect(
      verifyViaHttp({ ...baseCfg, fetchImpl, retries: 3, sleepImpl: noSleep }, {}),
    ).rejects.toBeInstanceOf(VerifierRequestError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("resolveVerifyRetries klemt en valt veilig terug", () => {
    expect(resolveVerifyRetries(undefined)).toBe(DEFAULT_VERIFY_RETRIES);
    expect(resolveVerifyRetries("0")).toBe(0);
    expect(resolveVerifyRetries("3")).toBe(3);
    expect(resolveVerifyRetries("999")).toBe(MAX_VERIFY_RETRIES);
    expect(resolveVerifyRetries("-4")).toBe(0);
    expect(resolveVerifyRetries("abc")).toBe(DEFAULT_VERIFY_RETRIES);
  });

  it("verifyRetryDelayMs groeit exponentieel en is begrensd", () => {
    expect(verifyRetryDelayMs(0)).toBe(VERIFY_RETRY_BASE_DELAY_MS);
    expect(verifyRetryDelayMs(1)).toBe(VERIFY_RETRY_BASE_DELAY_MS * 2);
    expect(verifyRetryDelayMs(2)).toBe(VERIFY_RETRY_BASE_DELAY_MS * 4);
    expect(verifyRetryDelayMs(20)).toBe(VERIFY_RETRY_MAX_DELAY_MS);
  });
});

describe("echte verifiers (met geconfigureerde env + geïnjecteerde fetch)", () => {
  afterEach(() => {
    delete process.env.DUO_API_BASE;
    delete process.env.DUO_API_KEY;
    delete process.env.BIG_API_BASE;
    delete process.env.BIG_API_KEY;
  });

  it("DuoDiplomaVerifier mapt een positief antwoord naar source DUO", async () => {
    process.env.DUO_API_BASE = "https://duo.test";
    process.env.DUO_API_KEY = "k";
    const fetchImpl = vi.fn(async () => jsonResponse({ verified: true }));
    const v = new DuoDiplomaVerifier(fetchImpl);
    const r = await v.verify({ verificationCode: "DUO-AAAA-BBBB", holderName: "Sanne" });
    expect(r.verified).toBe(true);
    expect(r.source).toBe("DUO");
  });

  it("BigRegisterVerifier mapt een negatief antwoord met eigen bericht", async () => {
    process.env.BIG_API_BASE = "https://big.test";
    process.env.BIG_API_KEY = "k";
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ verified: false, message: "Niet gevonden" }),
    );
    const v = new BigRegisterVerifier(fetchImpl);
    const r = await v.verify({ bigNumber: "12345678901", holderName: "Fatima" });
    expect(r.verified).toBe(false);
    expect(r.source).toBe("BIG");
    expect(r.message).toBe("Niet gevonden");
  });

  it("zonder env faalt de echte verifier helder (niet geconfigureerd)", async () => {
    const v = new DuoDiplomaVerifier();
    await expect(
      v.verify({ verificationCode: "DUO-AAAA-BBBB", holderName: "Sanne" }),
    ).rejects.toBeInstanceOf(VerifierNotConfiguredError);
  });
});
