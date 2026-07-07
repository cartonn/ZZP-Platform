// Factuur herhalen: bouwt de voor-ingevulde formulierwaarden voor een NIEUWE handmatige factuur op
// basis van een bestaande. Puur en getest. Server-side is de waarheid (CLAUDE.md regel 1): de
// bron-factuur wordt server-side opgehaald en op ownership gecontroleerd; deze helper vormt alleen de
// payload om, en de bestaande createInvoice-actie herberekent en valideert elke regel opnieuw.
//
// Bewust weggelaten bij het herhalen:
// - factuurnummer/status/factuur- en vervaldatum → een kopie start altijd als vers concept met een
//   nieuw, opeenvolgend nummer; niets van de verzend-/betaalstaat lekt mee.
// - Alleen de regels (omschrijving, aantal, tarief) en de samenwerking worden overgenomen, want dat
//   is wat bij terugkerende facturatie identiek blijft.

import { centsToEuroInput } from "./mileage";

/** Bron-factuurregel met de velden die een herhaal-payload nodig heeft. */
export interface DuplicableInvoiceLine {
  description: string;
  quantity: number;
  unitCents: number;
}

/** Bron-factuur (handmatig, niet-cascade) met de relaties die een herhaal-payload nodig heeft. */
export interface DuplicableInvoice {
  collaborationId: string;
  lines: readonly DuplicableInvoiceLine[];
}

/** Formulier-vorm van de kopie: strings zoals de invoervelden ze verwachten. */
export interface InvoiceDuplicateInitial {
  collaborationId: string;
  lines: { description: string; quantity: string; unit: string }[];
}

/**
 * Vormt een bron-factuur om tot de `initial` van de nieuwe-factuur-form: dezelfde samenwerking en
 * dezelfde regels, maar zonder nummer/status/datums. Aantallen en tarieven worden naar de
 * invoerstring-vorm gebracht (centen → euro-decimaal) zodat ze exact terug-ronden via de bestaande
 * `createInvoice`-actie. Een factuur zonder regels levert een lege regellijst; het formulier valt dan
 * terug op één lege regel.
 */
export function buildInvoiceDuplicateInitial(invoice: DuplicableInvoice): InvoiceDuplicateInitial {
  return {
    collaborationId: invoice.collaborationId,
    lines: invoice.lines.map((l) => ({
      description: l.description,
      quantity: String(l.quantity),
      unit: centsToEuroInput(l.unitCents),
    })),
  };
}
