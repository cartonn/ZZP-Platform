// Activatiepoort voor een zelf-aangemeld bureau (bemiddeling). Server-side is de waarheid:
//
//  1. Het account van de bemiddelaar is gewoon ACTIVE — hij MOET kunnen inloggen om zijn aanmelding
//     te volgen (de login weigert elk niet-ACTIVE account, zie authorize-credentials.ts).
//  2. De tenant staat op PENDING. `tenantAccessBlocked()` in authz.ts laat `currentActor()` dan
//     `null` teruggeven, waardoor ELKE server action en elke data-lezende pagina fail-closed weigert
//     — precies hetzelfde mechanisme als bij een geschorste (SUSPENDED) franchise. Er is dus geen
//     apart "PENDING mag dit wel"-pad dat kan lekken.
//  3. Deze module levert alleen de NAVIGATIE-kant: waar sturen we zo'n gebruiker naartoe zodat hij
//     geen doodlopende 403-pagina ziet? Pure functies, los getest.

import { TENANT_TRANSITIONS, type TenantStatus } from "@/lib/enums";

/** Wachtpagina voor een bureau waarvan de aanmelding nog loopt of is afgewezen. */
export const ACTIVATION_GATE_PATH = "/aanmelding";

/**
 * Pad waarheen een gebruiker van deze tenant moet worden gestuurd, of `null` als er niets te
 * omleiden valt. Alleen PENDING/REJECTED krijgen de wachtpagina; een geschorste tenant houdt het
 * bestaande gedrag (de schorsingspagina volgt uit de accountstatus, niet uit de tenant).
 */
export function activationGatePath(tenantStatus: string | null | undefined): string | null {
  return tenantStatus === "PENDING" || tenantStatus === "REJECTED" ? ACTIVATION_GATE_PATH : null;
}

export class TenantTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Ongeldige statusovergang: ${from} → ${to}.`);
    this.name = "TenantTransitionError";
  }
}

/** Volgt de expliciete overgangsmap (CLAUDE.md regel 3). */
export function canTransitionTenant(from: string, to: TenantStatus): boolean {
  const allowed = TENANT_TRANSITIONS[from as TenantStatus];
  return !!allowed && allowed.includes(to);
}

export type ActivationDecision = "ACTIVATE" | "REJECT";

/**
 * Bepaalt de te zetten tenant-status bij een activatiebeslissing. Een afwijzing vereist een
 * (niet-lege) reden — server-side afgedwongen, spiegelt `statusForDecision` voor certificaten.
 * Werpt bij een ongeldige overgang (bv. een al geactiveerde tenant nogmaals activeren).
 */
export function statusForActivation(
  current: string,
  decision: ActivationDecision,
  reason?: string | null,
): TenantStatus {
  if (decision === "REJECT" && !reason?.trim()) {
    throw new Error("Een afwijzing vereist een reden.");
  }
  const next: TenantStatus = decision === "ACTIVATE" ? "ACTIVE" : "REJECTED";
  if (!canTransitionTenant(current, next)) throw new TenantTransitionError(current, next);
  return next;
}
