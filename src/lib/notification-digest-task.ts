// Geplande runner voor de notificatie-digest (concurrentie-backlog punt 7: e-mail-fallback).
// Bundelt ongelezen in-app-notificaties ouder dan de drempel tot één e-mail per gebruiker.
// Plan/apply zoals runExpiryTask; idempotent via Notification.digestedAt (voortgangsmarkering)
// met DomainEvent.dedupeKey als vangnet. E-mail is hier het ENIGE effect: zonder echt
// mailkanaal (EMAIL_DRIVER=smtp) slaat de runner over, zodat de markering niet wordt gezet
// terwijl er niets is verzonden.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { planNotificationDigests } from "@/lib/notification-digest";
import { getMailSender, isMailDeliveryConfigured } from "@/lib/services/mail-sender";
import { buildNotificationDigestEmail } from "@/lib/services/reminder-emails";

export interface NotificationDigestResult {
  /** Aantal verstuurde digest-e-mails (één per gebruiker). */
  digests: number;
  /** Aantal notificaties dat in die digests is meegenomen. */
  notifications: number;
  /** True wanneer er geen echt mailkanaal is geconfigureerd en de run is overgeslagen. */
  skipped?: boolean;
}

/** Bovengrens per run; de digestedAt-markering laat een volgende run de rest oppakken. */
const MAX_CANDIDATES_PER_RUN = 500;

export async function runNotificationDigestTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<NotificationDigestResult> {
  if (!isMailDeliveryConfigured()) {
    return { digests: 0, notifications: 0, skipped: true };
  }
  const now = opts.now ?? new Date();

  // Kandidaten: ongelezen, nog niet gedigest, van actieve gebruikers die de digest-mail niet
  // hebben uitgezet (opt-out op queryniveau — notificaties van een opted-out gebruiker blijven
  // ongemarkeerd, zodat hij na heraanzetten alsnog één digest over de hele achterstand krijgt).
  // De leeftijdsdrempel handhaaft de planner; hier alleen ophalen wat in aanmerking kan komen.
  const candidates = await prisma.notification.findMany({
    where: {
      readAt: null,
      digestedAt: null,
      user: {
        status: "ACTIVE",
        notificationPreferences: { none: { category: "digest", emailEnabled: false } },
      },
    },
    select: {
      id: true,
      userId: true,
      type: true,
      title: true,
      createdAt: true,
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_CANDIDATES_PER_RUN,
  });
  if (candidates.length === 0) return { digests: 0, notifications: 0 };

  const userMap = new Map(candidates.map((c) => [c.userId, c.user]));
  const plan = planNotificationDigests(candidates, now);
  if (plan.digests.length === 0) return { digests: 0, notifications: 0 };

  // Vangnet-idempotentie: filter digests weg waarvan het event al bestaat (zelfde set).
  const keys = plan.digests.map((d) => d.dedupeKey);
  const existing = await prisma.domainEvent.findMany({
    where: { dedupeKey: { in: keys } },
    select: { dedupeKey: true },
  });
  const seen = new Set(existing.map((e) => e.dedupeKey));
  const fresh = plan.digests.filter((d) => !seen.has(d.dedupeKey));
  if (fresh.length === 0) return { digests: 0, notifications: 0 };

  const loginUrl = process.env.NEXTAUTH_URL ?? "https://app.zzp-platform.nl";
  const mail = getMailSender();

  let sentNotifications = 0;
  for (const d of fresh) {
    await prisma.$transaction([
      prisma.domainEvent.create({
        data: {
          type: "NOTIFICATION_DIGEST",
          actorRole: "SYSTEM",
          actorId: opts.actorId ?? null,
          subjectType: "User",
          subjectId: d.userId,
          payload: JSON.stringify({ count: d.count, notificationIds: d.notificationIds }),
          correlationId: null,
          dedupeKey: d.dedupeKey,
        },
      }),
      prisma.notification.updateMany({
        where: { id: { in: d.notificationIds } },
        data: { digestedAt: now },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId ?? null,
          action: "NOTIFICATION_DIGEST_SENT",
          entityType: "User",
          entityId: d.userId,
          metadata: { count: d.count },
        }),
      }),
    ]);
    sentNotifications += d.count;
    const u = userMap.get(d.userId);
    if (u) {
      try {
        await mail.send(
          buildNotificationDigestEmail({
            name: u.name ?? u.email,
            email: u.email,
            count: d.count,
            lines: d.lines,
            loginUrl,
          }),
        );
      } catch (err) {
        console.error("[notification-digest-task] e-mail mislukt:", err);
      }
    }
  }

  return { digests: fresh.length, notifications: sentNotifications };
}
