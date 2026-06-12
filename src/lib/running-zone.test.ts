import { describe, expect, it } from "vitest";
import { RUNNING_ZONE_LIMIT, runningZonePlan } from "@/lib/running-zone";

describe("runningZonePlan", () => {
  it("geen overloop zolang het totaal binnen de zone past", () => {
    expect(runningZonePlan(0).overflow).toBe(0);
    expect(runningZonePlan(1).overflow).toBe(0);
    expect(runningZonePlan(RUNNING_ZONE_LIMIT).overflow).toBe(0);
  });

  it("overloop = totaal − grens zodra er meer loopt dan de zone toont", () => {
    expect(runningZonePlan(RUNNING_ZONE_LIMIT + 1).overflow).toBe(1);
    expect(runningZonePlan(RUNNING_ZONE_LIMIT + 14).overflow).toBe(14);
  });

  it("weekoverzicht pas vanaf 2 lopende samenwerkingen", () => {
    expect(runningZonePlan(0).showWeek).toBe(false);
    expect(runningZonePlan(1).showWeek).toBe(false);
    expect(runningZonePlan(2).showWeek).toBe(true);
  });

  it("weekoverzicht alleen op volledige data — boven de grens zou de telling liegen", () => {
    expect(runningZonePlan(RUNNING_ZONE_LIMIT).showWeek).toBe(true);
    expect(runningZonePlan(RUNNING_ZONE_LIMIT + 1).showWeek).toBe(false);
  });

  it("eigen grens overschrijft de default", () => {
    expect(runningZonePlan(5, 3)).toEqual({ overflow: 2, showWeek: false });
    expect(runningZonePlan(3, 3)).toEqual({ overflow: 0, showWeek: true });
  });
});
