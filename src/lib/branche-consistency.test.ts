import { describe, it, expect } from "vitest";
import {
  findBrancheMismatches,
  isBrancheConsistent,
  type JobBranche,
  type CompanyIndustryMap,
} from "./branche-consistency";

const companies: CompanyIndustryMap = {
  jansen: "zorg",
  zorggroep: "zorg",
  bouwpartners: "bouw",
  logiflow: "logistiek",
  datic: "ict",
};

describe("findBrancheMismatches", () => {
  it("meldt geen mismatch als elke vacature bij de branche van haar bedrijf past", () => {
    const jobs: JobBranche[] = [
      { id: "job-1", industry: "zorg", companyKey: "jansen" },
      { id: "job-2", industry: "ict", companyKey: "datic" },
      { id: "job-5", industry: "bouw", companyKey: "bouwpartners" },
    ];
    expect(findBrancheMismatches(jobs, companies)).toEqual([]);
    expect(isBrancheConsistent(jobs, companies)).toBe(true);
  });

  it("detecteert een zorg-vacature onder een IT-bedrijf", () => {
    const jobs: JobBranche[] = [{ id: "job-x", industry: "zorg", companyKey: "datic" }];
    const mismatches = findBrancheMismatches(jobs, companies);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toMatchObject({
      jobId: "job-x",
      jobIndustry: "zorg",
      companyKey: "datic",
      companyIndustry: "ict",
    });
    expect(isBrancheConsistent(jobs, companies)).toBe(false);
  });

  it("detecteert een onbekend bedrijf (undefined branche)", () => {
    const jobs: JobBranche[] = [{ id: "job-y", industry: "ict", companyKey: "onbekend" }];
    const mismatches = findBrancheMismatches(jobs, companies);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]!.companyIndustry).toBeUndefined();
  });
});
