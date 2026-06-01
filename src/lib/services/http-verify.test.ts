import { describe, expect, it, vi, afterEach } from "vitest";
import {
  verifyViaHttp,
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

const baseCfg = {
  name: "TEST",
  baseUrl: "https://api.example.test",
  apiKey: "secret",
  path: "/verify",
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
