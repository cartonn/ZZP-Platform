// Geplande runner die het auditlogboek snoeit volgens de gedocumenteerde bewaartermijn
// (RETENTION_SCHEDULE "auditlog-beveiligingslogboeken" = 12 maanden; AVG art. 5 lid 1e
// dataminimalisatie). Auditregels bevatten IP-adres + user-agent, dus onbeperkt bewaren is een
// privacyrisico. Staat standaard AAN op het beloofde 12-maandenvenster (env leeg → default): de sweep
// snoeit regels ouder dan de cutoff. Een expliciete 0/negatieve AUDIT_LOG_RETENTION_DAYS zet 'm uit
// (bv. bij een lopende forensische/juridische bewaarplicht) → dan is dit een no-op. Idempotent: draait
// de taak nogmaals met dezelfde klok, dan is er niets meer ouder dan de cutoff. Verwijdering is
// ONOMKEERBAAR — daarom een veilige minimumvloer in config (parseAuditRetentionDays).

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { auditLogRetentionDays } from "@/lib/config";
import { auditRetentionCutoff } from "@/lib/audit-retention";

export interface AuditRetentionResult {
  enabled: boolean;
  pruned: number;
  retentionDays: number;
  /** ISO-string van de afkapdatum, of null als retentie uit staat. */
  cutoff: string | null;
}

// Verwijder in begrensde batches i.p.v. één grote deleteMany: houdt de transactie/lock kort op een
// grote productie-tabel en voorkomt geheugendruk. Prisma's deleteMany kent geen limit, dus we
// selecteren id's per batch en verwijderen die set (werkt op SQLite én PostgreSQL).
const BATCH_SIZE = 500;
// Harde bovengrens op het aantal batches per run zodat een gigantische achterstand nooit één run
// oneindig laat lopen; de volgende geplande run ruimt de rest op (idempotent).
const MAX_BATCHES = 200;

export async function runAuditRetentionTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<AuditRetentionResult> {
  const now = opts.now ?? new Date();
  const retentionDays = auditLogRetentionDays();
  const cutoff = auditRetentionCutoff(retentionDays, now);

  if (!cutoff) {
    return { enabled: false, pruned: 0, retentionDays: 0, cutoff: null };
  }

  let pruned = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const stale = await prisma.auditLog.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (stale.length === 0) break;

    const { count } = await prisma.auditLog.deleteMany({
      where: { id: { in: stale.map((r) => r.id) } },
    });
    pruned += count;

    if (stale.length < BATCH_SIZE) break;
  }

  // Registreer de minimalisatie-actie zelf (AVG art. 5 lid 2 verantwoordingsplicht). Dit record is
  // per definitie nieuwer dan de cutoff, dus het wordt niet in dezelfde run weer verwijderd. Geen
  // PII: alleen aantal + cutoff + venster.
  if (pruned > 0) {
    await prisma.auditLog.create({
      data: auditData({
        actorId: opts.actorId ?? null,
        action: "AUDIT_LOG_PRUNED",
        entityType: "AuditLog",
        entityId: "retention",
        metadata: { pruned, retentionDays, cutoff: cutoff.toISOString() },
      }),
    });
  }

  return { enabled: true, pruned, retentionDays, cutoff: cutoff.toISOString() };
}
