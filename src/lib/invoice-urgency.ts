// Urgentie-ordening + te-laat-uitsplitsing voor de facturenlijst (`/facturen`, beide rollen).
//
// De lijst wordt uit de database geladen op `createdAt desc` — nieuw bovenaan. Daardoor kan de
// factuur die de meeste aandacht vraagt (het langst te laat) juist onderaan belanden. Deze pure
// helpers herordenen de reeds geladen lijst zonder extra query: wat te laat is eerst, dan wat
// binnenkort vervalt, dan de rest. Server-side waarheid: alleen tonen/ordenen, nooit beslissen — de
// statusovergang naar OVERDUE blijft de payment-reminders-taak.

import { isInvoiceOutstanding } from "@/lib/administration/outstanding";
import { invoiceDueStatus } from "@/lib/invoice-due";

/** Minimale vorm die zowel de outstanding-regel als de vervaldatum-aftelling voedt. */
export type UrgencyInvoice = {
  dueAt: Date | null;
  lifecycleStatus: string | null;
  status: string;
};

/**
 * Sorteersleutel `[bucket, within]` — lager staat hoger in de lijst. Buckets:
 *   0 = te laat            (within = -dagen te laat → langst te laat bovenaan)
 *   1 = openstaand mét vervaldatum, nog niet verstreken (within = dagen tot vervaldag → sneller eerst)
 *   2 = openstaand zónder vervaldatum
 *   3 = niet openstaand (betaald/concept/afgehandeld) — behoudt de inkomende volgorde
 */
function urgencyKey(inv: UrgencyInvoice, now: Date): [number, number] {
  const outstanding = isInvoiceOutstanding(inv);
  if (!outstanding) return [3, 0];
  const due = invoiceDueStatus({ dueAt: inv.dueAt, outstanding }, now);
  if (!due) return [2, 0];
  if (due.tense === "overdue") return [0, -due.days];
  // "today" (days 0) en "upcoming" (days >= 1) vallen samen: eerder verschuldigd = hoger.
  return [1, due.days];
}

/**
 * Geeft een nieuwe, op urgentie geordende lijst terug (muteert de invoer niet). Stabiel: bij een
 * gelijke sleutel blijft de inkomende volgorde behouden (de query levert `createdAt desc`), zodat de
 * ordening deterministisch is los van de sorteerstabiliteit van de engine.
 */
export function sortInvoicesByUrgency<T extends UrgencyInvoice>(
  invoices: T[],
  now: Date = new Date(),
): T[] {
  return invoices
    .map((inv, index) => ({ inv, index, key: urgencyKey(inv, now) }))
    .sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1] || a.index - b.index)
    .map((entry) => entry.inv);
}

/**
 * Sommeert het te-late deel van het openstaande bedrag (in centen). Een factuur telt mee als ze
 * openstaand is én haar vervaldatum is verstreken. Voedt de "waarvan € X te laat"-subregel op de
 * Openstaand-kaart — een geaggregeerd urgentiesignaal, ook voor de opdrachtgever die geen
 * debiteuren-/crediteurenkaart op deze pagina heeft.
 */
export function outstandingOverdueCents(
  invoices: (UrgencyInvoice & { totalCents: number })[],
  now: Date = new Date(),
): number {
  let cents = 0;
  for (const inv of invoices) {
    const outstanding = isInvoiceOutstanding(inv);
    if (!outstanding) continue;
    const due = invoiceDueStatus({ dueAt: inv.dueAt, outstanding }, now);
    if (due?.tense === "overdue") cents += inv.totalCents;
  }
  return cents;
}
