// BTW-aangifte-deadline-signaal (administratie-ontzorging): het boekhoudpaneel toont de BTW per
// kwartaal (bedragen), maar niet wanneer de aangifte uiterlijk ingediend én betaald moet zijn. Deze
// pure module leidt uit de ledger-entries af welk kwartaal nú aan de beurt is, wat de uiterste
// indieningsdatum is (Nederlandse regel: einde van de maand ná het kwartaal) en hoe dringend dat is.
// Geen fiscaal advies, geen geldstroom — puur een signaal bovenop de bestaande vatReturn-berekening.

import { type LedgerParty } from "@/lib/administration/ledger";
import {
  quarterOf,
  vatReturn,
  type LedgerEntry,
  type Quarter,
} from "@/lib/administration/overview";

/** Kwartaal wordt "binnenkort" zodra de deadline binnen dit aantal dagen valt. */
export const VAT_DEADLINE_SOON_DAYS = 14;

export type VatDeadlineStatus = "upcoming" | "due-soon" | "overdue";

export interface VatDeadlineSummary {
  /** Het kwartaal waarvoor nu aangifte gedaan moet worden (het meest recent afgesloten kwartaal). */
  year: number;
  quarter: Quarter;
  /** Uiterste indienings-/betaaldag (inclusief), als kalenderdatum op UTC-middernacht. */
  deadline: Date;
  /** Hele dagen tot de deadline; 0 = vandaag nog op tijd, negatief = verstreken. */
  daysUntil: number;
  status: VatDeadlineStatus;
  /** Saldo voor dít kwartaal: positief = af te dragen, negatief = terug te ontvangen. */
  balanceCents: number;
  party: LedgerParty;
}

/** Het kalenderkwartaal (1-4) direct vóór het kwartaal van `d`, met bijbehorend jaar. */
export function previousQuarter(d: Date): { year: number; quarter: Quarter } {
  const q = quarterOf(d);
  if (q === 1) return { year: d.getFullYear() - 1, quarter: 4 };
  return { year: d.getFullYear(), quarter: (q - 1) as Quarter };
}

/**
 * Uiterste indieningsdatum van de BTW-aangifte voor een kwartaal (NL): het einde van de maand ná
 * het kwartaal. Q1→30 apr, Q2→31 jul, Q3→31 okt, Q4→31 jan (volgend jaar). Teruggegeven als
 * kalenderdatum op UTC-middernacht (de aangifte mag t/m die dag).
 */
export function vatFilingDeadline(year: number, quarter: Quarter): Date {
  // De maand ná het kwartaal (0-indexed): Q1 eindigt mrt → apr (3), Q2 jun → jul (6), enz.
  // Dag 0 van de daaropvolgende maand = de laatste dag van de deadline-maand.
  const monthAfterQuarter = quarter * 3; // 3, 6, 9, 12 (0-indexed apr/jul/okt/jan-volgend-jaar)
  return new Date(Date.UTC(year, monthAfterQuarter + 1, 0));
}

/** Hele kalenderdagen van `now` tot `deadline` (beide genormaliseerd naar de kalenderdag). */
function wholeDaysUntil(now: Date, deadline: Date): number {
  const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineDay = Date.UTC(
    deadline.getUTCFullYear(),
    deadline.getUTCMonth(),
    deadline.getUTCDate(),
  );
  return Math.round((deadlineDay - nowDay) / 86_400_000);
}

function statusForDays(daysUntil: number): VatDeadlineStatus {
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= VAT_DEADLINE_SOON_DAYS) return "due-soon";
  return "upcoming";
}

/**
 * Vat het openstaande BTW-aangiftevenster samen: het meest recent afgesloten kwartaal, de uiterste
 * indieningsdatum, de aftelling en het saldo voor dat kwartaal. Puur — `now` wordt geïnjecteerd.
 */
export function summarizeVatDeadline(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  now: Date,
): VatDeadlineSummary {
  const { year, quarter } = previousQuarter(now);
  const deadline = vatFilingDeadline(year, quarter);
  const daysUntil = wholeDaysUntil(now, deadline);
  const { balanceCents } = vatReturn(entries, party, year, quarter);
  return {
    year,
    quarter,
    deadline,
    daysUntil,
    status: statusForDays(daysUntil),
    balanceCents,
    party,
  };
}

/**
 * Kalendergrens (lokale tijd) van een kwartaal, zodat een query op `occurredAt` tot precies dat
 * kwartaal beperkt kan worden. `end` is exclusief (de eerste dag van het volgende kwartaal). Bewust
 * lokale tijd — spiegelt de filtering in `vatReturn`/`quarterOf` (`getFullYear`/`getMonth`), zodat
 * een op dit venster gescopete set exact dezelfde entries bevat als de pure berekening ziet.
 */
export function vatQuarterRange(year: number, quarter: Quarter): { start: Date; end: Date } {
  const firstMonth = (quarter - 1) * 3; // 0, 3, 6, 9
  return {
    start: new Date(year, firstMonth, 1),
    end: new Date(year, firstMonth + 3, 1),
  };
}

/**
 * Verdient deze BTW-deadline een next-action? Alleen wanneer de aangifte nú aan de beurt is
 * (binnenkort of verstreken — niet ver weg) én er daadwerkelijk een saldo te melden is (af te
 * dragen óf terug te vorderen). Een nihil-kwartaal (saldo 0) nudgen we niet: dan is er niets
 * eenduidigs te doen en zouden we de vraag "ben ik wel BTW-plichtig?" oproepen. Geen fiscaal advies.
 */
export function vatDeadlineNeedsAction(summary: VatDeadlineSummary): boolean {
  return summary.status !== "upcoming" && summary.balanceCents !== 0;
}
