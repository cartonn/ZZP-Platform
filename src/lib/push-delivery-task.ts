// Geplande runner die nog-niet-gepushte notificaties als web-push aflevert. Ontkoppeld van de vele
// notification.create-plekken (zoals de digest-taak): voortgangsmarkering Notification.pushedAt,
// idempotent, transactie-veilig — geen externe call binnen een DB-transactie. Draait mee in
// /api/tasks/run-all. Zonder VAPID-config slaat de runner over (markeert dan niets).

import { prisma } from "@/lib/db";
import { buildPushPayload } from "@/lib/push/payload";
import { isWebPushConfigured, sendToSubscription } from "@/lib/push/web-push";
import {
  recordPushDeliverySuccess,
  recordPushDeliveryFailure,
} from "@/lib/observability/push-delivery-heartbeat";

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

/**
 * Beslist puur wat een afleverronde aan de dead-man's-switch-heartbeat meldt, op basis van de ronde-
 * uitkomst. Bewust apart + testbaar: de "verlopen abonnementen (churn) tellen NIET als mislukking"-regel
 * is de kern van de detector — alleen echte (niet-verlopen) endpoints die niets ontvingen wijzen op een
 * afwijzend kanaal.
 *   - `success` : ≥1 endpoint ontving de melding (het kanaal werkt; wist ook een eerdere storing).
 *   - `failure` : geen enkele geslaagde aflevering terwijl er wél echte (niet-verlopen) pogingen waren.
 *   - `none`    : alleen churn (verlopen endpoints) of niets geprobeerd → neutraal, niets registreren.
 */
export function classifyPushDeliveryOutcome(input: {
  delivered: number;
  realFailures: number;
}): "success" | "failure" | "none" {
  if (input.delivered > 0) return "success";
  if (input.realFailures > 0) return "failure";
  return "none";
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
  // Echte (niet-verlopen) afleverfouten: een 404/410 is churn (het endpoint bestaat niet meer → opruimen),
  // GEEN kanaalstoring. Alleen niet-verlopen fouten (netwerk, 5xx, 401/403 VAPID-auth) wijzen op een
  // afwijzend kanaal en voeden de dead-man's-switch-heartbeat hieronder.
  let realFailures = 0;
  const expiredEndpoints = new Set<string>();
  for (const n of candidates) {
    const payload = JSON.stringify(buildPushPayload(n));
    for (const s of subsByUser.get(n.userId) ?? []) {
      if (expiredEndpoints.has(s.endpoint)) continue;
      const res = await sendToSubscription(s, payload);
      if (res.ok) delivered += 1;
      else if (res.expired) expiredEndpoints.add(s.endpoint);
      else realFailures += 1;
    }
  }

  // Push-aflever-heartbeat (dead-man's-switch): oordeel op de UITKOMST van deze afleverronde, niet op
  // leeftijd (push is event-gedreven). ≥1 geslaagde aflevering → het kanaal werkt (wist ook een eerdere
  // storing). Geen enkele succesvolle aflevering terwijl er wél echte (niet-verlopen) pogingen waren →
  // het kanaal wijst af (geroteerde/verlopen VAPID-sleutels, provider-storing). Alleen churn (verlopen
  // endpoints) of niets afgeleverd → neutraal, niets registreren. Fail-open: een heartbeat-storing mag
  // de afleverronde niet laten falen.
  const outcome = classifyPushDeliveryOutcome({ delivered, realFailures });
  if (outcome === "success") {
    await recordPushDeliverySuccess(now);
  } else if (outcome === "failure") {
    await recordPushDeliveryFailure(now);
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
