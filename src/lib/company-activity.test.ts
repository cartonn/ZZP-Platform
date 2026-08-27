import { describe, expect, it } from "vitest";
import { summarizeCompanyActivity } from "@/lib/company-activity";

const MEMBER_SINCE = new Date("2026-05-01T00:00:00.000Z");

describe("summarizeCompanyActivity", () => {
  it("behoudt lid-sinds altijd", () => {
    const result = summarizeCompanyActivity({
      memberSince: MEMBER_SINCE,
      publishedJobs: 0,
      completedCollaborations: 0,
    });
    expect(result.memberSince).toEqual(MEMBER_SINCE);
  });

  it("verbergt tellingen bij nul (nieuwkomer lijkt niet onterecht zwak)", () => {
    const result = summarizeCompanyActivity({
      memberSince: MEMBER_SINCE,
      publishedJobs: 0,
      completedCollaborations: 0,
    });
    expect(result.publishedJobs).toBeNull();
    expect(result.completedCollaborations).toBeNull();
  });

  it("toont positieve tellingen ongewijzigd", () => {
    const result = summarizeCompanyActivity({
      memberSince: MEMBER_SINCE,
      publishedJobs: 12,
      completedCollaborations: 5,
    });
    expect(result.publishedJobs).toBe(12);
    expect(result.completedCollaborations).toBe(5);
  });

  it("verbergt een gedeeltelijke telling los van de andere", () => {
    const result = summarizeCompanyActivity({
      memberSince: MEMBER_SINCE,
      publishedJobs: 3,
      completedCollaborations: 0,
    });
    expect(result.publishedJobs).toBe(3);
    expect(result.completedCollaborations).toBeNull();
  });

  it("clampt defensief negatieve waarden naar null", () => {
    const result = summarizeCompanyActivity({
      memberSince: MEMBER_SINCE,
      publishedJobs: -1,
      completedCollaborations: -4,
    });
    expect(result.publishedJobs).toBeNull();
    expect(result.completedCollaborations).toBeNull();
  });
});
