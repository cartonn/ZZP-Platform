import { type ApplicationStatus } from "@/lib/enums";

/**
 * Splitst reacties in twee triage-groepen voor het kandidatenscherm:
 * - `active`: nog een actie nodig — alle niet-geaccepteerde reacties, PLUS geaccepteerde reacties
 *   die nog geen samenwerking hebben (die vragen nog om "Samenwerking voorstellen").
 * - `accepted`: afgehandeld — geaccepteerd én de samenwerking loopt al. Deze verhuizen naar de
 *   aparte, ingeklapte sectie onderaan ("zie Samenwerkingen"); ze vragen geen beslissing meer.
 *
 * Een `hasCollaboration`-vlag i.p.v. alleen status voorkomt dat het propose-formulier (een openstaande
 * actie) in de ingeklapte sectie verdwijnt. Pure functie: behoudt de invoervolgorde, muteert niet.
 */
export function partitionTriage<
  T extends { status: ApplicationStatus | string; hasCollaboration: boolean },
>(items: T[]): { active: T[]; accepted: T[] } {
  const active: T[] = [];
  const accepted: T[] = [];
  for (const item of items) {
    if (item.status === "ACCEPTED" && item.hasCollaboration) accepted.push(item);
    else active.push(item);
  }
  return { active, accepted };
}

/** Voornaam uit een volledige naam — voor een compacte, persoonlijke keuze-knop ("Kies Sanne"). */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}
