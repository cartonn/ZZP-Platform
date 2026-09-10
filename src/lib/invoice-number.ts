/**
 * Het getoonde/wettelijke factuurnummer — ÉÉN bron, zodat geen enkel scherm, export of notificatie
 * het interne globale `Invoice.number` lekt. Sinds de per-partij-nummering draagt `number` een
 * `issuerKey:`-prefix (bv. `<userId>:2026-0007`) die globaal uniek maakt maar niet getoond mag worden;
 * het partij-nummer (`2026-0007`) is het nummer dat de ZZP'er/opdrachtgever ziet en dat op de factuur
 * hoort. Een factuur met een toegekend `partyInvoiceNumber` (elke losse factuur, en een cascade-factuur
 * ná indienen) toont dat; anders valt het terug op `number` (cascade-concept `CONCEPT-…`, of een oude
 * losse factuur van vóór de partij-nummering die nog geen partij-nummer heeft).
 */
export function displayInvoiceNumber(inv: {
  partyInvoiceNumber: string | null;
  number: string;
}): string {
  return inv.partyInvoiceNumber ?? inv.number;
}
