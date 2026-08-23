import { afterEach, describe, expect, it } from "vitest";
import { BigRegisterVerifier, getBigVerifier, MockBigVerifier } from "@/lib/services/big-verifier";
import { RecordingBigVerifier } from "@/lib/services/recording-verifier";

describe("MockBigVerifier", () => {
  const v = new MockBigVerifier();

  it("accepteert een geldig BIG-nummer (11 cijfers)", async () => {
    const r = await v.verify({ bigNumber: "12345678901", holderName: "Sanne" });
    expect(r.verified).toBe(true);
    expect(r.source).toBe("MOCK");
  });

  it("weigert een ongeldig BIG-nummer", async () => {
    expect((await v.verify({ bigNumber: "123", holderName: "x" })).verified).toBe(false);
    expect((await v.verify({ bigNumber: "abcdefghijk", holderName: "x" })).verified).toBe(false);
  });

  it("verzint geen registratiegegevens (alleen verified + message)", async () => {
    const r = await v.verify({ bigNumber: "12345678901", holderName: "x" });
    expect(Object.keys(r).sort()).toEqual(["message", "source", "verified"]);
  });
});

describe("BigRegisterVerifier", () => {
  it("faalt helder zonder configuratie", async () => {
    await expect(
      new BigRegisterVerifier().verify({ bigNumber: "12345678901", holderName: "Fatima" }),
    ).rejects.toThrow(/niet geconfigureerd/);
  });
});

describe("getBigVerifier", () => {
  const original = process.env.BIG_VERIFIER;
  afterEach(() => {
    process.env.BIG_VERIFIER = original;
  });

  it("kiest mock standaard en bigregister bij env", () => {
    delete process.env.BIG_VERIFIER;
    expect(getBigVerifier()).toBeInstanceOf(MockBigVerifier);
    process.env.BIG_VERIFIER = "bigregister";
    // De echte koppeling wordt in de aflever-heartbeat-decorator gewrapt (dead-man's-switch).
    expect(getBigVerifier()).toBeInstanceOf(RecordingBigVerifier);
  });
});
