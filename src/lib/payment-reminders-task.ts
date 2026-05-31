// Geplande runner voor de betaaltermijn-reminders (plan/apply, zoals runExpiryTask). Markeert
// verstreken goedgekeurde facturen als OVERDUE en stuurt herinneringen/te-laat-signalen,
// idempotent via DomainEvent dedupeKey. Geen incasso — alleen statusregistratie + signalering.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { invoiceLifecycleMachine, type InvoiceLifecycleState } from "@/lib/lifecycles";
import {
  planPaymentReminders,
  type PaymentReminderCandidate,
  type PaymentEscalationItem,
} from "@/lib/payment-reminders";
import { getMailSender } from "@/lib/services/mail-sender";
import {
  buildPaymentReminderEmail,
  buildPaymentOverdueEmail,
} from "@/lib/services/reminder-emails";

export interface PaymentReminderResult {
  markedOverdue: number;
  reminded: number;
  escalated: number;
}

export async function runPaymentReminderTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<PaymentReminderResult> {
  const now = opts.now ?? new Date();

  const rows = await prisma.invoice.findMany({
    where: { lifecycleStatus: { in: ["APPROVED", "OVERDUE"] }, dueAt: { not: null } },
    select: {
      id: true,
      lifecycleStatus: true,
      dueAt: true,
      issuerUserId: true,
      counterpartyUserId: true,
      partyInvoiceNumber: true,
    },
  });

  const candidates: PaymentReminderCandidate[] = rows
    .filter((r) => r.issuerUserId && r.counterpartyUserId)
    .map((r) => ({
      invoiceId: r.id,
      lifecycleStatus: r.lifecycleStatus as InvoiceLifecycleState,
      dueAt: r.dueAt,
      freelancerUserId: r.issuerUserId!,
      clientUserId: r.counterpartyUserId!,
      partyInvoiceNumber: r.partyInvoiceNumber,
    }));

  const plan = planPaymentReminders(candidates, now);

  // Markeer verstreken facturen als OVERDUE (gevalideerd tegen de state machine).
  let markedOverdue = 0;
  for (const id of plan.toMarkOverdue) {
    invoiceLifecycleMachine.assert("APPROVED", "OVERDUE");
    await prisma.invoice.update({
      where: { id },
      data: { lifecycleStatus: "OVERDUE", status: "OVERDUE" },
    });
    markedOverdue += 1;
  }

  // Filter al-gevuurde herinneringen en escalaties weg (idempotent via DomainEvent dedupeKey).
  if (plan.reminders.length === 0 && plan.escalations.length === 0)
    return { markedOverdue, reminded: 0, escalated: 0 };

  const keys = [
    ...plan.reminders.map((r) => r.dedupeKey),
    ...plan.escalations.map((e) => e.dedupeKey),
  ];
  const existing = await prisma.domainEvent.findMany({
    where: { dedupeKey: { in: keys } },
    select: { dedupeKey: true },
  });
  const seen = new Set(existing.map((e) => e.dedupeKey));
  const fresh = plan.reminders.filter((r) => !seen.has(r.dedupeKey));
  const freshEscalations: PaymentEscalationItem[] = plan.escalations.filter(
    (e) => !seen.has(e.dedupeKey),
  );

  // Batch-query voor e-mailadressen van alle betrokken gebruikers.
  const allUserIds = [...new Set(fresh.map((r) => r.userId))];
  const paymentUsers =
    allUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: allUserIds } },
          select: { id: true, email: true, name: true },
        })
      : [];
  const paymentUserMap = new Map(paymentUsers.map((u) => [u.id, u]));
  const loginUrl = process.env.NEXTAUTH_URL ?? "https://app.zzp-platform.nl";
  const mail = getMailSender();

  for (const r of fresh) {
    await prisma.$transaction([
      prisma.domainEvent.create({
        data: {
          type: r.overdue ? "PAYMENT_OVERDUE" : "PAYMENT_REMINDER",
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
          action: r.overdue ? "PAYMENT_OVERDUE" : "PAYMENT_REMINDER",
          entityType: "Invoice",
          entityId: r.invoiceId,
          metadata: { stage: r.stage },
        }),
      }),
    ]);
    const u = paymentUserMap.get(r.userId);
    const candidate = candidates.find((c) => c.invoiceId === r.invoiceId);
    if (u && candidate) {
      const num = candidate.partyInvoiceNumber ?? "factuur";
      try {
        if (r.overdue) {
          const isFreelancer = r.userId === candidate.freelancerUserId;
          await mail.send(
            buildPaymentOverdueEmail({
              role: isFreelancer ? "freelancer" : "client",
              name: u.name ?? u.email,
              email: u.email,
              invoiceNumber: num,
              loginUrl,
            }),
          );
        } else {
          // Bereken daysLeft uit de stage-string (bv. "before-5" → 5).
          const daysLeft = parseInt(r.stage.replace("before-", ""), 10);
          if (!isNaN(daysLeft)) {
            await mail.send(
              buildPaymentReminderEmail({
                name: u.name ?? u.email,
                email: u.email,
                invoiceNumber: num,
                daysLeft,
                loginUrl,
              }),
            );
          }
        }
      } catch (err) {
        console.error("[payment-reminders-task] e-mail mislukt:", err);
      }
    }
  }

  // Escalaties naar admins: één DomainEvent + notificaties per admin + auditlog per escalatie.
  let escalated = 0;
  if (freshEscalations.length > 0) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });
    for (const e of freshEscalations) {
      const domainEvent = prisma.domainEvent.create({
        data: {
          type: "PAYMENT_OVERDUE",
          actorRole: "SYSTEM",
          actorId: opts.actorId ?? null,
          subjectType: "Invoice",
          subjectId: e.invoiceId,
          payload: JSON.stringify({
            stage: "escalation",
            level: e.level,
            daysOverdue: e.daysOverdue,
          }),
          correlationId: null,
          dedupeKey: e.dedupeKey,
        },
      });
      const notificationCreates = admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: "PAYMENT_OVERDUE",
            title: "Te late betaling vraagt aandacht",
            body: `Factuur ${e.partyInvoiceNumber ?? "(concept)"} staat ${e.daysOverdue} dagen open (laatste aanmaning).`,
            link: "/admin/administratie",
          },
        }),
      );
      const auditLog = prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId ?? null,
          action: "PAYMENT_OVERDUE",
          entityType: "Invoice",
          entityId: e.invoiceId,
          metadata: { stage: "escalation", level: e.level },
        }),
      });
      await prisma.$transaction([domainEvent, ...notificationCreates, auditLog]);
      escalated += 1;
    }
  }

  return { markedOverdue, reminded: fresh.length, escalated };
}
