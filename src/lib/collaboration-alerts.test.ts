import { describe, expect, it } from "vitest";
import {
  assessCollaborationCredentials,
  describeCredentialAlert,
  summarizeClientCompliance,
  type ClientCredentialAlert,
} from "./collaboration-alerts";
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

describe("summarizeClientCompliance", () => {
  const makeAlert = (
    overrides: Partial<ClientCredentialAlert> & { alert: ClientCredentialAlert["alert"] },
  ): ClientCredentialAlert => ({
    collaborationId: "collab-1",
    jobId: "job-1",
    jobTitle: "Testproject",
    freelancerName: "Jan",
    ...overrides,
  });

  it("geeft alle nullen terug bij een lege invoer", () => {
    const snap = summarizeClientCompliance([]);
    expect(snap).toEqual({
      total: 0,
      nonCompliant: 0,
      warning: 0,
      missing: 0,
      expired: 0,
      expiringSoon: 0,
      inReview: 0,
    });
  });

  it("splitst NON_COMPLIANT en WARNING correct over meerdere samenwerkingen", () => {
    const alerts: ClientCredentialAlert[] = [
      makeAlert({
        collaborationId: "c1",
        alert: {
          status: "NON_COMPLIANT",
          missing: ["VOG"],
          expired: [],
          expiringSoon: [],
          inReview: [],
        },
      }),
      makeAlert({
        collaborationId: "c2",
        alert: {
          status: "WARNING",
          missing: [],
          expired: [],
          expiringSoon: ["INSURANCE"],
          inReview: [],
        },
      }),
      makeAlert({
        collaborationId: "c3",
        alert: {
          status: "NON_COMPLIANT",
          missing: [],
          expired: ["DIPLOMA"],
          expiringSoon: [],
          inReview: [],
        },
      }),
    ];
    const snap = summarizeClientCompliance(alerts);
    expect(snap.total).toBe(3);
    expect(snap.nonCompliant).toBe(2);
    expect(snap.warning).toBe(1);
  });

  it("telt type-aantallen op over meerdere samenwerkingen", () => {
    const alerts: ClientCredentialAlert[] = [
      makeAlert({
        collaborationId: "c1",
        alert: {
          status: "NON_COMPLIANT",
          missing: ["VOG"],
          expired: [],
          expiringSoon: [],
          inReview: [],
        },
      }),
      makeAlert({
        collaborationId: "c2",
        alert: {
          status: "NON_COMPLIANT",
          missing: ["INSURANCE"],
          expired: ["DIPLOMA"],
          expiringSoon: [],
          inReview: [],
        },
      }),
    ];
    const snap = summarizeClientCompliance(alerts);
    expect(snap.missing).toBe(2);
    expect(snap.expired).toBe(1);
    expect(snap.expiringSoon).toBe(0);
    expect(snap.inReview).toBe(0);
  });

  it("muteert de invoer niet (bevroren array)", () => {
    const alerts: ClientCredentialAlert[] = [
      makeAlert({
        alert: { status: "WARNING", missing: [], expired: [], expiringSoon: [], inReview: ["VOG"] },
      }),
    ];
    const frozen = Object.freeze(alerts);
    // Mag geen uitzondering gooien; retourwaarde is correct.
    const snap = summarizeClientCompliance(frozen);
    expect(snap.total).toBe(1);
    expect(snap.inReview).toBe(1);
  });
});
