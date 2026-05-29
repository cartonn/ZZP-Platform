import { describe, expect, it } from "vitest";
import {
  monthsBetween,
  assessCollaborationDba,
  planDbaMonitorRun,
  jobDbaIndicators,
  DBA_LEVEL_LABEL,
  type DbaMonitorCandidate,
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
    const a = assessCollaborationDba({ collaborationId: "c1", startDate: new Date("2026-04-01") }, now);
    expect(a.level).toBe("LAAG");
    expect(a.signals).toHaveLength(0);
    expect(a.disclaimer).toBe(DBA_DISCLAIMER);
  });

  it("6–12 maanden → verhoogd risico", () => {
    const a = assessCollaborationDba({ collaborationId: "c1", startDate: new Date("2025-10-01") }, now);
    expect(a.level).toBe("VERHOOGD");
    expect(a.signals.some((s) => s.key === "duration-6m")).toBe(true);
  });

  it(">12 maanden → hoog risico", () => {
    const a = assessCollaborationDba({ collaborationId: "c1", startDate: new Date("2025-01-01") }, now);
    expect(a.level).toBe("HOOG");
    expect(a.signals.some((s) => s.key === "duration-12m")).toBe(true);
  });

  it("omzetconcentratie >80% en patroon-indicatoren leveren signalen", () => {
    const a = assessCollaborationDba(
      { collaborationId: "c1", startDate: new Date("2026-05-01"), revenueConcentrationPct: 85, directionAndSupervision: true, fixedSchedule: true },
      now,
    );
    expect(a.level).toBe("HOOG"); // supervision = hoog
    expect(a.signals.map((s) => s.key).sort()).toEqual(["fixed-schedule", "revenue-concentration", "supervision"]);
  });

  it("geen signaal onder de drempel (80%)", () => {
    const a = assessCollaborationDba({ collaborationId: "c1", startDate: new Date("2026-05-01"), revenueConcentrationPct: 79 }, now);
    expect(a.signals).toHaveLength(0);
  });

  it("labels zijn niet-alarmerend Nederlands", () => {
    expect(DBA_LEVEL_LABEL.HOOG).toBe("Hoog risico");
  });
});

describe("jobDbaIndicators", () => {
  it("vertaalt Job-DBA-vlaggen naar monitor-indicatoren", () => {
    expect(jobDbaIndicators({ dbaDirectSupervision: true, dbaEmbedded: true, dbaFixedSchedule: false })).toEqual({
      directionAndSupervision: true,
      fixedSchedule: false,
      sameFunctionAsEmployees: true,
    });
  });

  it("gecombineerd met assessCollaborationDba levert een hoog signaal bij gezag", () => {
    const a = assessCollaborationDba(
      { collaborationId: "c1", startDate: new Date("2026-05-01"), ...jobDbaIndicators({ dbaDirectSupervision: true, dbaEmbedded: false, dbaFixedSchedule: false }) },
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
