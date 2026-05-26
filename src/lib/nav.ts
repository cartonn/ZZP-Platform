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
  | "building";

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
    { label: "Mijn profiel", href: "/profiel", icon: "user", enabled: true },
    { label: "Opdrachten", href: "/opdrachten", icon: "briefcase", enabled: true },
    { label: "Mijn reacties", href: "/reacties", icon: "files", enabled: false },
    { label: "Documenten", href: "/documenten", icon: "files", enabled: false },
    { label: "Certificaten", href: "/certificaten", icon: "fileCheck", enabled: false },
    { label: "Berichten", href: "/berichten", icon: "messages", enabled: false },
    { label: "Facturen", href: "/facturen", icon: "receipt", enabled: false },
  ],
  CLIENT: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", enabled: true },
    { label: "Bedrijfsprofiel", href: "/bedrijf", icon: "building", enabled: true },
    { label: "Mijn opdrachten", href: "/opdrachten", icon: "briefcase", enabled: true },
    { label: "Kandidaten", href: "/kandidaten", icon: "users", enabled: false },
    { label: "Berichten", href: "/berichten", icon: "messages", enabled: false },
    { label: "Facturen", href: "/facturen", icon: "receipt", enabled: false },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", enabled: true },
    { label: "Verificaties", href: "/admin/verificaties", icon: "fileCheck", enabled: false },
    { label: "Gebruikers", href: "/admin/gebruikers", icon: "users", enabled: false },
    { label: "Opdrachten", href: "/admin/opdrachten", icon: "briefcase", enabled: false },
    { label: "Audit log", href: "/admin/audit", icon: "shield", enabled: false },
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
