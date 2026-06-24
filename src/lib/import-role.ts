import { z } from "zod";

/**
 * Runtime-guard voor de rol die bij een bulk-import naar `prisma.user.create` wordt geschreven.
 * Defense-in-depth tegen mass-assignment (A04): het TypeScript-type `ImportRole` garandeert niets
 * op runtime, dus dwingen we hier expliciet af dat alleen "FREELANCER" of "CLIENT" doorkomt —
 * nooit "ADMIN" of een andere rol.
 */
export const IMPORT_ROLE = z.enum(["FREELANCER", "CLIENT"]);

export type ImportRoleValue = z.infer<typeof IMPORT_ROLE>;

/**
 * Valideert de rol vlak vóór de DB-write en geeft de getypeerde waarde terug.
 * Gooit bij een ongeldige rol (bv. "ADMIN", lege string) zodat de rij niet wordt aangemaakt.
 */
export function assertImportRole(role: string): ImportRoleValue {
  return IMPORT_ROLE.parse(role);
}
