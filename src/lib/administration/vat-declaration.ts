// BTW-aangifte-rubrieken (administratie-ontzorging): het boekhoudpaneel toont de BTW per kwartaal
// (af te dragen / voorbelasting / saldo), maar niet de kant-en-klare Belastingdienst-rubrieken die
// je in het BTW-portaal overtikt. Deze pure motor mapt het grootboek van één kwartaal naar precies
// die rubrieken zodat de ZZP'er de bedragen rechtstreeks kan overnemen. INDICATIEF (zie
// TAX_DISCLAIMER): afgeleid uit de platform-facturen (hoog tarief 21%), geen fiscaal advies.
import { type LedgerParty } from "@/lib/administration/ledger";
import { type LedgerEntry, type Quarter, revenueCents, vatReturn } from "./overview";

/** Eén ingevulde rubriek van de BTW-aangifte. */
export interface VatRubriek {
  /** Rubrieknummer zoals op het aangifteformulier, bv. "1a" of "5b". */
  code: string;
  /** Omschrijving van de rubriek. */
  label: string;
  /** Grondslag (het bedrag waarover BTW wordt berekend), of `null` als de rubriek geen grondslag kent. */
  baseCents: number | null;
  /** De omzetbelasting van deze rubriek. */
  vatCents: number;
}

/** Volledig ingevulde BTW-aangifte voor één kwartaal, als rubrieken plus het te-betalen-saldo. */
export interface VatDeclaration {
  year: number;
  quarter: Quarter;
  party: LedgerParty;
  /** De rubriekregels in aangiftevolgorde (1a, 5a, 5b). */
  rubrieken: VatRubriek[];
  /** Rubriek 5g: totaal te betalen (positief) of terug te ontvangen (negatief). */
  balanceCents: number;
}

/**
 * Bouw de BTW-aangifte voor één partij, jaar en kwartaal uit het grootboek. Puur.
 *
 * Mapping (NL, hoog tarief 21%):
 * - **1a** Leveringen/diensten belast met hoog tarief → grondslag = omzet excl. BTW, BTW = af te dragen;
 * - **5a** Verschuldigde omzetbelasting → som van de verschuldigde BTW (hier gelijk aan 1a);
 * - **5b** Voorbelasting → de aftrekbare BTW op kosten;
 * - **5g** Saldo (5a − 5b) → te betalen of terug te ontvangen.
 */
export function buildVatDeclaration(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  year: number,
  quarter: Quarter,
): VatDeclaration {
  const { payableCents, deductibleCents, balanceCents } = vatReturn(entries, party, year, quarter);
  const baseCents = revenueCents(entries, party, year, quarter);

  const rubrieken: VatRubriek[] = [
    {
      code: "1a",
      label: "Leveringen/diensten belast met hoog tarief",
      baseCents,
      vatCents: payableCents,
    },
    {
      code: "5a",
      label: "Verschuldigde omzetbelasting",
      baseCents: null,
      vatCents: payableCents,
    },
    {
      code: "5b",
      label: "Voorbelasting",
      baseCents: null,
      vatCents: deductibleCents,
    },
  ];

  return { year, quarter, party, rubrieken, balanceCents };
}
