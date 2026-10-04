import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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
      needsAttentionNow: 0,
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

  it("soonestOpenDays = kalenderdagen tot eerstvolgende open dienst", () => {
    const result = buildDekkingsprognose(
      [
        dienst({ startDate: onDay(2026, 6, 23) }),
        dienst({ startDate: onDay(2026, 6, 20) }), // eerstvolgende
        dienst({ startDate: null }),
      ],
      NOW,
    );
    // wo 17 juni → za 20 juni = 3 kalenderdagen (middernacht-tot-middernacht, niet wall-clock)
    expect(result.soonestOpenDays).toBe(3);
  });

  it("soonestOpenDays is 1 voor een dienst morgenochtend, ook 's avonds laat", () => {
    // 22:30 vanavond → morgen 09:00 is < 24u wall-clock, maar wél 1 kalenderdag.
    const eveningNow = new Date(2026, 5, 17, 22, 30, 0);
    const result = buildDekkingsprognose([dienst({ startDate: onDay(2026, 6, 18) })], eveningNow);
    expect(result.soonestOpenDays).toBe(1);
  });

  it("soonestOpenDays is 0 voor een dienst later vandaag", () => {
    const morningNow = new Date(2026, 5, 17, 7, 0, 0);
    const result = buildDekkingsprognose([dienst({ startDate: onDay(2026, 6, 17) })], morningNow);
    expect(result.soonestOpenDays).toBe(0);
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

  describe("needsAttentionNow", () => {
    it("telt deze week + geen-startdatum (acuut), niet volgende week / later", () => {
      const result = buildDekkingsprognose(
        [
          dienst({ startDate: onDay(2026, 6, 18) }), // deze week
          dienst({ startDate: onDay(2026, 6, 1) }), // verleden → deze week
          dienst({ startDate: null }), // geen datum → acuut
          dienst({ startDate: onDay(2026, 6, 23) }), // volgende week
          dienst({ startDate: onDay(2026, 7, 1) }), // later
        ],
        NOW,
      );
      expect(result.needsAttentionNow).toBe(3);
    });

    it("is 0 als alles pas volgende week of later start (dan mag 'alles gedekt' getoond worden)", () => {
      const result = buildDekkingsprognose(
        [dienst({ startDate: onDay(2026, 6, 23) }), dienst({ startDate: onDay(2026, 7, 1) })],
        NOW,
      );
      expect(result.totalOpen).toBe(2);
      expect(result.needsAttentionNow).toBe(0);
    });

    it("een dienst zonder startdatum houdt needsAttentionNow > 0 (geen valse 'alles gedekt')", () => {
      const result = buildDekkingsprognose([dienst({ startDate: null })], NOW);
      expect(result.needsAttentionNow).toBe(1);
    });
  });

  // De weekgrenzen moeten rond een zomer-/wintertijdovergang kloppen. Een expliciete zone houdt
  // de regressie actief ook als CI zelf in UTC draait (zonder DST reproduceert de fout niet).
  // Dates binnen de test construeren, ná het zetten van TZ (NOW bovenaan staat los daarvan).
  describe("DST-weekgrenzen (Europe/Amsterdam)", () => {
    beforeEach(() => vi.stubEnv("TZ", "Europe/Amsterdam"));
    afterEach(() => vi.unstubAllEnvs());

    it("zomertijd (voorjaar, 167u-week): dienst op maandag volgende week valt in VOLGENDE_WEEK, niet DEZE_WEEK", () => {
      // Overgang zo 29-03-2026 02:00→03:00; ISO-week ma 23-03 .. zo 29-03 duurt 167 uur.
      const now = new Date(2026, 2, 25, 12, 0, 0); // wo 25 maart, midden in deze week
      const nextMonday = new Date(2026, 2, 30, 0, 0, 0); // ma 30 maart 00:00 = volgende week
      const result = buildDekkingsprognose([dienst({ startDate: nextMonday })], now);
      expect(result.buckets).toEqual([
        { key: "VOLGENDE_WEEK", label: "Volgende week", openCount: 1 },
      ]);
      // Belangrijkste gevolg: geen valse "deze week onderbezet".
      expect(result.needsAttentionNow).toBe(0);
    });

    it("wintertijd (najaar, 169u-week): dienst zondagnacht deze week blijft DEZE_WEEK", () => {
      // Overgang zo 25-10-2026 03:00→02:00; ISO-week ma 19-10 .. zo 25-10 duurt 169 uur.
      const now = new Date(2026, 9, 21, 12, 0, 0); // wo 21 oktober, midden in deze week
      const sundayNight = new Date(2026, 9, 25, 23, 30, 0); // zo 25 oktober 23:30 = nog deze week
      const result = buildDekkingsprognose([dienst({ startDate: sundayNight })], now);
      expect(result.buckets).toEqual([{ key: "DEZE_WEEK", label: "Deze week", openCount: 1 }]);
      expect(result.needsAttentionNow).toBe(1);
    });

    it("zomertijd: buckets deze/volgende/later blijven kloppen over de overgang heen", () => {
      const now = new Date(2026, 2, 25, 12, 0, 0); // wo 25 maart
      const result = buildDekkingsprognose(
        [
          dienst({ startDate: new Date(2026, 2, 27, 9, 0, 0) }), // vr 27 maart → deze week
          dienst({ startDate: new Date(2026, 2, 30, 0, 0, 0) }), // ma 30 maart → volgende week
          dienst({ startDate: new Date(2026, 3, 6, 9, 0, 0) }), // ma 6 april → later
        ],
        now,
      );
      const byKey = Object.fromEntries(result.buckets.map((b) => [b.key, b.openCount]));
      expect(byKey).toEqual({ DEZE_WEEK: 1, VOLGENDE_WEEK: 1, LATER: 1 });
    });
  });
});
