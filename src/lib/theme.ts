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

// Het vroegere palette-systeem (3 kleurschema's) is bewust verwijderd: één
// identiteit (Vakwerk) in licht en donker — zie ADR 0007.
