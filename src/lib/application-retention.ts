// Pure retentie-logica voor reacties/sollicitaties (Application). Berekent de afkapdatum: een terminale,
// niet-geaccepteerde reactie die vóór `cutoff` voor het laatst is aangeraakt (`updatedAt < cutoff`) mag
// gewist worden. We bounden op `updatedAt`, niet `createdAt`: `updatedAt` weerspiegelt het moment dat de
// reactie terminaal werd (afgewezen/ingetrokken) of voor het laatst is bewerkt, en dát ankert "4 weken
// na afronding van de selectieprocedure" — `createdAt` (indienmoment) zou een reactie die net is
// afgewezen maar lang geleden is ingediend ten onrechte direct wissen.
//
// AVG art. 5(1)(e) (opslagbeperking): het verwerkingsregister ("opdrachten-reacties-matching") belooft
// reactie-inhoud "tot 4 weken na afronding van de selectieprocedure". Een Application-rij draagt
// vrije-tekst-PII in `motivation`/`note`; deze afleiding maakt de belofte deterministisch afdwingbaar.
// Geen DB-toegang zodat dit zonder fixture testbaar blijft; de taak (application-retention-task.ts) doet
// de daadwerkelijke, gebatchte verwijdering.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * De afkapdatum voor reactie-retentie, of `null` als retentie uit staat.
 * @param retentionDays het geconfigureerde venster in dagen (0/negatief = uit).
 * @param now referentietijdstip (geïnjecteerd voor determinisme).
 * @returns een Date: terminale reacties met `updatedAt < cutoff` mogen weg; `null` = niets snoeien.
 */
export function applicationRetentionCutoff(retentionDays: number, now: Date): Date | null {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return null;
  return new Date(now.getTime() - Math.floor(retentionDays) * MS_PER_DAY);
}
