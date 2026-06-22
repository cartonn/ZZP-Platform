// Taalkeuze (i18n). Nederlands is en blijft de standaard; Engels is een optionele schakelaar
// (knop bovenin) zodat Engelstalige bezoekers de kern-UI begrijpen. De keuze leeft in een cookie,
// server-side gelezen — deterministisch, geen flits, geen client-only state.

export const LOCALES = ["nl", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "nl";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "nl" || value === "en";
}

/** Korte labels voor de taalschakelaar. */
export const LOCALE_LABEL: Record<Locale, string> = {
  nl: "NL",
  en: "EN",
};
