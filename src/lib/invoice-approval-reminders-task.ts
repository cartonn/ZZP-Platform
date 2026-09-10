// Geplande runner voor de factuur-goedkeuring-reminders (§4 Event C → D). Herinnert de opdrachtgever
// aan ingediende (SUBMITTED) cascade-facturen die nog niet zijn goedgekeurd (dag 3/7) en escaleert
// daarna naar het platform (admins). Idempotent via DomainEvent dedupeKey. Plan/apply zoals
// runPerformanceApprovalReminderTask. Geen geldstroom. Sluit de énige opdrachtgever-poort in de
// cascade die nog geen nudge had — zonder deze herinnering blijft de betaling na indiening hangen.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import {
  planInvoiceApprovalReminders,
  invoiceLabel,
  type InvoiceApprovalCandidate,
} from "@/lib/invoice-approval-reminders";

export interface InvoiceApprovalReminderResult {
  reminded: number;
  escalated: number;
}

export async function runInvoiceApprovalReminderTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<InvoiceApprovalReminderResult> {
  const now = opts.now ?? new Date();

  const rows = await prisma.invoice.findMany({
    where: { lifecycleStatus: "SUBMITTED", counterpartyUserId: { not: null } },
    select: {
      id: true,
      lifecycleStatus: true,
      issuedAt: true,
      counterpartyUserId: true,
      partyInvoiceNumber: true,
      collaboration: {
        select: {
          status: true,
          disputedAt: true,
        },
      },
    },
    // Oudste indiening eerst: zonder orderBy is de selectie boven de cap ongedefinieerd en kan een
    // factuur structureel buiten de 500 vallen (starvation).
    orderBy: { issuedAt: "asc" },
    take: 500,
  });

  const candidates: InvoiceApprovalCandidate[] = rows
    .filter((r) => r.counterpartyUserId)
    .map((r) => ({
      invoiceId: r.id,
      lifecycleStatus: r.lifecycleStatus ?? "",
      submittedAt: r.issuedAt,
      clientUserId: r.counterpartyUserId!,
      // Een losstaande factuur zonder samenwerking (collaboration = null) is nooit CANCELLED/disputed.
      collabStatus: r.collaboration?.status ?? "ACTIVE",
      disputed: r.collaboration?.disputedAt != null,
      partyInvoiceNumber: r.partyInvoiceNumber,
    }));

  const plan = planInvoiceApprovalReminders(candidates, now);
  if (plan.reminders.length === 0 && plan.escalations.length === 0)
    return { reminded: 0, escalated: 0 };

  // Idempotentie: filter al-gevuurde signalen weg op DomainEvent dedupeKey.
  const keys = [
    ...plan.reminders.map((r) => r.dedupeKey),
    ...plan.escalations.map((e) => e.dedupeKey),
  ];
  // unbounded-allow: begrensd door de in-clause (keys komt uit het al-begrensde plan, ≤ 2×500)
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
          type: "INVOICE_APPROVAL_REMINDER",
          actorRole: "SYSTEM",
          actorId: opts.actorId ?? null,
          subjectType: "Invoice",
          subjectId: r.invoiceId,
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
          link: "/facturen",
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId ?? null,
          action: "INVOICE_APPROVAL_REMINDER",
          entityType: "Invoice",
          entityId: r.invoiceId,
          metadata: { stage: r.stage },
        }),
      }),
    ]);
  }

  if (freshEscalations.length > 0) {
    // unbounded-allow: aantal actieve admins is klein en operationeel begrensd
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });
    for (const e of freshEscalations) {
      const label = invoiceLabel(e.partyInvoiceNumber);
      await prisma.$transaction([
        prisma.domainEvent.create({
          data: {
            type: "INVOICE_APPROVAL_ESCALATION",
            actorRole: "SYSTEM",
            actorId: opts.actorId ?? null,
            subjectType: "Invoice",
            subjectId: e.invoiceId,
            payload: JSON.stringify({ daysSince: e.daysSince }),
            correlationId: null,
            dedupeKey: e.dedupeKey,
          },
        }),
        ...admins.map((a) =>
          prisma.notification.create({
            data: {
              userId: a.id,
              type: "INVOICE_APPROVAL_ESCALATION",
              title: "Factuur blijft ongekeurd liggen",
              body: `${label} wacht al ${e.daysSince} dagen op goedkeuring door de opdrachtgever. De betaling staat stil.`,
              // Een stille goedkeuring is géén dispuut: de admin hoort in de samenwerkingen-cockpit,
              // niet in de disputenlijst (waar de betrokken samenwerking niet eens staat).
              link: "/admin/samenwerkingen",
            },
          }),
        ),
        prisma.auditLog.create({
          data: auditData({
            actorId: opts.actorId ?? null,
            action: "INVOICE_APPROVAL_ESCALATED",
            entityType: "Invoice",
            entityId: e.invoiceId,
            metadata: { daysSince: e.daysSince },
          }),
        }),
      ]);
    }
  }

  return { reminded: freshReminders.length, escalated: freshEscalations.length };
}
