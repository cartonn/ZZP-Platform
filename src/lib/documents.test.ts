import { describe, expect, it } from "vitest";
import { canAccessDocument, documentKindForCredential } from "@/lib/documents";
import { type Actor } from "@/lib/authz";

const owner: Actor = { id: "u1", role: "FREELANCER", status: "ACTIVE" };
const other: Actor = { id: "u2", role: "FREELANCER", status: "ACTIVE" };
const admin: Actor = { id: "u3", role: "ADMIN", status: "ACTIVE" };

describe("canAccessDocument", () => {
  it("staat eigenaar en admin toe", () => {
    expect(canAccessDocument(owner, "u1")).toBe(true);
    expect(canAccessDocument(admin, "u1")).toBe(true);
  });

  it("weigert anderen en anonieme bezoekers", () => {
    expect(canAccessDocument(other, "u1")).toBe(false);
    expect(canAccessDocument(null, "u1")).toBe(false);
    expect(canAccessDocument(undefined, "u1")).toBe(false);
  });
});

describe("documentKindForCredential", () => {
  it("mapt VOG en INSURANCE naar hun eigen kind, rest naar CREDENTIAL", () => {
    expect(documentKindForCredential("VOG")).toBe("VOG");
    expect(documentKindForCredential("INSURANCE")).toBe("INSURANCE");
    expect(documentKindForCredential("DIPLOMA")).toBe("CREDENTIAL");
    expect(documentKindForCredential("LICENSE")).toBe("CREDENTIAL");
    expect(documentKindForCredential("OTHER")).toBe("CREDENTIAL");
  });
});
