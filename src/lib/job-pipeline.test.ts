import { describe, expect, it } from "vitest";
import { summarizeJobPipeline, summarizeJobPipelineFromCounts } from "./job-pipeline";
import { type ApplicationStatus } from "@/lib/enums";

describe("summarizeJobPipeline", () => {
  it("telt elke status in het juiste vakje", () => {
    const statuses: ApplicationStatus[] = [
      "NEW",
      "NEW",
      "VIEWED",
      "SHORTLIST",
      "SHORTLIST",
      "SHORTLIST",
      "ACCEPTED",
      "REJECTED",
    ];
    const p = summarizeJobPipeline(statuses);
    expect(p).toEqual({
      total: 8,
      newCount: 2,
      viewed: 1,
      shortlist: 3,
      accepted: 1,
      rejected: 1,
      needsAttention: true,
    });
  });

  it("sluit ingetrokken reacties uit van het totaal", () => {
    const p = summarizeJobPipeline(["NEW", "WITHDRAWN", "WITHDRAWN", "ACCEPTED"]);
    expect(p.total).toBe(2);
    expect(p.newCount).toBe(1);
    expect(p.accepted).toBe(1);
  });

  it("needsAttention is alleen waar bij nieuwe, nog niet bekeken reacties", () => {
    expect(summarizeJobPipeline(["VIEWED", "SHORTLIST"]).needsAttention).toBe(false);
    expect(summarizeJobPipeline(["NEW"]).needsAttention).toBe(true);
    expect(summarizeJobPipeline(["WITHDRAWN"]).needsAttention).toBe(false);
  });

  it("geeft een lege pijplijn terug zonder reacties", () => {
    expect(summarizeJobPipeline([])).toEqual({
      total: 0,
      newCount: 0,
      viewed: 0,
      shortlist: 0,
      accepted: 0,
      rejected: 0,
      needsAttention: false,
    });
  });

  it("een pijplijn met uitsluitend ingetrokken reacties vraagt geen actie", () => {
    const p = summarizeJobPipeline(["WITHDRAWN", "WITHDRAWN"]);
    expect(p.total).toBe(0);
    expect(p.needsAttention).toBe(false);
  });
});

describe("summarizeJobPipelineFromCounts", () => {
  it("vat statustellingen (bv. een Prisma groupBy) samen", () => {
    const p = summarizeJobPipelineFromCounts({
      NEW: 2,
      VIEWED: 1,
      SHORTLIST: 3,
      ACCEPTED: 1,
      REJECTED: 1,
    });
    expect(p).toEqual({
      total: 8,
      newCount: 2,
      viewed: 1,
      shortlist: 3,
      accepted: 1,
      rejected: 1,
      needsAttention: true,
    });
  });

  it("behandelt ontbrekende statussen als 0 en sluit WITHDRAWN uit van het totaal", () => {
    const p = summarizeJobPipelineFromCounts({ NEW: 1, WITHDRAWN: 5 });
    expect(p.total).toBe(1);
    expect(p.newCount).toBe(1);
    expect(p.viewed).toBe(0);
    expect(p.needsAttention).toBe(true);
  });

  it("geeft een lege pijplijn terug bij lege tellingen", () => {
    expect(summarizeJobPipelineFromCounts({})).toEqual({
      total: 0,
      newCount: 0,
      viewed: 0,
      shortlist: 0,
      accepted: 0,
      rejected: 0,
      needsAttention: false,
    });
  });

  it("komt overeen met summarizeJobPipeline over dezelfde reacties", () => {
    const statuses: ApplicationStatus[] = ["NEW", "VIEWED", "VIEWED", "SHORTLIST", "WITHDRAWN"];
    const counts = { NEW: 1, VIEWED: 2, SHORTLIST: 1, WITHDRAWN: 1 };
    expect(summarizeJobPipelineFromCounts(counts)).toEqual(summarizeJobPipeline(statuses));
  });
});
