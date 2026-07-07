// Nederlandse labels voor support (UI). Geen "AI" — de beantwoorder heet "Support-assistent".

import { type SupportTicketStatus, type SupportCategory } from "@/lib/enums";

/**
 * Statussen waarbij een medewerker aan zet is (het ticket wacht op de helpdesk). AWAITING_USER
 * valt hier bewust buiten: dan ligt de bal bij de aanvrager, niet bij de admin. Eén bron voor de
 * actiecentrum-taak (pending-tasks.ts) én de zijbalk-badge (signals.ts), zodat beide nooit afwijken.
 */
export const SUPPORT_OPEN_STATUSES = [
  "NEW",
  "TRIAGED",
  "ESCALATED",
  "REOPENED",
] as const satisfies readonly SupportTicketStatus[];

export const SUPPORT_STATUS_LABEL: Record<SupportTicketStatus, string> = {
  NEW: "Nieuw",
  TRIAGED: "In behandeling",
  AUTO_ANSWERED: "Beantwoord",
  ESCALATED: "Bij de helpdesk",
  AWAITING_USER: "Wacht op je reactie",
  RESOLVED: "Opgelost",
  REOPENED: "Heropend",
};

export const SUPPORT_CATEGORY_LABEL: Record<SupportCategory, string> = {
  ACCOUNT: "Account",
  INVOICE: "Facturen",
  CREDENTIAL: "Certificaten",
  JOB: "Opdrachten",
  TECHNICAL: "Technisch",
  PRIVACY: "Privacy",
  OTHER: "Overig",
};

/** Badge-variant per status (afgestemd op de bestaande Badge-varianten). */
export function statusVariant(status: SupportTicketStatus): "success" | "warning" | "default" {
  if (status === "RESOLVED" || status === "AUTO_ANSWERED") return "success";
  if (status === "ESCALATED" || status === "REOPENED") return "warning";
  return "default";
}
