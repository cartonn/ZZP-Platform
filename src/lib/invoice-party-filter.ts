/**
 * Rolbewust tegenpartij-filter voor de facturenlijst (`/facturen`). Elke factuur hangt aan een
 * samenwerking met twee kanten: een opdrachtgever (company) en een ZZP'er (freelancer). Welke kant
 * de "tegenpartij" is, hangt af van wie er kijkt: de ZZP'er filtert op opdrachtgever, de opdrachtgever
 * filtert op ZZP'er. Deze module mapt elke factuur — ongeacht de kijkende rol — naar die ene relevante
 * partij, zodat de UI niet per rol apart hoeft te redeneren.
 *
 * Pure functies → unit-testbaar zonder database of React. De invoer wordt nooit gemuteerd; onbekende
 * partij-ids vallen terug op "alles" (anti-oracle: een gok op een vreemd id lekt geen bestaan van data).
 */

/** Minimale vorm die de partij-helpers van een factuurrij nodig hebben. */
export type PartyInvoiceLike = {
  collaboration: {
    company: { id: string; name: string } | null;
    freelancer: { id: string; user: { name: string | null } } | null;
  } | null;
};

/** De tegenpartij van de kijkende rol: opdrachtgever (company) voor de ZZP'er,
 *  ZZP'er (freelancer) voor de opdrachtgever. `null` als de relatie ontbreekt. */
export function invoiceParty(
  inv: PartyInvoiceLike,
  isFreelancer: boolean,
): { id: string; name: string } | null {
  if (isFreelancer) {
    const company = inv.collaboration?.company;
    if (!company) return null;
    return { id: company.id, name: company.name };
  }

  const freelancer = inv.collaboration?.freelancer;
  if (!freelancer) return null;
  return { id: freelancer.id, name: freelancer.user.name ?? "" };
}

/** Filtert op één partij-id met behoud van invoervolgorde; leeg/`null` → lijst ongewijzigd.
 *  Muteert de invoer niet. */
export function filterInvoicesByParty<T extends PartyInvoiceLike>(
  invoices: T[],
  partyId: string | null,
  isFreelancer: boolean,
): T[] {
  if (partyId == null || partyId === "") return invoices.slice();
  return invoices.filter((inv) => invoiceParty(inv, isFreelancer)?.id === partyId);
}

/** Distinct partijen over de lijst met hun aantal, gesorteerd op naam (nl, case-insensitive).
 *  `name` is de ruwe naam (kan "" zijn als een freelancer-gebruikersnaam ontbreekt — de caller
 *  bepaalt de fallback-weergave). */
export function summarizeInvoiceParties(
  invoices: PartyInvoiceLike[],
  isFreelancer: boolean,
): { id: string; name: string; count: number }[] {
  const parties = new Map<string, { id: string; name: string; count: number }>();
  for (const inv of invoices) {
    const party = invoiceParty(inv, isFreelancer);
    if (!party) continue;
    const existing = parties.get(party.id);
    if (existing) {
      existing.count += 1;
    } else {
      parties.set(party.id, { id: party.id, name: party.name, count: 1 });
    }
  }
  return [...parties.values()].sort((a, b) => {
    const byName = a.name.localeCompare(b.name, "nl", { sensitivity: "base" });
    return byName !== 0 ? byName : a.id.localeCompare(b.id);
  });
}

/** Onbekende/lege waarde → `null` (filter genegeerd). Retourneert het id alleen als het
 *  daadwerkelijk bij een partij in de lijst hoort (anti-oracle: onbekend id valt terug op "alles"). */
export function parsePartyFilter(
  value: string | undefined,
  invoices: PartyInvoiceLike[],
  isFreelancer: boolean,
): string | null {
  if (value == null || value === "") return null;
  const exists = invoices.some((inv) => invoiceParty(inv, isFreelancer)?.id === value);
  return exists ? value : null;
}
