import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/messages";

/** Huidige taal uit de cookie; valt terug op de standaard (Nederlands). */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Aan een taal gebonden vertaalfunctie: `t("Dashboard")` → vertaald of de NL-brontekst. */
export type Translator = (source: string) => string;

export async function getTranslator(): Promise<{ locale: Locale; t: Translator }> {
  const locale = await getLocale();
  return { locale, t: (source: string) => translate(locale, source) };
}
