import { describe, expect, it } from "vitest";
import {
  signingInputSchema,
  signingParty,
  signingPath,
  type SigningDocument,
} from "./signing-contract";

const valid = {
  documentHash: "a".repeat(64),
  signerName: "  Noor de Vries  ",
  password: "synthetic-test-only",
  reviewed: "on",
  consent: "on",
  authority: "on",
};
describe("explicit signing consent", () => {
  it("normalizes the name and preserves the exact password", () => {
    expect(signingInputSchema.parse(valid)).toEqual({ ...valid, signerName: "Noor de Vries" });
  });
  it.each(["reviewed", "consent", "authority"])("requires an explicit %s confirmation", (field) => {
    for (const value of [undefined, null, "", "false", true]) {
      expect(signingInputSchema.safeParse({ ...valid, [field]: value }).success).toBe(false);
    }
  });
  it.each(["", "a", " ", "A\nB", "A\u0000B", "A".repeat(121)])(
    "rejects invalid signer name %j",
    (signerName) => {
      expect(signingInputSchema.safeParse({ ...valid, signerName }).success).toBe(false);
    },
  );
  it.each(["", "a".repeat(63), "G".repeat(64), "a".repeat(65)])(
    "rejects malformed document digest %j",
    (documentHash) => {
      expect(signingInputSchema.safeParse({ ...valid, documentHash }).success).toBe(false);
    },
  );
  it.each([undefined, null, "", "x".repeat(257)])("requires a bounded password", (password) => {
    expect(signingInputSchema.safeParse({ ...valid, password }).success).toBe(false);
  });
});

const parties = { freelancer: { userId: "f" }, client: { userId: "c" } } as SigningDocument;
it("only assigns the two distinct document parties", () => {
  expect(signingParty("f", parties)).toBe("FREELANCER");
  expect(signingParty("c", parties)).toBe("CLIENT");
  expect(signingParty("outsider", parties)).toBeNull();
  expect(
    signingParty("f", { ...parties, client: { userId: "f", name: "Same account" } }),
  ).toBeNull();
});
it("escapes a collaboration identifier in the signing route", () => {
  expect(signingPath("a/b?#")).toBe("/samenwerkingen/a%2Fb%3F%23/ondertekenen");
});
