// Geplande runner die nog-niet-gepushte notificaties als web-push aflevert. Ontkoppeld van de vele
// notification.create-plekken (zoals de digest-taak): voortgangsmarkering Notification.pushedAt,
// idempotent, transactie-veilig — geen externe call binnen een DB-transactie. Draait mee in
// /api/tasks/run-all. Zonder VAPID-config slaat de runner over (markeert dan niets).

import { prisma } from "@/lib/db";
import { buildPushPayload } from "@/lib/push/payload";
import { isWebPushConfigured, sendToSubscription } from "@/lib/push/web-push";

export interface PushDeliveryResult {
  /** Aantal behandelde notificaties. */
  considered: number;
  /** Aantal notificaties gemarkeerd als gepusht. */
  pushed: number;
  /** Aantal geslaagde endpoint-leveringen. */
  delivered: number;
  /** Aantal opgeruimde verlopen abonnementen. */
  pruned: number;
  /** True wanneer er geen VAPID-config is en de run is overgeslagen. */
  skipped?: boolean;
}

/** Bovengrens per run; de pushedAt-markering laat een volgende run de rest oppakken. */
const MAX_PER_RUN = 500;
/** Ouder dan dit: geen verse push meer (een dagen-oude melding pushen is zinloos). */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function runPushDeliveryTask(opts: { now?: Date }): Promise<PushDeliveryResult> {
  if (!isWebPushConfigured()) {
    return { considered: 0, pushed: 0, delivered: 0, pruned: 0, skipped: true };
  }
  const now = opts.now ?? new Date();
  const cutoff = new Date(now.getTime() - MAX_AGE_MS);

  // Kandidaten: nog niet gepusht, recent, van actieve gebruikers mét minstens één abonnement.
  const candidates = await prisma.notification.findMany({
    where: {
      pushedAt: null,
      createdAt: { gte: cutoff },
      user: { status: "ACTIVE", pushSubscriptions: { some: {} } },
    },
    select: { id: true, userId: true, type: true, title: true, body: true, link: true },
    orderBy: { createdAt: "asc" },
    take: MAX_PER_RUN,
  });
  if (candidates.length === 0) return { considered: 0, pushed: 0, delivered: 0, pruned: 0 };

  const userIds = [...new Set(candidates.map((c) => c.userId))];
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, endpoint: true, p256dh: true, auth: true },
  });
  const subsByUser = new Map<string, typeof subs>();
  for (const s of subs) {
    const arr = subsByUser.get(s.userId) ?? [];
    arr.push(s);
    subsByUser.set(s.userId, arr);
  }

  let delivered = 0;
  const expiredEndpoints = new Set<string>();
  for (const n of candidates) {
    const payload = JSON.stringify(buildPushPayload(n));
    for (const s of subsByUser.get(n.userId) ?? []) {
      if (expiredEndpoints.has(s.endpoint)) continue;
      const res = await sendToSubscription(s, payload);
      if (res.ok) delivered += 1;
      else if (res.expired) expiredEndpoints.add(s.endpoint);
    }
  }

  // Markeer álle behandelde notificaties als gepusht (best-effort; niet eindeloos herproberen).
  const ids = candidates.map((c) => c.id);
  await prisma.notification.updateMany({ where: { id: { in: ids } }, data: { pushedAt: now } });

  // Ruim verlopen abonnementen op (endpoint bestaat niet meer).
  let pruned = 0;
  if (expiredEndpoints.size > 0) {
    const r = await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: [...expiredEndpoints] } },
    });
    pruned = r.count;
  }

  return { considered: candidates.length, pushed: ids.length, delivered, pruned };
}
