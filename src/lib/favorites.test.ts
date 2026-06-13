import { describe, expect, it } from "vitest";
import { FAVORITE_NOTE_MAX, favoriteNoteSchema, sortFavorites } from "@/lib/favorites";

describe("favoriteNoteSchema", () => {
  it("trimt de notitie", () => {
    expect(favoriteNoteSchema.parse("  betrouwbaar  ")).toBe("betrouwbaar");
  });

  it("accepteert een notitie op de maximale lengte", () => {
    const max = "x".repeat(FAVORITE_NOTE_MAX);
    expect(favoriteNoteSchema.parse(max)).toBe(max);
  });

  it("weigert een te lange notitie", () => {
    expect(() => favoriteNoteSchema.parse("x".repeat(FAVORITE_NOTE_MAX + 1))).toThrow();
  });
});

describe("sortFavorites", () => {
  const d = (iso: string) => new Date(iso);

  it("zet beschikbare ZZP'ers vooraan", () => {
    const sorted = sortFavorites([
      { availability: "UNAVAILABLE", createdAt: d("2026-01-01") },
      { availability: "AVAILABLE", createdAt: d("2026-01-01") },
      { availability: "LIMITED", createdAt: d("2026-01-01") },
      { availability: "UNKNOWN", createdAt: d("2026-01-01") },
    ]);
    expect(sorted.map((f) => f.availability)).toEqual([
      "AVAILABLE",
      "LIMITED",
      "UNKNOWN",
      "UNAVAILABLE",
    ]);
  });

  it("ordent bij gelijke beschikbaarheid de recentst toegevoegde bovenaan", () => {
    const sorted = sortFavorites([
      { availability: "AVAILABLE", createdAt: d("2026-01-01") },
      { availability: "AVAILABLE", createdAt: d("2026-03-01") },
      { availability: "AVAILABLE", createdAt: d("2026-02-01") },
    ]);
    expect(sorted.map((f) => f.createdAt.getMonth())).toEqual([2, 1, 0]);
  });

  it("muteert de invoer niet", () => {
    const input = [
      { availability: "UNAVAILABLE" as const, createdAt: d("2026-01-01") },
      { availability: "AVAILABLE" as const, createdAt: d("2026-01-01") },
    ];
    const copy = [...input];
    sortFavorites(input);
    expect(input).toEqual(copy);
  });
});
