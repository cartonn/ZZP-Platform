import { type UserRole } from "@/lib/enums";

export type NavIcon =
  | "dashboard"
  | "briefcase"
  | "users"
  | "fileCheck"
  | "files"
  | "messages"
  | "receipt"
  | "shield"
  | "user"
  | "building"
  | "handshake"
  | "creditCard"
  | "calendar"
  | "clock"
  | "barChart"
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
    { label: "Opdrachten", href: "/opdrachten", icon: "briefcase", section: "Werk", enabled: true },
    { label: "Mijn reacties", href: "/reacties", icon: "files", section: "Werk", enabled: true },
    { label: "Samenwerkingen", href: "/samenwerkingen", icon: "handshake", section: "Werk", enabled: true }, // prettier-ignore
    { label: "Berichten", href: "/berichten", icon: "messages", section: "Werk", enabled: true },
    { label: "Mijn profiel", href: "/profiel", icon: "user", section: "Profiel", enabled: true },
    { label: "Certificaten", href: "/certificaten", icon: "fileCheck", section: "Profiel", enabled: true }, // prettier-ignore
    { label: "Diensten", href: "/diensten", icon: "clock", section: "Profiel", enabled: true },
    { label: "Beschikbaarheid", href: "/beschikbaarheid", icon: "calendar", section: "Profiel", enabled: true }, // prettier-ignore
    { label: "Documenten", href: "/documenten", icon: "files", section: "Profiel", enabled: true },
    {
      label: "Ontzorgd",
      href: "/ontzorgd",
      icon: "barChart",
      section: "Financieel",
      enabled: true,
    },
    { label: "Facturen", href: "/facturen", icon: "receipt", section: "Financieel", enabled: true },
    { label: "Administratie", href: "/administratie", icon: "receipt", section: "Financieel", enabled: true }, // prettier-ignore
    { label: "Openstaand", href: "/openstaand", icon: "receipt", section: "Financieel", enabled: true }, // prettier-ignore
    { label: "Abonnement", href: "/abonnement", icon: "creditCard", section: "Account", enabled: true }, // prettier-ignore
    { label: "Support", href: "/support", icon: "messages", section: "Account", enabled: true },
  ],
  CLIENT: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", enabled: true },
    { label: "Mijn opdrachten", href: "/opdrachten", icon: "briefcase", section: "Werk", enabled: true }, // prettier-ignore
    { label: "ZZP'ers", href: "/freelancers", icon: "users", section: "Werk", enabled: true },
    { label: "Kandidaten", href: "/kandidaten", icon: "users", section: "Werk", enabled: true },
    { label: "Samenwerkingen", href: "/samenwerkingen", icon: "handshake", section: "Werk", enabled: true }, // prettier-ignore
    { label: "Prestaties", href: "/prestaties", icon: "fileCheck", section: "Werk", enabled: true },
    { label: "Berichten", href: "/berichten", icon: "messages", section: "Werk", enabled: true },
    { label: "Facturen", href: "/facturen", icon: "receipt", section: "Financieel", enabled: true },
    { label: "Administratie", href: "/administratie", icon: "receipt", section: "Financieel", enabled: true }, // prettier-ignore
    { label: "Openstaand", href: "/openstaand", icon: "receipt", section: "Financieel", enabled: true }, // prettier-ignore
    { label: "Bedrijfsprofiel", href: "/bedrijf", icon: "building", section: "Account", enabled: true }, // prettier-ignore
    { label: "Abonnement", href: "/abonnement", icon: "creditCard", section: "Account", enabled: true }, // prettier-ignore
    { label: "Support", href: "/support", icon: "messages", section: "Account", enabled: true },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", enabled: true },
    { label: "Verificaties", href: "/admin/verificaties", icon: "fileCheck", section: "Operatie", enabled: true }, // prettier-ignore
    { label: "Samenwerkingen", href: "/admin/samenwerkingen", icon: "handshake", section: "Operatie", enabled: true }, // prettier-ignore
    { label: "Disputen", href: "/admin/disputen", icon: "handshake", section: "Operatie", enabled: true }, // prettier-ignore
    { label: "Helpdesk", href: "/admin/support", icon: "messages", section: "Operatie", enabled: true }, // prettier-ignore
    { label: "Opdrachten", href: "/admin/opdrachten", icon: "briefcase", section: "Operatie", enabled: true }, // prettier-ignore
    { label: "Platform-bewaking", href: "/admin/bewaking", icon: "shield", section: "Toezicht", enabled: true }, // prettier-ignore
    { label: "DBA-monitor", href: "/admin/dba", icon: "shield", section: "Toezicht", enabled: true }, // prettier-ignore
    { label: "Audit log", href: "/admin/audit", icon: "shield", section: "Toezicht", enabled: true }, // prettier-ignore
    { label: "Statistieken", href: "/admin/statistieken", icon: "barChart", section: "Toezicht", enabled: true }, // prettier-ignore
    { label: "Gebruikers", href: "/admin/gebruikers", icon: "users", section: "Beheer", enabled: true }, // prettier-ignore
    { label: "Importeren", href: "/admin/import", icon: "users", section: "Beheer", enabled: true },
    { label: "Administratie", href: "/admin/administratie", icon: "barChart", section: "Beheer", enabled: true }, // prettier-ignore
    { label: "Configuratie", href: "/admin/configuratie", icon: "settings", section: "Beheer", enabled: true }, // prettier-ignore
  ],
};

export function navForRole(role: UserRole): NavItem[] {
  return NAV[role];
}

export const ROLE_LABEL: Record<UserRole, string> = {
  FREELANCER: "ZZP'er",
  CLIENT: "Opdrachtgever",
  ADMIN: "Beheerder",
};
