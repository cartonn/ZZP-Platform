import { describe, expect, it } from "vitest";
import {
  summarizeVoordrachtOpvolging,
  voordrachtAgeBucket,
  voordrachtOpvolgingStrip,
  VOORDRACHT_STIL_DAYS,
  VOORDRACHT_WACHTEND_DAYS,
  type VoordrachtContext,
  type VoordrachtRecord,
} from "./voordracht-opvolging";

const NOW = new Date("2026-08-28T12:00:00.000Z");
const DAY = 86_400_000;

/** Bouw een voordracht-record `ageDays` dagen oud t.o.v. NOW. */
const rec = (jobId: string, freelancerId: string, ageDays: number): VoordrachtRecord => ({
  jobId,
  freelancerId,
  proposedAt: new Date(NOW.getTime() - ageDays * DAY),
});

const ctx = (over: Partial<VoordrachtContext> = {}): VoordrachtContext => ({
  respondedKeys: new Set<string>(),
  openJobIds: new Set(["j1", "j2", "j3"]),
  jobMeta: new Map([
    [
      "j1",
      {
        title: "Dienst 1",
        freelancerName: new Map([
          ["f1", "Sanne"],
          ["f2", "Ben"],
        ]),
      },
    ],
    [
      "j2",
      {
        title: "Dienst 2",
        freelancerName: new Map([
          ["f1", "Sanne"],
          ["f3", "Kim"],
        ]),
      },
    ],
    ["j3", { title: "Dienst 3", freelancerName: new Map([["f4", "Noa"]]) }],
  ]),
  ...over,
});

describe("voordrachtAgeBucket", () => {
  it("bucket op de drempels", () => {
    expect(voordrachtAgeBucket(0)).toBe("fresh");
    expect(voordrachtAgeBucket(VOORDRACHT_WACHTEND_DAYS)).toBe("fresh");
    expect(voordrachtAgeBucket(VOORDRACHT_WACHTEND_DAYS + 1)).toBe("waiting");
    expect(voordrachtAgeBucket(VOORDRACHT_STIL_DAYS)).toBe("waiting");
    expect(voordrachtAgeBucket(VOORDRACHT_STIL_DAYS + 1)).toBe("stale");
  });
});

describe("summarizeVoordrachtOpvolging", () => {
  it("lege input → alle tellers 0, lege lijst", () => {
    expect(summarizeVoordrachtOpvolging([], ctx(), NOW)).toEqual({
      open: 0,
      fresh: 0,
      waiting: 0,
      stale: 0,
      items: [],
    });
  });

  it("bucket op leeftijd; alleen waiting+stale in items", () => {
    const out = summarizeVoordrachtOpvolging(
      [rec("j1", "f1", 1), rec("j2", "f3", 3), rec("j3", "f4", 8)],
      ctx(),
      NOW,
    );
    expect(out).toMatchObject({ open: 3, fresh: 1, waiting: 1, stale: 1 });
    expect(out.items).toHaveLength(2);
    // Oudste (stilste) bovenaan.
    expect(out.items[0]).toMatchObject({ freelancerId: "f4", ageDays: 8, bucket: "stale" });
    expect(out.items[1]).toMatchObject({ freelancerId: "f3", ageDays: 3, bucket: "waiting" });
  });

  it("verrijkt items met dienst-titel en ZZP'er-naam", () => {
    const out = summarizeVoordrachtOpvolging([rec("j1", "f2", 4)], ctx(), NOW);
    expect(out.items[0]).toMatchObject({
      jobTitle: "Dienst 1",
      freelancerName: "Ben",
      bucket: "waiting",
    });
  });

  it("laat een voordracht vallen zodra de ZZP'er zelf reageerde", () => {
    const out = summarizeVoordrachtOpvolging(
      [rec("j1", "f1", 6)],
      ctx({ respondedKeys: new Set(["j1:f1"]) }),
      NOW,
    );
    expect(out).toMatchObject({ open: 0, items: [] });
  });

  it("laat een voordracht vallen zodra de dienst niet meer open is (gevuld/gesloten)", () => {
    const out = summarizeVoordrachtOpvolging(
      [rec("j1", "f1", 6), rec("j2", "f3", 6)],
      ctx({ openJobIds: new Set(["j2"]) }),
      NOW,
    );
    expect(out.open).toBe(1);
    expect(out.items.map((i) => i.jobId)).toEqual(["j2"]);
  });

  it("klemt een toekomstige uitnodigingsdatum (data-ruis) op vers", () => {
    const out = summarizeVoordrachtOpvolging([rec("j1", "f1", -3)], ctx(), NOW);
    expect(out).toMatchObject({ open: 1, fresh: 1, waiting: 0, stale: 0, items: [] });
  });

  it("tiebreak op naam bij gelijke leeftijd", () => {
    const out = summarizeVoordrachtOpvolging([rec("j1", "f2", 4), rec("j2", "f3", 4)], ctx(), NOW);
    // Ben < Kim (nl-collatie)
    expect(out.items.map((i) => i.freelancerName)).toEqual(["Ben", "Kim"]);
  });
});

describe("voordrachtOpvolgingStrip", () => {
  const summary = (over: Partial<ReturnType<typeof summarizeVoordrachtOpvolging>>) => ({
    open: 0,
    fresh: 0,
    waiting: 0,
    stale: 0,
    items: [],
    ...over,
  });

  it("geen wachtende/stille voordracht → null (rustige lijst)", () => {
    expect(voordrachtOpvolgingStrip(summary({ open: 2, fresh: 2 }))).toBeNull();
  });

  it("alleen wachtend → muted herinnering", () => {
    const strip = voordrachtOpvolgingStrip(summary({ open: 2, waiting: 2 }));
    expect(strip?.tone).toBe("muted");
    expect(strip?.label).toContain("wachten op een reactie");
  });

  it("≥1 stil → warning met plan-B", () => {
    const strip = voordrachtOpvolgingStrip(summary({ open: 1, stale: 1 }));
    expect(strip?.tone).toBe("warning");
    expect(strip?.label).toContain("stil");
  });

  it("stil + wachtend → warning met beide getallen", () => {
    const strip = voordrachtOpvolgingStrip(summary({ open: 3, stale: 2, waiting: 1 }));
    expect(strip?.tone).toBe("warning");
    expect(strip?.label).toContain("2 voordrachten zijn al");
    expect(strip?.label).toContain("1 wacht op reactie");
  });
});
