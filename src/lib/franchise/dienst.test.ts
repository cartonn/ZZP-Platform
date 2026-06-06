import { describe, expect, it } from "vitest";
import { dienstSchema } from "@/lib/franchise/dienst";

const base = { title: "Nachtdienst verpleegkundige", description: "Zorg op de nachtafdeling." };

describe("dienstSchema", () => {
  it("accepteert een minimale geldige dienst met standaard werkvorm", () => {
    const r = dienstSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.workMode).toBe("ONSITE");
  });

  it("weigert een te korte titel", () => {
    const r = dienstSchema.safeParse({ ...base, title: "Ja" });
    expect(r.success).toBe(false);
  });

  it("weigert een te korte omschrijving", () => {
    const r = dienstSchema.safeParse({ ...base, description: "kort" });
    expect(r.success).toBe(false);
  });

  it("coerced tariefvelden en accepteert min ≤ max", () => {
    const r = dienstSchema.safeParse({ ...base, rateMin: "40", rateMax: "55" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.rateMin).toBe(40);
      expect(r.data.rateMax).toBe(55);
    }
  });

  it("weigert een minimumtarief hoger dan het maximum (pad rateMax)", () => {
    const r = dienstSchema.safeParse({ ...base, rateMin: 60, rateMax: 40 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path).toContain("rateMax");
  });

  it("staat alleen een minimumtarief toe (open bovengrens)", () => {
    const r = dienstSchema.safeParse({ ...base, rateMin: 45 });
    expect(r.success).toBe(true);
  });
});
