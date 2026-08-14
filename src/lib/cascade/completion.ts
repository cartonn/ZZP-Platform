// Pure gereedheidscheck voor het automatisch afronden van een samenwerking in de betaal-cascade.
// Een samenwerking met nog openstaand geld (niet-afgewikkelde facturen) of onbeoordeeld werk
// (ingediende prestaties die nog op goedkeuring wachten) mag niet automatisch op COMPLETED
// springen — anders raakt die betaalverplichting of dat werk los van zijn context.
// Server-berekend, geen DB-toegang (CLAUDE.md regel 1). Pure functie, unit-testbaar.

// Een cascade-factuur (lifecycleStatus gezet) is afgewikkeld zodra de keten klaar is.
export const SETTLED_INVOICE_LIFECYCLE = ["PAID", "PROCESSED", "CREDITED"] as const;
// Een legacy-factuur (geen lifecycleStatus) is afgewikkeld bij betaald of geannuleerd.
export const SETTLED_INVOICE_LEGACY_STATUS = ["PAID", "CANCELLED"] as const;

export interface InvoiceStateSnapshot {
  lifecycleStatus: string | null;
  status: string;
}

/**
 * Een factuur is "afgewikkeld" (geen openstaand geld meer) als ze cascade is met
 * lifecycleStatus PAID/PROCESSED/CREDITED, of legacy (geen lifecycleStatus) met status
 * PAID/CANCELLED. Alle overige toestanden (DRAFT, SUBMITTED, APPROVED, OVERDUE, REJECTED,
 * legacy SENT/DRAFT) gelden als openstaand.
 */
export function isInvoiceSettled(inv: InvoiceStateSnapshot): boolean {
  if (inv.lifecycleStatus != null) {
    return (SETTLED_INVOICE_LIFECYCLE as readonly string[]).includes(inv.lifecycleStatus);
  }
  return (SETTLED_INVOICE_LEGACY_STATUS as readonly string[]).includes(inv.status);
}

export interface OpenWorkSnapshot {
  /** Andere facturen van de samenwerking (de zojuist betaalde factuur uitgesloten). */
  otherInvoices: InvoiceStateSnapshot[];
  /** Aantal ingediende prestaties (Performance status SUBMITTED) dat nog op goedkeuring wacht. */
  submittedPerformances: number;
}

/**
 * True zodra er nog openstaand geld (een niet-afgewikkelde andere factuur) of onbeoordeeld
 * werk (een ingediende prestatie) is. Pure functie, geen DB.
 */
export function hasOpenCollaborationWork(snapshot: OpenWorkSnapshot): boolean {
  if (snapshot.submittedPerformances > 0) return true;
  return snapshot.otherInvoices.some((inv) => !isInvoiceSettled(inv));
}

/**
 * Relationele eligibility-guard (Prisma-where-vorm) voor het automatisch afronden van een
 * samenwerking bij betaling (Event E). Náást de `from: "ACTIVE"`-match dwingt deze guard bij het
 * wegschrijven — binnen de transactie — af dat er géén ander openstaand werk meer is:
 *  - geen ingediende (SUBMITTED) prestatie die nog op goedkeuring wacht, én
 *  - geen andere niet-afgewikkelde factuur (de zojuist betaalde factuur uitgesloten via `id != …`;
 *    die staat op dat moment al op PAID binnen dezelfde transactie).
 *
 * Zo wordt de race gedicht waarbij `hasOpenCollaborationWork` vóór de transactie `false` teruggaf
 * maar er tussen die lees en de write alsnog een prestatie werd ingediend of een factuur verscheen:
 * de rij matcht dan niet meer (count 0) en de afronding valt weg (`optional`), zónder de betaling
 * zelf terug te draaien. Één bron van waarheid met `isInvoiceSettled` (dezelfde afgewikkeld-sets).
 * Plain object (geen Prisma-import) — puur en unit-testbaar.
 *
 * `disputedAt: null` sluit bovendien het venster waarin een gelijktijdig geopend dispuut binnen de
 * betaal-transactie zou wegvallen: de dispuut-guard in `persistEventAndEffects` leest `disputedAt`
 * één keer als eerste statement, maar de auto-afronding-write komt enkele statements later. Werd er in
 * dat venster een dispuut geopend, dan mag de samenwerking niet op COMPLETED springen (een afgeronde
 * samenwerking met een open `disputedAt` is een inconsistente staat). Deze `disputedAt: null`-eis her-
 * toetst dat in dezelfde write: bij een net-geopend dispuut matcht de rij niet meer (count 0), de
 * afronding valt weg (`optional`) en de samenwerking blijft ACTIVE en bevroren — betaling blijft staan.
 */
