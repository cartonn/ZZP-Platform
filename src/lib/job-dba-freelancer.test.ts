import { describe, it, expect } from "vitest";
import {
  DBA_FREELANCER_ADVICE,
  buildFreelancerComplianceSignal,
  dbaFreelancerAdvice,
} from "@/lib/job-dba-freelancer";

describe("buildFreelancerComplianceSignal", () => {
  it("gives HOOG a level and the freelancer-oriented message", () => {
    const signal = buildFreelancerComplianceSignal({ dbaRisk: "HOOG", rateMinCents: null });
    expect(signal).not.toBeNull();
    expect(signal?.dbaLevel).toBe("HOOG");
    expect(signal?.dbaMessage).toBe(DBA_FREELANCER_ADVICE.HOOG);
  });

  it("gives MIDDEN a level and the freelancer-oriented message", () => {
    const signal = buildFreelancerComplianceSignal({ dbaRisk: "MIDDEN", rateMinCents: null });
    expect(signal?.dbaLevel).toBe("MIDDEN");
    expect(signal?.dbaMessage).toBe(DBA_FREELANCER_ADVICE.MIDDEN);
  });

  it("gives LAAG a level and the freelancer-oriented message", () => {
    const signal = buildFreelancerComplianceSignal({ dbaRisk: "LAAG", rateMinCents: 5000 });
    expect(signal?.dbaLevel).toBe("LAAG");
    expect(signal?.dbaMessage).toBe(DBA_FREELANCER_ADVICE.LAAG);
  });

  it("treats an invalid dbaRisk as no level and no message (but keeps a below-threshold rate)", () => {
    const signal = buildFreelancerComplianceSignal({ dbaRisk: "ONZIN", rateMinCents: 3500 });
    expect(signal?.dbaLevel).toBeNull();
    expect(signal?.dbaMessage).toBeNull();
    expect(signal?.rateBelowThreshold).toBe(true);
  });

  it("treats a null dbaRisk as no level and no message", () => {
    const signal = buildFreelancerComplianceSignal({ dbaRisk: null, rateMinCents: 3500 });
    expect(signal?.dbaLevel).toBeNull();
    expect(signal?.dbaMessage).toBeNull();
  });

  it("flags a rate below €38/uur as below the threshold", () => {
    const signal = buildFreelancerComplianceSignal({ dbaRisk: "MIDDEN", rateMinCents: 3500 });
    expect(signal?.rateBelowThreshold).toBe(true);
    expect(signal?.thresholdCents).toBe(3800);
  });

  it("does not flag a rate at or above the threshold", () => {
    const signal = buildFreelancerComplianceSignal({ dbaRisk: "MIDDEN", rateMinCents: 3800 });
    expect(signal?.rateBelowThreshold).toBe(false);
  });

  it("does not flag a null rate", () => {
    const signal = buildFreelancerComplianceSignal({ dbaRisk: "HOOG", rateMinCents: null });
    expect(signal?.rateBelowThreshold).toBe(false);
  });

  it("returns null when there is nothing to show (no level and rate at/above threshold)", () => {
    expect(buildFreelancerComplianceSignal({ dbaRisk: null, rateMinCents: 6000 })).toBeNull();
  });

  it("returns a populated object when only the rate is below threshold", () => {
    const signal = buildFreelancerComplianceSignal({ dbaRisk: null, rateMinCents: 3000 });
    expect(signal).not.toBeNull();
    expect(signal?.dbaLevel).toBeNull();
    expect(signal?.rateBelowThreshold).toBe(true);
  });
});

describe("dbaFreelancerAdvice", () => {
  it("returns the mapped string for each level", () => {
    expect(dbaFreelancerAdvice("HOOG")).toBe(DBA_FREELANCER_ADVICE.HOOG);
    expect(dbaFreelancerAdvice("MIDDEN")).toBe(DBA_FREELANCER_ADVICE.MIDDEN);
    expect(dbaFreelancerAdvice("LAAG")).toBe(DBA_FREELANCER_ADVICE.LAAG);
  });
});
