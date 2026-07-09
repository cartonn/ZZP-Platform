import { describe, it, expect } from "vitest";
import { groupCandidateRatings } from "@/lib/candidate-reviews";

describe("groupCandidateRatings", () => {
  it("aggregates ratings per subject and computes the average", () => {
    const map = groupCandidateRatings(
      [
        { subjectId: "u1", rating: 5 },
        { subjectId: "u1", rating: 4 },
        { subjectId: "u2", rating: 3 },
      ],
      ["u1", "u2"],
    );

    expect(map.get("u1")).toMatchObject({ count: 2, average: 4.5 });
    expect(map.get("u2")).toMatchObject({ count: 1, average: 3 });
  });

  it("omits subjects with no reviews", () => {
    const map = groupCandidateRatings([{ subjectId: "u1", rating: 5 }], ["u1", "u2"]);
    expect(map.has("u1")).toBe(true);
    expect(map.has("u2")).toBe(false);
  });

  it("ignores rows for subjects outside the requested scope (no leakage)", () => {
    const map = groupCandidateRatings(
      [
        { subjectId: "u1", rating: 5 },
        { subjectId: "stranger", rating: 1 },
      ],
      ["u1"],
    );
    expect(map.has("stranger")).toBe(false);
    expect(map.get("u1")).toMatchObject({ count: 1, average: 5 });
  });

  it("drops a subject whose only ratings are out of range (count falls to 0)", () => {
    const map = groupCandidateRatings(
      [
        { subjectId: "u1", rating: 0 },
        { subjectId: "u1", rating: 6 },
      ],
      ["u1"],
    );
    expect(map.has("u1")).toBe(false);
  });

  it("returns an empty map for empty input", () => {
    expect(groupCandidateRatings([], []).size).toBe(0);
    expect(groupCandidateRatings([{ subjectId: "u1", rating: 5 }], []).size).toBe(0);
  });
});
