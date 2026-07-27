// Geplande runner die notificatiehistorie (Notification) na het retentievenster hard verwijdert.
// Dwingt de AVG art. 5(1)(e)-belofte uit het verwerkingsregister af ("Notificatiehistorie max. 6
// maanden") die tot nu toe niet technisch was afgedwongen — notificaties stapelden zich onbeperkt op,
// mét PII in title/body. Wist op `createdAt < cutoff`, ongeacht lees-/digest-/push-status (het is een
// MAX-bewaartermijn voor de hele historie). Idempotent: een tweede run met dezelfde klok wist niets meer.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { notificationRetentionDays } from "@/lib/config";
import { notificationRetentionCutoff } from "@/lib/notification-retention";

export interface NotificationRetentionResult {
  enabled: boolean;
  pruned: number;
  retentionDays: number;
  /** ISO-string van de afkapdatum, of null als retentie uit staat. */
  cutoff: string | null;
}

// Verwijder in begrensde batches i.p.v. één grote deleteMany: houdt de transactie/lock kort en
// voorkomt geheugendruk. Prisma's deleteMany kent geen limit, dus we selecteren id's per batch en
// verwijderen die set (werkt op SQLite én PostgreSQL).
const BATCH_SIZE = 500;
// Harde bovengrens op het aantal batches per run zodat een grote achterstand nooit één run oneindig
// laat lopen; de volgende geplande run ruimt de rest op (idempotent).
const MAX_BATCHES = 200;

export async function runNotificationRetentionTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<NotificationRetentionResult> {
  const now = opts.now ?? new Date();
  const retentionDays = notificationRetentionDays();
  const cutoff = notificationRetentionCutoff(retentionDays, now);

  if (!cutoff) {
    return { enabled: false, pruned: 0, retentionDays: 0, cutoff: null };
  }

  let pruned = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const stale = await prisma.notification.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true },
      take: BATCH_SIZE,
    });
    if (stale.length === 0) break;

    const { count } = await prisma.notification.deleteMany({
      where: { id: { in: stale.map((r) => r.id) } },
    });
    pruned += count;

    if (stale.length < BATCH_SIZE) break;
  }

  // Registreer de snoei-actie voor operationele traceerbaarheid (art. 5(2) verantwoordingsplicht).
  // Geen PII: alleen aantal + cutoff + venster. Alleen bij daadwerkelijk snoeien, zodat een lege run
  // de auditlog niet vervuilt.
  if (pruned > 0) {
    await prisma.auditLog.create({
      data: auditData({
        actorId: opts.actorId ?? null,
        action: "NOTIFICATIONS_PRUNED",
        entityType: "Notification",
        entityId: "retention",
        metadata: { pruned, retentionDays, cutoff: cutoff.toISOString() },
      }),
    });
  }

  return { enabled: true, pruned, retentionDays, cutoff: cutoff.toISOString() };
}
