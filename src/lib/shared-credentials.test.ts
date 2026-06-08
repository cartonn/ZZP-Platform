import { describe, expect, it } from "vitest";
import { isCredentialShareableNow } from "@/lib/shared-credentials";

const now = new Date("2026-06-08T12:00:00Z");
const future = new Date("2027-01-01T00:00:00Z");
const past = new Date("2026-01-01T00:00:00Z");

describe("isCredentialShareableNow", () => {
  it("toont een gedeeld, geverifieerd en niet-verlopen certificaat", () => {
    expect(
      isCredentialShareableNow(
        { status: "VERIFIED", sharedWithClient: true, expiresAt: future },
        now,
      ),
    ).toBe(true);
  });

  it("toont een gedeeld geverifieerd certificaat zonder vervaldatum", () => {
    expect(
      isCredentialShareableNow(
        { status: "VERIFIED", sharedWithClient: true, expiresAt: null },
        now,
      ),
    ).toBe(true);
  });

  it("verbergt een niet-gedeeld certificaat", () => {
    expect(
      isCredentialShareableNow(
        { status: "VERIFIED", sharedWithClient: false, expiresAt: future },
        now,
      ),
    ).toBe(false);
  });

  it("verbergt een nog niet geverifieerd certificaat, ook als het gedeeld is", () => {
    expect(
      isCredentialShareableNow(
        { status: "SUBMITTED", sharedWithClient: true, expiresAt: future },
        now,
      ),
    ).toBe(false);
  });

  it("verbergt een verlopen certificaat", () => {
    expect(
      isCredentialShareableNow(
        { status: "VERIFIED", sharedWithClient: true, expiresAt: past },
        now,
      ),
    ).toBe(false);
  });
});
