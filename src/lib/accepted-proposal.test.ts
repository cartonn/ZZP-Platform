import { describe, expect, it } from "vitest";
import { pendingCollaborationProposals, type AcceptedProposalRow } from "@/lib/accepted-proposal";

const row = (over: Partial<AcceptedProposalRow>): AcceptedProposalRow => ({
  applicationId: "app-1",
  freelancerName: "Sanne de Vries",
  jobTitle: "Wijkverpleegkundige",
  hasCollaboration: false,
  ...over,
});

describe("pendingCollaborationProposals", () => {
  it("houdt een geaccepteerde reactie zonder collaboration over", () => {
    const out = pendingCollaborationProposals([row({})]);
    expect(out).toEqual([
      { applicationId: "app-1", freelancerName: "Sanne de Vries", jobTitle: "Wijkverpleegkundige" },
    ]);
  });

  it("filtert een reactie die al een collaboration heeft (voorstel al verstuurd)", () => {
    const out = pendingCollaborationProposals([
      row({ applicationId: "a", hasCollaboration: true }),
      row({ applicationId: "b", hasCollaboration: false }),
    ]);
    expect(out.map((p) => p.applicationId)).toEqual(["b"]);
  });

  it("behoudt de invoervolgorde (oudst-eerst uit de enumerator)", () => {
    const out = pendingCollaborationProposals([
      row({ applicationId: "oud" }),
      row({ applicationId: "nieuw" }),
    ]);
    expect(out.map((p) => p.applicationId)).toEqual(["oud", "nieuw"]);
  });

  it("lege invoer → lege lijst", () => {
    expect(pendingCollaborationProposals([])).toEqual([]);
  });
});
