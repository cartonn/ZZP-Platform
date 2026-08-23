// Gedeelde bron van waarheid voor de body van de afkeur-notificaties die de OPDRACHTGEVER veroorzaakt
// (factuur- en prestatie-afkeuring). De door de opdrachtgever zélf getypte `reason` (vrije tekst → PII
// van de opdrachtgever) wordt verbatim in de body gekopieerd op de feed van de ZZP'er — een ándere
// gebruiker dan de schrijver.
//
// Eén gedeelde helper zodat de schrijver (`planInvoiceRejectedEvent` / `planPerformanceRejectedEvent`
// in `handlers.ts`) en de AVG-erasure (`anonymizeUser`, die bij verwijdering van de OPDRACHTGEVER exact
// díe body op de ZZP'er-feed moet redacten) nooit driften — anders matcht de erasure een andere body dan
// er staat en overleeft de reden art. 17. Spiegelt `noShowReportedNotificationBody` /
// `shiftHandoffRejectedNotificationBody`. Puur en los testbaar (locked-body-test).

/** Body van de `INVOICE_REJECTED`-notificatie die de ZZP'er (crediteur) op zijn feed ontvangt. */
export function invoiceRejectedNotificationBody(reason: string): string {
  return `Reden: ${reason}. Corrigeer de factuur en dien hem opnieuw in.`;
}

/** Body van de `PERFORMANCE_REJECTED`-notificatie die de ZZP'er op zijn feed ontvangt. */
export function performanceRejectedNotificationBody(reason: string): string {
  return `Reden: ${reason}. Pas het aan en dien opnieuw in.`;
}

/**
 * Body van de `COLLABORATION_STATUS`-notificatie die de TEGENPARTIJ op haar feed ontvangt wanneer een
 * samenwerking wordt geannuleerd. De annulering is symmetrisch: de annuleerder kan de opdrachtgever óf
 * de ZZP'er zijn, en de door hém/haar zélf getypte `reason` (vrije tekst → PII van de annuleerder) landt
 * verbatim in de body op de feed van de ándere partij. Eén gedeelde helper zodat de schrijver
 * (`changeCollaborationStatus` in `samenwerkingen/actions.ts`) en de AVG-erasure (`anonymizeUser`, die
 * bij verwijdering van de annuleerder exact díe body op de tegenpartij-feed moet redacten) nooit driften.
 * Spiegelt `invoiceRejectedNotificationBody` / `performanceRejectedNotificationBody`.
 */
export function collaborationCancelledNotificationBody(
  reason: string,
  chargeable: boolean,
): string {
  return `Reden: ${reason}${
    chargeable
      ? " · Geannuleerd binnen 7 dagen vóór de start — voor de opdrachtgever geldt een betalingsverplichting."
      : ""
  }`;
}
