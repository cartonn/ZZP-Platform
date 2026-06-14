import { describe, expect, it } from "vitest";
import {
  indirectHoursEntrySchema,
  sumIndirectHours,
  groupIndirectHoursByCategory,
  INDIRECT_HOUR_CATEGORIES,
} from "@/lib/tax/indirect-hours";

// ---------------------------------------------------------------------------
// Schema-validatie
// ---------------------------------------------------------------------------

describe("indirectHoursEntrySchema", () => {
  it("accepteert een geldige invoer", () => {
    const result = indirectHoursEntrySchema.safeParse({
      workedOn: "2026-06-01",
      hours: 2.5,
      category: "ACQUISITIE",
      note: "Offerte uitgewerkt",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hours).toBe(2.5);
      expect(result.data.category).toBe("ACQUISITIE");
    }
  });

  it("accepteert een lege notitie als geldige invoer", () => {
    const result = indirectHoursEntrySchema.safeParse({
      workedOn: "2026-06-01",
      hours: 1,
      category: "ADMINISTRATIE",
      note: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepteert invoer zonder notitie (optioneel veld)", () => {
    const result = indirectHoursEntrySchema.safeParse({
      workedOn: "2026-01-15",
      hours: 0.25,
      category: "SCHOLING",
    });
    expect(result.success).toBe(true);
  });

  it("weigert een datum in de toekomst", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const result = indirectHoursEntrySchema.safeParse({
      workedOn: futureDate.toISOString(),
      hours: 1,
      category: "REISTIJD",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("toekomst"))).toBe(true);
    }
  });

  it("weigert uren die geen veelvoud van 0,25 zijn", () => {
    const result = indirectHoursEntrySchema.safeParse({
      workedOn: "2026-06-01",
      hours: 1.3,
      category: "ADMINISTRATIE",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("15 minuten"))).toBe(true);
    }
  });

  it("weigert uren groter dan 24", () => {
    const result = indirectHoursEntrySchema.safeParse({
      workedOn: "2026-06-01",
      hours: 24.25,
      category: "OVERIG",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("24"))).toBe(true);
    }
  });

  it("weigert uren van 0 of minder", () => {
    const result = indirectHoursEntrySchema.safeParse({
      workedOn: "2026-06-01",
      hours: 0,
      category: "ACQUISITIE",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("groter"))).toBe(true);
    }
  });

  it("weigert een ongeldige categorie", () => {
    const result = indirectHoursEntrySchema.safeParse({
      workedOn: "2026-06-01",
      hours: 1,
      category: "ONBEKEND",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sumIndirectHours
// ---------------------------------------------------------------------------

describe("sumIndirectHours", () => {
  it("berekent de som van een reeks uren", () => {
    const items = [{ hours: 1.5 }, { hours: 2.25 }, { hours: 0.75 }];
    expect(sumIndirectHours(items)).toBe(4.5);
  });

  it("geeft 0 terug voor een lege reeks", () => {
    expect(sumIndirectHours([])).toBe(0);
  });

  it("rondt af op 2 decimalen", () => {
    // 0.1 + 0.2 geeft floating-point drift; de functie moet dit corrigeren
    const items = [{ hours: 0.1 }, { hours: 0.2 }];
    const result = sumIndirectHours(items);
    expect(result).toBe(0.3);
  });
});

// ---------------------------------------------------------------------------
// groupIndirectHoursByCategory
// ---------------------------------------------------------------------------

describe("groupIndirectHoursByCategory", () => {
  it("groepeert subtotalen in canonieke volgorde", () => {
    const items = [
      { category: "SCHOLING" as const, hours: 3 },
      { category: "ACQUISITIE" as const, hours: 2 },
      { category: "SCHOLING" as const, hours: 1 },
    ];
    const result = groupIndirectHoursByCategory(items);
    // ACQUISITIE staat vóór SCHOLING in de canonieke volgorde
    expect(result).toHaveLength(2);
    const [first, second] = result;
    expect(first?.category).toBe("ACQUISITIE");
    expect(first?.hours).toBe(2);
    expect(second?.category).toBe("SCHOLING");
    expect(second?.hours).toBe(4);
  });

  it("laat categorieën met 0 uur weg", () => {
    const items = [{ category: "REISTIJD" as const, hours: 1.5 }];
    const result = groupIndirectHoursByCategory(items);
    const categories = result.map((r) => r.category);
    expect(categories).toEqual(["REISTIJD"]);
    // Andere categorieën mogen niet aanwezig zijn
    expect(categories).not.toContain("ACQUISITIE");
  });

  it("geeft een lege array terug bij geen invoer", () => {
    expect(groupIndirectHoursByCategory([])).toEqual([]);
  });

  it("rondt subtotalen af op 2 decimalen", () => {
    const items = [
      { category: "ADMINISTRATIE" as const, hours: 0.1 },
      { category: "ADMINISTRATIE" as const, hours: 0.2 },
    ];
    const result = groupIndirectHoursByCategory(items);
    expect(result).toHaveLength(1);
    expect(result[0]?.hours).toBe(0.3);
  });

  it("bevat labels voor elke teruggegeven categorie", () => {
    const items = INDIRECT_HOUR_CATEGORIES.map((category) => ({ category, hours: 1 }));
    const result = groupIndirectHoursByCategory(items);
    expect(result).toHaveLength(5);
    for (const row of result) {
      expect(typeof row.label).toBe("string");
      expect(row.label.length).toBeGreaterThan(0);
    }
  });
});
