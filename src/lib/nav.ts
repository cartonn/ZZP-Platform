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
  /** false = nog niet gebouwd (toont als placeholder), voorkomt dode links in Sessie 0. */
  enabled: boolean;
}

// Role-aware navigatie. Per sessie worden items op `enabled: true` gezet zodra het
// bijbehorende scherm bestaat (zie BUILD_ORDER.md).
const NAV: Record<UserRole, NavItem[]> = {
  FREELANCER: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", enabled: true },
    { label: "Ontzorgd", href: "/ontzorgd", icon: "barChart", enabled: true },
    { label: "Mijn profiel", href: "/profiel", icon: "user", enabled: true },
    { label: "Beschikbaarheid", href: "/beschikbaarheid", icon: "calendar", enabled: true },
    { label: "Diensten", href: "/diensten", icon: "clock", enabled: true },
    { label: "Opdrachten", href: "/opdrachten", icon: "briefcase", enabled: true },
    { label: "Mijn reacties", href: "/reacties", icon: "files", enabled: true },
    { label: "Documenten", href: "/documenten", icon: "files", enabled: true },
    { label: "Certificaten", href: "/certificaten", icon: "fileCheck", enabled: true },
    { label: "Samenwerkingen", href: "/samenwerkingen", icon: "handshake", enabled: true },
    { label: "Berichten", href: "/berichten", icon: "messages", enabled: true },
    { label: "Facturen", href: "/facturen", icon: "receipt", enabled: true },
    { label: "Administratie", href: "/administratie", icon: "receipt", enabled: true },
    { label: "Openstaand", href: "/openstaand", icon: "receipt", enabled: true },
    { label: "Abonnement", href: "/abonnement", icon: "creditCard", enabled: true },
    { label: "Support", href: "/support", icon: "messages", enabled: true },
  ],
  CLIENT: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", enabled: true },
    { label: "Bedrijfsprofiel", href: "/bedrijf", icon: "building", enabled: true },
    { label: "Mijn opdrachten", href: "/opdrachten", icon: "briefcase", enabled: true },
    { label: "ZZP'ers", href: "/freelancers", icon: "users", enabled: true },
    { label: "Kandidaten", href: "/kandidaten", icon: "users", enabled: true },
    { label: "Samenwerkingen", href: "/samenwerkingen", icon: "handshake", enabled: true },
    { label: "Prestaties", href: "/prestaties", icon: "fileCheck", enabled: true },
    { label: "Berichten", href: "/berichten", icon: "messages", enabled: true },
    { label: "Facturen", href: "/facturen", icon: "receipt", enabled: true },
    { label: "Administratie", href: "/administratie", icon: "receipt", enabled: true },
    { label: "Openstaand", href: "/openstaand", icon: "receipt", enabled: true },
    { label: "Abonnement", href: "/abonnement", icon: "creditCard", enabled: true },
    { label: "Support", href: "/support", icon: "messages", enabled: true },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", enabled: true },
    { label: "Verificaties", href: "/admin/verificaties", icon: "fileCheck", enabled: true },
    { label: "Samenwerkingen", href: "/admin/samenwerkingen", icon: "handshake", enabled: true },
    { label: "Disputen", href: "/admin/disputen", icon: "handshake", enabled: true },
    { label: "Helpdesk", href: "/admin/support", icon: "messages", enabled: true },
    { label: "DBA-monitor", href: "/admin/dba", icon: "shield", enabled: true },
    { label: "Administratie", href: "/admin/administratie", icon: "barChart", enabled: true },
    { label: "Gebruikers", href: "/admin/gebruikers", icon: "users", enabled: true },
    { label: "Importeren", href: "/admin/import", icon: "users", enabled: true },
    { label: "Opdrachten", href: "/admin/opdrachten", icon: "briefcase", enabled: true },
    { label: "Statistieken", href: "/admin/statistieken", icon: "barChart", enabled: true },
    { label: "Audit log", href: "/admin/audit", icon: "shield", enabled: true },
    { label: "Configuratie", href: "/admin/configuratie", icon: "settings", enabled: true },
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
