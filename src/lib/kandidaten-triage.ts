import { type ApplicationStatus } from "@/lib/enums";

/**
 * Splitst reacties in twee triage-groepen voor het kandidatenscherm:
 * - `active`: nog te beslissen (NEW/VIEWED/SHORTLIST/REJECTED/WITHDRAWN) — compacte, uitklapbare rijen.
 * - `accepted`: al geaccepteerd (status ACCEPTED) — apart, ingeklapt onderaan ("zie Samenwerkingen"),
 *   want de beslissing is gemaakt en de samenwerking loopt al.
 *
 * Pure functie: behoudt de invoervolgorde binnen elke groep, muteert de invoer niet.
 */
export function partitionTriage<T extends { status: ApplicationStatus | string }>(
  items: T[],
): { active: T[]; accepted: T[] } {
  const active: T[] = [];
  const accepted: T[] = [];
  for (const item of items) {
    if (item.status === "ACCEPTED") accepted.push(item);
    else active.push(item);
  }
  return { active, accepted };
}

/** Voornaam uit een volledige naam — voor een compacte, persoonlijke keuze-knop ("Kies Sanne"). */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}
