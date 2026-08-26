import { describe, it, expect } from "vitest";
import { buildPoolOutstandingGlance } from "@/lib/franchise/pool-outstanding";
import type { PoolOutstandingTotals } from "@/lib/franchise/client-outstanding";

const totals = (over: Partial<PoolOutstandingTotals> = {}): PoolOutstandingTotals => ({
  totalOpenCents: 0,
  overdueCents: 0,
  overdueCount: 0,
  clientsOverdue: 0,
  ...over,
});

describe("buildPoolOutstandingGlance", () => {
  it("geeft null wanneer er niets openstaat (rustig startscherm)", () => {
    expect(buildPoolOutstandingGlance(totals())).toBeNull();
  });

  it("geeft null bij een negatief totaal (data-ruis) — geen tegel", () => {
    expect(buildPoolOutstandingGlance(totals({ totalOpenCents: -100 }))).toBeNull();
  });

  it("toont een neutrale glance wanneer alles binnen termijn is", () => {
    const glance = buildPoolOutstandingGlance(totals({ totalOpenCents: 500_00 }));
    expect(glance).toEqual({
      totalOpenCents: 500_00,
      overdueCents: 0,
      overdueCount: 0,
      clientsOverdue: 0,
      tone: "neutral",
    });
  });

  it("zet de toon op waarschuwing zodra er iets te laat is", () => {
    const glance = buildPoolOutstandingGlance(
      totals({
        totalOpenCents: 900_00,
        overdueCents: 400_00,
        overdueCount: 2,
        clientsOverdue: 1,
      }),
    );
    expect(glance?.tone).toBe("warning");
    expect(glance?.overdueCents).toBe(400_00);
    expect(glance?.clientsOverdue).toBe(1);
  });

  it("draagt de pool-totalen ongewijzigd door", () => {
    const glance = buildPoolOutstandingGlance(
      totals({ totalOpenCents: 1_234_56, overdueCents: 12_00, overdueCount: 1, clientsOverdue: 1 }),
    );
    expect(glance?.totalOpenCents).toBe(1_234_56);
    expect(glance?.overdueCount).toBe(1);
  });
});
