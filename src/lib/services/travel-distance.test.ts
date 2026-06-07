import { describe, expect, it } from "vitest";
import { estimateTravelMinutes, haversineKm } from "@/lib/services/travel-distance";

describe("haversineKm", () => {
  it("is 0 voor hetzelfde punt", () => {
    expect(haversineKm({ lat: 52.37, lon: 4.9 }, { lat: 52.37, lon: 4.9 })).toBe(0);
  });

  it("Amsterdam–Rotterdam ligt rond de 57 km (hemelsbreed)", () => {
    const km = haversineKm({ lat: 52.3676, lon: 4.9041 }, { lat: 51.9225, lon: 4.4792 });
    expect(km).toBeGreaterThan(50);
    expect(km).toBeLessThan(65);
  });
});

describe("estimateTravelMinutes", () => {
  it("geeft 0 minuten binnen dezelfde plaats", () => {
    expect(estimateTravelMinutes("Amsterdam", "Amsterdam")).toBe(0);
  });

  it("is hoofdletterongevoelig en negeert witruimte", () => {
    expect(estimateTravelMinutes(" amsterdam ", "AMSTERDAM")).toBe(0);
  });

  it("schat een realistische reistijd Amsterdam–Rotterdam (~70–100 min)", () => {
    const min = estimateTravelMinutes("Amsterdam", "Rotterdam");
    expect(min).not.toBeNull();
    expect(min!).toBeGreaterThan(70);
    expect(min!).toBeLessThan(100);
  });

  it("verder weg = meer minuten (Amsterdam–Venlo > Amsterdam–Utrecht)", () => {
    expect(estimateTravelMinutes("Amsterdam", "Venlo")!).toBeGreaterThan(
      estimateTravelMinutes("Amsterdam", "Utrecht")!,
    );
  });

  it("geeft null bij een onbekende plaats of lege invoer", () => {
    expect(estimateTravelMinutes("Amsterdam", "Parijs")).toBeNull();
    expect(estimateTravelMinutes("Atlantis", "Rotterdam")).toBeNull();
    expect(estimateTravelMinutes(null, "Rotterdam")).toBeNull();
    expect(estimateTravelMinutes("Amsterdam", "")).toBeNull();
  });
});
