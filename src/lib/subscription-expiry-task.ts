// Geplande runner voor de betaalde-abonnements-verval/renewal-cyclus. Stuurt renewal-herinneringen
// vóór het periode-einde (dag 7/1) en laat een verlopen periode daadwerkelijk vervallen (→ CANCELLED,
// waarna de gebruiker terugvalt op Gratis). Idempotent via DomainEvent dedupeKey. Plan/apply zoals
// runSubscriptionPastDueTask. Geen geldstroom — alleen periode-registratie + signalering; de
// Mollie-webhook schuift `currentPeriodEnd` op bij een echte betaling, deze taak verwerkt het verval.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import {
  planSubscriptionExpiry,
  type SubscriptionExpiryCandidate,
} from "@/lib/subscription-lifecycle";
import { SUBSCRIPTION_TRANSITIONS, type SubscriptionStatus } from "@/lib/enums";

export interface SubscriptionExpiryResult {
  reminded: number;
  expired: number;
}

// De verval-write draait in een interactieve $transaction zodat de status-write compound-guarded
// kan zijn. Elke transactie behandelt één abonnement (geen batch), dus de default-timeout ruimt
// makkelijk; `maxWait` begrenst het wachten op een slot. Spiegelt runSubscriptionPastDueTask.
const EXPIRY_TX_OPTIONS = { timeout: 30_000, maxWait: 10_000 } as const;

export async function runSubscriptionExpiryTask(opts: {
  actorId?: string | null;
  now?: Date;
}): Promise<SubscriptionExpiryResult> {
  const now = opts.now ?? new Date();

  // Alleen betaalde (priceCents > 0) ACTIVE-abonnementen met een concrete periode-einddatum.
  // Gratis/demo-perpetuele abonnementen hebben currentPeriodEnd = null en vallen hier automatisch buiten.
  const rows = await prisma.subscription.findMany({
    where: { status: "ACTIVE", currentPeriodEnd: { not: null }, plan: { priceCents: { gt: 0 } } },
    select: { id: true, userId: true, currentPeriodEnd: true },
  });
  const candidates: SubscriptionExpiryCandidate[] = rows
    .filter((r): r is typeof r & { currentPeriodEnd: Date } => r.currentPeriodEnd !== null)
    .map((r) => ({ id: r.id, userId: r.userId, currentPeriodEnd: r.currentPeriodEnd }));

  const plan = planSubscriptionExpiry(candidates, now);
  if (plan.reminders.length === 0 && plan.expiries.length === 0) {
    return { reminded: 0, expired: 0 };
  }

  // Idempotentie: filter al-gevuurde signalen weg op DomainEvent dedupeKey.
  const keys = [
    ...plan.reminders.map((r) => r.dedupeKey),
    ...plan.expiries.map((e) => e.dedupeKey),
  ];
  const existing = await prisma.domainEvent.findMany({
    where: { dedupeKey: { in: keys } },
    select: { dedupeKey: true },
  });
  const seen = new Set(existing.map((e) => e.dedupeKey));
  const freshReminders = plan.reminders.filter((r) => !seen.has(r.dedupeKey));
  const freshExpiries = plan.expiries.filter((e) => !seen.has(e.dedupeKey));

  for (const r of freshReminders) {
    await prisma.$transaction([
      prisma.domainEvent.create({
        data: {
          type: "SUBSCRIPTION_RENEWAL_REMINDER",
          actorRole: "SYSTEM",
          actorId: opts.actorId ?? null,
          subjectType: "Subscription",
          subjectId: r.subscriptionId,
          payload: JSON.stringify({ daysUntil: r.daysUntil }),
          correlationId: null,
          dedupeKey: r.dedupeKey,
        },
      }),
      prisma.notification.create({
        data: {
          userId: r.userId,
          type: "SUBSCRIPTION_RENEWAL",
          title: "Je abonnement verloopt binnenkort",
          body: `Je abonnement verloopt over ${r.daysUntil} ${r.daysUntil === 1 ? "dag" : "dagen"}. Verleng het om zonder onderbreking gebruik te blijven maken van je plan.`,
          link: "/abonnement",
        },
      }),
      prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId ?? null,
          action: "SUBSCRIPTION_RENEWAL_REMINDER",
          entityType: "Subscription",
          entityId: r.subscriptionId,
          metadata: { daysUntil: r.daysUntil },
        }),
      }),
    ]);
  }

  let expired = 0;
  for (const e of freshExpiries) {
    // Defensief: ACTIVE → CANCELLED moet een geldige overgang zijn (CLAUDE.md regel 3).
    if (!SUBSCRIPTION_TRANSITIONS.ACTIVE.includes("CANCELLED" as SubscriptionStatus)) continue;

    // Interactieve transactie (niet de array-vorm) zodat de status-write compound-guarded kan zijn.
    // De kandidaten komen uit een findMany-snapshot van vóór de transactie; schuift een echte
    // betaling (Mollie-webhook) `currentPeriodEnd` in dat venster naar de toekomst — de rij blijft
    // ACTIVE maar met een verse periode — dan mag deze cron die rij niet blind naar CANCELLED +
    // currentPeriodEnd:null schrijven; dat zou een net-verlengde klant stil naar Gratis downgraden én
    // een valse "verlopen"-notificatie sturen. De compound
    // `updateMany({ where: { id, status: "ACTIVE", currentPeriodEnd: <snapshot> } })` flipt alleen als
    // de rij nú (in de transactie) nog exact dezelfde ACTIVE-periode heeft; anders count 0 → niets
    // schrijven. Dit hardt ook twee gelijktijdige runs: run B's updateMany vindt de rij al
    // niet-ACTIVE/verlengd (count 0) en slaat de DomainEvent-create over → geen dedupeKey-collisie.
    const flipped = await prisma.$transaction(async (tx) => {
      const { count } = await tx.subscription.updateMany({
        where: { id: e.subscriptionId, status: "ACTIVE", currentPeriodEnd: e.currentPeriodEnd },
        // Status CANCELLED → de user valt terug op Gratis (getActivePlanKey behandelt niet-ACTIVE als FREE).
        data: { status: "CANCELLED", currentPeriodEnd: null },
      });
      if (count === 0) return false;

      await tx.domainEvent.create({
        data: {
          type: "SUBSCRIPTION_EXPIRED",
          actorRole: "SYSTEM",
          actorId: opts.actorId ?? null,
          subjectType: "Subscription",
          subjectId: e.subscriptionId,
          correlationId: null,
          dedupeKey: e.dedupeKey,
        },
      });
      await tx.notification.create({
        data: {
          userId: e.userId,
          type: "SUBSCRIPTION_EXPIRED",
          title: "Abonnement verlopen — teruggezet naar Gratis",
          body: "Je betaalde periode is verlopen en je account staat weer op Gratis. Kies op elk moment opnieuw een abonnement om je plan te heractiveren.",
          link: "/abonnement",
        },
      });
      await tx.auditLog.create({
        data: auditData({
          actorId: opts.actorId ?? null,
          action: "SUBSCRIPTION_EXPIRED",
          entityType: "Subscription",
          entityId: e.subscriptionId,
          metadata: { from: "ACTIVE", to: "CANCELLED", reason: "period_ended" },
        }),
      });
      return true;
    }, EXPIRY_TX_OPTIONS);

    if (flipped) expired += 1;
  }

  return { reminded: freshReminders.length, expired };
}
