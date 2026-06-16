import { describe, it, expect } from "vitest";
import {
  buildDekkingsprognose,
  type DekkingsprognoseInput,
} from "@/lib/franchise/dekkingsprognose";

// Maandag 2026-06-15 (lokale tijd) — zo liggen de ISO-weekgrenzen voorspelbaar:
//   deze week:     ma 15-06 .. zo 21-06
//   volgende week: ma 22-06 .. zo 28-06
//   later:         vanaf ma 29-06
const NOW = new Date(2026, 5, 17, 12, 0, 0); // wo 17 juni 2026, midden in deze week

function dienst(p: Partial<DienstInput> = {}): DienstInput {
  return { startDate: p.startDate ?? null, filled: p.filled ?? false };
}
type DienstInput = DekkingsprognoseInput;

function onDay(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d, 9, 0, 0);
}

describe("buildDekkingsprognose", () => {
  it("lege input → 0 open, geen buckets, soonestOpenDays null", () => {
    expect(buildDekkingsprognose([], NOW)).toEqual({
      buckets: [],
      totalOpen: 0,
      soonestOpenDays: null,
    });
  });

  it("alles gevuld → 0 open", () => {
    const result = buildDekkingsprognose(
      [
        dienst({ filled: true, startDate: onDay(2026, 6, 18) }),
        dienst({ filled: true, startDate: null }),
      ],
      NOW,
    );
    expect(result.totalOpen).toBe(0);
    expect(result.buckets).toEqual([]);
    expect(result.soonestOpenDays).toBeNull();
  });

  it("buckets deze week / volgende week / later correct", () => {
    const result = buildDekkingsprognose(
      [
        dienst({ startDate: onDay(2026, 6, 18) }), // do, deze week
        dienst({ startDate: onDay(2026, 6, 21) }), // zo, deze week
        dienst({ startDate: onDay(2026, 6, 23) }), // di, volgende week
        dienst({ startDate: onDay(2026, 7, 1) }), // later
      ],
      NOW,
    );
    expect(result.totalOpen).toBe(4);
    const byKey = Object.fromEntries(result.buckets.map((b) => [b.key, b.openCount]));
    expect(byKey).toEqual({ DEZE_WEEK: 2, VOLGENDE_WEEK: 1, LATER: 1 });
  });

  it("open dienst met startdatum in het verleden telt acuut mee in DEZE_WEEK", () => {
    const result = buildDekkingsprognose([dienst({ startDate: onDay(2026, 6, 1) })], NOW);
    expect(result.buckets).toEqual([{ key: "DEZE_WEEK", label: "Deze week", openCount: 1 }]);
    expect(result.totalOpen).toBe(1);
  });

  it("startDate null → GEEN_DATUM en telt niet mee in soonestOpenDays", () => {
    const result = buildDekkingsprognose(
      [dienst({ startDate: null }), dienst({ startDate: null })],
      NOW,
    );
    expect(result.buckets).toEqual([{ key: "GEEN_DATUM", label: "Geen startdatum", openCount: 2 }]);
    expect(result.totalOpen).toBe(2);
    expect(result.soonestOpenDays).toBeNull();
  });

  it("soonestOpenDays = dagen tot eerstvolgende open dienst", () => {
    const result = buildDekkingsprognose(
      [
        dienst({ startDate: onDay(2026, 6, 23) }),
        dienst({ startDate: onDay(2026, 6, 20) }), // eerstvolgende
        dienst({ startDate: null }),
      ],
      NOW,
    );
    // 17 juni 12:00 → 20 juni 09:00 = ~2,9 dagen → floor 2
    expect(result.soonestOpenDays).toBe(2);
  });

  it("soonestOpenDays is 0 bij een open dienst in het verleden (acuut)", () => {
    const result = buildDekkingsprognose([dienst({ startDate: onDay(2026, 6, 1) })], NOW);
    expect(result.soonestOpenDays).toBe(0);
  });

  it("buckets blijven in vaste volgorde, lege buckets weggelaten", () => {
    const result = buildDekkingsprognose(
      [dienst({ startDate: null }), dienst({ startDate: onDay(2026, 7, 1) })],
      NOW,
    );
    expect(result.buckets.map((b) => b.key)).toEqual(["LATER", "GEEN_DATUM"]);
  });
});
