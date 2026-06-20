import { describe, expect, it } from "vitest";
import {
  computeCredentialDemand,
  type FreelancerCredentialRow,
  type JobRequirementRow,
} from "./credential-demand";

const NOW = new Date("2026-06-18T12:00:00.000Z");

function req(
  jobId: string,
  credentialType: JobRequirementRow["credentialType"],
): JobRequirementRow {
  return { jobId, credentialType };
}

function cred(
  type: FreelancerCredentialRow["type"],
  status: FreelancerCredentialRow["status"],
  expiresAt: Date | null = null,
): FreelancerCredentialRow {
  return { type, status, expiresAt };
}

describe("computeCredentialDemand", () => {
  it("returns empty result for empty requirements", () => {
    expect(computeCredentialDemand([], [], NOW)).toEqual({ gaps: [], blockedOpportunities: 0 });
    expect(computeCredentialDemand([], [cred("VOG", "VERIFIED")], NOW)).toEqual({
      gaps: [],
      blockedOpportunities: 0,
    });
  });

  it("excludes a satisfied (verified, not expired) type", () => {
    const result = computeCredentialDemand([req("j1", "VOG")], [cred("VOG", "VERIFIED")], NOW);
    expect(result.gaps).toEqual([]);
    expect(result.blockedOpportunities).toBe(0);
  });

  it("keeps a satisfied type with a future expiry out of the gaps", () => {
    const future = new Date(NOW.getTime() + 86_400_000);
    const result = computeCredentialDemand(
      [req("j1", "DIPLOMA")],
      [cred("DIPLOMA", "VERIFIED", future)],
      NOW,
    );
    expect(result.gaps).toEqual([]);
  });

  it("treats an expired VERIFIED credential as missing", () => {
    const past = new Date(NOW.getTime() - 86_400_000);
    const result = computeCredentialDemand(
      [req("j1", "VOG")],
      [cred("VOG", "VERIFIED", past)],
      NOW,
    );
    expect(result.gaps).toEqual([{ type: "VOG", opportunityCount: 1, state: "missing" }]);
    expect(result.blockedOpportunities).toBe(1);
  });

  it("treats expiresAt exactly equal to now as expired (strict >)", () => {
    const result = computeCredentialDemand(
      [req("j1", "VOG")],
      [cred("VOG", "VERIFIED", new Date(NOW.getTime()))],
      NOW,
    );
    expect(result.gaps).toEqual([{ type: "VOG", opportunityCount: 1, state: "missing" }]);
  });

  it("marks a type with a DRAFT credential as pending", () => {
    const result = computeCredentialDemand(
      [req("j1", "CERTIFICATE")],
      [cred("CERTIFICATE", "DRAFT")],
      NOW,
    );
    expect(result.gaps).toEqual([{ type: "CERTIFICATE", opportunityCount: 1, state: "pending" }]);
  });

  it("marks a type with a SUBMITTED credential as pending", () => {
    const result = computeCredentialDemand(
      [req("j1", "LICENSE")],
      [cred("LICENSE", "SUBMITTED")],
      NOW,
    );
    expect(result.gaps[0]?.state).toBe("pending");
  });

  it("treats a REJECTED-only type as missing", () => {
    const result = computeCredentialDemand([req("j1", "VOG")], [cred("VOG", "REJECTED")], NOW);
    expect(result.gaps).toEqual([{ type: "VOG", opportunityCount: 1, state: "missing" }]);
  });

  it("treats an EXPIRED-only type as missing", () => {
    const result = computeCredentialDemand([req("j1", "VOG")], [cred("VOG", "EXPIRED")], NOW);
    expect(result.gaps[0]?.state).toBe("missing");
  });

  it("counts DISTINCT jobs requiring the same type", () => {
    const result = computeCredentialDemand([req("j1", "VOG"), req("j2", "VOG")], [], NOW);
    expect(result.gaps).toEqual([{ type: "VOG", opportunityCount: 2, state: "missing" }]);
    expect(result.blockedOpportunities).toBe(2);
  });

  it("dedupes (jobId, credentialType) rows defensively", () => {
    const result = computeCredentialDemand([req("j1", "VOG"), req("j1", "VOG")], [], NOW);
    expect(result.gaps[0]?.opportunityCount).toBe(1);
    expect(result.blockedOpportunities).toBe(1);
  });

  it("counts a job requiring two unsatisfied types once in blockedOpportunities", () => {
    const result = computeCredentialDemand([req("j1", "VOG"), req("j1", "DIPLOMA")], [], NOW);
    expect(result.blockedOpportunities).toBe(1);
    expect(result.gaps.map((g) => g.type).sort()).toEqual(["DIPLOMA", "VOG"]);
  });

  it("sorts by opportunityCount desc, then type asc", () => {
    const result = computeCredentialDemand(
      [
        // VOG: 1 job, DIPLOMA: 2 jobs, CERTIFICATE: 2 jobs
        req("j1", "VOG"),
        req("j1", "DIPLOMA"),
        req("j2", "DIPLOMA"),
        req("j1", "CERTIFICATE"),
        req("j2", "CERTIFICATE"),
      ],
      [],
      NOW,
    );
    expect(result.gaps.map((g) => [g.type, g.opportunityCount])).toEqual([
      // count 2 first; CERTIFICATE < DIPLOMA alphabetically; then VOG with count 1
      ["CERTIFICATE", 2],
      ["DIPLOMA", 2],
      ["VOG", 1],
    ]);
  });

  it("excludes satisfied types from blockedOpportunities even when sharing a job", () => {
    const result = computeCredentialDemand(
      [req("j1", "VOG"), req("j1", "DIPLOMA")],
      [cred("VOG", "VERIFIED")],
      NOW,
    );
    // VOG satisfied, DIPLOMA missing → job j1 still blocked by DIPLOMA
    expect(result.gaps).toEqual([{ type: "DIPLOMA", opportunityCount: 1, state: "missing" }]);
    expect(result.blockedOpportunities).toBe(1);
  });

  it("does not block a job whose every required type is satisfied", () => {
    const result = computeCredentialDemand(
      [req("j1", "VOG"), req("j1", "DIPLOMA")],
      [cred("VOG", "VERIFIED"), cred("DIPLOMA", "VERIFIED")],
      NOW,
    );
    expect(result.gaps).toEqual([]);
    expect(result.blockedOpportunities).toBe(0);
  });

  it("prefers satisfied over pending when both exist for a type", () => {
    const result = computeCredentialDemand(
      [req("j1", "VOG")],
      [cred("VOG", "DRAFT"), cred("VOG", "VERIFIED")],
      NOW,
    );
    expect(result.gaps).toEqual([]);
  });
});
