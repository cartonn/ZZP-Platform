import { afterEach, describe, expect, it } from "vitest";
import {
  DuoDiplomaVerifier,
  getDiplomaVerifier,
  MockDiplomaVerifier,
} from "@/lib/services/diploma-verifier";
import { RecordingDiplomaVerifier } from "@/lib/services/recording-verifier";

describe("MockDiplomaVerifier", () => {
  const v = new MockDiplomaVerifier();

  it("accepteert een geldig codeformaat", async () => {
    const r = await v.verify({ verificationCode: "DUO-AB12-CD34", holderName: "Sanne" });
    expect(r.verified).toBe(true);
    expect(r.source).toBe("MOCK");
  });

  it("weigert een ongeldig codeformaat", async () => {
    expect((await v.verify({ verificationCode: "12345", holderName: "Sanne" })).verified).toBe(
      false,
    );
    expect((await v.verify({ verificationCode: "", holderName: "Sanne" })).verified).toBe(false);
  });

  it("verzint geen diplomagegevens (alleen verified + message)", async () => {
    const r = await v.verify({ verificationCode: "duo-ab12-cd34", holderName: "x" });
    expect(Object.keys(r).sort()).toEqual(["message", "source", "verified"]);
  });
});

describe("DuoDiplomaVerifier", () => {
  it("faalt helder zonder configuratie", async () => {
    await expect(
      new DuoDiplomaVerifier().verify({ verificationCode: "DUO-AAAA-BBBB", holderName: "Sanne" }),
    ).rejects.toThrow(/niet geconfigureerd/);
  });
});

describe("getDiplomaVerifier", () => {
  const original = process.env.DIPLOMA_VERIFIER;
  afterEach(() => {
    process.env.DIPLOMA_VERIFIER = original;
  });

  it("kiest mock standaard en de echte DUO-verifier (met aflever-heartbeat-decorator) bij env", () => {
    delete process.env.DIPLOMA_VERIFIER;
    expect(getDiplomaVerifier()).toBeInstanceOf(MockDiplomaVerifier);
    process.env.DIPLOMA_VERIFIER = "duo";
    // De echte koppeling wordt in de aflever-heartbeat-decorator gewrapt (dead-man's-switch).
    expect(getDiplomaVerifier()).toBeInstanceOf(RecordingDiplomaVerifier);
  });
});
