import { type Locale } from "@/lib/i18n/config";

// Vertaalwoordenboek per bron-string (NL → EN). We vertalen op de Nederlandse brontekst i.p.v.
// op aparte sleutels: dat houdt de bestaande code (nav.ts, app-shell) ongemoeid — we vertalen
// op het render-moment. Ontbreekt een vertaling, dan valt t() terug op de NL-brontekst (nooit
// een lege of kapotte UI). Dit is de fundering; per increment groeit de dekking mee.

const EN: Record<string, string> = {
  // --- Navigatie (zijbalk-labels) ---
  Dashboard: "Dashboard",
  Acties: "Actions",
  Inzicht: "Insights",
  Opdrachten: "Assignments",
  "Mijn opdrachten": "My assignments",
  Rooster: "Schedule",
  "Mijn reacties": "My applications",
  Opgeslagen: "Saved",
  Samenwerkingen: "Collaborations",
  Berichten: "Messages",
  "Mijn profiel": "My profile",
  Diensten: "Shifts",
  Academie: "Academy",
  Administratie: "Administration",
  Abonnement: "Subscription",
  Ideeën: "Ideas",
  Support: "Support",
  "ZZP'ers": "Freelancers",
  Kandidaten: "Candidates",
  Prestaties: "Deliverables",
  Bedrijfsprofiel: "Company profile",
  Verificaties: "Verifications",
  Disputen: "Disputes",
  "No-shows": "No-shows",
  "Shift-overnames": "Shift handovers",
  Helpdesk: "Help desk",
  Opdrachtgevers: "Clients",
  Toezicht: "Oversight",
  Gebruikers: "Users",
  Financiën: "Finance",
  Configuratie: "Configuration",
  Leads: "Leads",
  "Mijn bemiddeling": "My agency",

  // --- Sectiekoppen in de zijbalk ---
  Werk: "Work",
  Profiel: "Profile",
  Account: "Account",
  Operatie: "Operations",
  Beheer: "Management",
  Bemiddeling: "Agency",

  // --- Rollabels ---
  "ZZP'er": "Freelancer",
  Opdrachtgever: "Client",
  Beheerder: "Admin",
  Bemiddelaar: "Agent",

  // --- App-schil (bovenbalk + accountblok) ---
  "Zoeken…": "Search…",
  "Snelzoeker openen (Ctrl K)": "Open quick search (Ctrl K)",
  Notificaties: "Notifications",
  Uitloggen: "Sign out",
  "Account & privacy": "Account & privacy",
  "Schakel naar donkere modus": "Switch to dark mode",
  "Schakel naar lichte modus": "Switch to light mode",
  "Donkere modus": "Dark mode",
  "Lichte modus": "Light mode",
  "Hoofdinhoud overslaan": "Skip to main content",
  Taal: "Language",
  Nederlands: "Dutch",
  Engels: "English",

  // --- Primaire actie in de bovenbalk (werkruimte) ---
  "Nieuwe opdracht": "New assignment",
  "Opdrachten zoeken": "Find assignments",
  "Dienst uitzetten": "Post a shift",
};

const TABLES: Record<Locale, Record<string, string>> = {
  nl: {},
  en: EN,
};

/**
 * Vertaalt een Nederlandse brontekst naar de gekozen taal. `nl` geeft de brontekst onveranderd
 * terug; `en` geeft de vertaling, of de brontekst als die (nog) niet vertaald is.
 */
export function translate(locale: Locale, source: string): string {
  if (locale === "nl") return source;
  return TABLES[locale][source] ?? source;
}
