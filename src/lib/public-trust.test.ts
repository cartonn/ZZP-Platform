import { describe, expect, it } from "vitest";
import { trustHighlights } from "./public-trust";

describe("trustHighlights", () => {
  it("toont niets onder de betekenis-drempels", () => {
    expect(
      trustHighlights({
        verifiedCredentials: 9,
        verifiedFreelancers: 4,
        completedCollaborations: 4,
      }),
    ).toEqual([]);
  });

  it("toont een cijfer zodra het zijn drempel haalt", () => {
    const h = trustHighlights({
      verifiedCredentials: 10,
      verifiedFreelancers: 4,
      completedCollaborations: 4,
    });
    expect(h).toEqual([{ value: 10, label: "geverifieerde certificaten" }]);
  });

  it("toont alle hoogtepunten in vaste volgorde", () => {
    const h = trustHighlights({
      verifiedCredentials: 42,
      verifiedFreelancers: 12,
      completedCollaborations: 7,
    });
    expect(h.map((x) => x.label)).toEqual([
      "geverifieerde certificaten",
      "geverifieerde ZZP'ers",
      "afgeronde samenwerkingen",
    ]);
    expect(h.map((x) => x.value)).toEqual([42, 12, 7]);
  });
});
