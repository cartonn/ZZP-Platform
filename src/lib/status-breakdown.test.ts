import { describe, expect, it } from "vitest";
import { toDonutData, COLLABORATION_SEGMENTS, APPLICATION_SEGMENTS } from "./status-breakdown";

describe("toDonutData", () => {
  it("volgt de vaste segmentvolgorde en vult ontbrekende statussen met 0", () => {
    const data = toDonutData({ ACTIVE: 3, PROPOSED: 1 }, COLLABORATION_SEGMENTS);
    expect(data.map((d) => [d.label, d.value])).toEqual([
      ["Voorgesteld", 1],
      ["Actief", 3],
      ["Afgerond", 0],
      ["Geannuleerd", 0],
    ]);
  });

  it("negeert statussen die niet in de config staan", () => {
    const data = toDonutData({ ONBEKEND: 9, NEW: 2 }, APPLICATION_SEGMENTS);
    expect(data.find((d) => d.label === "Nieuw")?.value).toBe(2);
    expect(data.some((d) => d.value === 9)).toBe(false);
  });

  it("koppelt elke status aan zijn tone", () => {
    const data = toDonutData({ REJECTED: 1 }, APPLICATION_SEGMENTS);
    expect(data.find((d) => d.label === "Afgewezen")?.tone).toBe("danger");
  });
});
