// Pure retentie-logica voor notificatiehistorie (Notification). Berekent de afkapdatum: een
// notificatie die vóór `cutoff` is aangemaakt (`createdAt < cutoff`) mag gewist worden — ongeacht
// lees-/digest-/push-status, want het register belooft een MAX-bewaartermijn voor de hele historie.
//
// AVG art. 5(1)(e) (opslagbeperking): het verwerkingsregister ("notificaties-email") belooft
// "Notificatiehistorie max. 6 maanden". Een Notification-rij draagt PII in title/body (namen,
// bedragen, statusupdates); deze afleiding maakt de belofte deterministisch afdwingbaar. Geen
// DB-toegang zodat dit zonder fixture testbaar blijft; de taak (notification-retention-task.ts) doet
// de daadwerkelijke, gebatchte verwijdering.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * De afkapdatum voor notificatie-retentie, of `null` als retentie uit staat.
 * @param retentionDays het geconfigureerde venster in dagen (0/negatief = uit).
 * @param now referentietijdstip (geïnjecteerd voor determinisme).
 * @returns een Date: notificaties met `createdAt < cutoff` mogen weg; `null` = niets snoeien.
 */
export function notificationRetentionCutoff(retentionDays: number, now: Date): Date | null {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return null;
  return new Date(now.getTime() - Math.floor(retentionDays) * MS_PER_DAY);
}
