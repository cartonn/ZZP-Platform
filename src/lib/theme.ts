// Themalogica (light/dark) als pure, testbare functies. Dark mode is een GEBRUIKERSKEUZE
// (toggle), niet geforceerd. De UI-laag (ThemeToggle + no-flash-script in layout) gebruikt dit.

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/** Runtime-guard voor een opgeslagen waarde. */
export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** De tegenovergestelde stand (voor een simpele toggle). */
export function nextTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}

/** Minimale vorm van `document.documentElement` die we nodig hebben (zo blijft dit testbaar). */
export interface ThemeRoot {
  classList: { toggle(token: string, force: boolean): void };
}

/** Past het thema toe door de `dark`-class op de root te zetten/weghalen. */
export function applyTheme(theme: Theme, root: ThemeRoot): void {
  root.classList.toggle("dark", theme === "dark");
}

// ---------------------------------------------------------------------------
// Palette (kleurschema) — een ORTHOGONALE as naast light/dark. De palette
// bepaalt de tint/het merk; de `.dark`-class bepaalt de helderheid. Samen
// vormen ze een 3×2-matrix. De palette wordt gezet via het `data-theme`-attribuut
// op <html>; "standaard" = geen attribuut (valt terug op de basis-tokens).
// ---------------------------------------------------------------------------

export const PALETTES = ["standaard", "warm-clay", "indigo"] as const;
export type Palette = (typeof PALETTES)[number];

/** Nederlandse labels voor de UI (geen technische ids tonen). */
export const PALETTE_LABELS: Record<Palette, string> = {
  standaard: "Standaard",
  "warm-clay": "Klei",
  indigo: "Indigo",
};

/** Runtime-guard voor een opgeslagen palette-waarde. */
export function isPalette(value: unknown): value is Palette {
  return value === "standaard" || value === "warm-clay" || value === "indigo";
}

/** De volgende palette in de cyclus (voor een eenvoudige doorloop-knop). */
export function nextPalette(current: Palette): Palette {
  const i = PALETTES.indexOf(current);
  return PALETTES[(i + 1) % PALETTES.length] as Palette;
}

/** Minimale vorm van de root die we nodig hebben voor palette-toepassing. */
export interface PaletteRoot {
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

/** Past de palette toe via `data-theme`. "standaard" verwijdert het attribuut. */
export function applyPalette(palette: Palette, root: PaletteRoot): void {
  if (palette === "standaard") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", palette);
  }
}
