// Geplande runner voor de concept-factuur-reminders (§4 Event B2). Herinnert de ZZP'er aan
// niet-ingediende concept-facturen (dag 3/7) en escaleert daarna naar het platform (admins).
// Idempotent via DomainEvent dedupeKey. Plan/apply zoals runExpiryTask. Geen geldstroom.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { type InvoiceLifecycleState } from "@/lib/lifecycles";
import { planConceptInvoiceReminders, type ConceptInvoiceCandidate } from "@/lib/concept-invoice-reminders";

export interface ConceptReminderResult {
  reminded: number;
  escalated: number;
}

export async function runConceptInvoiceReminderTask(opts: { actorId?: string | null; now?: Date }): Promise<ConceptReminderResult> {
  const now = opts.now ?? new Date();

  const rows = await prisma.invoice.findMany({
    where: { lifecycleStatus: "DRAFT", issuerUserId: { not: null } },
    select: { id: true, lifecycleStatus: true, createdAt: true, issuerUserId: true, partyInvoiceNumber: true },
  });

  const candidates: ConceptInvoiceCandidate[] = rows
    .filter((r) => r.issuerUserId)
    .map((r) => ({
      invoiceId: r.id,
      lifecycleStatus: r.lifecycleStatus as InvoiceLifecycleState,
      createdAt: r.createdAt,
      issuerUserId: r.issuerUserId!,
      partyInvoiceNumber: r.partyInvoiceNumber,
    }));

  const plan = planConceptInvoiceReminders(candidates, now);
  if (plan.reminders.length === 0 && plan.escalations.length === 0) return { reminded: 0, escalated: 0 };

  // Idempotentie: filter al-gevuurde signalen weg op DomainEvent dedupeKey.
  const keys = [...plan.reminders.map((r) => r.dedupeKey), ...plan.escalations.map((e) => e.dedupeKey)];
  const existing = await prisma.domainEvent.findMany({ where: { dedupeKey: { in: keys } }, select: { dedupeKey: true } });
  const seen = new Set(existing.map((e) => e.dedupeKey));

  const freshReminders = plan.reminders.filter((r) => !seen.has(r.dedupeKey));
  const freshEscalations = plan.escalations.filter((e) => !seen.has(e.dedupeKey));

  for (const r of freshReminders) {
    await prisma.$transaction([
      prisma.domainEvent.create({
        data: { type: "PAYMENT_REMINDER", actorRole: "SYSTEM", actorId: opts.actorId ?? null, subjectType: "Invoice", subjectId: r.invoiceId, payload: JSON.stringify({ stage: r.stage }), correlationId: null, dedupeKey: r.dedupeKey },
      }),
      prisma.notification.create({ data: { userId: r.userId, type: r.notificationType, title: r.title, body: r.body, link: "/facturen" } }),
      prisma.auditLog.create({ data: auditData({ actorId: opts.actorId ?? null, action: "INVOICE_DRAFT_REMINDER", entityType: "Invoice", entityId: r.invoiceId, metadata: { stage: r.stage } }) }),
    ]);
  }

  if (freshEscalations.length > 0) {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
    for (const e of freshEscalations) {
      const num = e.partyInvoiceNumber ?? "concept-factuur";
      await prisma.$transaction([
        prisma.domainEvent.create({
          data: { type: "PAYMENT_OVERDUE", actorRole: "SYSTEM", actorId: opts.actorId ?? null, subjectType: "Invoice", subjectId: e.invoiceId, payload: JSON.stringify({ daysSince: e.daysSince }), correlationId: null, dedupeKey: e.dedupeKey },
        }),
        ...admins.map((a) => prisma.notification.create({ data: { userId: a.id, type: "INVOICE_DRAFT_ESCALATION", title: "Concept-factuur blijft liggen", body: `${num} staat al ${e.daysSince} dagen op concept en is niet ingediend.`, link: "/admin/disputen" } })),
        prisma.auditLog.create({ data: auditData({ actorId: opts.actorId ?? null, action: "INVOICE_DRAFT_ESCALATED", entityType: "Invoice", entityId: e.invoiceId, metadata: { daysSince: e.daysSince } }) }),
      ]);
    }
  }

  return { reminded: freshReminders.length, escalated: freshEscalations.length };
}
