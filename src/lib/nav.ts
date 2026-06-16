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
  | "settings";

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
// de sectie wisselt). Volgorde = werkstroom van de gebruiker: eerst werk, dan profiel/financieel.
const NAV: Record<UserRole, NavItem[]> = {
  FREELANCER: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", enabled: true },
    { label: TERM_PLURAL.action, href: "/acties", icon: "inbox", enabled: true },
    { label: "Inzicht", href: "/inzicht", icon: "barChart", enabled: true },
    { label: TERM_PLURAL.job, href: "/opdrachten", icon: "briefcase", section: "Werk", enabled: true }, // prettier-ignore
    { label: "Rooster", href: "/rooster", icon: "calendar", section: "Werk", enabled: true }, // prettier-ignore
    { label: `Mijn ${TERM_PLURAL.application.toLowerCase()}`, href: "/reacties", icon: "files", section: "Werk", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.collaboration, href: "/samenwerkingen", icon: "handshake", section: "Werk", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.message, href: "/berichten", icon: "messages", section: "Werk", enabled: true }, // prettier-ignore
    // Certificaten, Beschikbaarheid en Documenten zitten nu als tabs in "Mijn profiel"
    // (de profielhub), dus niet meer apart in de zijbalk.
    { label: "Mijn profiel", href: "/profiel", icon: "user", section: "Profiel", enabled: true },
    { label: TERM_PLURAL.shift, href: "/diensten", icon: "clock", section: "Profiel", enabled: true }, // prettier-ignore
    { label: "Academie", href: "/academie", icon: "graduationCap", section: "Profiel", enabled: true }, // prettier-ignore
    // Facturen, Boekhouding, Openstaand, Ontzorgd en Prognose zitten nu als tabs in de
    // Administratie-hub (/financien), dus niet meer apart in de zijbalk.
    { label: "Administratie", href: "/financien", icon: "fileText", section: "Administratie", enabled: true }, // prettier-ignore
    { label: "Abonnement", href: "/abonnement", icon: "creditCard", section: "Account", enabled: true }, // prettier-ignore
    { label: "Ideeën", href: "/ideeen", icon: "lightbulb", section: "Account", enabled: true }, // prettier-ignore
    { label: "Support", href: "/support", icon: "messages", section: "Account", enabled: true },
  ],
  CLIENT: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", enabled: true },
    { label: TERM_PLURAL.action, href: "/acties", icon: "inbox", enabled: true },
    { label: "Inzicht", href: "/inzicht", icon: "barChart", enabled: true },
    { label: `Mijn ${TERM_PLURAL.job.toLowerCase()}`, href: "/opdrachten", icon: "briefcase", section: "Werk", enabled: true }, // prettier-ignore
    { label: "ZZP'ers", href: "/freelancers", icon: "users", section: "Werk", enabled: true },
    // Flexpool zit nu als tab in de bedrijfsprofiel-hub (/bedrijf?tab=flexpool), niet meer apart.
    { label: TERM_PLURAL.candidate, href: "/kandidaten", icon: "users", section: "Werk", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.collaboration, href: "/samenwerkingen", icon: "handshake", section: "Werk", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.performance, href: "/prestaties", icon: "fileCheck", section: "Werk", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.message, href: "/berichten", icon: "messages", section: "Werk", enabled: true }, // prettier-ignore
    // Facturen, Boekhouding, Openstaand en Verplichtingen zitten nu als tabs in de
    // Administratie-hub (/financien), dus niet meer apart in de zijbalk.
    { label: "Administratie", href: "/financien", icon: "fileText", section: "Administratie", enabled: true }, // prettier-ignore
    { label: "Bedrijfsprofiel", href: "/bedrijf", icon: "building", section: "Account", enabled: true }, // prettier-ignore
    { label: "Academie", href: "/academie", icon: "graduationCap", section: "Account", enabled: true }, // prettier-ignore
    { label: "Abonnement", href: "/abonnement", icon: "creditCard", section: "Account", enabled: true }, // prettier-ignore
    { label: "Ideeën", href: "/ideeen", icon: "lightbulb", section: "Account", enabled: true }, // prettier-ignore
    { label: "Support", href: "/support", icon: "messages", section: "Account", enabled: true },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", enabled: true },
    { label: TERM_PLURAL.action, href: "/acties", icon: "inbox", enabled: true },
    { label: "Verificaties", href: "/admin/verificaties", icon: "fileCheck", section: "Operatie", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.collaboration, href: "/admin/samenwerkingen", icon: "handshake", section: "Operatie", enabled: true }, // prettier-ignore
    { label: "Disputen", href: "/admin/disputen", icon: "handshake", section: "Operatie", enabled: true }, // prettier-ignore
    { label: "No-shows", href: "/admin/no-shows", icon: "users", section: "Operatie", enabled: true }, // prettier-ignore
    { label: "Shift-overnames", href: "/admin/shift-overnames", icon: "handshake", section: "Operatie", enabled: true }, // prettier-ignore
    { label: "Helpdesk", href: "/admin/support", icon: "messages", section: "Operatie", enabled: true }, // prettier-ignore
    { label: "Opdrachten", href: "/admin/opdrachten", icon: "briefcase", section: "Operatie", enabled: true }, // prettier-ignore
    // De vijf toezicht-pagina's (statistieken, platform-bewaking, DBA-monitor, audit-log,
    // verwerkingsregister) zitten nu als tabs in de toezicht-hub, dus niet meer apart in de zijbalk.
    { label: "Toezicht", href: "/admin/toezicht", icon: "shield", section: "Toezicht", enabled: true }, // prettier-ignore
    // Gebruikers, Bemiddelaars en Importeren zitten nu als tabs in de Gebruikers-hub
    // (/admin/gebruikersbeheer); Administratie en Facturatie in de Financiën-hub (/admin/financien).
    { label: "Gebruikers", href: "/admin/gebruikersbeheer", icon: "users", section: "Beheer", enabled: true }, // prettier-ignore
    { label: "Financiën", href: "/admin/financien", icon: "fileText", section: "Beheer", enabled: true }, // prettier-ignore
    { label: "Configuratie", href: "/admin/configuratie", icon: "settings", section: "Beheer", enabled: true }, // prettier-ignore
    { label: "Academie", href: "/academie", icon: "graduationCap", section: "Beheer", enabled: true }, // prettier-ignore
    { label: "Ideeën", href: "/ideeen", icon: "lightbulb", section: "Beheer", enabled: true },
  ],
  // Bemiddelaar (tenant-admin). De bemiddeling-werkplek-items (Opdrachtgevers, ZZP'ers,
  // Diensten) komen per increment binnen zodra hun pagina's bestaan.
  FRANCHISER: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", enabled: true },
    { label: "Leads", href: "/franchise/leads", icon: "contact", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: "Opdrachtgevers", href: "/franchise/opdrachtgevers", icon: "building", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: "ZZP'ers", href: "/franchise/zzpers", icon: "users", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.shift, href: "/franchise/diensten", icon: "clock", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.collaboration, href: "/franchise/samenwerkingen", icon: "handshake", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: "Shift-overnames", href: "/franchise/shift-overnames", icon: "handshake", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: "Inzicht", href: "/inzicht", icon: "barChart", section: "Bemiddeling", enabled: true }, // prettier-ignore
    { label: TERM_PLURAL.message, href: "/berichten", icon: "messages", section: "Account", enabled: true }, // prettier-ignore
    // Facturatie zit nu als tab in de bemiddeling-hub (/franchise/instellingen?tab=facturatie).
    { label: "Mijn bemiddeling", href: "/franchise/instellingen", icon: "settings", section: "Account", enabled: true }, // prettier-ignore
    { label: "Ideeën", href: "/ideeen", icon: "lightbulb", section: "Account", enabled: true }, // prettier-ignore
    { label: "Support", href: "/support", icon: "messages", section: "Account", enabled: true },
  ],
};

export function navForRole(role: UserRole): NavItem[] {
  return NAV[role];
}

export const ROLE_LABEL: Record<UserRole, string> = {
  FREELANCER: "ZZP'er",
  CLIENT: "Opdrachtgever",
  ADMIN: "Beheerder",
  FRANCHISER: "Bemiddelaar",
};
