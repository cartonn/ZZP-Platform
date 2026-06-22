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

  // --- Login / registratie ---
  "E-mail": "Email",
  Wachtwoord: "Password",
  Inloggen: "Sign in",
  "Bezig met inloggen…": "Signing in…",
  "Log in om verder te gaan naar je dashboard.": "Sign in to continue to your dashboard.",
  "Je wachtwoord is gewijzigd. Log in met je nieuwe wachtwoord.":
    "Your password has been changed. Sign in with your new password.",
  "Wachtwoord vergeten?": "Forgot your password?",
  "Nog geen account?": "No account yet?",
  Registreren: "Sign up",

  // --- Werkruimte (#19 dashboard) — gedeelde chrome ---
  "Alles tonen": "View all",
  "Nog niets om te tonen.": "Nothing to show yet.",
  "per uur": "per hour",
  match: "match",
  "Volgende acties": "Next actions",
  "Niets dat nu aandacht vraagt. Goed bezig.": "Nothing needs your attention. Well done.",
  "Rapport openen": "Open report",
  Werkruimte: "Workspace",
  Week: "Week",
  ma: "Mon",
  di: "Tue",
  wo: "Wed",
  do: "Thu",
  vr: "Fri",
  za: "Sat",
  zo: "Sun",
  dienst: "shift",
  diensten: "shifts",

  // --- ZZP'er-dashboard: KPI's, inzetbaarheid, beschikbaarheid ---
  Profielvelden: "Profile fields",
  "Geverifieerde certificaten": "Verified credentials",
  "Opdrachten voor jou": "Assignments for you",
  "Nog geen passende opdrachten — maak je profiel compleet voor betere matches.":
    "No matching assignments yet — complete your profile for better matches.",
  Inzetbaarheid: "Availability status",
  Status: "Status",
  "Open aandachtspunten": "Open attention points",
  // Inzetbaarheidsstatus (engageability)
  Inzetbaar: "Available for work",
  "Aandacht nodig": "Needs attention",
  "Nog niet inzetbaar": "Not yet available",
  // Beschikbaarheid (availability)
  Beschikbaar: "Available",
  Beperkt: "Limited",
  "Niet beschikbaar": "Unavailable",

  // --- Login: vertrouwens-strip (marketing) ---
  "Waarom ZZP Platform": "Why ZZP Platform",
  "Certificaten geverifieerd": "Credentials verified",
  "VOG, diploma's en BIG-registratie worden handmatig gecontroleerd.":
    "Police certificates, diplomas and professional registrations are checked manually.",
  "Wet-DBA-proof": "Compliant with Dutch labour law",
  "Bij elke opdracht een modelovereenkomst — geen schijnzelfstandigheid.":
    "A model agreement with every assignment — no bogus self-employment.",
  "Verklaarbare match": "Explainable matching",
  "Je ziet bij elke opdracht waaróm die bij je past.":
    "For every assignment you see exactly why it fits you.",
  "Geverifieerd dossier is je startkapitaal": "A verified profile is your head start",
  "Je hebt geen reviews nodig om te beginnen — een volledig dossier spreekt voor zich.":
    "You don't need reviews to start — a complete profile speaks for itself.",
  "Gatenvrije factuurnummering": "Gap-free invoice numbering",
  "Facturen krijgen een eigen, doorlopende nummering per partij — jouw boekhouding sluit altijd aan.":
    "Invoices get their own sequential numbering per party — your bookkeeping always reconciles.",
  Diploma: "Diploma",
  Verzekering: "Insurance",
  "geverifieerde certificaten": "verified credentials",
  "geverifieerde ZZP'ers": "verified freelancers",
  "afgeronde samenwerkingen": "completed collaborations",
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
