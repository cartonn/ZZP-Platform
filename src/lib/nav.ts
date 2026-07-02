import { type UserRole } from "@/lib/enums";
import { TERM_PLURAL } from "@/lib/terminology";

export type NavIcon =
  | "dashboard"
  | "inbox"
  | "briefcase"
  | "users"
  | "fileCheck"
  | "files"
  | "messages"
  | "receipt"
  | "fileText"
  | "wallet"
  | "shield"
  | "user"
  | "building"
  | "handshake"
  | "creditCard"
  | "calendar"
  | "clock"
  | "barChart"
  | "trendingUp"
  | "lightbulb"
  | "contact"
  | "graduationCap"
  | "settings"
  | "bookmark";

export interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
  /** Sectiekop waaronder dit item valt (leeg = bovenaan, zonder kop). */
  section?: string;
  /** false = nog niet gebouwd (toont als placeholder), voorkomt dode links in Sessie 0. */
  enabled: boolean;
}

// Role-aware navigatie, gegroepeerd in semantische secties (de sidebar rendert een kop zodra
// de sectie wisselt). Volgorde = werkstroom van de gebruiker: eerst werk, dan dossier/zakelijk.
// Elk item krijgt een `section` zodat de zijbalk (labels standaard zichtbaar) altijd onder een
// rustige kop valt — geen naamloze icoon-rail meer.
const NAV: Record<UserRole, NavItem[]> = {
  FREELANCER: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", section: "Werk", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.action, href: "/acties", icon: "inbox", section: "Werk", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.job, href: "/opdrachten", icon: "briefcase", section: "Werk", enabled: true }, // prettier-ignore
    { label: "Rooster", href: "/rooster", icon: "calendar", section: "Werk", enabled: true }, // prettier-ignore
    { label: `Mijn ${TERM_PLURAL.application.toLowerCase()}`, href: "/reacties", icon: "files", section: "Werk", enabled: true }, // prettier-ignore
    { label: "Opgeslagen", href: "/opgeslagen", icon: "bookmark", section: "Werk", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.collaboration, href: "/samenwerkingen", icon: "handshake", section: "Werk", enabled: true }, // prettier-ignore
    // Certificaten, Beschikbaarheid en Documenten zitten nu als tabs in "Mijn profiel"
    // (de profielhub), dus niet meer apart in de zijbalk.
    { label: "Mijn profiel", href: "/profiel", icon: "user", section: "Dossier", enabled: true }, // prettier-ignore
    { label: "Urenstaten", href: "/diensten", icon: "clock", section: "Dossier", enabled: true }, // prettier-ignore
    // Facturen, Boekhouding, Openstaand, Ontzorgd en Prognose zitten nu als tabs in de
    // Administratie-hub (/financien), dus niet meer apart in de zijbalk.
    { label: "Administratie", href: "/financien", icon: "fileText", section: "Zakelijk", enabled: true }, // prettier-ignore
    { label: "Abonnement", href: "/abonnement", icon: "creditCard", section: "Zakelijk", enabled: true }, // prettier-ignore
    { label: "Inzicht", href: "/inzicht", icon: "barChart", section: "Zakelijk", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.message, href: "/berichten", icon: "messages", section: "Overig", enabled: true }, // prettier-ignore
    { label: "Academie", href: "/academie", icon: "graduationCap", section: "Overig", enabled: true }, // prettier-ignore
    { label: "Ideeën", href: "/ideeen", icon: "lightbulb", section: "Overig", enabled: true }, // prettier-ignore
    { label: "Support", href: "/support", icon: "messages", section: "Overig", enabled: true }, // prettier-ignore
  ],
  CLIENT: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", section: "Werk", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.action, href: "/acties", icon: "inbox", section: "Werk", enabled: true }, // prettier-ignore
    { label: `Mijn ${TERM_PLURAL.job.toLowerCase()}`, href: "/opdrachten", icon: "briefcase", section: "Werk", enabled: true }, // prettier-ignore
    { label: "ZZP'ers vinden", href: "/freelancers", icon: "users", section: "Werk", enabled: true }, // prettier-ignore
    // Flexpool zit nu als tab in de bedrijfsprofiel-hub (/bedrijf?tab=flexpool), niet meer apart.
    { label: "Reacties", href: "/kandidaten", icon: "users", section: "Werk", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.collaboration, href: "/samenwerkingen", icon: "handshake", section: "Werk", enabled: true }, // prettier-ignore
    { label: "Uren goedkeuren", href: "/prestaties", icon: "fileCheck", section: "Werk", enabled: true }, // prettier-ignore
    // Facturen, Boekhouding, Openstaand en Verplichtingen zitten nu als tabs in de
    // Administratie-hub (/financien), dus niet meer apart in de zijbalk.
    { label: "Administratie", href: "/financien", icon: "fileText", section: "Zakelijk", enabled: true }, // prettier-ignore
    { label: "Bedrijfsprofiel", href: "/bedrijf", icon: "building", section: "Zakelijk", enabled: true }, // prettier-ignore
    { label: "Abonnement", href: "/abonnement", icon: "creditCard", section: "Zakelijk", enabled: true }, // prettier-ignore
    { label: "Inzicht", href: "/inzicht", icon: "barChart", section: "Zakelijk", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.message, href: "/berichten", icon: "messages", section: "Overig", enabled: true }, // prettier-ignore
    { label: "Academie", href: "/academie", icon: "graduationCap", section: "Overig", enabled: true }, // prettier-ignore
    { label: "Ideeën", href: "/ideeen", icon: "lightbulb", section: "Overig", enabled: true }, // prettier-ignore
    { label: "Support", href: "/support", icon: "messages", section: "Overig", enabled: true }, // prettier-ignore
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", section: "Inzicht", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.action, href: "/acties", icon: "inbox", section: "Inzicht", enabled: true }, // prettier-ignore
    // De vijf toezicht-pagina's (statistieken, platform-bewaking, DBA-monitor, audit-log,
    // verwerkingsregister) zitten nu als tabs in de toezicht-hub, dus niet meer apart in de zijbalk.
    { label: "Toezicht", href: "/admin/toezicht", icon: "shield", section: "Inzicht", enabled: true }, // prettier-ignore
    { label: "Verificaties", href: "/admin/verificaties", icon: "fileCheck", section: "Wachtrijen", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.collaboration, href: "/admin/samenwerkingen", icon: "handshake", section: "Wachtrijen", enabled: true }, // prettier-ignore
    { label: "Disputen", href: "/admin/disputen", icon: "handshake", section: "Wachtrijen", enabled: true }, // prettier-ignore
    { label: "No-shows", href: "/admin/no-shows", icon: "users", section: "Wachtrijen", enabled: true }, // prettier-ignore
    { label: "Dienst-overnames", href: "/admin/shift-overnames", icon: "handshake", section: "Wachtrijen", enabled: true }, // prettier-ignore
    { label: "Helpdesk", href: "/admin/support", icon: "messages", section: "Wachtrijen", enabled: true }, // prettier-ignore
    { label: "Opdrachten", href: "/admin/opdrachten", icon: "briefcase", section: "Beheer", enabled: true }, // prettier-ignore
    // Gebruikers, Bemiddelaars en Importeren zitten nu als tabs in de Gebruikers-hub
    // (/admin/gebruikersbeheer); Administratie en Facturatie in de Financiën-hub (/admin/financien).
    { label: "Gebruikers", href: "/admin/gebruikersbeheer", icon: "users", section: "Beheer", enabled: true }, // prettier-ignore
    { label: "Financiën", href: "/admin/financien", icon: "fileText", section: "Beheer", enabled: true }, // prettier-ignore
    { label: "Configuratie", href: "/admin/configuratie", icon: "settings", section: "Beheer", enabled: true }, // prettier-ignore
    { label: "Academie", href: "/academie", icon: "graduationCap", section: "Overig", enabled: true }, // prettier-ignore
    { label: "Ideeën", href: "/ideeen", icon: "lightbulb", section: "Overig", enabled: true }, // prettier-ignore
  ],
  // Bemiddelaar (tenant-admin). De bemiddeling-werkplek-items (Opdrachtgevers, ZZP'ers,
  // Diensten) komen per increment binnen zodra hun pagina's bestaan.
  FRANCHISER: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: "Leads", href: "/franchise/leads", icon: "contact", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: "Opdrachtgevers", href: "/franchise/opdrachtgevers", icon: "building", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: "ZZP'ers", href: "/franchise/zzpers", icon: "users", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.shift, href: "/franchise/diensten", icon: "clock", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.collaboration, href: "/franchise/samenwerkingen", icon: "handshake", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: "Dienst-overnames", href: "/franchise/shift-overnames", icon: "handshake", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: "Inzicht", href: "/inzicht", icon: "barChart", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.message, href: "/berichten", icon: "messages", section: "Overig", enabled: true }, // prettier-ignore
    // Facturatie zit nu als tab in de bemiddeling-hub (/franchise/instellingen?tab=facturatie).
    { label: "Mijn bemiddeling", href: "/franchise/instellingen", icon: "settings", section: "Overig", enabled: true }, // prettier-ignore
    { label: "Ideeën", href: "/ideeen", icon: "lightbulb", section: "Overig", enabled: true }, // prettier-ignore
    { label: "Support", href: "/support", icon: "messages", section: "Overig", enabled: true }, // prettier-ignore
  ],
};

export function navForRole(role: UserRole): NavItem[] {
  return NAV[role];
}

/** Eén nav-sectie: de kop + de items die eronder vallen (behoudt de bronvolgorde). */
export interface NavGroup {
  section: string;
  items: NavItem[];
}

/**
 * Groepeert een platte nav-lijst in secties op basis van `section`, met behoud van de volgorde.
 * Opeenvolgende items met dezelfde sectie vallen onder één kop; een item zonder `section` krijgt
 * een lege kop (rendert dan zonder koptekst). Pure functie — los testbaar, geen DOM/DB.
 */
export function groupNavItems(items: readonly NavItem[]): NavGroup[] {
  const groups: NavGroup[] = [];
  for (const item of items) {
    const section = item.section ?? "";
    const last = groups[groups.length - 1];
    if (last && last.section === section) {
      last.items.push(item);
    } else {
      groups.push({ section, items: [item] });
    }
  }
  return groups;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  FREELANCER: "ZZP'er",
  CLIENT: "Opdrachtgever",
  ADMIN: "Beheerder",
  FRANCHISER: "Bemiddelaar",
};
