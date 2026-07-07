import { describe, it, expect } from "vitest";
import { type FreelancerCredential } from "@/lib/matching";
import {
  outstandingMandatoryTypes,
  franchiseCredentialReminderMessage,
  credentialReminderLink,
} from "@/lib/franchise/credential-reminder";

const now = new Date("2026-07-07T09:00:00Z");
const cred = (
  type: FreelancerCredential["type"],
  status: FreelancerCredential["status"],
  expiresAt: Date | null = null,
): FreelancerCredential => ({ type, status, expiresAt });

describe("outstandingMandatoryTypes", () => {
  it("geeft alle verplichte types terug als er geen bewijsstukken zijn (beide ontbreken)", () => {
    expect(outstandingMandatoryTypes([], now)).toEqual(["VOG", "INSURANCE"]);
  });

  it("laat een geldig geverifieerd verplicht document weg", () => {
    const out = outstandingMandatoryTypes([cred("VOG", "VERIFIED")], now);
    expect(out).toContain("INSURANCE");
    expect(out).not.toContain("VOG");
  });

  it("markeert een verlopen verplicht document als openstaand", () => {
    const out = outstandingMandatoryTypes(
      [cred("VOG", "VERIFIED"), cred("INSURANCE", "VERIFIED", new Date("2026-01-01T00:00:00Z"))],
      now,
    );
    expect(out).toEqual(["INSURANCE"]);
  });

  it("telt een document in beoordeling NIET als openstaand (ligt bij de admin)", () => {
    const out = outstandingMandatoryTypes(
      [cred("VOG", "SUBMITTED"), cred("INSURANCE", "VERIFIED")],
      now,
    );
    expect(out).not.toContain("VOG");
    expect(out).not.toContain("INSURANCE");
  });

  it("geeft niets terug als alle verplichte documenten in orde zijn", () => {
    expect(
      outstandingMandatoryTypes([cred("VOG", "VERIFIED"), cred("INSURANCE", "VERIFIED")], now),
    ).toEqual([]);
  });
});

describe("franchiseCredentialReminderMessage", () => {
  it("noemt de bemiddeling als afzender en het documentlabel", () => {
    const { title, body } = franchiseCredentialReminderMessage("Zorgbemiddeling BV", "VOG");
    expect(title).toBeTruthy();
    expect(body).toContain("Zorgbemiddeling BV");
    expect(body).toMatch(/inzetbaar/i);
  });
});

describe("credentialReminderLink (hergebruik)", () => {
  it("deep-linkt naar het uploadformulier met het type voorgeselecteerd", () => {
    expect(credentialReminderLink("VOG")).toBe("/certificaten/nieuw?type=VOG");
  });
});
