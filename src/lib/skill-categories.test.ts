import { describe, expect, it } from "vitest";
import {
  categoryForSkill,
  groupSkillsByCategory,
  SKILL_CATEGORY_ORDER,
  splitSkillChips,
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
    // Aanwezig, in de canonieke volgorde (Zorg & Welzijn eerst); 'Logistiek' ontbreekt (geen opties).
    expect(categories).toEqual([
      "Zorg & Welzijn",
      "IT & Software",
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

describe("splitSkillChips", () => {
  const chipOptions: SkillOption[] = [
    { value: "react", label: "React" },
    { value: "aws", label: "AWS" },
    { value: "verpleegkunde", label: "Verpleegkunde" },
    { value: "vca", label: "VCA" },
    { value: "onbekend", label: "Onbekende Skill" },
  ];

  it("zet relevante vaardigheden vooraan, ongeacht hun categorie", () => {
    const { primary } = splitSkillChips(chipOptions, ["aws"], 2);
    expect(primary.map((o) => o.value)).toEqual(["aws", "verpleegkunde"]);
  });

  it("vult de voorhoede aan in categorie-volgorde: zorg vóór IT", () => {
    const { primary, more } = splitSkillChips(chipOptions, [], 2);
    expect(primary.map((o) => o.label)).toEqual(["Verpleegkunde", "React"]);
    expect(more.map((o) => o.label)).toEqual(["AWS", "VCA", "Onbekende Skill"]);
  });

  it("verbergt nooit een relevante vaardigheid, ook niet boven de limiet", () => {
    const { primary, more } = splitSkillChips(chipOptions, ["react", "aws", "vca"], 1);
    expect(primary.map((o) => o.value)).toEqual(["react", "aws", "vca"]);
    expect(more.some((o) => ["react", "aws", "vca"].includes(o.value))).toBe(false);
  });

  it("splitst elke optie in precies één van beide lijsten", () => {
    const { primary, more } = splitSkillChips(chipOptions, ["vca"], 3);
    expect([...primary, ...more]).toHaveLength(chipOptions.length);
    expect(new Set([...primary, ...more].map((o) => o.value)).size).toBe(chipOptions.length);
  });

  it("geeft lege lijsten voor geen opties", () => {
    expect(splitSkillChips([], [])).toEqual({ primary: [], more: [] });
  });
});
