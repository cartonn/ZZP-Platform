import { describe, expect, it } from "vitest";
import { isSavedJobOpen, partitionSavedJobs, type SavedJobItem } from "@/lib/saved-jobs";

function item(over: Partial<SavedJobItem> & { jobId: string }): SavedJobItem {
  return {
    title: "Opdracht",
    companyName: "Zorg BV",
    status: "PUBLISHED",
    savedAt: new Date("2026-01-01T00:00:00Z"),
    ...over,
  };
}

describe("isSavedJobOpen", () => {
  it("alleen PUBLISHED telt als open", () => {
    expect(isSavedJobOpen("PUBLISHED")).toBe(true);
    expect(isSavedJobOpen("CLOSED")).toBe(false);
    expect(isSavedJobOpen("DRAFT")).toBe(false);
  });
});

describe("partitionSavedJobs", () => {
  it("splitst open vs. niet meer beschikbaar", () => {
    const { open, unavailable } = partitionSavedJobs([
      item({ jobId: "a", status: "PUBLISHED" }),
      item({ jobId: "b", status: "CLOSED" }),
      item({ jobId: "c", status: "DRAFT" }),
    ]);
    expect(open.map((j) => j.jobId)).toEqual(["a"]);
    expect(unavailable.map((j) => j.jobId).sort()).toEqual(["b", "c"]);
  });

  it("sorteert het meest recent bewaard eerst binnen elke groep", () => {
    const { open } = partitionSavedJobs([
      item({ jobId: "old", savedAt: new Date("2026-01-01T00:00:00Z") }),
      item({ jobId: "new", savedAt: new Date("2026-03-01T00:00:00Z") }),
      item({ jobId: "mid", savedAt: new Date("2026-02-01T00:00:00Z") }),
    ]);
    expect(open.map((j) => j.jobId)).toEqual(["new", "mid", "old"]);
  });

  it("breekt gelijke tijdstippen deterministisch op jobId", () => {
    const same = new Date("2026-01-01T00:00:00Z");
    const { open } = partitionSavedJobs([
      item({ jobId: "z", savedAt: same }),
      item({ jobId: "a", savedAt: same }),
    ]);
    expect(open.map((j) => j.jobId)).toEqual(["a", "z"]);
  });

  it("muteert de invoer niet", () => {
    const input = [
      item({ jobId: "b", savedAt: new Date("2026-01-01T00:00:00Z") }),
      item({ jobId: "a", savedAt: new Date("2026-02-01T00:00:00Z") }),
    ];
    const snapshot = input.map((j) => j.jobId);
    partitionSavedJobs(input);
    expect(input.map((j) => j.jobId)).toEqual(snapshot);
  });

  it("lege invoer geeft lege groepen", () => {
    expect(partitionSavedJobs([])).toEqual({ open: [], unavailable: [] });
  });
});
