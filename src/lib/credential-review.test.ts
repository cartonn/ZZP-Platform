import { describe, expect, it } from "vitest";
import { parseCredentialReview, credentialReviewMethods } from "./credential-review";

const now = new Date("2026-09-12T12:00:00.000Z");
const credential = {
  type: "VOG",
  updatedAt: now,
  documentId: "doc-1",
  document: { mimeType: "application/pdf", ownerId: "owner" },
  freelancerProfile: { userId: "owner" },
  issuedAt: null,
  expiresAt: null,
};
function form() {
  const fd = new FormData();
  for (const [key, value] of Object.entries({
    updatedAt: now.toISOString(),
    documentId: "doc-1",
    reviewMethod: "DIGITAL_VOG",
    original: "on",
    person: "on",
    authenticity: "on",
    scope: "on",
  }))
    fd.set(key, value);
  return fd;
}
describe("credential review evidence", () => {
  it("records the manual method and bounded confirmations with the server time", () => {
    expect(parseCredentialReview(form(), credential, now).evidence).toEqual({
      version: 1,
      method: "DIGITAL_VOG",
      confirmations: ["original", "person", "authenticity", "scope"],
      note: null,
      documentId: "doc-1",
      credentialUpdatedAt: now.toISOString(),
      checkedAt: now.toISOString(),
    });
  });
  it.each(["original", "person", "authenticity", "scope"])(
    "refuses a missing %s confirmation",
    (key) => {
      const fd = form();
      fd.delete(key);
      expect(() => parseCredentialReview(fd, credential, now)).toThrow(/vier controles/);
    },
  );
  it("refuses a legacy invocation without form data safely", () =>
    expect(() => parseCredentialReview(undefined as unknown as FormData, credential, now)).toThrow(
      "Open de aanvraag opnieuw voordat je beslist.",
    ));
  it("refuses an empty POST", () =>
    expect(() => parseCredentialReview(new FormData(), credential, now)).toThrow(/opnieuw/));
  it.each([{ updatedAt: new Date(now.getTime() + 1) }, { documentId: "replacement" }])(
    "refuses a changed submission %j",
    (change) =>
      expect(() => parseCredentialReview(form(), { ...credential, ...change }, now)).toThrow(
        /gewijzigd/,
      ),
  );
  it("refuses a missing document", () =>
    expect(() => parseCredentialReview(form(), { ...credential, document: null }, now)).toThrow(
      /bewijsstuk ontbreekt/,
    ));
  it("refuses another person's document", () =>
    expect(() =>
      parseCredentialReview(
        form(),
        { ...credential, document: { ...credential.document, ownerId: "other" } },
        now,
      ),
    ).toThrow(/bewijsstuk ontbreekt/));
  it("refuses a future issue date", () =>
    expect(() =>
      parseCredentialReview(form(), { ...credential, issuedAt: new Date(now.getTime() + 1) }, now),
    ).toThrow(/toekomst/));
  it("refuses expiry at the exact decision boundary with policy wording for VOG", () =>
    expect(() => parseCredentialReview(form(), { ...credential, expiresAt: now }, now)).toThrow(
      /herbeoordelingsdatum/,
    ));
  it("refuses an expired diploma", () => {
    const fd = form();
    fd.set("reviewMethod", "DUO_EXTRACT");
    expect(() =>
      parseCredentialReview(fd, { ...credential, type: "DIPLOMA", expiresAt: now }, now),
    ).toThrow(/verlopen/);
  });
  it("never treats a VOG as an issuer or DUO check", () => {
    const fd = form();
    fd.set("reviewMethod", "ISSUER");
    expect(() => parseCredentialReview(fd, credential, now)).toThrow(/passende/);
  });
  it("requires original PDF for digital checks", () =>
    expect(() =>
      parseCredentialReview(
        form(),
        { ...credential, document: { ...credential.document, mimeType: "image/png" } },
        now,
      ),
    ).toThrow(/originele PDF/));
  it("allows physical VOG review with an uploaded image only through the explicit paper method", () => {
    const fd = form();
    fd.set("reviewMethod", "ORIGINAL_PAPER");
    expect(
      parseCredentialReview(
        fd,
        { ...credential, document: { ...credential.document, mimeType: "image/png" } },
        now,
      ).method,
    ).toBe("ORIGINAL_PAPER");
  });
  it.each(["123456789", "123 456 789", "x".repeat(301)])("bounds private notes", (note) => {
    const fd = form();
    fd.set("reviewNote", note);
    expect(() => parseCredentialReview(fd, credential, now)).toThrow();
  });
  it("offers issuer verification for certificates outside DUO and other evidence", () => {
    expect(credentialReviewMethods("CERTIFICATE")).toContain("ISSUER");
    expect(credentialReviewMethods("INSURANCE")).toEqual(["ISSUER"]);
  });
});
