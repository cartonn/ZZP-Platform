import { describe, expect, it } from "vitest";
import {
  AVAILABILITY_STATUS_OPTIONS,
  SELECTABLE_AVAILABILITIES,
  availabilityStatusLabel,
  availabilityStatusSchema,
  isSelectableAvailability,
  selectedAvailability,
} from "@/lib/availability-status";

describe("availability-status", () => {
  it("biedt precies de drie betekenisvolle statussen aan (geen UNKNOWN)", () => {
    expect([...SELECTABLE_AVAILABILITIES]).toEqual(["AVAILABLE", "LIMITED", "UNAVAILABLE"]);
    expect(AVAILABILITY_STATUS_OPTIONS.map((o) => o.value)).toEqual([
      "AVAILABLE",
      "LIMITED",
      "UNAVAILABLE",
    ]);
    expect(AVAILABILITY_STATUS_OPTIONS.some((o) => o.value === ("UNKNOWN" as never))).toBe(false);
  });

  it("elke optie heeft label, hint en tone", () => {
    for (const o of AVAILABILITY_STATUS_OPTIONS) {
      expect(o.label.length).toBeGreaterThan(0);
      expect(o.hint.length).toBeGreaterThan(0);
      expect(["success", "warning", "muted"]).toContain(o.tone);
    }
  });

  it("schema accepteert de drie statussen en weigert UNKNOWN/onzin", () => {
    expect(availabilityStatusSchema.safeParse("AVAILABLE").success).toBe(true);
    expect(availabilityStatusSchema.safeParse("LIMITED").success).toBe(true);
    expect(availabilityStatusSchema.safeParse("UNAVAILABLE").success).toBe(true);
    expect(availabilityStatusSchema.safeParse("UNKNOWN").success).toBe(false);
    expect(availabilityStatusSchema.safeParse("BOGUS").success).toBe(false);
    expect(availabilityStatusSchema.safeParse("").success).toBe(false);
  });

  it("type-guard herkent alleen kiesbare statussen", () => {
    expect(isSelectableAvailability("AVAILABLE")).toBe(true);
    expect(isSelectableAvailability("UNKNOWN")).toBe(false);
    expect(isSelectableAvailability(null)).toBe(false);
    expect(isSelectableAvailability(42)).toBe(false);
  });

  it("labelt bekende statussen, valt terug op Onbekend", () => {
    expect(availabilityStatusLabel("AVAILABLE")).toBe("Beschikbaar");
    expect(availabilityStatusLabel("LIMITED")).toBe("Beperkt beschikbaar");
    expect(availabilityStatusLabel("UNAVAILABLE")).toBe("Niet beschikbaar");
    expect(availabilityStatusLabel("UNKNOWN")).toBe("Onbekend");
    expect(availabilityStatusLabel("xyz")).toBe("Onbekend");
  });

  it("normaliseert de huidige status (UNKNOWN/null → geen selectie)", () => {
    expect(selectedAvailability("LIMITED")).toBe("LIMITED");
    expect(selectedAvailability("UNKNOWN")).toBe(null);
    expect(selectedAvailability(null)).toBe(null);
    expect(selectedAvailability(undefined)).toBe(null);
  });
});
