// BTW-aangifte-deadline-signaal (administratie-ontzorging): het boekhoudpaneel toont de BTW per
// kwartaal (bedragen), maar niet wanneer de aangifte uiterlijk ingediend én betaald moet zijn. Deze
// pure module leidt uit de ledger-entries af welk kwartaal nú aan de beurt is, wat de uiterste
// indieningsdatum is (Nederlandse regel: einde van de maand ná het kwartaal) en hoe dringend dat is.
// Geen fiscaal advies, geen geldstroom — puur een signaal bovenop de bestaande vatReturn-berekening.

import {
  amsterdamCivilDayMs,
  fiscalYearOf,
  quarterStartInstant,
} from "@/lib/administration/fiscal-calendar";
import { type LedgerParty } from "@/lib/administration/ledger";
import {
  quarterOf,
  vatReturn,
  type LedgerEntry,
  type Quarter,
} from "@/lib/administration/overview";

/** Kwartaal wordt "binnenkort" zodra de deadline binnen dit aantal dagen valt. */
export const VAT_DEADLINE_SOON_DAYS = 14;

/**
 * Hoeveel kwartalen terug de openstaande-aangifte-scan kijkt (8 = 2 jaar). Een aangifte ouder dan dit
 * venster valt buiten de actieve herinnering: een >2 jaar verstreken aangifte is geen dashboard-nudge
 * meer, en het venster houdt zowel de query als de actie-rail begrensd. Alle realistische
 * niet-afgehandelde kwartalen vallen ruim binnen dit venster.
 */
export const VAT_DEADLINE_LOOKBACK_QUARTERS = 8;

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
  const year = fiscalYearOf(d);
  if (q === 1) return { year: year - 1, quarter: 4 };
  return { year, quarter: (q - 1) as Quarter };
}

/** Het kalenderkwartaal direct vóór (year, quarter) — rolt in Q1 terug naar Q4 van het vorige jaar. */
export function precedingQuarter(
  year: number,
  quarter: Quarter,
): { year: number; quarter: Quarter } {
  if (quarter === 1) return { year: year - 1, quarter: 4 };
  return { year, quarter: (quarter - 1) as Quarter };
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

/**
 * Hele kalenderdagen van `now` tot `deadline` (beide genormaliseerd naar de burgerlijke kalenderdag
 * in Europe/Amsterdam). `now` wordt via de Amsterdamse dag genormaliseerd; de deadline is al op
 * UTC-middernacht van de betreffende NL-kalenderdag geconstrueerd (`vatFilingDeadline`).
 */
function wholeDaysUntil(now: Date, deadline: Date): number {
  const nowDay = amsterdamCivilDayMs(now);
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

/** Vat één specifiek BTW-aangiftevenster (year, quarter) samen t.o.v. `now`. Puur. */
function summarizeVatDeadlineFor(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  year: number,
  quarter: Quarter,
  now: Date,
): VatDeadlineSummary {
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
 * Vat het openstaande BTW-aangiftevenster samen: het meest recent afgesloten kwartaal, de uiterste
 * indieningsdatum, de aftelling en het saldo voor dat kwartaal. Puur — `now` wordt geïnjecteerd.
 */
export function summarizeVatDeadline(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  now: Date,
): VatDeadlineSummary {
  const { year, quarter } = previousQuarter(now);
  return summarizeVatDeadlineFor(entries, party, year, quarter, now);
}

/**
 * Alle openstaande BTW-aangiftevensters die nú actie verdienen — niet alleen het meest recent
 * afgesloten kwartaal. Scant vanaf `previousQuarter(now)` een begrensd aantal kwartalen terug
 * (`VAT_DEADLINE_LOOKBACK_QUARTERS`), zodat een overgeslagen, nooit-afgehandeld kwartaal niet stil
 * verdwijnt zodra de kalender in het volgende kwartaal rolt (er is geen "afgehandeld"-vlag: het
 * grootboek kent alleen het openstaande saldo). Een nihil-/upcoming-kwartaal levert niets op (zie
 * `vatDeadlineNeedsAction`), dus lege of afgeronde kwartalen vallen vanzelf weg. Oudste-eerst, zodat
 * de meest verstreken aangifte bovenaan de actie-rail komt. Puur — `now` wordt geïnjecteerd.
 */
export function summarizeVatDeadlines(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  now: Date,
  maxLookbackQuarters: number = VAT_DEADLINE_LOOKBACK_QUARTERS,
): VatDeadlineSummary[] {
  const steps = Math.max(1, Math.floor(maxLookbackQuarters));
  const out: VatDeadlineSummary[] = [];
  let cursor = previousQuarter(now); // nieuw → oud
  for (let i = 0; i < steps; i++) {
    const summary = summarizeVatDeadlineFor(entries, party, cursor.year, cursor.quarter, now);
    if (vatDeadlineNeedsAction(summary)) out.push(summary);
    cursor = precedingQuarter(cursor.year, cursor.quarter);
  }
  return out.reverse(); // oudste-eerst
}

/**
 * Kalendergrens van een kwartaal als UTC-instanten, zodat een query op `occurredAt` (opgeslagen als
 * UTC-instant) tot precies dat kwartaal beperkt kan worden. `end` is exclusief (de eerste dag van het
 * volgende kwartaal). De grenzen vallen op burgerlijke middernacht in Europe/Amsterdam — spiegelt de
 * filtering in `vatReturn`/`quarterOf` (`fiscalYearOf`/`fiscalQuarterOf`), zodat een op dit venster
 * gescopete set exact dezelfde entries bevat als de pure berekening ziet.
 */
export function vatQuarterRange(year: number, quarter: Quarter): { start: Date; end: Date } {
  return {
    start: quarterStartInstant(year, quarter),
    end:
      quarter === 4
        ? quarterStartInstant(year + 1, 1)
        : quarterStartInstant(year, (quarter + 1) as Quarter),
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
