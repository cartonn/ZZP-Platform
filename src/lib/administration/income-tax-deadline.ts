// Aangifte-inkomstenbelasting-deadline-signaal (administratie-ontzorging): het ontzorg-overzicht
// toont de IB-schatting (bedrag) al, maar niet wanneer de aangifte over een belastingjaar uiterlijk
// ingediend moet zijn. Deze pure module leidt de uiterste aangiftedatum af (Nederlandse standaardregel:
// 1 mei van het jaar ná het belastingjaar) en bepaalt welk belastingjaar nú op de kalender hoort.
//
// Bewust FORWARD-LOOKING: er is — anders dan bij een BTW-saldo — geen "ingediend"-vlag in het systeem
// (de aangifte gebeurt buiten het platform, via DigiD/een fiscaal dienstverlener). Een verstreken
// IB-deadline tonen zou dus vaak onjuist/ruis zijn. Daarom kiezen we altijd de eerstvolgende
// deadline die nog niet is verstreken; het venster flipt precies op 2 mei naar het volgende
// belastingjaar. Geen fiscaal advies, geen geldstroom — puur een agenderingssignaal.

/** De deadline wordt "binnenkort" zodra hij binnen dit aantal dagen valt (ruimer dan BTW: jaarlijks,
 * meer voorbereiding). */
export const INCOME_TAX_DEADLINE_SOON_DAYS = 30;

export type IncomeTaxDeadlineStatus = "upcoming" | "due-soon";

export interface IncomeTaxDeadlineSummary {
  /** Het belastingjaar waarover aangifte gedaan wordt (bv. 2026 → deadline 1 mei 2027). */
  taxYear: number;
  /** Uiterste aangifte-/betaaldag (inclusief), als kalenderdatum op UTC-middernacht. */
  deadline: Date;
  /** Hele dagen tot de deadline; 0 = vandaag nog op tijd. Altijd ≥ 0 (forward-looking). */
  daysUntil: number;
  status: IncomeTaxDeadlineStatus;
}

/**
 * Uiterste aangiftedatum van de inkomstenbelasting over een belastingjaar (NL-standaard): 1 mei van
 * het daaropvolgende kalenderjaar. Teruggegeven als kalenderdatum op UTC-middernacht (de aangifte mag
 * t/m die dag). Uitstel via de Belastingdienst/een fiscaal dienstverlener valt buiten dit signaal.
 */
export function incomeTaxFilingDeadline(taxYear: number): Date {
  // Maand 4 (0-indexed) = mei; dag 1 = 1 mei.
  return new Date(Date.UTC(taxYear + 1, 4, 1));
}

/** Hele kalenderdagen van `now` tot `deadline` (beide genormaliseerd naar de kalenderdag, UTC). */
function wholeDaysUntil(now: Date, deadline: Date): number {
  const nowDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const deadlineDay = Date.UTC(
    deadline.getUTCFullYear(),
    deadline.getUTCMonth(),
    deadline.getUTCDate(),
  );
  return Math.round((deadlineDay - nowDay) / 86_400_000);
}

/**
 * Het belastingjaar waarvan de aangifte-deadline (1 mei van het jaar erná) de eerstvolgende is die
 * nog niet is verstreken t.o.v. `now`. Vóór/op 1 mei van jaar Y → belastingjaar Y-1 (net afgesloten);
 * vanaf 2 mei → belastingjaar Y (het lopende jaar). Puur — `now` wordt geïnjecteerd.
 */
export function nextIncomeTaxYear(now: Date): number {
  const year = now.getUTCFullYear();
  // Deadline over jaar Y-1 valt op 1 mei Y. Nog niet verstreken (deadline-dag ≥ vandaag) → kies Y-1.
  return wholeDaysUntil(now, incomeTaxFilingDeadline(year - 1)) >= 0 ? year - 1 : year;
}

/**
 * Vat de eerstvolgende IB-aangifte-deadline samen: het te agenderen belastingjaar, de uiterste
 * aangiftedatum, de aftelling en de urgentie. Altijd forward-looking (nooit verstreken). Puur.
 */
export function summarizeIncomeTaxDeadline(now: Date): IncomeTaxDeadlineSummary {
  const taxYear = nextIncomeTaxYear(now);
  const deadline = incomeTaxFilingDeadline(taxYear);
  const daysUntil = Math.max(0, wholeDaysUntil(now, deadline));
  return {
    taxYear,
    deadline,
    daysUntil,
    status: daysUntil <= INCOME_TAX_DEADLINE_SOON_DAYS ? "due-soon" : "upcoming",
  };
}

/**
 * Verdient de IB-deadline een next-action-nudge? Alléén wanneer hij binnen het "binnenkort"-venster
 * (`INCOME_TAX_DEADLINE_SOON_DAYS`) valt. Buiten dat venster leeft het signaal alleen in de agenda-feed
 * en het ontzorg-overzicht — een jaarrond IB-nudge op /acties zou puur ruis zijn. Anders dan bij de BTW
 * is er geen "verstreken"-status (forward-looking; zie `summarizeIncomeTaxDeadline`), dus dit is de enige
 * gate. Puur — spiegelt `vatDeadlineNeedsAction`.
 */
export function incomeTaxDeadlineNeedsAction(summary: IncomeTaxDeadlineSummary): boolean {
  return summary.status === "due-soon";
}

/**
 * Kalendergrens (lokale tijd) van een belastingjaar, zodat een query op `occurredAt` tot precies dat
 * jaar beperkt kan worden. `end` is exclusief (1 januari van het volgende jaar). Bewust lokale tijd —
 * spiegelt de filtering in `annualSummary`/`revenueCents` (`getFullYear`), zodat een op dit venster
 * gescopete set exact dezelfde entries bevat als de pure omzetberekening ziet.
 */
export function taxYearRange(taxYear: number): { start: Date; end: Date } {
  return { start: new Date(taxYear, 0, 1), end: new Date(taxYear + 1, 0, 1) };
}
