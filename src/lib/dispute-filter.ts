/**
 * Pure filterlogica voor het admin-disputenoverzicht (`/admin/disputen`): filter de al geladen
 * disputen op urgentieniveau. Server-side waarheid — het filter beslist niets, het toont alleen
 * een deelverzameling van wat de admin al mag zien. Leaf-module zonder server-/prisma-imports
 * zodat ze los testbaar is.
 */

import { DISPUTE_URGENCY_LEVELS, type DisputeUrgency, type DisputeRow } from "@/lib/disputes";

/** Het geparste filter; `null` betekent "alle urgentieniveaus". */
export interface DisputeFilter {
  urgency: DisputeUrgency | null;
}

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** Leest het filter uit de (genormaliseerde) searchParams; onbekende waarden vallen weg naar `null`. */
export function parseDisputeFilter(
  sp: Record<string, string | string[] | undefined>,
): DisputeFilter {
  const raw = first(sp.urgency).trim().toUpperCase();
  const urgency = (DISPUTE_URGENCY_LEVELS as readonly string[]).includes(raw)
    ? (raw as DisputeUrgency)
    : null;
  return { urgency };
}

/** Of een dispuut aan het actieve filter voldoet. */
export function matchesDisputeFilter(row: Pick<DisputeRow, "urgency">, f: DisputeFilter): boolean {
  if (f.urgency && row.urgency !== f.urgency) return false;
  return true;
}

/**
 * Filtert de rijen; muteert de invoer niet. Zonder actief filter wordt een kopie van de volledige
 * verzameling teruggegeven (zodat de aanroeper de invoer-array nooit per ongeluk muteert).
 */
export function filterDisputeRows<T extends Pick<DisputeRow, "urgency">>(
  rows: readonly T[],
  f: DisputeFilter,
): T[] {
  if (!isDisputeFilterActive(f)) return [...rows];
  return rows.filter((r) => matchesDisputeFilter(r, f));
}

/** Of er een actieve filterdimensie is (voor de lege-staat-tekst / "wis filter"-affordance). */
export function isDisputeFilterActive(f: DisputeFilter): boolean {
  return f.urgency !== null;
}

/** Bouwt de querystring-params voor een filterlink; `null` (= "alle") geeft een leeg object. */
export function disputeFilterParams(urgency: DisputeUrgency | null): Record<string, string> {
  return urgency ? { urgency } : {};
}
