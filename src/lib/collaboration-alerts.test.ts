import { describe, expect, it } from "vitest";
import { assessCollaborationCredentials, describeCredentialAlert } from "./collaboration-alerts";
import { type FreelancerCredential } from "./matching";

const now = new Date("2026-05-26T00:00:00Z");
const inDays = (d: number) => new Date(now.getTime() + d * 86_400_000);

describe("assessCollaborationCredentials", () => {
  it("is COMPLIANT als alle vereiste certificaten geldig en niet bijna verlopen zijn", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: inDays(200) },
      { type: "DIPLOMA", status: "VERIFIED", expiresAt: null },
    ];
    const r = assessCollaborationCredentials(["VOG", "DIPLOMA"], creds, now);
    expect(r.status).toBe("COMPLIANT");
  });

  it("is NON_COMPLIANT bij een ontbrekend vereist certificaat", () => {
    const r = assessCollaborationCredentials(["VOG"], [], now);
    expect(r.status).toBe("NON_COMPLIANT");
    expect(r.missing).toEqual(["VOG"]);
  });

  it("is NON_COMPLIANT bij een verlopen vereist certificaat", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: inDays(-1) },
    ];
    const r = assessCollaborationCredentials(["VOG"], creds, now);
    expect(r.status).toBe("NON_COMPLIANT");
    expect(r.expired).toEqual(["VOG"]);
  });

  it("waarschuwt (WARNING) als een geldig certificaat binnenkort verloopt", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: inDays(10) },
    ];
    const r = assessCollaborationCredentials(["VOG"], creds, now);
    expect(r.status).toBe("WARNING");
    expect(r.expiringSoon).toEqual(["VOG"]);
  });

  it("waarschuwt niet als een tweede, langlopend certificaat de dekking behoudt", () => {
    const creds: FreelancerCredential[] = [
      { type: "VOG", status: "VERIFIED", expiresAt: inDays(10) },
      { type: "VOG", status: "VERIFIED", expiresAt: inDays(400) },
    ];
    const r = assessCollaborationCredentials(["VOG"], creds, now);
    expect(r.status).toBe("COMPLIANT");
    expect(r.expiringSoon).toEqual([]);
  });

  it("is WARNING als een vereist certificaat nog in beoordeling is", () => {
    const creds: FreelancerCredential[] = [{ type: "VOG", status: "SUBMITTED", expiresAt: null }];
    const r = assessCollaborationCredentials(["VOG"], creds, now);
    expect(r.status).toBe("WARNING");
    expect(r.inReview).toEqual(["VOG"]);
  });
});

describe("describeCredentialAlert", () => {
  it("benoemt het type en de opdracht in begrijpelijk Nederlands", () => {
    const text = describeCredentialAlert("Jan", "Dakproject", {
      status: "WARNING",
      missing: [],
      expired: [],
      expiringSoon: ["VOG"],
      inReview: [],
    });
    expect(text).toBe("Certificaat van Jan verloopt binnenkort (VOG) — Dakproject");
  });
});
