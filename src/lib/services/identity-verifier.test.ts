import { afterEach, describe, expect, it } from "vitest";
import {
  getIdentityVerifier,
  IdinIdentityVerifier,
  MockIdentityVerifier,
} from "@/lib/services/identity-verifier";

describe("MockIdentityVerifier", () => {
  const v = new MockIdentityVerifier();

  it("verifieert als de naam overeenkomt (case-/spatie-ongevoelig)", async () => {
    const r = await v.verify({
      accountName: "Sanne de Vries",
      providedName: "  sanne   DE vries ",
    });
    expect(r.verified).toBe(true);
    expect(r.verifiedName).toBe("Sanne de Vries");
  });

  it("weigert bij afwijkende naam of lege invoer", async () => {
    expect(
      (await v.verify({ accountName: "Sanne de Vries", providedName: "Jan Jansen" })).verified,
    ).toBe(false);
    expect((await v.verify({ accountName: "Sanne", providedName: "" })).verified).toBe(false);
  });
});

describe("IdinIdentityVerifier", () => {
  it("faalt helder zonder configuratie", async () => {
    await expect(new IdinIdentityVerifier().verify()).rejects.toThrow(/niet geconfigureerd/);
  });
});

describe("getIdentityVerifier", () => {
  const original = process.env.IDENTITY_VERIFIER;
  afterEach(() => {
    process.env.IDENTITY_VERIFIER = original;
  });

  it("kiest mock standaard en idin bij env", () => {
    delete process.env.IDENTITY_VERIFIER;
    expect(getIdentityVerifier()).toBeInstanceOf(MockIdentityVerifier);
    process.env.IDENTITY_VERIFIER = "idin";
    expect(getIdentityVerifier()).toBeInstanceOf(IdinIdentityVerifier);
  });
});
