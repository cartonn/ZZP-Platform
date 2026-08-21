import { describe, expect, it } from "vitest";
import { sortJobsByStart, type StartSortJob } from "./job-start-sort";

const NOW = new Date("2026-08-21T12:00:00Z");

function job(
  id: string,
  startDate: string | null,
  publishedAt: string | null = null,
): StartSortJob<string> {
  return {
    job: id,
    id,
    startDate: startDate ? new Date(startDate) : null,
    publishedAt: publishedAt ? new Date(publishedAt) : null,
  };
}

describe("sortJobsByStart", () => {
  it("zet aankomende starts oplopend bovenaan (soonste eerst)", () => {
    const result = sortJobsByStart(
      [job("c", "2026-09-10"), job("a", "2026-08-25"), job("b", "2026-09-01")],
      NOW,
    );
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("zet aankomend vóór voorbij vóór ongedateerd", () => {
    const result = sortJobsByStart(
      [job("past", "2026-07-01"), job("none", null), job("soon", "2026-08-30")],
      NOW,
    );
    expect(result).toEqual(["soon", "past", "none"]);
  });

  it("sorteert voorbije starts aflopend (recentst gestart eerst, dichtst bij nu)", () => {
    const result = sortJobsByStart(
      [job("old", "2026-01-01"), job("recent", "2026-08-10"), job("mid", "2026-05-01")],
      NOW,
    );
    expect(result).toEqual(["recent", "mid", "old"]);
  });

  it("behandelt een start van vandaag als aankomend (>= vandaag-middernacht)", () => {
    const result = sortJobsByStart([job("later", "2026-08-25"), job("today", "2026-08-21")], NOW);
    expect(result).toEqual(["today", "later"]);
  });

  it("tie-breakt gelijke startdatum op nieuwst gepubliceerd, dan id", () => {
    const result = sortJobsByStart(
      [
        job("z", "2026-09-01", "2026-08-01"),
        job("a", "2026-09-01", "2026-08-05"),
        job("m", "2026-09-01", null),
      ],
      NOW,
    );
    // a (nieuwst gepubliceerd) → z (ouder gepubliceerd) → m (geen publicatie, telt als oudst)
    expect(result).toEqual(["a", "z", "m"]);
  });

  it("ordent ongedateerde opdrachten op publicatie desc, dan id", () => {
    const result = sortJobsByStart(
      [job("b", null, "2026-08-01"), job("a", null, "2026-08-10"), job("c", null, null)],
      NOW,
    );
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("muteert de invoer niet", () => {
    const input = [job("b", "2026-09-05"), job("a", "2026-08-25")];
    const snapshot = input.map((j) => j.id);
    sortJobsByStart(input, NOW);
    expect(input.map((j) => j.id)).toEqual(snapshot);
  });

  it("is volledig deterministisch op identieke sleutels", () => {
    const a = sortJobsByStart([job("y", "2026-09-01"), job("x", "2026-09-01")], NOW);
    const b = sortJobsByStart([job("x", "2026-09-01"), job("y", "2026-09-01")], NOW);
    expect(a).toEqual(b);
    expect(a).toEqual(["x", "y"]);
  });
});
