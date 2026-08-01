// Geplande runner die de webhook-event-ledger (ProcessedWebhookEvent) snoeit. De ledger borgt
// exact-één-keer-verwerking van betaal-webhooks; hij groeit monotoon zodra recurring billing het
// eventvolume opvoert. Deze taak verwijdert rijen ouder dan het geconfigureerde venster
// (WEBHOOK_EVENT_RETENTION_DAYS). Staat standaard UIT (leeg/0): dan is dit een no-op en behoudt de
// ledger alle rijen (huidig gedrag). Idempotent: een tweede run met dezelfde klok snoeit niets meer.
// De rijen bevatten GEEN persoonsgegevens (alleen een opaque providerreferentie + status) — dit is
// opslag-hygiëne, geen AVG-minimalisatie. De veilige minimumvloer in config
// (parseWebhookEventRetentionDays) houdt het venster boven het retry-/resend-venster van de provider,
// zodat de replay-bescherming niet heropent.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { webhookEventRetentionDays } from "@/lib/config";
import { webhookEventRetentionCutoff } from "@/lib/webhook-event-retention";

export interface WebhookEventRetentionResult {
  enabled: boolean;
  pruned: number;
  retentionDays: number;
  /** ISO-string van de afkapdatum, of null als retentie uit staat. */
  cutoff: string | null;
}

/**
 * De `where`-conditie voor snoeibare webhook-ledgerrijen: rijen ouder dan de cutoff. Eén bron van
 * waarheid, gedeeld door de taak (die ze verwijdert) én de stille-faal-backlog-gauge op /api/metrics
 * (die ze telt), zodat de gauge niet kan driften t.o.v. wat de cron daadwerkelijk snoeit.
 */
export function prunableWebhookEventWhere(cutoff: Date) {
  return { createdAt: { lt: cutoff } };
}

// Verwijder in begrensde batches i.p.v. één grote deleteMany: houdt de transactie/lock kort op een
// mogelijk grote productietabel en voorkomt geheugendruk. Prisma's deleteMany kent geen limit, dus we
// selecteren id's per batch en verwijderen die set (werkt op SQLite én PostgreSQL).
const BATCH_SIZE = 500;
// Harde bovengrens op het aantal batches per run zodat een grote achterstand nooit één run oneindig
// laat lopen; de volgende geplande run ruimt de rest op (idempotent).
const MAX_BATCHES = 200;

export async function runWebhookEventRetentionTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<WebhookEventRetentionResult> {
  const now = opts.now ?? new Date();
  const retentionDays = webhookEventRetentionDays();
  const cutoff = webhookEventRetentionCutoff(retentionDays, now);

  if (!cutoff) {
    return { enabled: false, pruned: 0, retentionDays: 0, cutoff: null };
  }

  let pruned = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const stale = await prisma.processedWebhookEvent.findMany({
      where: prunableWebhookEventWhere(cutoff),
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (stale.length === 0) break;

    const { count } = await prisma.processedWebhookEvent.deleteMany({
      where: { id: { in: stale.map((r) => r.id) } },
    });
    pruned += count;

    if (stale.length < BATCH_SIZE) break;
  }

  // Registreer de snoei-actie voor operationele traceerbaarheid. Geen PII: alleen aantal + cutoff +
  // venster. Alleen bij daadwerkelijk snoeien, zodat een lege run de auditlog niet vervuilt.
  if (pruned > 0) {
    await prisma.auditLog.create({
      data: auditData({
        actorId: opts.actorId ?? null,
        action: "WEBHOOK_EVENT_LEDGER_PRUNED",
        entityType: "ProcessedWebhookEvent",
        entityId: "retention",
        metadata: { pruned, retentionDays, cutoff: cutoff.toISOString() },
      }),
    });
  }

  return { enabled: true, pruned, retentionDays, cutoff: cutoff.toISOString() };
}
