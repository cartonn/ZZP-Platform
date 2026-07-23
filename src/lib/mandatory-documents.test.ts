import { describe, expect, it } from "vitest";
import {
  mandatoryDocuments,
  mandatoryDocumentAlertCount,
  MANDATORY_CREDENTIAL_TYPES,
  type MandatoryDocState,
} from "@/lib/mandatory-documents";
import { type FreelancerCredential } from "@/lib/matching";

const now = new Date("2026-05-25T12:00:00Z");
const future = new Date("2027-01-01T00:00:00Z");
const past = new Date("2026-01-01T00:00:00Z");

const stateOf = (items: { type: string; state: MandatoryDocState }[], type: string) =>
  items.find((i) => i.type === type)?.state;

describe("mandatoryDocuments", () => {
  it("alles aangeleverd: allSatisfied, geen open punten", () => {
    const creds: FreelancerCredential[] = MANDATORY_CREDENTIAL_TYPES.map((type) => ({
      type,
      status: "VERIFIED",
      expiresAt: future,
    }));
    const r = mandatoryDocuments(creds, now);
    expect(r.allSatisfied).toBe(true);
    expect(r.openCount).toBe(0);
    expect(r.items.every((i) => i.state === "satisfied")).toBe(true);
  });

  it("ontbrekend verplicht document → state 'missing'", () => {
    const r = mandatoryDocuments([{ type: "VOG", status: "VERIFIED", expiresAt: future }], now);
    expect(r.allSatisfied).toBe(false);
    expect(stateOf(r.items, "VOG")).toBe("satisfied");
    expect(stateOf(r.items, "INSURANCE")).toBe("missing");
    expect(r.openCount).toBe(1);
  });

  it("verlopen verplicht document → state 'expired'", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: future },
      { type: "INSURANCE", status: "VERIFIED", expiresAt: past },
    ];
    expect(stateOf(mandatoryDocuments(creds, now).items, "INSURANCE")).toBe("expired");
  });

  it("in beoordeling → state 'inReview'", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: future },
      { type: "INSURANCE", status: "SUBMITTED" },
    ];
    expect(stateOf(mandatoryDocuments(creds, now).items, "INSURANCE")).toBe("inReview");
  });

  it("toont altijd alle verplichte types", () => {
    const r = mandatoryDocuments([], now);
    expect(r.items.map((i) => i.type)).toEqual([...MANDATORY_CREDENTIAL_TYPES]);
    expect(r.openCount).toBe(MANDATORY_CREDENTIAL_TYPES.length);
  });
});

describe("mandatoryDocumentAlertCount", () => {
  it("verse ZZP'er zonder certificaten → elk verplicht type is een openstaande actie", () => {
    expect(mandatoryDocumentAlertCount([], now)).toBe(MANDATORY_CREDENTIAL_TYPES.length);
  });

  it("één verplicht type geldig geverifieerd → alleen het ontbrekende type telt", () => {
    const creds: FreelancerCredential[] = [{ type: "VOG", status: "VERIFIED", expiresAt: future }];
    expect(mandatoryDocumentAlertCount(creds, now)).toBe(1); // alleen INSURANCE ontbreekt
  });

  it("verlopen verplicht document telt mee als openstaande actie", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: future },
      { type: "INSURANCE", status: "VERIFIED", expiresAt: past },
    ];
    expect(mandatoryDocumentAlertCount(creds, now)).toBe(1); // INSURANCE verlopen
  });

  it("in beoordeling telt NIET (admin is aan zet, niet de ZZP'er)", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: future },
      { type: "INSURANCE", status: "SUBMITTED" },
    ];
    expect(mandatoryDocumentAlertCount(creds, now)).toBe(0);
  });

  it("een REJECTED verplicht type telt hier NIET (de credentialFixTask/rejected-telling dekt het al)", () => {
    // REJECTED valt in de 'missing'-emmer, maar krijgt de fix-taak → hier onderdrukt tegen dubbeltelling.
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: future },
      { type: "INSURANCE", status: "REJECTED" },
    ];
    expect(mandatoryDocumentAlertCount(creds, now)).toBe(0);
  });
});
