// Geplande runner voor de prestatie-goedkeuring-reminders (§4 Event B1 → B2). Herinnert de
// opdrachtgever aan ingediende urenstaten/opleveringen die nog niet zijn gekeurd (dag 3/7) en
// escaleert daarna naar het platform (admins). Idempotent via DomainEvent dedupeKey. Plan/apply
// zoals runConceptInvoiceReminderTask. Geen geldstroom. Vult het gat dat het grace-venster
// (auto-goedkeuring) default UIT staat — zonder nudge stalt de cascade eindeloos.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import {
  planPerformanceApprovalReminders,
  type PerformanceApprovalCandidate,
} from "@/lib/performance-approval-reminders";

export interface PerformanceApprovalReminderResult {
  reminded: number;
  escalated: number;
}

/** Korte, deterministische omschrijving van de prestatie voor de notificatietekst. */
function performanceLabel(row: { type: string; milestoneTitle: string | null }): string {
  if (row.type === "MILESTONE") {
    return row.milestoneTitle ? `Oplevering "${row.milestoneTitle}"` : "Een oplevering";
  }
  return "Een ingediende urenstaat";
}

export async function runPerformanceApprovalReminderTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<PerformanceApprovalReminderResult> {
  const now = opts.now ?? new Date();

  const rows = await prisma.performance.findMany({
    where: { status: "SUBMITTED", submittedAt: { not: null } },
    select: {
      id: true,
      type: true,
      status: true,
      submittedAt: true,
      milestoneTitle: true,
      collaboration: {
        select: {
          status: true,
          disputedAt: true,
          company: { select: { userId: true } },
        },
      },
    },
    // Oudste indiening eerst: zonder orderBy is de selectie boven de cap ongedefinieerd
    // en kan een prestatie structureel buiten de 500 vallen (starvation).
    orderBy: { submittedAt: "asc" },
    take: 500,
  });

  const candidates: PerformanceApprovalCandidate[] = rows
    .filter((r) => r.collaboration?.company?.userId)
    .map((r) => ({
      performanceId: r.id,
      status: r.status,
      submittedAt: r.submittedAt,
      clientUserId: r.collaboration!.company.userId,
      collabStatus: r.collaboration!.status,
      disputed: r.collaboration!.disputedAt != null,
      label: performanceLabel(r),
    }));

  const plan = planPerformanceApprovalReminders(candidates, now);
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
          type: "PERFORMANCE_APPROVAL_REMINDER",
          actorRole: "SYSTEM",
          actorId: opts.actorId ?? null,
          subjectType: "Performance",
          subjectId: r.performanceId,
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
          link: "/prestaties",
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId ?? null,
          action: "PERFORMANCE_APPROVAL_REMINDER",
          entityType: "Performance",
          entityId: r.performanceId,
          metadata: { stage: r.stage },
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
            type: "PERFORMANCE_APPROVAL_ESCALATION",
            actorRole: "SYSTEM",
            actorId: opts.actorId ?? null,
            subjectType: "Performance",
            subjectId: e.performanceId,
            payload: JSON.stringify({ daysSince: e.daysSince }),
            correlationId: null,
            dedupeKey: e.dedupeKey,
          },
        }),
        ...admins.map((a) =>
          prisma.notification.create({
            data: {
              userId: a.id,
              type: "PERFORMANCE_APPROVAL_ESCALATION",
              title: "Urenstaat blijft ongekeurd liggen",
              body: `${e.label} wacht al ${e.daysSince} dagen op goedkeuring door de opdrachtgever. De facturatie staat stil.`,
              // Een stille goedkeuring is géén dispuut: de admin hoort in de samenwerkingen-cockpit,
              // niet in de disputenlijst (waar de betrokken samenwerking niet eens staat).
              link: "/admin/samenwerkingen",
            },
          }),
        ),
        prisma.auditLog.create({
          data: auditData({
            actorId: opts.actorId ?? null,
            action: "PERFORMANCE_APPROVAL_ESCALATED",
            entityType: "Performance",
            entityId: e.performanceId,
            metadata: { daysSince: e.daysSince },
          }),
        }),
      ]);
    }
  }

  return { reminded: freshReminders.length, escalated: freshEscalations.length };
}
