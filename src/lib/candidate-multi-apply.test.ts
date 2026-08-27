import { describe, it, expect } from "vitest";
import {
  summarizeMultiApply,
  otherAppliedJobs,
  multiApplyLabel,
  type MultiApplyRow,
} from "./candidate-multi-apply";

function row(freelancerId: string, jobId: string, jobTitle: string, status = "NEW"): MultiApplyRow {
  return { freelancerId, jobId, jobTitle, status };
}

describe("summarizeMultiApply", () => {
  it("emits only freelancers with ≥ 2 distinct opdrachten", () => {
    const map = summarizeMultiApply([
      row("f1", "j1", "Verpleegkundige"),
      row("f1", "j2", "Wijkverpleging"),
      row("f2", "j1", "Verpleegkundige"),
    ]);
    expect(map.has("f1")).toBe(true);
    expect(map.get("f1")).toHaveLength(2);
    // f2 reageerde op één opdracht → geen breedte-signaal.
    expect(map.has("f2")).toBe(false);
  });

  it("telt een opdracht éénmaal ondanks dubbele invoer (dedup op jobId)", () => {
    const map = summarizeMultiApply([
      row("f1", "j1", "A"),
      row("f1", "j1", "A"),
      row("f1", "j2", "B"),
    ]);
    expect(map.get("f1")).toHaveLength(2);
  });

  it("negeert afgewezen en ingetrokken reacties (niet meer in de race)", () => {
    const map = summarizeMultiApply([
      row("f1", "j1", "A", "REJECTED"),
      row("f1", "j2", "B", "WITHDRAWN"),
      row("f1", "j3", "C", "SHORTLIST"),
    ]);
    // Alleen j3 is nog actief → onder de drempel van 2.
    expect(map.has("f1")).toBe(false);
  });

  it("sorteert de opdrachten deterministisch op titel (dan id)", () => {
    const map = summarizeMultiApply([
      row("f1", "j3", "Zebra"),
      row("f1", "j1", "Alfa"),
      row("f1", "j2", "Alfa"),
    ]);
    expect(map.get("f1")).toEqual([
      { id: "j1", title: "Alfa" },
      { id: "j2", title: "Alfa" },
      { id: "j3", title: "Zebra" },
    ]);
  });

  it("geeft een lege Map terug bij lege invoer", () => {
    expect(summarizeMultiApply([]).size).toBe(0);
  });
});

describe("otherAppliedJobs", () => {
  const all = [
    { id: "j1", title: "A" },
    { id: "j2", title: "B" },
    { id: "j3", title: "C" },
  ];

  it("laat de huidige opdracht weg", () => {
    expect(otherAppliedJobs(all, "j2")).toEqual([
      { id: "j1", title: "A" },
      { id: "j3", title: "C" },
    ]);
  });

  it("geeft [] terug wanneer de kandidaat geen breedte heeft", () => {
    expect(otherAppliedJobs(undefined, "j1")).toEqual([]);
  });

  it("geeft [] wanneer de kandidaat alleen op de huidige opdracht reageerde", () => {
    expect(otherAppliedJobs([{ id: "j1", title: "A" }], "j1")).toEqual([]);
  });
});

describe("multiApplyLabel", () => {
  it("gebruikt enkelvoud bij 1", () => {
    expect(multiApplyLabel(1)).toBe("Ook op 1 andere opdracht");
  });

  it("gebruikt meervoud bij > 1", () => {
    expect(multiApplyLabel(3)).toBe("Ook op 3 andere opdrachten");
  });

  it("is leeg bij ≤ 0", () => {
    expect(multiApplyLabel(0)).toBe("");
    expect(multiApplyLabel(-2)).toBe("");
  });
});
