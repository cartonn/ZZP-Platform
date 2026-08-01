// Unit-tests voor de gedeelde her-voorstel-module: de ENIGE bron van waarheid voor "is de bestaande
// collaboration een herbruikbaar, geannuleerd voorstel?". De pure spiegel + het blokkeer-predicaat
// moeten exact de where-fragment-voorwaarden dekken; deze tests borgen elk disqualificerend veld.

import { describe, it, expect } from "vitest";
import {
  isReproposableCancelledProposal,
  collaborationBlocksProposal,
  type ProposalCollaborationState,
} from "./collaboration-reproposal";

/** Een schoon, geannuleerd PROPOSED-voorstel: nooit ondertekend, nooit actief, geen artefacten. */
function cleanCancelled(
  overrides: Partial<ProposalCollaborationState> = {},
): ProposalCollaborationState {
  return {
    status: "CANCELLED",
    contractStatus: "DRAFT",
    agreementClientSignedAt: null,
    agreementFreelancerSignedAt: null,
    completedAt: null,
    invoicesCount: 0,
    performancesCount: 0,
    ...overrides,
  };
}

describe("isReproposableCancelledProposal", () => {
  it("true voor een schoon geannuleerd voorstel", () => {
    expect(isReproposableCancelledProposal(cleanCancelled())).toBe(true);
  });

  it("false wanneer de status niet CANCELLED is (ACTIVE/COMPLETED/PROPOSED)", () => {
    expect(isReproposableCancelledProposal(cleanCancelled({ status: "ACTIVE" }))).toBe(false);
    expect(isReproposableCancelledProposal(cleanCancelled({ status: "COMPLETED" }))).toBe(false);
    expect(isReproposableCancelledProposal(cleanCancelled({ status: "PROPOSED" }))).toBe(false);
  });

  it("false wanneer het contract SIGNED is (ooit ondertekend)", () => {
    expect(isReproposableCancelledProposal(cleanCancelled({ contractStatus: "SIGNED" }))).toBe(
      false,
    );
  });

  it("false wanneer een handtekening-timestamp gezet is (client of freelancer)", () => {
    const now = new Date();
    expect(isReproposableCancelledProposal(cleanCancelled({ agreementClientSignedAt: now }))).toBe(
      false,
    );
    expect(
      isReproposableCancelledProposal(cleanCancelled({ agreementFreelancerSignedAt: now })),
    ).toBe(false);
  });

  it("false wanneer completedAt gezet is", () => {
    expect(isReproposableCancelledProposal(cleanCancelled({ completedAt: new Date() }))).toBe(
      false,
    );
  });

  it("false wanneer er facturen of prestaties bestaan", () => {
    expect(isReproposableCancelledProposal(cleanCancelled({ invoicesCount: 1 }))).toBe(false);
    expect(isReproposableCancelledProposal(cleanCancelled({ performancesCount: 1 }))).toBe(false);
  });
});

describe("collaborationBlocksProposal", () => {
  it("false voor null — een eerste voorstel mag", () => {
    expect(collaborationBlocksProposal(null)).toBe(false);
  });

  it("true voor een levende/afgeronde samenwerking", () => {
    expect(collaborationBlocksProposal(cleanCancelled({ status: "ACTIVE" }))).toBe(true);
    expect(collaborationBlocksProposal(cleanCancelled({ status: "COMPLETED" }))).toBe(true);
    expect(collaborationBlocksProposal(cleanCancelled({ status: "PROPOSED" }))).toBe(true);
    // CANCELLED mét artefact blokkeert eveneens.
    expect(collaborationBlocksProposal(cleanCancelled({ invoicesCount: 1 }))).toBe(true);
  });

  it("false voor een herbruikbaar geannuleerd voorstel — een nieuw voorstel mag", () => {
    expect(collaborationBlocksProposal(cleanCancelled())).toBe(false);
  });
});
