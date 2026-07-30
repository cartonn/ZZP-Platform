// Geplande runner die het bron-IP redact uit beveiligingsincidenten (HealthIncident) ouder dan het
// retentievenster. De anomaliedetector legt bij een inlog-burst/reset-flood het IP vast in
// `evidence` (JSON) én in de `summary`; een IP-adres is een persoonsgegeven. Deze taak dwingt de
// opslagbeperking/dataminimalisatie af (AVG art. 5(1)(c)/(e)) door het IP na het venster te vervangen
// door de redactie-sentinel — het incident zelf blijft als beveiligingssignaal bewaard. Staat
// standaard AAN (HEALTH_INCIDENT_IP_RETENTION_DAYS leeg → default 90 dagen), want onbeperkte
// IP-retentie is hier de overtreding. Idempotent: een geredigeerde rij valt buiten de kandidaatquery
// (bevat de sentinel), dus een tweede run met dezelfde klok redact niets meer.

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { AUDIT_PII_REDACTED } from "@/lib/account-anonymization";
import { healthIncidentIpRetentionDays } from "@/lib/config";
import {
  healthIncidentIpRetentionCutoff,
  redactIncidentIp,
  IP_EVIDENCE_MARKER,
  UNKNOWN_IP,
} from "@/lib/health-incident-retention";

/**
 * De `where`-vorm die één redigeerbaar (IP-dragend) beveiligingsincident ouder dan `cutoff` selecteert:
 * te oud, mét een string-waardig `ip`-veld in de evidence, nog niet geredigeerd, en geen "onbekend"-
 * sentinel (dat is geen PII). Bron van waarheid, gedeeld door de retentie-taak (die deze rijen redact)
 * én de /api/metrics-backlog-gauge (die ze telt) zodat de detector niet kan driften t.o.v. het werk dat
 * de taak doet.
 */
export function prunableHealthIncidentIpWhere(cutoff: Date): Prisma.HealthIncidentWhereInput {
  return {
    createdAt: { lt: cutoff },
    AND: [
      { evidence: { contains: IP_EVIDENCE_MARKER } },
      { NOT: { evidence: { contains: `${IP_EVIDENCE_MARKER}${UNKNOWN_IP}"` } } },
      { NOT: { evidence: { contains: AUDIT_PII_REDACTED } } },
    ],
  };
}

export interface HealthIncidentRetentionResult {
  enabled: boolean;
  redacted: number;
  retentionDays: number;
  /** ISO-string van de afkapdatum, of null als redactie uit staat. */
  cutoff: string | null;
}

// Verwerk in begrensde batches i.p.v. één grote scan: houdt de transactie/lock kort en voorkomt
// geheugendruk. Elke geredigeerde rij bevat daarna de sentinel en valt buiten de query, dus de
// volgende findMany levert de volgende set — geen cursor nodig.
const BATCH_SIZE = 500;
// Harde bovengrens op het aantal batches per run zodat een grote achterstand nooit één run oneindig
// laat lopen; de volgende geplande run ruimt de rest op (idempotent).
const MAX_BATCHES = 200;

export async function runHealthIncidentRetentionTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<HealthIncidentRetentionResult> {
  const now = opts.now ?? new Date();
  const retentionDays = healthIncidentIpRetentionDays();
  const cutoff = healthIncidentIpRetentionCutoff(retentionDays, now);

  if (!cutoff) {
    return { enabled: false, redacted: 0, retentionDays: 0, cutoff: null };
  }

  let redacted = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    // Kandidaten: te oud, mét een string-waardig `ip`-veld, nog niet geredigeerd, en geen "onbekend"-
    // sentinel (dat is geen PII). De sluitingen (gedeeld via `prunableHealthIncidentIpWhere`)
    // garanderen dat elke opgehaalde rij ook écht redigeerbaar is → gestage voortgang zonder cursor.
    const stale = await prisma.healthIncident.findMany({
      where: prunableHealthIncidentIpWhere(cutoff),
      select: { id: true, evidence: true, summary: true, dedupeKey: true },
      take: BATCH_SIZE,
    });
    if (stale.length === 0) break;

    let redactedInBatch = 0;
    for (const row of stale) {
      const next = redactIncidentIp(row);
      if (!next) continue; // defensief: query filtert dit al weg.
      // Redact ELKE kolom van de rij die het IP droeg (evidence, summary én de machine-dedupeKey).
      await prisma.healthIncident.update({
        where: { id: row.id },
        data: { evidence: next.evidence, summary: next.summary, dedupeKey: next.dedupeKey },
      });
      // Afgeleide kopieën die hetzelfde IP droegen mee-redigeren, zodat de opslagbeperking over álle
      // stores geldt (het IP is triviaal terug te halen uit één ongeredigeerde kopie):
      //  1) de auditregel HEALTH_INCIDENT_OPENED bewaart het (oude) dedupeKey als entityId;
      //  2) de admin-notificatie (bij CRITICAL) kopieert de summary in de body.
      if (next.dedupeKey !== row.dedupeKey) {
        await prisma.auditLog.updateMany({
          where: { action: "HEALTH_INCIDENT_OPENED", entityId: row.dedupeKey },
          data: { entityId: next.dedupeKey },
        });
      }
      if (next.summary !== row.summary) {
        await prisma.notification.updateMany({
          where: { type: "HEALTH_INCIDENT", body: row.summary },
          data: { body: next.summary },
        });
      }
      redactedInBatch += 1;
    }
    redacted += redactedInBatch;

    // Vangnet tegen een oneindige lus: als een volle batch niets redigeerde (zou niet mogen na de
    // query-sluitingen), stop dan i.p.v. dezelfde rijen te blijven ophalen.
    if (redactedInBatch === 0) break;
    if (stale.length < BATCH_SIZE) break;
  }

  // Registreer de minimalisatie-actie zelf (AVG art. 5(2) verantwoordingsplicht). Geen PII: alleen
  // aantal + cutoff + venster. Alleen bij daadwerkelijk redigeren, zodat een lege run de auditlog
  // niet vervuilt.
  if (redacted > 0) {
    await prisma.auditLog.create({
      data: auditData({
        actorId: opts.actorId ?? null,
        action: "HEALTH_INCIDENT_IPS_REDACTED",
        entityType: "HealthIncident",
        entityId: "retention",
        metadata: { redacted, retentionDays, cutoff: cutoff.toISOString() },
      }),
    });
  }

  return { enabled: true, redacted, retentionDays, cutoff: cutoff.toISOString() };
}
