import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock de heartbeat-opslag: de decorators registreren succes/mislukking via deze twee functies.
const recordSuccess = vi.fn(async () => {});
const recordFailure = vi.fn(async () => {});
vi.mock("@/lib/observability/verification-delivery-heartbeat", () => ({
  VERIFICATION_CHANNELS: [
    { key: "diploma", channel: "verification-diploma", label: "DUO — diploma's" },
    { key: "big", channel: "verification-big", label: "BIG-register" },
    { key: "identity", channel: "verification-identity", label: "iDIN — identiteit" },
  ],
  recordVerificationDeliverySuccess: recordSuccess,
  recordVerificationDeliveryFailure: recordFailure,
}));

import {
  RecordingDiplomaVerifier,
  RecordingBigVerifier,
  RecordingIdentityVerifier,
} from "./recording-verifier";
import type { DiplomaVerifier } from "./diploma-verifier";
import type { BigVerifier } from "./big-verifier";
import type { IdentityVerifier } from "./identity-verifier";

class FakeDiploma implements DiplomaVerifier {
  constructor(private readonly mode: "verified" | "rejected" | "throw") {}
  async verify() {
    if (this.mode === "throw") throw new Error("RegisterDown");
    return {
      verified: this.mode === "verified",
      source: "DUO" as const,
      message: "x",
    };
  }
}

class FakeBig implements BigVerifier {
  constructor(private readonly mode: "verified" | "throw") {}
  async verify() {
    if (this.mode === "throw") throw new Error("RegisterDown");
    return { verified: true, source: "BIG" as const, message: "x" };
  }
}

class FakeIdentity implements IdentityVerifier {
  constructor(private readonly mode: "verified" | "throw") {}
  async verify() {
    if (this.mode === "throw") throw new Error("RegisterDown");
    return { verified: true, verifiedName: "Jan", source: "IDIN" as const, message: "x" };
  }
}

describe("Recording*Verifier — aflever-heartbeat-registratie", () => {
  beforeEach(() => {
    recordSuccess.mockClear();
    recordFailure.mockClear();
  });

  it("registreert succes wanneer het register antwoordt met verified:true", async () => {
    const rec = new RecordingDiplomaVerifier(new FakeDiploma("verified"), "duo");
    const out = await rec.verify({ verificationCode: "DUO-AAAA-BBBB", holderName: "Jan" });
    expect(out.verified).toBe(true);
    expect(recordSuccess).toHaveBeenCalledWith("verification-diploma", "duo");
    expect(recordFailure).not.toHaveBeenCalled();
  });

  it("registreert OOK succes wanneer het register terecht afwijst (verified:false) — geslaagde aflevering", async () => {
    const rec = new RecordingDiplomaVerifier(new FakeDiploma("rejected"), "duo");
    const out = await rec.verify({ verificationCode: "DUO-AAAA-BBBB", holderName: "Jan" });
    expect(out.verified).toBe(false);
    expect(recordSuccess).toHaveBeenCalledWith("verification-diploma", "duo");
    expect(recordFailure).not.toHaveBeenCalled();
  });

  it("registreert mislukking en her-gooit de originele fout wanneer verify() werpt", async () => {
    const rec = new RecordingDiplomaVerifier(new FakeDiploma("throw"), "duo");
    await expect(
      rec.verify({ verificationCode: "DUO-AAAA-BBBB", holderName: "Jan" }),
    ).rejects.toThrow("RegisterDown");
    expect(recordFailure).toHaveBeenCalledWith("verification-diploma", "duo");
    expect(recordSuccess).not.toHaveBeenCalled();
  });

  it("gebruikt het juiste kanaal/driver voor BIG", async () => {
    await new RecordingBigVerifier(new FakeBig("verified"), "bigregister").verify({
      bigNumber: "12345678901",
      holderName: "Jan",
    });
    expect(recordSuccess).toHaveBeenCalledWith("verification-big", "bigregister");
  });

  it("gebruikt het juiste kanaal/driver voor iDIN en registreert mislukking bij een storing", async () => {
    await new RecordingIdentityVerifier(new FakeIdentity("verified"), "idin").verify({
      accountName: "Jan",
      providedName: "Jan",
    });
    expect(recordSuccess).toHaveBeenCalledWith("verification-identity", "idin");

    recordSuccess.mockClear();
    await expect(
      new RecordingIdentityVerifier(new FakeIdentity("throw"), "idin").verify({
        accountName: "Jan",
        providedName: "Jan",
      }),
    ).rejects.toThrow("RegisterDown");
    expect(recordFailure).toHaveBeenCalledWith("verification-identity", "idin");
  });
});
