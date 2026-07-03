import { describe, expect, it } from "vitest";
import {
  categoryForSkill,
  groupSkillsByCategory,
  SKILL_CATEGORY_ORDER,
  type SkillOption,
} from "@/lib/skill-categories";

describe("categoryForSkill", () => {
  it("mapt bekende IT-skills naar 'IT & Software'", () => {
    expect(categoryForSkill("React")).toBe("IT & Software");
    expect(categoryForSkill("TypeScript")).toBe("IT & Software");
    expect(categoryForSkill("Node.js")).toBe("IT & Software");
    expect(categoryForSkill("AWS")).toBe("IT & Software");
  });

  it("mapt zorg-, bouw- en managementskills naar hun categorie", () => {
    expect(categoryForSkill("Verpleegkunde")).toBe("Zorg & Welzijn");
    expect(categoryForSkill("Elektrotechniek")).toBe("Bouw & Techniek");
    expect(categoryForSkill("VCA")).toBe("Bouw & Techniek");
    expect(categoryForSkill("Projectmanagement")).toBe("Management & Advies");
  });

  it("is case- en spatie-ongevoelig", () => {
    expect(categoryForSkill("  react  ")).toBe("IT & Software");
    expect(categoryForSkill("VERPLEEGKUNDE")).toBe("Zorg & Welzijn");
  });

  it("valt terug op 'Overig' voor onbekende skills", () => {
    expect(categoryForSkill("Onderwaterlassen")).toBe("Overig");
    expect(categoryForSkill("")).toBe("Overig");
  });
});

describe("groupSkillsByCategory", () => {
  const options: SkillOption[] = [
    { value: "1", label: "React" },
    { value: "2", label: "Verpleegkunde" },
    { value: "3", label: "VCA" },
    { value: "4", label: "Projectmanagement" },
    { value: "5", label: "Onbekende Skill" },
    { value: "6", label: "TypeScript" },
  ];

  it("groepeert opties onder hun categorie en houdt volgorde binnen de categorie", () => {
    const groups = groupSkillsByCategory(options);
    const it = groups.find((g) => g.category === "IT & Software");
    expect(it?.options.map((o) => o.label)).toEqual(["React", "TypeScript"]);
  });

  it("volgt SKILL_CATEGORY_ORDER en laat lege categorieën weg", () => {
    const groups = groupSkillsByCategory(options);
    const categories = groups.map((g) => g.category);
    // Aanwezig, in de canonieke volgorde; 'Logistiek' ontbreekt (geen opties).
    expect(categories).toEqual([
      "IT & Software",
      "Zorg & Welzijn",
      "Bouw & Techniek",
      "Management & Advies",
      "Overig",
    ]);
    expect(categories).not.toContain("Logistiek");
    // Elke categorie in het resultaat staat in de canonieke volgorde.
    for (const c of categories) expect(SKILL_CATEGORY_ORDER).toContain(c);
  });

  it("geeft een lege lijst voor geen opties", () => {
    expect(groupSkillsByCategory([])).toEqual([]);
  });
});
