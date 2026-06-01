import { describe, expect, it } from "vitest";
import {
  bestFieldScore,
  DEFAULT_SEARCH_LIMIT,
  groupResultsByType,
  isSearchableQuery,
  MIN_QUERY_LENGTH,
  normalizeSearchQuery,
  rankResults,
  scoreField,
  SEARCH_TYPE_ORDER,
  type SearchResult,
} from "@/lib/search";

describe("normalizeSearchQuery", () => {
  it("trimt, klapt witruimte in en lowercaset", () => {
    expect(normalizeSearchQuery("  Sanne   de   Vries ")).toBe("sanne de vries");
  });
  it("lege invoer → lege string", () => {
    expect(normalizeSearchQuery("   ")).toBe("");
  });
});

describe("isSearchableQuery", () => {
  it("false onder de minimumlengte", () => {
    expect(isSearchableQuery("a")).toBe(false);
    expect(isSearchableQuery(" ")).toBe(false);
  });
  it("true vanaf de minimumlengte", () => {
    expect(isSearchableQuery("ab")).toBe(true);
    expect("ab".length).toBe(MIN_QUERY_LENGTH);
  });
});

describe("scoreField", () => {
  it("exacte match scoort het hoogst", () => {
    expect(scoreField("Verpleegkundige", "verpleegkundige")).toBe(4);
  });
  it("begint-met scoort hoger dan woord-begint-met", () => {
    expect(scoreField("Verpleegkundige nacht", "verpleeg")).toBe(3);
    expect(scoreField("Senior verpleegkundige", "verpleeg")).toBe(2);
  });
  it("bevat scoort het laagst boven nul", () => {
    expect(scoreField("Onverpleegd", "verpleeg")).toBe(1);
  });
  it("geen match of lege invoer → 0", () => {
    expect(scoreField("Dakdekker", "verpleeg")).toBe(0);
    expect(scoreField(null, "verpleeg")).toBe(0);
    expect(scoreField("Dakdekker", "")).toBe(0);
  });
});

describe("bestFieldScore", () => {
  it("neemt de hoogste score over alle velden", () => {
    expect(bestFieldScore(["Acme BV", "Verpleegkundige", null], "verpleeg")).toBe(3);
  });
  it("0 als niets matcht", () => {
    expect(bestFieldScore(["Acme BV", "Dakdekker"], "verpleeg")).toBe(0);
  });
});

function r(
  partial: Partial<SearchResult> & Pick<SearchResult, "type" | "id" | "title" | "score">,
): SearchResult {
  return { href: `/x/${partial.id}`, ...partial };
}

describe("rankResults", () => {
  it("sorteert op score, dan type-volgorde, dan titel; filtert score 0 en begrenst", () => {
    const input: SearchResult[] = [
      r({ type: "factuur", id: "2", title: "2026-0002", score: 1 }),
      r({ type: "opdracht", id: "a", title: "Beta", score: 3 }),
      r({ type: "samenwerking", id: "s", title: "Alpha", score: 3 }),
      r({ type: "gebruiker", id: "u", title: "Niemand", score: 0 }),
      r({ type: "opdracht", id: "b", title: "Alpha", score: 3 }),
    ];
    const ranked = rankResults(input, 10);
    expect(ranked.map((x) => x.id)).toEqual(["b", "a", "s", "2"]);
    // score 0 verwijderd
    expect(ranked.find((x) => x.id === "u")).toBeUndefined();
  });

  it("respecteert de limiet", () => {
    const many: SearchResult[] = Array.from({ length: 20 }, (_, i) =>
      r({ type: "opdracht", id: String(i), title: `Job ${i}`, score: 2 }),
    );
    expect(rankResults(many).length).toBe(DEFAULT_SEARCH_LIMIT);
    expect(rankResults(many, 3).length).toBe(3);
  });
});

describe("groupResultsByType", () => {
  it("groepeert in vaste volgorde en laat lege groepen weg", () => {
    const results: SearchResult[] = [
      r({ type: "factuur", id: "f", title: "2026-0001", score: 2 }),
      r({ type: "opdracht", id: "o", title: "Klus", score: 2 }),
    ];
    const groups = groupResultsByType(results);
    expect(groups.map((g) => g.type)).toEqual(["opdracht", "factuur"]);
    // volgt SEARCH_TYPE_ORDER
    expect(SEARCH_TYPE_ORDER.indexOf("opdracht")).toBeLessThan(
      SEARCH_TYPE_ORDER.indexOf("factuur"),
    );
  });
});
