import { describe, expect, it } from "vitest";
import {
  monthsBetween,
  assessCollaborationDba,
  planDbaMonitorRun,
  jobDbaIndicators,
  revenueConcentrationPct,
  effectiveRelationshipStart,
  bridgedPriorPlacementCount,
  DBA_LEVEL_LABEL,
  type DbaMonitorCandidate,
  type PlacementSpan,
} from "@/lib/dba-monitor";
import { DBA_DISCLAIMER } from "@/lib/config";

const now = new Date("2026-05-29T12:00:00Z");

describe("monthsBetween", () => {
  it("telt volledige kalendermaanden, dag-gecorrigeerd", () => {
    expect(monthsBetween(new Date("2026-05-01"), now)).toBe(0);
    expect(monthsBetween(new Date("2025-11-15"), now)).toBe(6);
    expect(monthsBetween(new Date("2025-05-15"), now)).toBe(12);
    expect(monthsBetween(new Date("2026-05-30"), now)).toBe(0); // dag nog niet bereikt
  });
});

describe("assessCollaborationDba", () => {
  it("geen signalen bij korte duur → laag risico, mét disclaimer", () => {
    const a = assessCollaborationDba(
      { collaborationId: "c1", startDate: new Date("2026-04-01") },
      now,
    );
    expect(a.level).toBe("LAAG");
    expect(a.signals).toHaveLength(0);
    expect(a.disclaimer).toBe(DBA_DISCLAIMER);
  });

  it("6–12 maanden → verhoogd risico", () => {
    const a = assessCollaborationDba(
      { collaborationId: "c1", startDate: new Date("2025-10-01") },
      now,
    );
    expect(a.level).toBe("VERHOOGD");
    expect(a.signals.some((s) => s.key === "duration-6m")).toBe(true);
  });

  it(">12 maanden → hoog risico", () => {
    const a = assessCollaborationDba(
      { collaborationId: "c1", startDate: new Date("2025-01-01") },
      now,
    );
    expect(a.level).toBe("HOOG");
    expect(a.signals.some((s) => s.key === "duration-12m")).toBe(true);
  });

  it("omzetconcentratie >80% en patroon-indicatoren leveren signalen", () => {
    const a = assessCollaborationDba(
      {
        collaborationId: "c1",
        startDate: new Date("2026-05-01"),
        revenueConcentrationPct: 85,
        directionAndSupervision: true,
        fixedSchedule: true,
      },
      now,
    );
    expect(a.level).toBe("HOOG"); // supervision = hoog
    expect(a.signals.map((s) => s.key).sort()).toEqual([
      "fixed-schedule",
      "revenue-concentration",
      "supervision",
    ]);
  });

  it("geen signaal onder de drempel (80%)", () => {
    const a = assessCollaborationDba(
      { collaborationId: "c1", startDate: new Date("2026-05-01"), revenueConcentrationPct: 79 },
      now,
    );
    expect(a.signals).toHaveLength(0);
  });

  it("labels zijn niet-alarmerend Nederlands", () => {
    expect(DBA_LEVEL_LABEL.HOOG).toBe("Hoog risico");
  });
});

describe("revenueConcentrationPct", () => {
  it("berekent het afgeronde aandeel per opdrachtgever", () => {
    expect(revenueConcentrationPct({ a: 80000, b: 20000 }, "a")).toBe(80);
    expect(revenueConcentrationPct({ a: 1, b: 2 }, "a")).toBe(33);
  });
  it("null zonder omzet", () => {
    expect(revenueConcentrationPct({}, "a")).toBeNull();
    expect(revenueConcentrationPct({ a: 0 }, "a")).toBeNull();
  });
});

describe("jobDbaIndicators", () => {
  it("vertaalt Job-DBA-vlaggen naar monitor-indicatoren", () => {
    expect(
      jobDbaIndicators({ dbaDirectSupervision: true, dbaEmbedded: true, dbaFixedSchedule: false }),
    ).toEqual({
      directionAndSupervision: true,
      fixedSchedule: false,
      sameFunctionAsEmployees: true,
    });
  });

  it("gecombineerd met assessCollaborationDba levert een hoog signaal bij gezag", () => {
    const a = assessCollaborationDba(
      {
        collaborationId: "c1",
        startDate: new Date("2026-05-01"),
        ...jobDbaIndicators({
          dbaDirectSupervision: true,
          dbaEmbedded: false,
          dbaFixedSchedule: false,
        }),
      },
      now,
    );
    expect(a.level).toBe("HOOG");
    expect(a.signals.some((s) => s.key === "supervision")).toBe(true);
  });
});

describe("planDbaMonitorRun", () => {
  const base: DbaMonitorCandidate = {
    collaborationId: "c1",
    startDate: new Date("2025-01-01"),
    freelancerUserId: "f1",
    clientUserId: "cl1",
  };

  it("levert per signaal een dedup-sleutel op voor idempotentie", () => {
    const plan = planDbaMonitorRun([base], now);
    expect(plan.toRaise.length).toBeGreaterThan(0);
    expect(plan.toRaise[0]?.dedupeKey).toBe("dba-c1-duration-12m");
    expect(plan.toRaise[0]?.freelancerUserId).toBe("f1");
    expect(plan.toRaise[0]?.clientUserId).toBe("cl1");
  });

  it("zonder signalen niets te vuren", () => {
    const plan = planDbaMonitorRun([{ ...base, startDate: new Date("2026-05-01") }], now);
    expect(plan.toRaise).toHaveLength(0);
  });
});

