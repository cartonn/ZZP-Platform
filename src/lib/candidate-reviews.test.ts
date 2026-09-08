import { describe, it, expect } from "vitest";
import { groupCandidateRatings } from "@/lib/candidate-reviews";

describe("groupCandidateRatings", () => {
  it("aggregates ratings per subject and computes the average (op/boven de vloer)", () => {
    const map = groupCandidateRatings(
      [
        { subjectId: "u1", rating: 5 },
        { subjectId: "u1", rating: 4 },
        { subjectId: "u1", rating: 3 },
        { subjectId: "u2", rating: 3 },
        { subjectId: "u2", rating: 4 },
        { subjectId: "u2", rating: 5 },
      ],
      ["u1", "u2"],
    );

    expect(map.get("u1")).toMatchObject({ count: 3, average: 4 });
    expect(map.get("u2")).toMatchObject({ count: 3, average: 4 });
  });

  it("omits subjects with no reviews", () => {
    const map = groupCandidateRatings(
      [
        { subjectId: "u1", rating: 5 },
        { subjectId: "u1", rating: 4 },
        { subjectId: "u1", rating: 3 },
      ],
      ["u1", "u2"],
    );
    expect(map.has("u1")).toBe(true);
    expect(map.has("u2")).toBe(false);
  });

  it("k-anonimiteitsvloer: laat een kandidaat met 1 of 2 beoordelingen weg (herleidbaar)", () => {
    // Onder REVIEW_AGGREGATE_MIN_SAMPLE (=3) is het aggregaat individueel herleidbaar → niet tonen,
    // ranking niet beïnvloeden. Regressie voor security-review 8-9-2026.
    const single = groupCandidateRatings([{ subjectId: "u1", rating: 2 }], ["u1"]);
    expect(single.has("u1")).toBe(false);

    const doubled = groupCandidateRatings(
      [
        { subjectId: "u1", rating: 2 },
        { subjectId: "u1", rating: 4 },
      ],
      ["u1"],
    );
    expect(doubled.has("u1")).toBe(false);
  });

  it("ignores rows for subjects outside the requested scope (no leakage)", () => {
    const map = groupCandidateRatings(
      [
        { subjectId: "u1", rating: 5 },
        { subjectId: "u1", rating: 4 },
        { subjectId: "u1", rating: 3 },
        { subjectId: "stranger", rating: 1 },
      ],
      ["u1"],
    );
    expect(map.has("stranger")).toBe(false);
    expect(map.get("u1")).toMatchObject({ count: 3, average: 4 });
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
