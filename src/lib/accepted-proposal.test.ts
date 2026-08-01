import { describe, expect, it } from "vitest";
import {
  pendingCollaborationProposals,
  PROPOSAL_STALL_DAYS,
  type AcceptedProposalRow,
} from "@/lib/accepted-proposal";

const NOW = new Date("2026-08-01T12:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const row = (over: Partial<AcceptedProposalRow>): AcceptedProposalRow => ({
  applicationId: "app-1",
  freelancerName: "Sanne de Vries",
  jobTitle: "Wijkverpleegkundige",
  hasCollaboration: false,
  acceptedAt: NOW, // vers geaccepteerd, tenzij overschreven
  ...over,
});

describe("pendingCollaborationProposals", () => {
  it("houdt een geaccepteerde reactie zonder collaboration over, met leeftijd + niet-stalled", () => {
    const out = pendingCollaborationProposals([row({ acceptedAt: daysAgo(1) })], NOW);
    expect(out).toEqual([
      {
        applicationId: "app-1",
        freelancerName: "Sanne de Vries",
        jobTitle: "Wijkverpleegkundige",
        agingDays: 1,
        stalled: false,
      },
    ]);
  });

  it("filtert een reactie die al een collaboration heeft (voorstel al verstuurd)", () => {
    const out = pendingCollaborationProposals(
      [
        row({ applicationId: "a", hasCollaboration: true }),
        row({ applicationId: "b", hasCollaboration: false }),
      ],
      NOW,
    );
    expect(out.map((p) => p.applicationId)).toEqual(["b"]);
  });

  it("behoudt de invoervolgorde (oudst-eerst uit de enumerator)", () => {
    const out = pendingCollaborationProposals(
      [row({ applicationId: "oud" }), row({ applicationId: "nieuw" })],
      NOW,
    );
    expect(out.map((p) => p.applicationId)).toEqual(["oud", "nieuw"]);
  });

  it("markeert stalled zodra de acceptatie ≥ PROPOSAL_STALL_DAYS oud is", () => {
    const out = pendingCollaborationProposals(
      [
        row({ applicationId: "grens", acceptedAt: daysAgo(PROPOSAL_STALL_DAYS) }),
        row({ applicationId: "onder", acceptedAt: daysAgo(PROPOSAL_STALL_DAYS - 1) }),
      ],
      NOW,
    );
    expect(out.find((p) => p.applicationId === "grens")).toMatchObject({
      agingDays: PROPOSAL_STALL_DAYS,
      stalled: true,
    });
    expect(out.find((p) => p.applicationId === "onder")).toMatchObject({ stalled: false });
  });

  it("klemt een acceptedAt in de toekomst op 0 dagen (nooit negatief, nooit stalled)", () => {
    const out = pendingCollaborationProposals([row({ acceptedAt: daysAgo(-5) })], NOW);
    expect(out[0]).toMatchObject({ agingDays: 0, stalled: false });
  });

  it("lege invoer → lege lijst", () => {
    expect(pendingCollaborationProposals([], NOW)).toEqual([]);
  });
});
