// Taalkeuze (i18n). Nederlands is de enige taal die de UI aanbiedt: er is geen taalschakelaar meer,
// omdat maar een fractie van de schermen vertaald was en een halve vertaling verwarrender is dan
// geen. De cookie-laag en `t()` blijven staan (server-side gelezen, deterministisch, geen flits),
// zodat de teksten al door één punt lopen mochten we ooit een volledige taal toevoegen.

export const LOCALES = ["nl", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "nl";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "nl" || value === "en";
}
