// Client-side groepering van skills onder rustige kopjes per categorie/branche.
//
// Het Skill-model (prisma/schema.prisma) heeft géén categorie- of branche-koppeling, en de
// opdracht schrijft voor daar géén schema-veld voor toe te voegen. Daarom groeperen we hier
// deterministisch op skillnaam via een kleine, pure mapping met "Overig"-fallback. Makkelijk
// uitbreidbaar: voeg een naam toe aan de juiste categorie hieronder (case-insensitief).

/** Vaste, gesorteerde volgorde waarin categorieën in de UI verschijnen. */
export const SKILL_CATEGORY_ORDER = [
  "IT & Software",
  "Zorg & Welzijn",
  "Bouw & Techniek",
  "Logistiek",
  "Management & Advies",
  "Overig",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORY_ORDER)[number];

// Expliciete naam → categorie. Sleutels zijn genormaliseerd (lowercase, getrimd) zodat de
// mapping ongevoelig is voor hoofdletters. Onbekende skills vallen terug op "Overig".
const SKILL_TO_CATEGORY: Record<string, SkillCategory> = {
  react: "IT & Software",
  typescript: "IT & Software",
  "node.js": "IT & Software",
  nodejs: "IT & Software",
  python: "IT & Software",
  aws: "IT & Software",
  scrum: "IT & Software",

  verpleegkunde: "Zorg & Welzijn",

  elektrotechniek: "Bouw & Techniek",
  vca: "Bouw & Techniek",

  projectmanagement: "Management & Advies",
};

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/** Categorie voor één skillnaam; deterministisch, met "Overig" als terugval. */
export function categoryForSkill(name: string): SkillCategory {
  return SKILL_TO_CATEGORY[normalize(name)] ?? "Overig";
}

export interface SkillOption {
  value: string;
  label: string;
}

export interface SkillCategoryGroup {
  category: SkillCategory;
  options: SkillOption[];
}

/**
 * Groepeer skill-opties onder hun categorie. Categorieën volgen SKILL_CATEGORY_ORDER; lege
 * categorieën worden weggelaten. Binnen een categorie blijft de meegegeven volgorde behouden
 * (de aanroeper sorteert al alfabetisch), zodat de UI stabiel en voorspelbaar is.
 */
export function groupSkillsByCategory(options: SkillOption[]): SkillCategoryGroup[] {
  const buckets = new Map<SkillCategory, SkillOption[]>();
  for (const option of options) {
    const category = categoryForSkill(option.label);
    const bucket = buckets.get(category);
    if (bucket) bucket.push(option);
    else buckets.set(category, [option]);
  }
  return SKILL_CATEGORY_ORDER.filter((category) => buckets.has(category)).map((category) => ({
    category,
    options: buckets.get(category)!,
  }));
}
