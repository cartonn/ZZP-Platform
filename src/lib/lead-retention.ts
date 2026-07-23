// Pure retentie-logica voor acquisitie-leads (Lead + LeadContact). Berekent de afkapdatum: een
// BESLISTE lead (KLANT of NO_DEAL — zie isActiveLeadStatus) die sinds `cutoff` niet meer is
// aangeraakt (`updatedAt < cutoff`) mag met zijn contactlogboek gewist worden. Actieve leads
// (KOUD/WARM) blijven altijd staan — die zitten nog in de verkooppijplijn.
//
// AVG art. 5(1)(e) (opslagbeperking): het verwerkingsregister belooft "tot de lead klant wordt of
// afvalt + 12 maanden"; deze afleiding maakt die belofte deterministisch afdwingbaar. Geen
// DB-toegang zodat dit zonder fixture testbaar blijft; de taak (lead-retention-task.ts) doet de
// daadwerkelijke, gebatchte verwijdering (LeadContact cascadeert mee via onDelete: Cascade).

import { isActiveLeadStatus } from "@/lib/leads";
import { type LeadStatus } from "@/lib/enums";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * De afkapdatum voor lead-retentie, of `null` als retentie uit staat.
 * @param retentionDays het geconfigureerde venster in dagen (0/negatief = uit).
 * @param now referentietijdstip (geïnjecteerd voor determinisme).
 * @returns een Date: beslíste leads met `updatedAt < cutoff` mogen weg; `null` = niets snoeien.
 */
export function leadRetentionCutoff(retentionDays: number, now: Date): Date | null {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return null;
  return new Date(now.getTime() - Math.floor(retentionDays) * MS_PER_DAY);
}

/**
 * Mag deze lead-status door de retentie-sweep gewist worden? Alleen beslíste leads (KLANT/NO_DEAL):
 * een nog actieve prospect (KOUD/WARM) blijft ongeacht ouderdom staan. Spiegelt de betekenis van
 * `isActiveLeadStatus` zodat er één bron van waarheid is voor "beslist vs. actief".
 */
export function isLeadRetentionEligible(status: LeadStatus): boolean {
  return !isActiveLeadStatus(status);
}
