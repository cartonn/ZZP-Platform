import { describe, expect, it } from "vitest";
import { buildDienstApplicant, type DienstApplicationSource } from "@/lib/franchise/dienst-detail";
import { type JobMatchSource } from "@/lib/matching";
import { type CredentialType } from "@/lib/enums";

const NOW = new Date("2026-07-09T12:00:00Z");

const job: JobMatchSource & { rateMin: number | null; rateMax: number | null } = {
  title: "Wijkverpleegkundige",
  description: "Zorg aan huis in de wijk.",
  skills: [
    { skillId: "skill-verpleging", required: true },
    { skillId: "skill-wijkzorg", required: false },
  ],
  credentialRequirements: [{ credentialType: "VOG", required: true }],
  rateMin: 40,
  rateMax: 60,
  workMode: "ONSITE",
  location: "Utrecht",
  industryId: "ind-zorg",
};

const requiredTypes: CredentialType[] = ["VOG"];

function app(over: Partial<DienstApplicationSource> = {}): DienstApplicationSource {
  return {
    id: "app-1",
    status: "APPLIED",
    proposedRate: 50,
    collaboration: null,
    freelancer: {
      id: "f-1",
      headline: "Verpleegkundige",
      bio: "Ervaren in de wijkzorg.",
      hourlyRate: 50,
      workMode: "ONSITE",
      location: "Utrecht",
      maxTravelMinutes: null,
      availability: "AVAILABLE",
      user: { name: "Sanne" },
      skills: [{ skillId: "skill-verpleging" }, { skillId: "skill-wijkzorg" }],
      industries: [{ industryId: "ind-zorg" }],
      availabilityWindows: [],
      credentials: [{ type: "VOG", status: "VERIFIED", expiresAt: null }],
      ...over.freelancer,
    },
    ...over,
  };
}

describe("buildDienstApplicant", () => {
  it("berekent match, troef en compliance uit dezelfde motor als /kandidaten", () => {
    const result = buildDienstApplicant(job, app(), requiredTypes, NOW);
    expect(result.matchScore).toBeGreaterThan(0);
    expect(result.topReason).not.toBeNull();
    expect(result.complianceStatus).toBe("COMPLIANT");
    expect(result.name).toBe("Sanne");
    expect(result.hired).toBe(false);
  });

  it("zet een ontbrekend verplicht certificaat als eerste minpunt (compliance-first)", () => {
    const result = buildDienstApplicant(
      job,
      app({
        freelancer: {
          ...app().freelancer,
          credentials: [], // geen VOG → niet-compliant, compliance-kloof
        },
      }),
      requiredTypes,
      NOW,
    );
    expect(result.complianceStatus).toBe("NON_COMPLIANT");
    expect(result.topGap).toBe("Mist vereist certificaat");
  });

  it("classificeert het tariefvoorstel t.o.v. het dienst-budget", () => {
    expect(buildDienstApplicant(job, app({ proposedRate: 50 }), requiredTypes, NOW).rateFit).toBe(
      "within",
    );
    expect(buildDienstApplicant(job, app({ proposedRate: 75 }), requiredTypes, NOW).rateFit).toBe(
      "above",
    );
    expect(buildDienstApplicant(job, app({ proposedRate: 30 }), requiredTypes, NOW).rateFit).toBe(
      "below",
    );
    expect(buildDienstApplicant(job, app({ proposedRate: null }), requiredTypes, NOW).rateFit).toBe(
      "unknown",
    );
  });

  it("markeert een reactie met een collaboration als aangenomen", () => {
    const result = buildDienstApplicant(
      job,
      app({ collaboration: { id: "collab-1" } }),
      requiredTypes,
      NOW,
    );
    expect(result.hired).toBe(true);
  });

  it("geeft geen compliance-status als de dienst geen verplichte certificaten kent", () => {
    const result = buildDienstApplicant(job, app(), [], NOW);
    expect(result.complianceStatus).toBeNull();
  });
});
