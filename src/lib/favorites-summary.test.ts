import { describe, expect, it } from "vitest";
import {
  hasFlexpoolSummary,
  summarizeFlexpool,
  type SummarizableFavorite,
} from "@/lib/favorites-summary";
import { type Availability } from "@/lib/enums";

function fav(availability: Availability): SummarizableFavorite {
  return { availability };
}

describe("summarizeFlexpool", () => {
  it("telt elke bucket en behoudt het totaal", () => {
    const summary = summarizeFlexpool([
      fav("AVAILABLE"),
      fav("AVAILABLE"),
      fav("LIMITED"),
      fav("UNAVAILABLE"),
      fav("UNKNOWN"),
    ]);
    expect(summary).toEqual({
      available: 2,
      limited: 1,
      unavailable: 1,
      unknown: 1,
      total: 5,
    });
  });

  it("laat de vier buckets altijd tot total sommeren", () => {
    const items: SummarizableFavorite[] = [
      fav("AVAILABLE"),
      fav("LIMITED"),
      fav("LIMITED"),
      fav("UNKNOWN"),
      fav("UNAVAILABLE"),
      fav("AVAILABLE"),
    ];
    const s = summarizeFlexpool(items);
    expect(s.available + s.limited + s.unavailable + s.unknown).toBe(s.total);
    expect(s.total).toBe(items.length);
  });

  it("geeft een lege telling bij een lege poule", () => {
    const s = summarizeFlexpool([]);
    expect(s).toEqual({ available: 0, limited: 0, unavailable: 0, unknown: 0, total: 0 });
  });

  it("behandelt een onbekende beschikbaarheid als unknown-bucket", () => {
    // Defensief: een waarde buiten de bekende set valt in de unknown-bucket, nooit in available.
    const s = summarizeFlexpool([{ availability: "GEKKE_WAARDE" as Availability }]);
    expect(s.unknown).toBe(1);
    expect(s.available).toBe(0);
    expect(s.total).toBe(1);
  });
});

describe("hasFlexpoolSummary", () => {
  it("is false bij een lege poule", () => {
    expect(hasFlexpoolSummary(summarizeFlexpool([]))).toBe(false);
  });

  it("is true zodra er minstens één ZZP'er in de poule zit", () => {
    expect(hasFlexpoolSummary(summarizeFlexpool([fav("UNKNOWN")]))).toBe(true);
  });
});