export function collaborationCompletableGuard(currentInvoiceId: string): Record<string, unknown> {
  return {
    disputedAt: null,
    performances: { none: { status: "SUBMITTED" } },
    invoices: {
      none: {
        id: { not: currentInvoiceId },
        OR: [
          // Cascade-factuur (lifecycleStatus gezet) die nog niet is afgewikkeld.
          { lifecycleStatus: { notIn: [...SETTLED_INVOICE_LIFECYCLE] } },
          // Legacy-factuur (geen lifecycleStatus) die nog niet betaald/geannuleerd is.
          { lifecycleStatus: null, status: { notIn: [...SETTLED_INVOICE_LEGACY_STATUS] } },
        ],
      },
    },
  };
}

/**
 * NL-reden waarom een samenwerking nog niet afgerond mag worden, of `null` als het mag.
 * Tegenhanger van `hasOpenCollaborationWork` voor het handmatige afrondpad én de knopweergave:
 * geld weegt het zwaarst (een niet-afgewikkelde factuur blokkeert vóór een onbeoordeelde
 * prestatie). Bij handmatig afronden tellen álle facturen mee (zet ze in `otherInvoices`).
 */
export function completionBlockReason(snapshot: OpenWorkSnapshot): string | null {
  const openInvoices = snapshot.otherInvoices.filter((inv) => !isInvoiceSettled(inv)).length;
  if (openInvoices > 0) {
    return openInvoices === 1
      ? "Er staat nog 1 factuur open voor deze samenwerking. Markeer die als betaald of crediteer 'm eerst."
      : `Er staan nog ${openInvoices} facturen open voor deze samenwerking. Markeer die als betaald of crediteer ze eerst.`;
  }
  if (snapshot.submittedPerformances > 0) {
    return snapshot.submittedPerformances === 1
      ? "Er wacht nog 1 ingediende urenstaat of oplevering op goedkeuring. Beoordeel die eerst voordat je de samenwerking afrondt."
      : `Er wachten nog ${snapshot.submittedPerformances} ingediende urenstaten of opleveringen op goedkeuring. Beoordeel die eerst voordat je de samenwerking afrondt.`;
  }
  return null;
}

/**
 * NL-reden waarom een samenwerking nog niet geANNULEERD mag worden, of `null` als het mag.
 * Symmetrisch met `completionBlockReason`: annuleren mag niet zolang er nog open geld (een
 * niet-afgewikkelde factuur, óók een DRAFT-cascadefactuur) óf onbeoordeeld werk (een ingediende
 * prestatie) is. Anders zou dat werk/geld ná de annulering losraken van zijn context en tóch de
 * cascade in kunnen glippen (approve-prestatie → factuur → betaling op een geannuleerde deal).
 * `submitPerformance` blokkeert al nieuw werk ná annulering; deze rem sluit het venster aan de
 * voorkant. Beoordeel/wijs de prestatie eerst af, of markeer/crediteer de factuur — dan mag annuleren.
 */
export function cancellationBlockReason(snapshot: OpenWorkSnapshot): string | null {
  const openInvoices = snapshot.otherInvoices.filter((inv) => !isInvoiceSettled(inv)).length;
  if (openInvoices > 0) {
    return openInvoices === 1
      ? "Er staat nog 1 factuur open voor deze samenwerking. Markeer die als betaald of crediteer 'm eerst."
      : `Er staan nog ${openInvoices} facturen open voor deze samenwerking. Markeer die als betaald of crediteer ze eerst.`;
  }
  if (snapshot.submittedPerformances > 0) {
    return snapshot.submittedPerformances === 1
      ? "Er wacht nog 1 ingediende urenstaat of oplevering op goedkeuring. Beoordeel of wijs die eerst af voordat je de samenwerking annuleert."
      : `Er wachten nog ${snapshot.submittedPerformances} ingediende urenstaten of opleveringen op goedkeuring. Beoordeel of wijs die eerst af voordat je de samenwerking annuleert.`;
  }
  return null;
}
