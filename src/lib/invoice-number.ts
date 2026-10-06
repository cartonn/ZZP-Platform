/**
 * Het getoonde/wettelijke factuurnummer — ÉÉN bron, zodat geen enkel scherm, export of notificatie
 * het interne globale `Invoice.number` lekt. Sinds de per-partij-nummering draagt `number` een
 * `issuerKey:`-prefix (bv. `<userId>:2026-0007`) die globaal uniek maakt maar niet getoond mag worden;
 * het partij-nummer (`2026-0007`) is het nummer dat de ZZP'er/opdrachtgever ziet en dat op de factuur
 * hoort. Een factuur met een toegekend `partyInvoiceNumber` (elke losse factuur, en een cascade-factuur
 * ná indienen) toont dat; anders valt het terug op `number` (cascade-concept `CONCEPT-…`, of een oude
 * losse factuur van vóór de partij-nummering die nog geen partij-nummer heeft).
 *
 * Verdediging in de diepte: mocht een genummerde factuur ooit tóch zonder `partyInvoiceNumber` op deze
 * helper belanden (data-afwijking, toekomstige regressie), dan strippen we de `issuerKey:`-prefix alsnog
 * voordat we hem teruggeven. Zo lekt de uitschrijver-sleutel — die een userId bevat — nooit naar UI,
 * PDF, CSV-export of notificatie. De prefix is `<issuerKey>:` waarbij de sleutel een cuid of `PLATFORM`
 * is (nooit een dubbele punt), en het zichtbare deel een partij-nummer (`JAAR-VOLGNR`, geen dubbele punt).
 * CONCEPT-nummers (`CONCEPT-<id>`, geen dubbele punt) en oude losse nummers blijven ongemoeid.
 */

/** Zichtbaar partij-nummer: `JAAR-VOLGNR`, bv. `2026-0007` (volgnummer ≥ 4 cijfers). Geen dubbele punt. */
const PARTY_NUMBER_RE = /^\d{4}-\d{4,}$/;

/**
 * Verwijdert een `issuerKey:`-prefix uitsluitend wanneer het restant een geldig partij-nummer is.
 * Elke andere waarde (CONCEPT-…, legacy) blijft letterlijk behouden.
 */
function stripIssuerPrefix(number: string): string {
  const colon = number.indexOf(":");
  if (colon !== -1) {
    const suffix = number.slice(colon + 1);
    if (PARTY_NUMBER_RE.test(suffix)) return suffix;
  }
  return number;
}

export function displayInvoiceNumber(inv: {
  partyInvoiceNumber: string | null;
  number: string;
}): string {
  // `!= null` spiegelt de eerdere `??`-semantiek: een leeg partij-nummer ("") blijft "" (ongewijzigd).
  if (inv.partyInvoiceNumber != null) return inv.partyInvoiceNumber;
  return stripIssuerPrefix(inv.number);
}
