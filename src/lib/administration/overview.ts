// Periodieke administratie-overzichten (PLATFORM_OVERHAUL.md §5): BTW per kwartaal,
// debiteuren/crediteuren-saldo, jaaromzet. Pure functies over de grootboekregels
// (AdministrationEntry). Integer-centen; exporteerbaar/herleidbaar (de UI/exports bouwen hierop).

import { type LedgerAccount, type LedgerParty } from "@/lib/administration/ledger";
import { type UserRole } from "@/lib/enums";

/** De grootboekpartij van de persoonlijke boekhouding (geen PLATFORM). */
export type PersonalLedgerParty = Extract<LedgerParty, "FREELANCER" | "CLIENT">;

/**
 * Welke grootboekpartij hoort bij een rol op de persoonlijke boekhouding (`/administratie`).
 * Alleen FREELANCER en CLIENT hebben een eigen cascade-grootboek. ADMIN en FRANCHISER niet:
 * een admin gebruikt het platform-brede overzicht (`/admin/administratie`), een franchisenemer
 * heeft geen persoonlijke debiteuren-/crediteurenadministratie. Voor die rollen → `null`.
 */
export function administrationPartyForRole(role: UserRole): PersonalLedgerParty | null {
  if (role === "FREELANCER") return "FREELANCER";
  if (role === "CLIENT") return "CLIENT";
  return null;
}

export interface LedgerEntry {
  party: LedgerParty;
  account: LedgerAccount;
  debitCents: number;
  creditCents: number;
  occurredAt: Date;
}

export type Quarter = 1 | 2 | 3 | 4;

/** Kwartaal (1–4) van een datum. */
export function quarterOf(d: Date): Quarter {
  return (Math.floor(d.getMonth() / 3) + 1) as Quarter;
}

/** Normaliseert -0 naar 0 zodat overzichten geen "-0" tonen. */
function norm(n: number): number {
  return n === 0 ? 0 : n;
}

function netDebit(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  account: LedgerAccount,
): number {
  return norm(
    entries
      .filter((e) => e.party === party && e.account === account)
      .reduce((sum, e) => sum + e.debitCents - e.creditCents, 0),
  );
}

/** Openstaande debiteuren (vorderingen) van een partij: netto debet op DEBITEUREN. */
export function openReceivablesCents(entries: readonly LedgerEntry[], party: LedgerParty): number {
  return netDebit(entries, party, "DEBITEUREN");
}

/** Openstaande crediteuren (schulden) van een partij: netto credit op CREDITEUREN. */
export function openPayablesCents(entries: readonly LedgerEntry[], party: LedgerParty): number {
  return norm(-netDebit(entries, party, "CREDITEUREN"));
}

/**
 * Gerealiseerde omzet van een partij: netto credit op OMZET. Zonder `quarter` over het hele jaar;
 * met `quarter` uitsluitend dat kalenderkwartaal (voor de BTW-aangifte-grondslag per kwartaal).
 */
export function revenueCents(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  year: number,
  quarter?: Quarter,
): number {
  return norm(
    -netDebit(
      entries.filter(
        (e) =>
          e.occurredAt.getFullYear() === year &&
          (quarter === undefined || quarterOf(e.occurredAt) === quarter),
      ),
      party,
      "OMZET",
    ),
  );
}

/** Geboekte kosten van een partij in een jaar: netto debet op KOSTEN. */
export function costCents(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  year: number,
): number {
  return norm(
    netDebit(
      entries.filter((e) => e.occurredAt.getFullYear() === year),
      party,
      "KOSTEN",
    ),
  );
}

export interface VatReturn {
  year: number;
  quarter: Quarter;
  party: LedgerParty;
  payableCents: number; //    af te dragen omzetbelasting
  deductibleCents: number; // voorbelasting
  balanceCents: number; //    te betalen (positief) of terug te ontvangen (negatief)
}

/** BTW-aangifte voor één partij, jaar en kwartaal. */
export function vatReturn(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  year: number,
  quarter: Quarter,
): VatReturn {
  const inPeriod = entries.filter(
    (e) => e.occurredAt.getFullYear() === year && quarterOf(e.occurredAt) === quarter,
  );
  const payableCents = norm(-netDebit(inPeriod, party, "BTW_AF_TE_DRAGEN")); // credit-saldo → positief
  const deductibleCents = netDebit(inPeriod, party, "BTW_VOORBELASTING"); // debet-saldo → positief
  return {
    year,
    quarter,
    party,
    payableCents,
    deductibleCents,
    balanceCents: norm(payableCents - deductibleCents),
  };
}

/** Alle vier de kwartalen van een jaar voor een partij. */
export function vatYear(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  year: number,
): VatReturn[] {
  return ([1, 2, 3, 4] as Quarter[]).map((q) => vatReturn(entries, party, year, q));
}

export interface AnnualSummary {
  year: number;
  party: LedgerParty;
  revenueCents: number; //        omzet (uitschrijver)
  costCents: number; //           kosten (ontvanger)
  vatPayableCents: number; //     af te dragen BTW over het jaar
  vatDeductibleCents: number; //  voorbelasting over het jaar
  vatBalanceCents: number; //     saldo (af te dragen − terug te ontvangen)
}

/** Jaaroverzicht voor IB-voorbereiding (§5): omzet/kosten + BTW-jaarsaldo. Indicatief. */
export function annualSummary(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  year: number,
): AnnualSummary {
  const quarters = vatYear(entries, party, year);
  const vatPayableCents = norm(quarters.reduce((s, q) => s + q.payableCents, 0));
  const vatDeductibleCents = norm(quarters.reduce((s, q) => s + q.deductibleCents, 0));
  return {
    year,
    party,
    revenueCents: revenueCents(entries, party, year),
    costCents: costCents(entries, party, year),
    vatPayableCents,
    vatDeductibleCents,
    vatBalanceCents: norm(vatPayableCents - vatDeductibleCents),
  };
}
