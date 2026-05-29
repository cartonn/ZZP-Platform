// Geplande DBA-monitorrun (PLATFORM_OVERHAUL.md §6). Scant actieve samenwerkingen, bepaalt de te
// vuren signalen (pure: planDbaMonitorRun) en schrijft per signaal — idempotent via DomainEvent
// dedupeKey — een notificatie bij ZZP'er én opdrachtgever + een DomainEvent (DBA_SIGNAL_RAISED) +
// auditregel weg. Geen auth hier; de aanroeper (route/cron) regelt autorisatie. Zoals runExpiryTask.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { planDbaMonitorRun, jobDbaIndicators, type DbaMonitorCandidate, DBA_LEVEL_LABEL } from "@/lib/dba-monitor";
import { DBA_DISCLAIMER } from "@/lib/config";

export interface DbaMonitorResult {
  raised: number;
}

export async function runDbaMonitorTask(opts: { actorId?: string | null; now?: Date }): Promise<DbaMonitorResult> {
  const now = opts.now ?? new Date();

  const collaborations = await prisma.collaboration.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      startDate: true,
      freelancer: { select: { userId: true } },
      company: { select: { userId: true } },
      job: { select: { dbaDirectSupervision: true, dbaEmbedded: true, dbaFixedSchedule: true } },
    },
  });

  const candidates: DbaMonitorCandidate[] = collaborations.map((c) => ({
    collaborationId: c.id,
    startDate: c.startDate,
    freelancerUserId: c.freelancer.userId,
    clientUserId: c.company.userId,
    ...jobDbaIndicators(c.job),
  }));

  const plan = planDbaMonitorRun(candidates, now);
  if (plan.toRaise.length === 0) return { raised: 0 };

  // Filter de al-gevuurde signalen weg (idempotent via DomainEvent dedupeKey).
  const keys = plan.toRaise.map((r) => r.dedupeKey);
  const existing = await prisma.domainEvent.findMany({ where: { dedupeKey: { in: keys } }, select: { dedupeKey: true } });
  const seen = new Set(existing.map((e) => e.dedupeKey));
  const fresh = plan.toRaise.filter((r) => !seen.has(r.dedupeKey));
  if (fresh.length === 0) return { raised: 0 };

  for (const item of fresh) {
    const title = `Aandachtspunt inzet — ${DBA_LEVEL_LABEL[item.signal.level]}`;
    const body = `${item.signal.message} ${DBA_DISCLAIMER}`;
    await prisma.$transaction([
      prisma.domainEvent.create({
        data: {
          type: "DBA_SIGNAL_RAISED",
          actorRole: "SYSTEM",
          actorId: opts.actorId ?? null,
          subjectType: "Collaboration",
          subjectId: item.collaborationId,
          payload: JSON.stringify({ level: item.signal.level, key: item.signal.key }),
          correlationId: item.collaborationId,
          dedupeKey: item.dedupeKey,
        },
      }),
      // Notificatie bij ZZP'er én opdrachtgever (§6: beide partijen), link naar het werkproces.
      prisma.notification.create({
        data: { userId: item.freelancerUserId, type: "DBA_SIGNAL", title, body, link: `/samenwerkingen/${item.collaborationId}` },
      }),
      prisma.notification.create({
        data: { userId: item.clientUserId, type: "DBA_SIGNAL", title, body, link: `/samenwerkingen/${item.collaborationId}` },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId ?? null,
          action: "DBA_SIGNAL_RAISED",
          entityType: "Collaboration",
          entityId: item.collaborationId,
          metadata: { level: item.signal.level, key: item.signal.key },
        }),
      }),
    ]);
  }

  return { raised: fresh.length };
}
