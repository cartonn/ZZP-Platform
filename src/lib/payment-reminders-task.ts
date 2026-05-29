// Geplande runner voor de betaaltermijn-reminders (plan/apply, zoals runExpiryTask). Markeert
// verstreken goedgekeurde facturen als OVERDUE en stuurt herinneringen/te-laat-signalen,
// idempotent via DomainEvent dedupeKey. Geen incasso — alleen statusregistratie + signalering.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { invoiceLifecycleMachine, type InvoiceLifecycleState } from "@/lib/lifecycles";
import { planPaymentReminders, type PaymentReminderCandidate } from "@/lib/payment-reminders";

export interface PaymentReminderResult {
  markedOverdue: number;
  reminded: number;
}

export async function runPaymentReminderTask(opts: { actorId?: string | null; now?: Date }): Promise<PaymentReminderResult> {
  const now = opts.now ?? new Date();

  const rows = await prisma.invoice.findMany({
    where: { lifecycleStatus: { in: ["APPROVED", "OVERDUE"] }, dueAt: { not: null } },
    select: { id: true, lifecycleStatus: true, dueAt: true, issuerUserId: true, counterpartyUserId: true, partyInvoiceNumber: true },
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
    await prisma.invoice.update({ where: { id }, data: { lifecycleStatus: "OVERDUE", status: "OVERDUE" } });
    markedOverdue += 1;
  }

  // Filter al-gevuurde herinneringen weg (idempotent via DomainEvent dedupeKey).
  if (plan.reminders.length === 0) return { markedOverdue, reminded: 0 };
  const keys = plan.reminders.map((r) => r.dedupeKey);
  const existing = await prisma.domainEvent.findMany({ where: { dedupeKey: { in: keys } }, select: { dedupeKey: true } });
  const seen = new Set(existing.map((e) => e.dedupeKey));
  const fresh = plan.reminders.filter((r) => !seen.has(r.dedupeKey));

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
        data: { userId: r.userId, type: r.notificationType, title: r.title, body: r.body, link: "/facturen" },
      }),
      prisma.auditLog.create({
        data: auditData({ actorId: opts.actorId ?? null, action: r.overdue ? "PAYMENT_OVERDUE" : "PAYMENT_REMINDER", entityType: "Invoice", entityId: r.invoiceId, metadata: { stage: r.stage } }),
      }),
    ]);
  }

  return { markedOverdue, reminded: fresh.length };
}
