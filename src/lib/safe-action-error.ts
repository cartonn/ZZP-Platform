// Veilige foutboodschap voor server-action-responses (CWE-209 / OWASP A05:2021 — Information
// Exposure). Server-actions vangen een fout en geven vaak `e instanceof Error ? e.message : "..."`
// terug aan de client. Dat forwardt de message van ELKE fout — ook een technische fout die interne
// details lekt: een Prisma-clientfout kan kolom-/tabel-/constraint-namen echoën, een Node
// system-error (ECONNREFUSED/timeout) kan hostnames/paden bevatten. Deze helper forwardt alleen de
// (gecureerde) applicatie-foutmeldingen en vervangt technische fouten door een generieke boodschap,
// terwijl de rauwe fout server-side wordt gelogd (de logger redacteert PII/secrets zelf).

import { logger } from "@/lib/observability/logger";
import { describeError } from "@/lib/observability/report";

/** Standaard generieke boodschap wanneer de echte fout niet veilig te tonen is. */
export const GENERIC_ACTION_ERROR = "Er is een fout opgetreden. Probeer het opnieuw.";

/**
 * Technische, niet-gecureerde fout waarvan de message interne details kan lekken. Gecureerde
 * applicatiefouten in deze codebase (AuthorizationError, *TransitionError, CascadeError,
 * UploadValidationError, VerifierRequestError, of een plain `Error` met een Nederlandse tekst)
 * zetten géén `code` en dragen geen Prisma-naam, dus die passeren als veilig.
 *
 * Gemarkeerd als intern (→ generieke boodschap) wanneer:
 *  - de waarde geen `Error` is (bv. een gegooide string/object), OF
 *  - de naam begint met `PrismaClient` (Known/Validation/Initialization/RustPanic), OF
 *  - er een niet-lege string-`code` is (Prisma `P####`-codes én Node system-errors zoals
 *    `ECONNREFUSED`, `ETIMEDOUT`, `ENOTFOUND`, `ENOENT`).
 */
export function isInternalError(e: unknown): boolean {
  if (!(e instanceof Error)) return true;
  if (e.name.startsWith("PrismaClient")) return true;
  const code = (e as { code?: unknown }).code;
  if (typeof code === "string" && code.length > 0) return true;
  return false;
}

/**
 * Zet een gevangen fout om naar een veilige boodschap voor een server-action-respons.
 *
 * - Gecureerde applicatiefout → de eigen (bewust Nederlandse) message blijft behouden.
 * - Technische fout (Prisma/system/niet-Error) → server-side gelogd + `fallback` teruggegeven,
 *   zodat interne details nooit naar de client lekken.
 *
 * @param e de gevangen fout (onbekend type).
 * @param fallback de generieke boodschap voor technische/niet-toonbare fouten.
 */
export function toSafeActionError(e: unknown, fallback: string = GENERIC_ACTION_ERROR): string {
  if (isInternalError(e)) {
    logger.error("server-action-fout", { error: describeError(e) });
    return fallback;
  }
  return (e as Error).message;
}
