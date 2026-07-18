// Uitgaven-vooruitblik voor de opdrachtgever — geaggregeerde verwachting op /facturen.
//
// Spiegelbeeld van de cashflow-vooruitblik van de ZZP'er (`cashflow-forecast.ts`). Waar die
// beantwoordt "hoeveel geld komt er binnen?", beantwoordt deze de payer-vraag: "hoeveel moet ik de
// komende 30 dagen betalen?" — zodat de opdrachtgever liquiditeit kan plannen en op tijd betaalt
// (te laat betalen schaadt de zichtbare betaalreputatie, `client-payment-reputation.ts`).
//
// Anker is de contractuele vervaldatum (`dueAt`), niet een historie-projectie: de payer weet zelf
// wanneer hij MOET betalen, niet wanneer hij dat gemiddeld doet. Reeds verstreken vervaldata tellen
// als "binnen 30 dagen" — dat geld is nú verschuldigd. Alleen openstaande facturen tellen mee; een
// factuur zonder vervaldatum kan niet op de tijdlijn geplaatst worden en blijft buiten de telling.
//
// Server-side waarheid: alleen tonen, nooit beslissen. De vooruitblik verandert geen status en
// verplaatst geen geld — het is een verwachting op basis van de vervaldata, geen betaalopdracht.

const MS_PER_DAY = 86_400_000;

/** Horizon (dagen) voor de "op korte termijn te betalen"-emmer. Eén maand = de gangbare betaaltermijn. */
export const PAYABLES_HORIZON_DAYS = 30;

export interface PayableInvoiceInput {
  /** Factuurbedrag inclusief btw (Invoice.totalCents). */
  totalCents: number;
  /** Contractuele vervaldatum (Invoice.dueAt); `null` = geen vervaldatum bekend. */
  dueAt: Date | null;
  /** Staat deze factuur nog open (te betalen)? Betaalde/afgehandelde facturen tellen niet mee. */
  outstanding: boolean;
}

export interface PayablesForecast {
  /** Te betalen binnen `PAYABLES_HORIZON_DAYS` dagen (inclusief reeds verstreken vervaldata). */
  next30Cents: number;
  next30Count: number;
  /** Verschuldigd ná de horizon (vervaldatum verder weg dan de horizon). */
  laterCents: number;
  laterCount: number;
}

/**
 * Telt openstaande, te betalen facturen op naar wanneer ze verschuldigd zijn, op basis van de
 * vervaldatum. Puur en deterministisch (klok via `now`), geschikt voor unit-tests zonder DB.
 *
 * - Alleen `outstanding` facturen tellen mee — een betaalde/afgehandelde factuur is geen uitgave meer.
 * - Een factuur zonder `dueAt` kan niet op de tijdlijn geplaatst worden en blijft buiten beide emmers.
 * - Een reeds verstreken vervaldatum telt als "binnen 30 dagen": het bedrag is nú verschuldigd.
 */
export function summarizePayablesForecast(
  invoices: readonly PayableInvoiceInput[],
  now: number,
): PayablesForecast {
  const horizon = now + PAYABLES_HORIZON_DAYS * MS_PER_DAY;
  let next30Cents = 0;
  let next30Count = 0;
  let laterCents = 0;
  let laterCount = 0;

  for (const inv of invoices) {
    if (!inv.outstanding || inv.dueAt == null) continue;
    if (inv.dueAt.getTime() <= horizon) {
      next30Cents += inv.totalCents;
      next30Count += 1;
    } else {
      laterCents += inv.totalCents;
      laterCount += 1;
    }
  }

  return { next30Cents, next30Count, laterCents, laterCount };
}
