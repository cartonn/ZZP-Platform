// Voorkeuren voor terugkerende herinnerings-/signaal-e-mails, per categorie. Opt-out-model:
// een ontbrekende voorkeur betekent "aan" (de gebruiker krijgt de e-mail tot hij hem uitzet).
// In-app notificaties staan hier los van — die blijven altijd de server-side bron van waarheid;
// deze voorkeur stuurt uitsluitend of het bijbehorende e-mailkanaal mag verzenden.
//
// Deze module is puur (geen Prisma, geen React) zodat hij overal — incl. unit-tests en de
// taakrunners — gedeeld kan worden. De databaselaag staat in notification-preferences-data.ts.

import { z } from "zod";

/** De door de gebruiker te beheren e-mailcategorieën. Elke sleutel hoort bij precies één
 *  terugkerende taakrunner (payment-reminders / concept-invoice-reminders / vat-reminder /
 *  dba-monitor). Transactionele e-mails (cascade-bevestigingen, wachtwoord-reset, welkomstmail)
 *  vallen hier bewust buiten — die zijn operationeel en niet uit te zetten. */
export const EMAIL_PREFERENCE_CATEGORIES = [
  {
    key: "payment",
    label: "Betalingsherinneringen",
    description: "E-mails rond openstaande en te late facturen (aanmaningen).",
  },
  {
    key: "invoice",
    label: "Concept-factuurherinneringen",
    description: "Een herinnering wanneer een goedgekeurde prestatie nog niet is gefactureerd.",
  },
  {
    key: "vat",
    label: "BTW-aangifteherinneringen",
    description: "Een seintje rond het einde van een btw-aangifteperiode.",
  },
  {
    key: "dba",
    label: "DBA-signalen",
    description: "Een melding wanneer een samenwerking een verhoogd DBA-risico laat zien.",
  },
] as const;

export type EmailPreferenceCategory = (typeof EMAIL_PREFERENCE_CATEGORIES)[number]["key"];

/** De sleutels los, in vaste volgorde. */
export const EMAIL_PREFERENCE_CATEGORY_KEYS: readonly EmailPreferenceCategory[] =
  EMAIL_PREFERENCE_CATEGORIES.map((c) => c.key);

/** Type-guard: is een willekeurige string een bekende e-mailvoorkeurcategorie? */
export function isEmailPreferenceCategory(value: string): value is EmailPreferenceCategory {
  return (EMAIL_PREFERENCE_CATEGORY_KEYS as readonly string[]).includes(value);
}

export type EmailPreferenceMap = Record<EmailPreferenceCategory, boolean>;

/** Standaardvoorkeuren: alles aan (opt-out-model). */
export function defaultEmailPreferences(): EmailPreferenceMap {
  const out = {} as EmailPreferenceMap;
  for (const key of EMAIL_PREFERENCE_CATEGORY_KEYS) out[key] = true;
  return out;
}

/** Bouw een volledige voorkeurenkaart uit opgeslagen rijen. Onbekende categorieën worden genegeerd;
 *  ontbrekende categorieën vallen terug op de standaard (aan). De laatste rij per categorie wint. */
export function resolveEmailPreferences(
  rows: ReadonlyArray<{ category: string; emailEnabled: boolean }>,
): EmailPreferenceMap {
  const out = defaultEmailPreferences();
  for (const row of rows) {
    if (isEmailPreferenceCategory(row.category)) out[row.category] = row.emailEnabled;
  }
  return out;
}

/** Mag het e-mailkanaal van deze categorie verzenden? Onbekende categorie of ontbrekende waarde
 *  ⇒ true (opt-out: standaard verzenden). */
export function isEmailEnabled(
  prefs: Partial<EmailPreferenceMap> | null | undefined,
  category: EmailPreferenceCategory,
): boolean {
  if (!prefs) return true;
  const value = prefs[category];
  return value === undefined ? true : value;
}

/** Zod-schema voor het bijwerken van de voorkeuren: één boolean per categorie. */
export const emailPreferencesSchema = z.object(
  Object.fromEntries(EMAIL_PREFERENCE_CATEGORY_KEYS.map((key) => [key, z.boolean()])) as Record<
    EmailPreferenceCategory,
    z.ZodBoolean
  >,
);

export type EmailPreferencesInput = z.infer<typeof emailPreferencesSchema>;
