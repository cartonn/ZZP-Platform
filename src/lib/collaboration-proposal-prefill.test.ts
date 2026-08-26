import { describe, it, expect } from "vitest";
import {
  buildCollaborationProposalPrefill,
  PROPOSAL_RATE_MIN,
  PROPOSAL_RATE_MAX,
} from "@/lib/collaboration-proposal-prefill";

describe("buildCollaborationProposalPrefill", () => {
  it("vult het tariefvoorstel van de kandidaat + de startdatum voor", () => {
    const start = new Date("2026-09-01T00:00:00.000Z");
    const r = buildCollaborationProposalPrefill({ proposedRate: 75, jobStartDate: start });
    expect(r).toEqual({ rate: 75, startIso: "2026-09-01" });
  });

  it("laat het tarief leeg wanneer de kandidaat geen tarief voorstelde", () => {
    const r = buildCollaborationProposalPrefill({
      proposedRate: null,
      jobStartDate: new Date("2026-09-01T00:00:00.000Z"),
    });
    expect(r.rate).toBeNull();
    expect(r.startIso).toBe("2026-09-01");
  });

  it("laat de startdatum leeg wanneer de opdracht er geen heeft", () => {
    const r = buildCollaborationProposalPrefill({ proposedRate: 60, jobStartDate: null });
    expect(r).toEqual({ rate: 60, startIso: null });
  });

  it("weigert een tarief buiten de schema-grenzen (te hoog / te laag / nul)", () => {
    const d = new Date("2026-09-01T00:00:00.000Z");
    expect(
      buildCollaborationProposalPrefill({ proposedRate: PROPOSAL_RATE_MAX + 1, jobStartDate: d })
        .rate,
    ).toBeNull();
    expect(
      buildCollaborationProposalPrefill({ proposedRate: PROPOSAL_RATE_MIN - 1, jobStartDate: d })
        .rate,
    ).toBeNull();
    expect(buildCollaborationProposalPrefill({ proposedRate: 0, jobStartDate: d }).rate).toBeNull();
  });

  it("weigert een niet-geheel tarief (schema is integer)", () => {
    const r = buildCollaborationProposalPrefill({
      proposedRate: 62.5,
      jobStartDate: new Date("2026-09-01T00:00:00.000Z"),
    });
    expect(r.rate).toBeNull();
  });

  it("honoreert de schema-grenzen precies (1 en 2000 zijn geldig)", () => {
    const d = new Date("2026-09-01T00:00:00.000Z");
    expect(
      buildCollaborationProposalPrefill({ proposedRate: PROPOSAL_RATE_MIN, jobStartDate: d }).rate,
    ).toBe(1);
    expect(
      buildCollaborationProposalPrefill({ proposedRate: PROPOSAL_RATE_MAX, jobStartDate: d }).rate,
    ).toBe(2000);
  });

  it("negeert een ongeldige Date (NaN) voor de startdatum", () => {
    const r = buildCollaborationProposalPrefill({
      proposedRate: 75,
      jobStartDate: new Date("niet-een-datum"),
    });
    expect(r.startIso).toBeNull();
  });
});
