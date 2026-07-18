// Pure retentie-logica voor de webhook-event-ledger (ProcessedWebhookEvent). Berekent de afkapdatum:
// ledgerrijen met createdAt vóór de cutoff mogen gesnoeid worden. Geen DB-toegang zodat dit
// deterministisch en zonder fixture testbaar blijft; de taak (webhook-event-retention-task.ts) doet de
// daadwerkelijke, gebatchte verwijdering.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * De afkapdatum voor webhook-ledger-retentie, of `null` als retentie uit staat.
 * @param retentionDays het geconfigureerde venster in dagen (0/negatief = uit).
 * @param now referentietijdstip (geïnjecteerd voor determinisme).
 * @returns een Date: rijen met `createdAt < cutoff` mogen weg; `null` = niets snoeien.
 */
export function webhookEventRetentionCutoff(retentionDays: number, now: Date): Date | null {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return null;
  return new Date(now.getTime() - Math.floor(retentionDays) * MS_PER_DAY);
}
