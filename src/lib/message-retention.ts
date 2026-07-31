// Pure retentie-logica voor berichten (Message). Berekent de afkapdatum: een bericht dat vóór `cutoff`
// is aangemaakt (`createdAt < cutoff`) mag gewist worden mits het gesprek niet meer aan een lopende
// samenwerking hangt (die scope-guard leeft in de taak, niet hier). We ankeren op `createdAt` van het
// bericht: het bericht is dan zo lang bewaard als het venster voorschrijft — anders dan een reactie
// (updatedAt) is een chatbericht immutabel, dus het aanmaakmoment ís het startpunt van de bewaartermijn.
//
// AVG art. 5(1)(e) (opslagbeperking): het verwerkingsregister ("berichten-communicatie") belooft dat
// chatberichten tussen ZZP'er en opdrachtgever worden bewaard voor de duur van de samenwerking + een
// redelijke termijn (max. 12 maanden na beëindiging). Een Message-rij draagt vrije-tekst-PII in `body`;
// deze afleiding maakt de belofte deterministisch afdwingbaar. Geen DB-toegang zodat dit zonder fixture
// testbaar blijft; de taak (message-retention-task.ts) doet de daadwerkelijke, gebatchte verwijdering.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * De afkapdatum voor berichten-retentie, of `null` als retentie uit staat.
 * @param retentionDays het geconfigureerde venster in dagen (0/negatief = uit).
 * @param now referentietijdstip (geïnjecteerd voor determinisme).
 * @returns een Date: berichten met `createdAt < cutoff` mogen weg; `null` = niets snoeien.
 */
export function messageRetentionCutoff(retentionDays: number, now: Date): Date | null {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return null;
  return new Date(now.getTime() - Math.floor(retentionDays) * MS_PER_DAY);
}
