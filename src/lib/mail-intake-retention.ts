// Pure retentie-logica voor mail-intake (MailIntake). Berekent de afkapdatum: een intake die vóór
// `cutoff` is ontvangen (`receivedAt < cutoff`) mag gewist worden mits de beoordeling aantoonbaar is
// afgerond (status ACCEPTED/DISMISSED) — die terminale-status-guard leeft in de taak, niet hier.
// We ankeren op de onveranderlijke `receivedAt`: dat is het moment waarop de (derde-partij-)mail
// binnenkwam en dus het startpunt van de bewaartermijn. `decidedAt` is bewust NIET de anker: die kan
// bij heropenen (DISMISSED → NEW) weer op null worden gezet.
//
// AVG art. 5(1)(e) (opslagbeperking): een MailIntake-rij draagt derde-partij-PII in `fromAddress`
// (het e-mailadres van een externe aanvrager die zonder account via het intake-alias mailt), `subject`
// en de vrije-tekst `textBody`. Die onbeperkt bewaren ís de overtreding; MailIntake was het enige
// PII-dragende model zónder retentie-sweep. Geen DB-toegang zodat dit zonder fixture testbaar blijft;
// de taak (mail-intake-retention-task.ts) doet de daadwerkelijke, gebatchte verwijdering.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * De afkapdatum voor mail-intake-retentie, of `null` als retentie uit staat.
 * @param retentionDays het geconfigureerde venster in dagen (0/negatief = uit).
 * @param now referentietijdstip (geïnjecteerd voor determinisme).
 * @returns een Date: intakes met `receivedAt < cutoff` (én besliste status) mogen weg; `null` = niets snoeien.
 */
export function mailIntakeRetentionCutoff(retentionDays: number, now: Date): Date | null {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return null;
  return new Date(now.getTime() - Math.floor(retentionDays) * MS_PER_DAY);
}
