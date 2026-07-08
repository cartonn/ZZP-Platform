import { describe, it, expect } from "vitest";
import {
  workExperienceSchema,
  formatWorkPeriod,
  sortWorkExperiences,
  WORK_EXPERIENCE_MIN_YEAR,
  WORK_EXPERIENCE_MAX_YEAR,
  type WorkExperienceLike,
} from "./work-experience";

function exp(over: Partial<WorkExperienceLike> & { id: string }): WorkExperienceLike {
  return {
    role: "Rol",
    organization: "Org",
    startYear: 2020,
    endYear: null,
    description: null,
    ...over,
  };
}

describe("workExperienceSchema", () => {
  it("accepteert een geldige lopende ervaring (leeg eindjaar → null)", () => {
    const r = workExperienceSchema.safeParse({
      role: "  Verpleegkundige  ",
      organization: "Ziekenhuis",
      startYear: "2019",
      endYear: "",
      description: "  ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.role).toBe("Verpleegkundige");
      expect(r.data.endYear).toBeNull();
      expect(r.data.description).toBeNull();
    }
  });

  it("coerct jaartallen en behoudt een geldig bereik", () => {
    const r = workExperienceSchema.safeParse({
      role: "Dev",
      organization: "Org",
      startYear: "2018",
      endYear: "2021",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.startYear).toBe(2018);
      expect(r.data.endYear).toBe(2021);
    }
  });

  it("weigert een eindjaar vóór het startjaar", () => {
    const r = workExperienceSchema.safeParse({
      role: "Dev",
      organization: "Org",
      startYear: "2021",
      endYear: "2019",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.flatten().fieldErrors.endYear?.[0]).toMatch(/vóór het startjaar/i);
    }
  });

  it("weigert een lege rol of organisatie", () => {
    expect(
      workExperienceSchema.safeParse({
        role: "   ",
        organization: "Org",
        startYear: "2020",
      }).success,
    ).toBe(false);
    expect(
      workExperienceSchema.safeParse({
        role: "Dev",
        organization: "",
        startYear: "2020",
      }).success,
    ).toBe(false);
  });

  it("weigert jaartallen buiten het toegestane bereik", () => {
    expect(
      workExperienceSchema.safeParse({
        role: "Dev",
        organization: "Org",
        startYear: String(WORK_EXPERIENCE_MIN_YEAR - 1),
      }).success,
    ).toBe(false);
    expect(
      workExperienceSchema.safeParse({
        role: "Dev",
        organization: "Org",
        startYear: String(WORK_EXPERIENCE_MAX_YEAR + 1),
      }).success,
    ).toBe(false);
  });
});

describe("formatWorkPeriod", () => {
  it("toont 'heden' bij een leeg eindjaar", () => {
    expect(formatWorkPeriod(2019, null)).toBe("2019 – heden");
  });
  it("toont één jaar wanneer start en eind gelijk zijn", () => {
    expect(formatWorkPeriod(2021, 2021)).toBe("2021");
  });
  it("toont een bereik", () => {
    expect(formatWorkPeriod(2019, 2022)).toBe("2019 – 2022");
  });
});

describe("sortWorkExperiences", () => {
  it("zet lopende ervaring bovenaan, daarna op eindjaar en startjaar aflopend", () => {
    const items = [
      exp({ id: "a", startYear: 2015, endYear: 2018 }),
      exp({ id: "b", startYear: 2020, endYear: null }), // lopend
      exp({ id: "c", startYear: 2018, endYear: 2020 }),
    ];
    expect(sortWorkExperiences(items).map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("gebruikt een stabiele tiebreak op id en muteert de invoer niet", () => {
    const items = [
      exp({ id: "z", startYear: 2020, endYear: 2022 }),
      exp({ id: "a", startYear: 2020, endYear: 2022 }),
    ];
    const original = items.map((i) => i.id);
    expect(sortWorkExperiences(items).map((i) => i.id)).toEqual(["a", "z"]);
    expect(items.map((i) => i.id)).toEqual(original);
  });
});
