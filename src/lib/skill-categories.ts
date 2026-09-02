// Client-side groepering van skills onder rustige kopjes per categorie/branche.
//
// Het Skill-model (prisma/schema.prisma) heeft géén categorie- of branche-koppeling, en de
// opdracht schrijft voor daar géén schema-veld voor toe te voegen. Daarom groeperen we hier
// deterministisch op skillnaam via een kleine, pure mapping met "Overig"-fallback. Makkelijk
// uitbreidbaar: voeg een naam toe aan de juiste categorie hieronder (case-insensitief).

/**
 * Vaste, gesorteerde volgorde waarin categorieën in de UI verschijnen. Zorg & Welzijn staat
 * vooraan: dat is de kernmarkt, en een verpleegkundige hoort niet eerst AWS en Node.js te zien.
 */
export const SKILL_CATEGORY_ORDER = [
  "Zorg & Welzijn",
  "IT & Software",
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
  wondzorg: "Zorg & Welzijn",
  medicatieverstrekking: "Zorg & Welzijn",
  "palliatieve zorg": "Zorg & Welzijn",
  dementiezorg: "Zorg & Welzijn",
  insulinetoediening: "Zorg & Welzijn",
  katheteriseren: "Zorg & Welzijn",
  infuustherapie: "Zorg & Welzijn",
  crisisinterventie: "Zorg & Welzijn",
  kinderverpleegkunde: "Zorg & Welzijn",
  "spoedeisende hulp": "Zorg & Welzijn",
  "reanimatie (bls)": "Zorg & Welzijn",
  "ok-assistentie": "Zorg & Welzijn",
  "begeleiding gehandicaptenzorg": "Zorg & Welzijn",
  jeugdhulpverlening: "Zorg & Welzijn",
  kraamzorg: "Zorg & Welzijn",
  "geriatrische revalidatie": "Zorg & Welzijn",

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
export interface SkillChipSplit {
  /** Chips die meteen zichtbaar zijn. */
  primary: SkillOption[];
  /** De rest, ingeklapt achter "Meer vaardigheden". */
  more: SkillOption[];
}

/**
 * Splitst vaardigheids-chips in een korte voorhoede en een ingeklapte rest. `relevantIds` (de eigen
 * profielvaardigheden plus wat al gefilterd is) staan altijd vooraan en raken dus nooit verstopt;
 * daarna vult de voorhoede aan in categorie-volgorde (Zorg & Welzijn eerst) tot `limit`. Pure
 * functie — dezelfde invoer geeft altijd exact dezelfde volgorde.
 */
export function splitSkillChips(
  options: SkillOption[],
  relevantIds: readonly string[],
  limit = 12,
): SkillChipSplit {
  const relevant = new Set(relevantIds);
  const upfront = options.filter((o) => relevant.has(o.value));
  const rest = groupSkillsByCategory(options.filter((o) => !relevant.has(o.value))).flatMap(
    (g) => g.options,
  );
  const fill = Math.max(0, limit - upfront.length);
  return { primary: [...upfront, ...rest.slice(0, fill)], more: rest.slice(fill) };
}

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