const GAP = 35;

describe("effectiveRelationshipStart", () => {
  const ongoing: PlacementSpan = { start: new Date("2026-04-01"), end: null };

  it("één lopende inzet → de eigen start", () => {
    const s = effectiveRelationshipStart([ongoing], new Date("2026-04-01"), now, GAP);
    expect(s?.toISOString()).toBe(new Date("2026-04-01").toISOString());
  });

  it("overbrugt een korte tussenpoos → vroegste start van de keten", () => {
    const spans: PlacementSpan[] = [
      { start: new Date("2025-09-01"), end: new Date("2026-03-20") }, // eindigt kort vóór
      ongoing, // start 2026-04-01, ~12 dagen later
    ];
    const s = effectiveRelationshipStart(spans, ongoing.start, now, GAP);
    expect(s?.toISOString()).toBe(new Date("2025-09-01").toISOString());
  });

  it("een lange onderbreking reset de klok → alleen de lopende keten telt", () => {
    const spans: PlacementSpan[] = [
      { start: new Date("2024-01-01"), end: new Date("2024-06-01") }, // ver in het verleden
      ongoing,
    ];
    const s = effectiveRelationshipStart(spans, ongoing.start, now, GAP);
    expect(s?.toISOString()).toBe(new Date("2026-04-01").toISOString());
  });

  it("keten van drie aaneengesloten inzetten → vroegste start", () => {
    const spans: PlacementSpan[] = [
      { start: new Date("2025-01-01"), end: new Date("2025-06-15") },
      { start: new Date("2025-07-01"), end: new Date("2026-03-25") }, // gaten telkens ≤ 35d
      ongoing,
    ];
    const s = effectiveRelationshipStart(spans, ongoing.start, now, GAP);
    expect(s?.toISOString()).toBe(new Date("2025-01-01").toISOString());
  });

  it("geen enkele span met start → fallback", () => {
    const s = effectiveRelationshipStart([{ start: null, end: null }], null, now, GAP);
    expect(s).toBeNull();
  });

  it("overlappende inzetten worden samengevoegd (vuile data-defensie)", () => {
    const spans: PlacementSpan[] = [
      { start: new Date("2026-02-01"), end: new Date("2026-05-01") }, // overlapt de lopende
      ongoing,
    ];
    const s = effectiveRelationshipStart(spans, ongoing.start, now, GAP);
    expect(s?.toISOString()).toBe(new Date("2026-02-01").toISOString());
  });
});

describe("bridgedPriorPlacementCount", () => {
  it("telt eerdere inzetten binnen de relatie, de lopende niet meegerekend", () => {
    const spans: PlacementSpan[] = [
      { start: new Date("2025-01-01"), end: new Date("2025-06-15") },
      { start: new Date("2025-07-01"), end: new Date("2026-03-25") },
      { start: new Date("2026-04-01"), end: null },
    ];
    expect(bridgedPriorPlacementCount(spans, new Date("2025-01-01"))).toBe(2);
  });

  it("negeert inzetten vóór de effectieve start (afgekapt door een lange onderbreking)", () => {
    const spans: PlacementSpan[] = [
      { start: new Date("2024-01-01"), end: new Date("2024-06-01") },
      { start: new Date("2026-04-01"), end: null },
    ];
    expect(bridgedPriorPlacementCount(spans, new Date("2026-04-01"))).toBe(0);
  });

  it("null effectieve start → 0", () => {
    expect(bridgedPriorPlacementCount([{ start: null, end: null }], null)).toBe(0);
  });
});

describe("assessCollaborationDba — dóórlopende relatie", () => {
  it("een gebridgede relatie ≥12m geeft HOOG met een relatie-tekst en telling", () => {
    // effectieve start 2025-01-01 → 16 maanden op `now`, met 1 eerdere inzet
    const a = assessCollaborationDba(
      { collaborationId: "c1", startDate: new Date("2025-01-01"), bridgedPriorPlacements: 1 },
      now,
    );
    expect(a.level).toBe("HOOG");
    const dur = a.signals.find((s) => s.key === "duration-12m");
    expect(dur?.message).toContain("Deze samenwerking");
    expect(dur?.message).toContain("1 eerdere aaneengesloten inzet");
  });

  it("zonder overbrugde inzetten blijft de melding ongewijzigd (opdracht-tekst)", () => {
    const a = assessCollaborationDba(
      { collaborationId: "c1", startDate: new Date("2025-01-01"), bridgedPriorPlacements: 0 },
      now,
    );
    const dur = a.signals.find((s) => s.key === "duration-12m");
    expect(dur?.message).toContain("Deze opdracht");
    expect(dur?.message).not.toContain("aaneengesloten");
  });

  it("meervoud bij meer dan één overbrugde inzet", () => {
    const a = assessCollaborationDba(
      { collaborationId: "c1", startDate: new Date("2025-11-01"), bridgedPriorPlacements: 3 },
      now,
    );
    const dur = a.signals.find((s) => s.key === "duration-6m");
    expect(dur?.message).toContain("3 eerdere aaneengesloten inzetten");
  });
});
