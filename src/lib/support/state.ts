// Statusovergangen voor support-tickets via de expliciete map (CLAUDE.md regel 3).
// Geen losse status-writes: elke wijziging loopt via assertSupportTransition.

import { SUPPORT_TICKET_TRANSITIONS, type SupportTicketStatus } from "@/lib/enums";

export class SupportTransitionError extends Error {
  constructor(from: SupportTicketStatus, to: SupportTicketStatus) {
    super(`Ongeldige ticket-overgang: ${from} -> ${to}`);
    this.name = "SupportTransitionError";
  }
}

export function canSupportTransition(from: SupportTicketStatus, to: SupportTicketStatus): boolean {
  return SUPPORT_TICKET_TRANSITIONS[from].includes(to);
}

export function assertSupportTransition(from: SupportTicketStatus, to: SupportTicketStatus): void {
  if (!canSupportTransition(from, to)) throw new SupportTransitionError(from, to);
}
