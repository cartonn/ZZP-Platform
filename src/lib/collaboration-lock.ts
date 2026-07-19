// Werkproces-slot van een samenwerking: mag de UI nog cascade-acties (uren/facturen indienen,
// goedkeuren, corrigeren) aanbieden? Server-side is de waarheid (CLAUDE.md regel 1): de server
// weigert deze acties bij een open dispuut (`assertNotDisputed`, §4) én bij een terminale status
// (`assertCollaborationNotTerminal`, #825). De UI hoort ze dan ook niet aan te bieden — anders
// klikt men tegen een kale foutpagina aan (dode knop). Pure functie, getest.

import { type CollaborationStatus } from "@/lib/enums";

export interface CollaborationLockInput {
  status: CollaborationStatus;
  disputedAt: Date | null;
}

export type CollaborationLockReason = "dispute" | "cancelled" | "completed" | null;

/**
 * Waarom (indien) de werkproces-acties bevroren zijn. Volgorde: een open dispuut heeft voorrang op
 * de terminale status (een geannuleerde/afgeronde samenwerking kan óók `disputedAt` dragen; het
 * dispuut is dan de meest sprekende reden). `null` = acties toegestaan.
 */
export function collaborationLockReason(input: CollaborationLockInput): CollaborationLockReason {
  if (input.disputedAt) return "dispute";
  if (input.status === "CANCELLED") return "cancelled";
  if (input.status === "COMPLETED") return "completed";
  return null;
}

/** Zijn de werkproces-acties (indienen/goedkeuren/corrigeren) bevroren? */
export function collaborationActionsLocked(input: CollaborationLockInput): boolean {
  return collaborationLockReason(input) !== null;
}

/** Nette Nederlandse toelichting bij de terminale (niet-dispuut) bevriezing, of `null`. */
export function terminalLockNotice(reason: CollaborationLockReason): string | null {
  if (reason === "cancelled")
    return "Deze samenwerking is geannuleerd — er zijn geen werkproces-acties meer.";
  if (reason === "completed")
    return "Deze samenwerking is afgerond — er zijn geen werkproces-acties meer.";
  return null;
}
