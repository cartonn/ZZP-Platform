import { describe, expect, it } from "vitest";
import {
  VERIFICATION_PRIORITY_WEIGHT,
  compareVerificationQueuePriority,
  orderVerificationQueue,
  verificationQueuePriority,
  type VerificationQueueOrderKey,
  type VerificationQueuePrioritySignals,
} from "@/lib/verification-queue-order";

const NONE: VerificationQueuePrioritySignals = {
  blocksActivePlacement: 0,
  alreadyExpired: false,
  expiringSoon: false,
  stale: false,
  openJobDemand: 0,
  resubmission: false,
};

function signals(
  over: Partial<VerificationQueuePrioritySignals>,
): VerificationQueuePrioritySignals {
  return { ...NONE, ...over };
}

describe("verificationQueuePriority", () => {
  it("geeft 0 zonder enig signaal (valt terug op pure FIFO)", () => {
    expect(verificationQueuePriority(NONE)).toBe(0);
  });

  it("telt elk signaal met zijn eigen gewicht", () => {
    expect(verificationQueuePriority(signals({ blocksActivePlacement: 1 }))).toBe(
      VERIFICATION_PRIORITY_WEIGHT.blocksActivePlacement,
    );
    expect(verificationQueuePriority(signals({ alreadyExpired: true }))).toBe(
      VERIFICATION_PRIORITY_WEIGHT.alreadyExpired,
    );
    expect(verificationQueuePriority(signals({ stale: true }))).toBe(
      VERIFICATION_PRIORITY_WEIGHT.stale,
    );
    expect(verificationQueuePriority(signals({ expiringSoon: true }))).toBe(
      VERIFICATION_PRIORITY_WEIGHT.expiringSoon,
    );
    expect(verificationQueuePriority(signals({ resubmission: true }))).toBe(
      VERIFICATION_PRIORITY_WEIGHT.resubmission,
    );
  });

  it("vlakke vraagbanden: hoog vanaf 3 vragende opdrachten, enig daaronder, niets bij 0", () => {
    expect(verificationQueuePriority(signals({ openJobDemand: 0 }))).toBe(0);
    expect(verificationQueuePriority(signals({ openJobDemand: 1 }))).toBe(
      VERIFICATION_PRIORITY_WEIGHT.demandSome,
    );
    expect(verificationQueuePriority(signals({ openJobDemand: 2 }))).toBe(
      VERIFICATION_PRIORITY_WEIGHT.demandSome,
    );
    expect(verificationQueuePriority(signals({ openJobDemand: 3 }))).toBe(
      VERIFICATION_PRIORITY_WEIGHT.demandHigh,
    );
    // Een enorme vraagtelling blijft vlak (hoog) — mag nooit een hogere tier overstijgen.
    expect(verificationQueuePriority(signals({ openJobDemand: 9999 }))).toBe(
      VERIFICATION_PRIORITY_WEIGHT.demandHigh,
    );
  });

  it("telt het expiry-signaal één keer: reeds verlopen sluit binnenkort-verlopen uit", () => {
    const score = verificationQueuePriority(signals({ alreadyExpired: true, expiringSoon: true }));
    expect(score).toBe(VERIFICATION_PRIORITY_WEIGHT.alreadyExpired);
  });

  it("strikte tier-dominantie: een hogere tier verslaat elke combinatie van lagere tiers", () => {
    const allLowerThanPlacement = verificationQueuePriority(
      signals({
        alreadyExpired: true,
        stale: true,
        expiringSoon: true,
        openJobDemand: 9999,
        resubmission: true,
      }),
    );
    const onlyPlacement = verificationQueuePriority(signals({ blocksActivePlacement: 1 }));
    expect(onlyPlacement).toBeGreaterThan(allLowerThanPlacement);

    const allLowerThanExpired = verificationQueuePriority(
      signals({ stale: true, expiringSoon: true, openJobDemand: 9999, resubmission: true }),
    );
    expect(verificationQueuePriority(signals({ alreadyExpired: true }))).toBeGreaterThan(
      allLowerThanExpired,
    );

    const allLowerThanStale = verificationQueuePriority(
      signals({ expiringSoon: true, openJobDemand: 9999, resubmission: true }),
    );
    expect(verificationQueuePriority(signals({ stale: true }))).toBeGreaterThan(allLowerThanStale);
  });
});

