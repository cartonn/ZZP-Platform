// Pure retentie-logica voor support-tickets (SupportTicket + SupportMessage). Berekent de afkapdatum:
// een afgehandeld (RESOLVED) ticket dat vóór `cutoff` is opgelost (`resolvedAt < cutoff`) mag gewist
// worden. We ankeren op `resolvedAt` — het afhandelmoment — omdat de bewaartermijn pas ná afhandeling
// begint te lopen ("tot afhandeling + redelijke termijn"); een nog-open ticket wordt nooit gesnoeid.
// De status-/null-guard (alleen RESOLVED, resolvedAt niet null) leeft in de taak, niet hier.
//
// AVG art. 5(1)(e) (opslagbeperking): het verwerkingsregister ("support-communicatie") belooft dat
// helpdesk-tickets worden bewaard tot afhandeling + een redelijke termijn (max. 12 maanden na
// afhandeling). Een SupportTicket draagt vrije-tekst-PII in `subject` en elke SupportMessage in `body`;
// deze afleiding maakt de belofte deterministisch afdwingbaar. Geen DB-toegang zodat dit zonder fixture
// testbaar blijft; de taak (support-retention-task.ts) doet de daadwerkelijke, gebatchte verwijdering.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * De afkapdatum voor support-ticket-retentie, of `null` als retentie uit staat.
 * @param retentionDays het geconfigureerde venster in dagen (0/negatief = uit).
 * @param now referentietijdstip (geïnjecteerd voor determinisme).
 * @returns een Date: afgehandelde tickets met `resolvedAt < cutoff` mogen weg; `null` = niets snoeien.
 */
export function supportTicketRetentionCutoff(retentionDays: number, now: Date): Date | null {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return null;
  return new Date(now.getTime() - Math.floor(retentionDays) * MS_PER_DAY);
}
