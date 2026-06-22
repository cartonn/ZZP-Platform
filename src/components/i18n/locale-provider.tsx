"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/messages";

// Client-zijde taalcontext: server-componenten gebruiken getTranslator(); client-componenten
// lezen de taal hier (geseed vanuit de root-layout met de server-cookie) en vertalen met dezelfde
// pure translate()-functie. Zo is er één woordenboek en één gedrag aan beide kanten.

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** `const t = useT(); t("Inloggen")` → vertaald of de NL-brontekst. */
export function useT(): (source: string) => string {
  const locale = useContext(LocaleContext);
  return useMemo(() => (source: string) => translate(locale, source), [locale]);
}
