// Geplande runner voor de dispuut-herinneringen (§4 zijpad dispuut/escalatie). Herinnert béíde
// partijen aan een open dispuut dat hun facturatie-cascade bevriest (dag 3/7) en escaleert daarna
// naar het platform (admins) voor bemiddeling. Idempotent via DomainEvent dedupeKey. Plan/apply
// zoals runPerformanceApprovalReminderTask. Geen geldstroom, geen cascade-mutatie. Vult het gat dat
// een open dispuut — anders dan alle andere cascade-stalls — geen actieve nudge had.

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { planDisputeReminders, type DisputeReminderCandidate } from "@/lib/dispute-reminders";

/**
 * Where-vorm voor open disputen die al door de cron naar admins geëscaleerd hadden moeten zijn: er is
 * een `disputedAt` en die ligt op of vóór de cutoff, én de samenwerking is niet geannuleerd. Spiegelt
 * de plan-guards uit `planDisputeReminders` (`if (!c.disputedAt) continue; if (c.collabStatus ===
 * "CANCELLED") continue;`) — één bron van waarheid voor de gauge `zzp_disputes_overdue_escalation` op
 * /api/metrics. Een drift-gate-test klinkt deze vorm vast aan de escalatie-beslissing van de planner.
 *
 * NB: dit is de ESCALATIE-achterstand (de duidelijke monotone stille-faalmodus). Blijft dit getal
 * oplopen terwijl de cron-heartbeat "vers" is, dan verwerkt de dispuut-reminder-pijplijn geen escalaties
 * meer: open disputen blijven eeuwig zonder admin-signaal hangen en bemiddeling komt nooit op gang.
 */
export function overdueDisputeCollaborationWhere(cutoff: Date): Prisma.CollaborationWhereInput {
  return {
    disputedAt: { not: null, lte: cutoff },
    status: { not: "CANCELLED" },
  };
}

export interface DisputeReminderResult {
  reminded: number;
  escalated: number;
}

type ReminderCursor = { disputedAt: Date; id: string };
const PAGE_SIZE = 500;

async function loadReminderPage(now: Date, cursor?: ReminderCursor) {
  return prisma.collaboration.findMany({
    where: {
      disputedAt: { not: null, lte: now },
      ...(cursor
        ? {
            OR: [
              { disputedAt: { gt: cursor.disputedAt } },
              { disputedAt: cursor.disputedAt, id: { gt: cursor.id } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      status: true,
      disputedAt: true,
      job: { select: { title: true } },
      freelancer: { select: { userId: true } },
      company: { select: { userId: true } },
    },
    orderBy: [{ disputedAt: "asc" }, { id: "asc" }],
    take: PAGE_SIZE,
  });
}

export async function runDisputeReminderTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<DisputeReminderResult> {
  const now = opts.now ?? new Date();
  const result = { reminded: 0, escalated: 0 };
  let cursor: ReminderCursor | undefined;
  while (true) {
    const rows = await loadReminderPage(now, cursor);
    if (rows.length === 0) break;
    const page = await processReminderPage(rows, now, opts.actorId);
    result.reminded += page.reminded;
    result.escalated += page.escalated;
    if (rows.length < PAGE_SIZE) break;
    const last = rows[rows.length - 1]!;
    // Already escalated or cancelled disputes must not prevent later pages from running.
    cursor = { disputedAt: last.disputedAt!, id: last.id };
  }
  return result;
}

async function processReminderPage(
  rows: Awaited<ReturnType<typeof loadReminderPage>>,
  now: Date,
  actorId?: string | null,
): Promise<DisputeReminderResult> {
  const candidates: DisputeReminderCandidate[] = rows
    .filter((r) => r.freelancer?.userId && r.company?.userId)
    .map((r) => ({
      collaborationId: r.id,
      disputedAt: r.disputedAt,
      collabStatus: r.status,
      freelancerUserId: r.freelancer.userId,
      clientUserId: r.company.userId,
      jobTitle: r.job?.title ?? "een opdracht",
    }));

  const plan = planDisputeReminders(candidates, now);
  if (plan.reminders.length === 0 && plan.escalations.length === 0)
    return { reminded: 0, escalated: 0 };

  // Idempotentie: filter al-gevuurde signalen weg op DomainEvent dedupeKey.
  const keys = [
    ...plan.reminders.map((r) => r.dedupeKey),
    ...plan.escalations.map((e) => e.dedupeKey),
  ];
  const existing = await prisma.domainEvent.findMany({
    where: { dedupeKey: { in: keys } },
    select: { dedupeKey: true },
  });
  const seen = new Set(existing.map((e) => e.dedupeKey));

  const freshReminders = plan.reminders.filter((r) => !seen.has(r.dedupeKey));
  const freshEscalations = plan.escalations.filter((e) => !seen.has(e.dedupeKey));

  for (const r of freshReminders) {
    await prisma.$transaction([
      prisma.domainEvent.create({
        data: {
          type: "DISPUTE_REMINDER",
          actorRole: "SYSTEM",
          actorId: actorId ?? null,
          subjectType: "Collaboration",
          subjectId: r.collaborationId,
          payload: JSON.stringify({ stage: r.stage, userId: r.userId }),
          correlationId: null,
          dedupeKey: r.dedupeKey,
        },
      }),
      prisma.notification.create({
        data: {
          userId: r.userId,
          type: r.notificationType,
          title: r.title,
          body: r.body,
          link: `/samenwerkingen/${r.collaborationId}`,
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: actorId ?? null,
          action: "DISPUTE_REMINDER",
          entityType: "Collaboration",
          entityId: r.collaborationId,
          metadata: { stage: r.stage, userId: r.userId },
        }),
      }),
    ]);
  }

  if (freshEscalations.length > 0) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });
    for (const e of freshEscalations) {
      await prisma.$transaction([
        prisma.domainEvent.create({
          data: {
            type: "DISPUTE_ESCALATION",
            actorRole: "SYSTEM",
            actorId: actorId ?? null,
            subjectType: "Collaboration",
            subjectId: e.collaborationId,
            payload: JSON.stringify({ ageDays: e.ageDays }),
            correlationId: null,
            dedupeKey: e.dedupeKey,
          },
        }),
        ...admins.map((a) =>
          prisma.notification.create({
            data: {
              userId: a.id,
              type: "DISPUTE_ESCALATION",
              title: "Dispuut blijft openstaan",
              body: `Het dispuut op "${e.jobTitle}" staat al ${e.ageDays} dagen open. De betalingscascade is bevroren — bemiddeling nodig.`,
              link: "/admin/disputen",
            },
          }),
        ),
        prisma.auditLog.create({
          data: auditData({
            actorId: actorId ?? null,
            action: "DISPUTE_ESCALATED",
            entityType: "Collaboration",
            entityId: e.collaborationId,
            metadata: { ageDays: e.ageDays },
          }),
        }),
      ]);
    }
  }

  return { reminded: freshReminders.length, escalated: freshEscalations.length };
}