describe("compareVerificationQueuePriority", () => {
  const base = (over: Partial<VerificationQueueOrderKey>): VerificationQueueOrderKey => ({
    priority: 0,
    submittedAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    id: "a",
    ...over,
  });

  it("hogere prioriteit eerst", () => {
    const high = base({ priority: 100, id: "high" });
    const low = base({ priority: 1, id: "low" });
    expect(compareVerificationQueuePriority(high, low)).toBeLessThan(0);
    expect(compareVerificationQueuePriority(low, high)).toBeGreaterThan(0);
  });

  it("bij gelijke prioriteit: oudste submittedAt eerst (FIFO)", () => {
    const older = base({ submittedAt: new Date("2026-01-01T00:00:00Z"), id: "older" });
    const newer = base({ submittedAt: new Date("2026-02-01T00:00:00Z"), id: "newer" });
    expect(compareVerificationQueuePriority(older, newer)).toBeLessThan(0);
  });

  it("legacy-records zonder submittedAt staan achteraan binnen dezelfde prioriteit", () => {
    const withDate = base({ submittedAt: new Date("2026-05-01T00:00:00Z"), id: "withDate" });
    const legacy = base({ submittedAt: null, id: "legacy" });
    expect(compareVerificationQueuePriority(withDate, legacy)).toBeLessThan(0);
    expect(compareVerificationQueuePriority(legacy, withDate)).toBeGreaterThan(0);
  });

  it("valt terug op updatedAt en daarna id voor een volledig stabiele volgorde", () => {
    const a = base({ submittedAt: null, updatedAt: new Date("2026-01-01T00:00:00Z"), id: "a" });
    const b = base({ submittedAt: null, updatedAt: new Date("2026-03-01T00:00:00Z"), id: "b" });
    expect(compareVerificationQueuePriority(a, b)).toBeLessThan(0);

    const sameTime1 = base({ id: "aaa" });
    const sameTime2 = base({ id: "bbb" });
    expect(compareVerificationQueuePriority(sameTime1, sameTime2)).toBeLessThan(0);
    expect(compareVerificationQueuePriority(sameTime1, sameTime1)).toBe(0);
  });
});

describe("orderVerificationQueue", () => {
  interface Row {
    id: string;
    submittedAt: Date | null;
    updatedAt: Date;
    s: VerificationQueuePrioritySignals;
  }

  const row = (
    id: string,
    submittedAt: string | null,
    over: Partial<VerificationQueuePrioritySignals> = {},
  ): Row => ({
    id,
    submittedAt: submittedAt ? new Date(submittedAt) : null,
    updatedAt: new Date(submittedAt ?? "2026-01-01T00:00:00Z"),
    s: signals(over),
  });

  const toKey = (r: Row): VerificationQueueOrderKey => ({
    priority: verificationQueuePriority(r.s),
    submittedAt: r.submittedAt,
    updatedAt: r.updatedAt,
    id: r.id,
  });

  it("een blokkerende inzending diep in de FIFO stijgt naar de top", () => {
    const rows: Row[] = [
      row("fresh-1", "2026-06-10T00:00:00Z"),
      row("fresh-2", "2026-06-09T00:00:00Z"),
      // Oudste zou in pure FIFO bovenaan staan, maar heeft geen signaal.
      row("old-plain", "2026-05-01T00:00:00Z"),
      // Nieuwste inzending, maar blokkeert een lopende inzet → moet bovenaan.
      row("blocking", "2026-06-20T00:00:00Z", { blocksActivePlacement: 2 }),
    ];
    const ordered = orderVerificationQueue(rows, toKey).map((r) => r.id);
    expect(ordered[0]).toBe("blocking");
  });

  it("zonder enig signaal is de volgorde identiek aan pure oudste-eerst FIFO", () => {
    const rows: Row[] = [
      row("c", "2026-06-03T00:00:00Z"),
      row("a", "2026-06-01T00:00:00Z"),
      row("b", "2026-06-02T00:00:00Z"),
      row("legacy", null),
    ];
    const ordered = orderVerificationQueue(rows, toKey).map((r) => r.id);
    expect(ordered).toEqual(["a", "b", "c", "legacy"]);
  });

  it("rangschikt de volledige urgentieladder correct, FIFO binnen gelijke tier", () => {
    const rows: Row[] = [
      row("demand", "2026-06-01T00:00:00Z", { openJobDemand: 5 }),
      row("expiring", "2026-06-01T00:00:00Z", { expiringSoon: true }),
      row("stale", "2026-06-01T00:00:00Z", { stale: true }),
      row("expired", "2026-06-01T00:00:00Z", { alreadyExpired: true }),
      row("blocking", "2026-06-01T00:00:00Z", { blocksActivePlacement: 1 }),
      row("plain-old", "2026-01-01T00:00:00Z"),
      row("resubmit", "2026-06-01T00:00:00Z", { resubmission: true }),
    ];
    const ordered = orderVerificationQueue(rows, toKey).map((r) => r.id);
    expect(ordered).toEqual([
      "blocking",
      "expired",
      "stale",
      "expiring",
      "demand",
      "resubmit",
      "plain-old",
    ]);
  });

  it("muteert de invoer niet", () => {
    const rows: Row[] = [
      row("b", "2026-06-02T00:00:00Z"),
      row("a", "2026-06-01T00:00:00Z", { blocksActivePlacement: 1 }),
    ];
    const snapshot = rows.map((r) => r.id);
    orderVerificationQueue(rows, toKey);
    expect(rows.map((r) => r.id)).toEqual(snapshot);
  });
});
