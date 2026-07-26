import { describe, expect, it } from "vitest";
import { jobComplianceChip } from "./compliance-chip";
import type { ComplianceResult } from "@/lib/matching";

function compliance(over: Partial<ComplianceResult>): ComplianceResult {
  return { status: "COMPLIANT", satisfied: [], inReview: [], expired: [], missing: [], ...over };
}

describe("jobComplianceChip", () => {
  it("zwijgt op een opdracht zonder harde certificaateisen", () => {
    expect(
      jobComplianceChip(compliance({ status: "NON_COMPLIANT", missing: ["VOG"] }), 0),
    ).toBeNull();
  });

  it("zwijgt wanneer de ZZP'er aan alle eisen voldoet (COMPLIANT)", () => {
    expect(
      jobComplianceChip(compliance({ status: "COMPLIANT", satisfied: ["VOG"] }), 1),
    ).toBeNull();
  });

  it("waarschuwt bij een ontbrekend vereist certificaat", () => {
    const chip = jobComplianceChip(compliance({ status: "NON_COMPLIANT", missing: ["VOG"] }), 1);
    expect(chip).toEqual({ tone: "warning", label: "Mist een vereist certificaat" });
  });

  it("meldt 'verlopen' wanneer het enige gat een verlopen certificaat is", () => {
    const chip = jobComplianceChip(compliance({ status: "NON_COMPLIANT", expired: ["VOG"] }), 1);
    expect(chip).toEqual({ tone: "warning", label: "Vereist certificaat verlopen" });
  });

  it("prioriteert 'mist' boven 'verlopen' als beide oorzaken spelen", () => {
    const chip = jobComplianceChip(
      compliance({ status: "NON_COMPLIANT", missing: ["VOG"], expired: ["CERTIFICATE"] }),
      2,
    );
    expect(chip).toEqual({ tone: "warning", label: "Mist een vereist certificaat" });
  });

  it("toont een zachte 'in beoordeling'-chip bij WARNING (SUBMITTED)", () => {
    const chip = jobComplianceChip(compliance({ status: "WARNING", inReview: ["VOG"] }), 1);
    expect(chip).toEqual({ tone: "muted", label: "Certificaat in beoordeling" });
  });
});
