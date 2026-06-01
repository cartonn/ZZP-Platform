import { describe, expect, it } from "vitest";

import {
  defaultEmailPreferences,
  EMAIL_PREFERENCE_CATEGORIES,
  EMAIL_PREFERENCE_CATEGORY_KEYS,
  emailPreferencesSchema,
  isEmailEnabled,
  isEmailPreferenceCategory,
  resolveEmailPreferences,
} from "@/lib/notification-preferences";

// ---------------------------------------------------------------------------
// EMAIL_PREFERENCE_CATEGORIES + EMAIL_PREFERENCE_CATEGORY_KEYS
// ---------------------------------------------------------------------------

describe("EMAIL_PREFERENCE_CATEGORIES", () => {
  it("bevat exact 4 categorieën", () => {
    expect(EMAIL_PREFERENCE_CATEGORIES).toHaveLength(4);
  });

  it("alle sleutels zijn uniek", () => {
    const keys = EMAIL_PREFERENCE_CATEGORIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("elke categorie heeft een niet-lege label en description", () => {
    for (const cat of EMAIL_PREFERENCE_CATEGORIES) {
      expect(cat.label.trim().length).toBeGreaterThan(0);
      expect(cat.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("bevat de vier verwachte sleutels: payment, invoice, vat, dba", () => {
    const keys = EMAIL_PREFERENCE_CATEGORIES.map((c) => c.key);
    expect(keys).toContain("payment");
    expect(keys).toContain("invoice");
    expect(keys).toContain("vat");
    expect(keys).toContain("dba");
  });
});

describe("EMAIL_PREFERENCE_CATEGORY_KEYS", () => {
  it("bevat dezelfde sleutels in dezelfde volgorde als EMAIL_PREFERENCE_CATEGORIES", () => {
    const expectedKeys = EMAIL_PREFERENCE_CATEGORIES.map((c) => c.key);
    expect(Array.from(EMAIL_PREFERENCE_CATEGORY_KEYS)).toEqual(expectedKeys);
  });

  it("bevat exact 4 sleutels", () => {
    expect(EMAIL_PREFERENCE_CATEGORY_KEYS).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// isEmailPreferenceCategory
// ---------------------------------------------------------------------------

describe("isEmailPreferenceCategory", () => {
  it("geeft true terug voor alle bekende sleutels", () => {
    for (const key of EMAIL_PREFERENCE_CATEGORY_KEYS) {
      expect(isEmailPreferenceCategory(key)).toBe(true);
    }
  });

  it("geeft false terug voor een onbekende string 'system'", () => {
    expect(isEmailPreferenceCategory("system")).toBe(false);
  });

  it("geeft false terug voor een lege string", () => {
    expect(isEmailPreferenceCategory("")).toBe(false);
  });

  it("geeft false terug voor 'PAYMENT' (hoofdletters)", () => {
    expect(isEmailPreferenceCategory("PAYMENT")).toBe(false);
  });

  it("geeft false terug voor willekeurige waarden", () => {
    expect(isEmailPreferenceCategory("onbekend")).toBe(false);
    expect(isEmailPreferenceCategory("123")).toBe(false);
    expect(isEmailPreferenceCategory(" payment")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// defaultEmailPreferences
// ---------------------------------------------------------------------------

describe("defaultEmailPreferences", () => {
  it("bevat exact de 4 bekende sleutels", () => {
    const prefs = defaultEmailPreferences();
    const keys = Object.keys(prefs).sort();
    const expectedKeys = Array.from(EMAIL_PREFERENCE_CATEGORY_KEYS).sort();
    expect(keys).toEqual(expectedKeys);
  });

  it("alle waarden zijn true (opt-out model)", () => {
    const prefs = defaultEmailPreferences();
    for (const key of EMAIL_PREFERENCE_CATEGORY_KEYS) {
      expect(prefs[key]).toBe(true);
    }
  });

  it("geeft een nieuw object terug bij elke aanroep (geen gedeelde referentie)", () => {
    const a = defaultEmailPreferences();
    const b = defaultEmailPreferences();
    a.payment = false;
    expect(b.payment).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resolveEmailPreferences
// ---------------------------------------------------------------------------

describe("resolveEmailPreferences", () => {
  it("lege rijen → alle standaardwaarden true", () => {
    const prefs = resolveEmailPreferences([]);
    for (const key of EMAIL_PREFERENCE_CATEGORY_KEYS) {
      expect(prefs[key]).toBe(true);
    }
  });

  it("rij met emailEnabled=false zet die categorie op false, rest blijft true", () => {
    const prefs = resolveEmailPreferences([{ category: "payment", emailEnabled: false }]);
    expect(prefs.payment).toBe(false);
    expect(prefs.invoice).toBe(true);
    expect(prefs.vat).toBe(true);
    expect(prefs.dba).toBe(true);
  });

  it("onbekende categorie in rijen wordt genegeerd (geen extra sleutels, geen crash)", () => {
    const prefs = resolveEmailPreferences([{ category: "onbekend", emailEnabled: false }]);
    const keys = Object.keys(prefs);
    expect(keys).toHaveLength(4);
    for (const key of EMAIL_PREFERENCE_CATEGORY_KEYS) {
      expect(prefs[key]).toBe(true);
    }
  });

  it("bij dubbele rijen voor dezelfde categorie wint de laatste", () => {
    const prefs = resolveEmailPreferences([
      { category: "vat", emailEnabled: false },
      { category: "vat", emailEnabled: true },
    ]);
    expect(prefs.vat).toBe(true);
  });

  it("bij dubbele rijen wint de laatste ook als de tweede false is", () => {
    const prefs = resolveEmailPreferences([
      { category: "dba", emailEnabled: true },
      { category: "dba", emailEnabled: false },
    ]);
    expect(prefs.dba).toBe(false);
  });

  it("mix van true/false rijen wordt correct verwerkt", () => {
    const prefs = resolveEmailPreferences([
      { category: "payment", emailEnabled: false },
      { category: "invoice", emailEnabled: true },
      { category: "vat", emailEnabled: false },
    ]);
    expect(prefs.payment).toBe(false);
    expect(prefs.invoice).toBe(true);
    expect(prefs.vat).toBe(false);
    expect(prefs.dba).toBe(true);
  });

  it("alle categorieën uitgeschakeld via rijen", () => {
    const rows = Array.from(EMAIL_PREFERENCE_CATEGORY_KEYS).map((key) => ({
      category: key,
      emailEnabled: false,
    }));
    const prefs = resolveEmailPreferences(rows);
    for (const key of EMAIL_PREFERENCE_CATEGORY_KEYS) {
      expect(prefs[key]).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// isEmailEnabled
// ---------------------------------------------------------------------------

describe("isEmailEnabled", () => {
  it("null prefs → true (opt-out: standaard verzenden)", () => {
    expect(isEmailEnabled(null, "payment")).toBe(true);
  });

  it("undefined prefs → true (opt-out: standaard verzenden)", () => {
    expect(isEmailEnabled(undefined, "payment")).toBe(true);
  });

  it("ontbrekende categorie in gedeeltelijke prefs → true", () => {
    expect(isEmailEnabled({}, "invoice")).toBe(true);
  });

  it("expliciet false → false", () => {
    expect(isEmailEnabled({ payment: false }, "payment")).toBe(false);
  });

  it("expliciet true → true", () => {
    expect(isEmailEnabled({ payment: true }, "payment")).toBe(true);
  });

  it("andere categorieën onbeïnvloed wanneer één false is", () => {
    const prefs = { payment: false };
    expect(isEmailEnabled(prefs, "invoice")).toBe(true);
    expect(isEmailEnabled(prefs, "vat")).toBe(true);
    expect(isEmailEnabled(prefs, "dba")).toBe(true);
  });

  it("volledige prefs met alle waarden false → altijd false", () => {
    const prefs = defaultEmailPreferences();
    for (const key of EMAIL_PREFERENCE_CATEGORY_KEYS) {
      prefs[key] = false;
    }
    for (const key of EMAIL_PREFERENCE_CATEGORY_KEYS) {
      expect(isEmailEnabled(prefs, key)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// emailPreferencesSchema
// ---------------------------------------------------------------------------

describe("emailPreferencesSchema", () => {
  const validInput = { payment: true, invoice: false, vat: true, dba: false };

  it("valideert een correct object met 4 booleans", () => {
    const result = emailPreferencesSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });

  it("valideert object met alle waarden true", () => {
    const result = emailPreferencesSchema.safeParse({
      payment: true,
      invoice: true,
      vat: true,
      dba: true,
    });
    expect(result.success).toBe(true);
  });

  it("valideert object met alle waarden false", () => {
    const result = emailPreferencesSchema.safeParse({
      payment: false,
      invoice: false,
      vat: false,
      dba: false,
    });
    expect(result.success).toBe(true);
  });

  it("faalt bij een ontbrekend veld", () => {
    const result = emailPreferencesSchema.safeParse({ payment: true, invoice: false, vat: true });
    expect(result.success).toBe(false);
  });

  it("faalt bij een niet-boolean waarde (string)", () => {
    const result = emailPreferencesSchema.safeParse({
      payment: "ja",
      invoice: false,
      vat: true,
      dba: false,
    });
    expect(result.success).toBe(false);
  });

  it("faalt bij een niet-boolean waarde (getal)", () => {
    const result = emailPreferencesSchema.safeParse({
      payment: 1,
      invoice: false,
      vat: true,
      dba: false,
    });
    expect(result.success).toBe(false);
  });

  it("faalt bij een niet-boolean waarde (null)", () => {
    const result = emailPreferencesSchema.safeParse({
      payment: null,
      invoice: false,
      vat: true,
      dba: false,
    });
    expect(result.success).toBe(false);
  });

  it("faalt bij een leeg object", () => {
    const result = emailPreferencesSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("parse gooit bij ongeldig input", () => {
    expect(() => emailPreferencesSchema.parse({ payment: "nee" })).toThrow();
  });

  it("geeft correct getypeerd resultaat terug", () => {
    const result = emailPreferencesSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      const keys = Object.keys(result.data).sort();
      expect(keys).toEqual(["dba", "invoice", "payment", "vat"]);
    }
  });
});
