import { describe, expect, it } from "vitest";
import { performanceFormDefaults, type StoredPerformance } from "@/lib/performance-form";

function base(overrides: Partial<StoredPerformance> = {}): StoredPerformance {
  return {
    type: "HOURS",
    hours: null,
    amountCents: null,
    milestoneTitle: null,
    periodStart: null,
    periodEnd: null,
    description: "",
    ortSegments: null,
    shifts: null,
    ...overrides,
  };
}

describe("performanceFormDefaults", () => {
  it("losse uren: vult het uren-veld als er geen ORT/diensten zijn", () => {
    const d = performanceFormDefaults(base({ hours: 8, description: "Week 1" }));
    expect(d.type).toBe("HOURS");
    expect(d.hours).toBe("8");
    expect(d.description).toBe("Week 1");
    expect(d.shifts).toEqual([]);
    expect(d.manualOrt.ort_normal).toBe("");
  });

  it("diensten worden letterlijk teruggezet en onderdrukken het uren-veld", () => {
    const d = performanceFormDefaults(
      base({
        hours: 9,
        shifts: JSON.stringify([{ start: "2026-06-02T18:00", end: "2026-06-03T02:00" }]),
        ortSegments: JSON.stringify([{ category: "NIGHT", hours: 6 }]),
      }),
    );
    expect(d.shifts).toEqual([{ start: "2026-06-02T18:00", end: "2026-06-03T02:00" }]);
    expect(d.hours).toBe(""); // afgeleid uit diensten, niet apart tonen
    expect(d.manualOrt.ort_night).toBe(""); // bij diensten geen handmatige ORT voorvullen
  });

  it("handmatige ORT-segmenten (zonder diensten) vullen de categorie-velden", () => {
    const d = performanceFormDefaults(
      base({
        ortSegments: JSON.stringify([
          { category: "NORMAL", hours: 4 },
          { category: "SUNDAY", hours: 3 },
        ]),
      }),
    );
    expect(d.manualOrt.ort_normal).toBe("4");
    expect(d.manualOrt.ort_sunday).toBe("3");
    expect(d.manualOrt.ort_evening).toBe("");
    expect(d.hours).toBe(""); // ORT aanwezig → losse uren niet tonen
  });

  it("MILESTONE: bedrag in euro's + titel", () => {
    const d = performanceFormDefaults(
      base({ type: "MILESTONE", amountCents: 250000, milestoneTitle: "Mijlpaal 1" }),
    );
    expect(d.type).toBe("MILESTONE");
    expect(d.amount).toBe("2500");
    expect(d.milestoneTitle).toBe("Mijlpaal 1");
  });

  it("periode wordt als datum (yyyy-mm-dd) teruggegeven", () => {
    const d = performanceFormDefaults(
      base({
        periodStart: new Date("2026-06-01T00:00:00Z"),
        periodEnd: new Date("2026-06-07T00:00:00Z"),
      }),
    );
    expect(d.periodStart).toBe("2026-06-01");
    expect(d.periodEnd).toBe("2026-06-07");
  });

  it("verdraagt corrupte JSON zonder te crashen", () => {
    const d = performanceFormDefaults(base({ shifts: "{niet-json", ortSegments: "ook niet" }));
    expect(d.shifts).toEqual([]);
    expect(d.manualOrt.ort_normal).toBe("");
  });
});
