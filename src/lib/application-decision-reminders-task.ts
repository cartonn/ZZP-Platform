// Geplande runner voor de kandidaat-beslissing-reminders: herinnert de opdrachtgever aan een
// reeds-bekeken kandidaat (VIEWED/SHORTLIST) die al langer dan gebruikelijk op een beslissing wacht.
// Idempotent via DomainEvent dedupeKey. Plan/apply-patroon zoals runPerformanceApprovalReminderTask.
// Geen geldstroom.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import {
  planApplicationDecisionReminders,
  type ApplicationDecisionCandidate,
} from "@/lib/application-decision-reminders";

export interface ApplicationDecisionReminderResult {
  reminded: number;
}

type ReminderCursor = { createdAt: Date; id: string };
/** Paginagrootte per scan. Stabiele cursor-paginatie dekt elke openstaande reactie (geen starvation). */
const PAGE_SIZE = 500;

async function loadReminderPage(cursor?: ReminderCursor) {
  return prisma.application.findMany({
    where: {
      status: { in: ["VIEWED", "SHORTLIST"] },
      collaboration: null, // nog geen samenwerking → beslissen is nog aan de orde
      job: { status: "PUBLISHED" },
      ...(cursor
        ? {
            OR: [
              { createdAt: { gt: cursor.createdAt } },
              { createdAt: cursor.createdAt, id: { gt: cursor.id } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      job: {
        select: {
          title: true,
          status: true,
          company: { select: { userId: true } },
        },
      },
    },
    // Stabiele volgorde [createdAt asc, id asc]: zonder tie-breaker op id is de paginagrens boven
    // gelijke createdAt-waarden ongedefinieerd en kan een reactie overgeslagen of herhaald worden.
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: PAGE_SIZE,
  });
}

export async function runApplicationDecisionReminderTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<ApplicationDecisionReminderResult> {
  const now = opts.now ?? new Date();
  let reminded = 0;
  let cursor: ReminderCursor | undefined;
  while (true) {
    const rows = await loadReminderPage(cursor);
    if (rows.length === 0) break;
    reminded += await processReminderPage(rows, now, opts.actorId);
    if (rows.length < PAGE_SIZE) break;
    const last = rows[rows.length - 1]!;
    // Ga door ook als elke reactie op deze pagina al afgehandeld of niet-nudgebaar was.
    cursor = { createdAt: last.createdAt, id: last.id };
  }
  return { reminded };
}

async function processReminderPage(
  rows: Awaited<ReturnType<typeof loadReminderPage>>,
  now: Date,
  actorId?: string | null,
): Promise<number> {
  const candidates: ApplicationDecisionCandidate[] = rows
    .filter((r) => r.job?.company?.userId)
    .map((r) => ({
      applicationId: r.id,
      status: r.status,
      createdAt: r.createdAt,
      hasCollaboration: false, // where filtert collaboration: null al weg
      jobStatus: r.job.status,
      clientUserId: r.job.company.userId,
      jobTitle: r.job.title,
    }));

  const plan = planApplicationDecisionReminders(candidates, now);
  if (plan.reminders.length === 0) return 0;

  // Idempotentie: filter al-gevuurde signalen weg op DomainEvent dedupeKey.
  // unbounded-allow: keys komt uit het al-begrensde plan (≤ PAGE_SIZE).
  const keys = plan.reminders.map((r) => r.dedupeKey);
  const existing = await prisma.domainEvent.findMany({
    where: { dedupeKey: { in: keys } },
    select: { dedupeKey: true },
  });
  const seen = new Set(existing.map((e) => e.dedupeKey));
  const fresh = plan.reminders.filter((r) => !seen.has(r.dedupeKey));

  for (const r of fresh) {
    await prisma.$transaction([
      prisma.domainEvent.create({
        data: {
          type: "APPLICATION_DECISION_REMINDER",
          actorRole: "SYSTEM",
          actorId: actorId ?? null,
          subjectType: "Application",
          subjectId: r.applicationId,
          payload: JSON.stringify({ stage: r.stage }),
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
          link: "/kandidaten",
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: actorId ?? null,
          action: "APPLICATION_DECISION_REMINDER",
          entityType: "Application",
          entityId: r.applicationId,
          metadata: { stage: r.stage },
        }),
      }),
    ]);
  }

  return fresh.length;
}
