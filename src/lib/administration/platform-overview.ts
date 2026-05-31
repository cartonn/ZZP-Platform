// Platform-brede kwartaaloverzichten over alle AdministrationEntry-regels (geen ownerUserId-filter).
// Pure functies; getest en exporteerbaar.

import { type LedgerEntry, quarterOf } from "@/lib/administration/overview";

export interface PlatformQuarterRow {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  /** Totale omzet geboekt voor de FREELANCER-partij (netto credit op OMZET). */
  freelancerRevenueCents: number;
  /** Totale kosten geboekt voor de CLIENT-partij (netto debet op KOSTEN). */
  clientCostsCents: number;
}

type YearQuarterKey = `${number}-${1 | 2 | 3 | 4}`;

/**
 * Platform-brede kwartaalomzet over alle grootboekregels.
 * Groepeert per jaar+kwartaal, sorteert nieuwste kwartaal eerst.
 * Kwartalen zonder data worden weggelaten.
 */
export function platformQuarterlySummary(entries: readonly LedgerEntry[]): PlatformQuarterRow[] {
  const map = new Map<
    YearQuarterKey,
    {
      year: number;
      quarter: 1 | 2 | 3 | 4;
      freelancerRevenueCents: number;
      clientCostsCents: number;
    }
  >();

  for (const entry of entries) {
    const year = entry.occurredAt.getFullYear();
    const quarter = quarterOf(entry.occurredAt);
    const key: YearQuarterKey = `${year}-${quarter}`;

    if (!map.has(key)) {
      map.set(key, { year, quarter, freelancerRevenueCents: 0, clientCostsCents: 0 });
    }

    const row = map.get(key)!;

    if (entry.party === "FREELANCER" && entry.account === "OMZET") {
      // OMZET is een credit-rekening: positieve omzet = credit groter dan debet
      row.freelancerRevenueCents += entry.creditCents - entry.debitCents;
    }

    if (entry.party === "CLIENT" && entry.account === "KOSTEN") {
      // KOSTEN is een debet-rekening: positieve kosten = debet groter dan credit
      row.clientCostsCents += entry.debitCents - entry.creditCents;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.quarter - a.quarter;
  });
}
