// Geplande taakrunner voor vervaldatum-afhandeling: verlopen + herinneringen.
// Eén uitvoerpunt dat Prisma-operaties atomair uitvoert (CLAUDE.md regel 5 & 2).
// Geen auth hier — de aanroeper (route of serveractie) is verantwoordelijk voor autorisatie.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { planExpiryRun, EXPIRY_REMINDER_WINDOW_DAYS, type ExpiryCandidate } from "@/lib/expiry";
import { type CredentialStatus } from "@/lib/enums";
import { plural } from "@/lib/plural";

export interface ExpiryRunResult {
  expired: number;
  reminded: number;
}

/**
 * Voert de verloop- en herinneringsrun uit als één atomaire transactie.
 *
 * @param opts.actorId - Gebruikers-ID van de aanroeper (null = systeemactie).
 * @param opts.now     - Referentietijdstip (standaard: huidige datum/tijd).
 */
export async function runExpiryTask(opts: {
  actorId: string | null;
  now?: Date;
}): Promise<ExpiryRunResult> {
  const now = opts.now ?? new Date();

  // Bovengrens: nu + herinnerings-window, zodat de scan altijd begrensd is.
  const upperBound = new Date(now);
  upperBound.setDate(upperBound.getDate() + EXPIRY_REMINDER_WINDOW_DAYS);

  // Laad kandidaten: alleen VERIFIED-credentials die binnen het venster verlopen
  // (al verlopen vallen ook onder lte: upperBound).
  const rows = await prisma.credential.findMany({
    where: {
      status: "VERIFIED",
      expiresAt: { not: null, lte: upperBound },
    },
    include: {
      freelancerProfile: { select: { userId: true } },
    },
  });

  // Zet Prisma-rijen om naar het pure ExpiryCandidate-model.
  const candidates: ExpiryCandidate[] = rows.map((c) => ({
    id: c.id,
    status: c.status as CredentialStatus,
    expiresAt: c.expiresAt,
    expiryReminderFor: c.expiryReminderFor,
    title: c.title,
    userId: c.freelancerProfile.userId,
  }));

  const plan = planExpiryRun(candidates, now);

  // Niets te doen: geen transactie, geen lege auditregels.
  if (plan.toExpire.length === 0 && plan.toRemind.length === 0) {
    return { expired: 0, reminded: 0 };
  }

  // Bouw de transactie-operaties op — alleen de benodigde blokken worden toegevoegd.
  // Alles in één $transaction voor atomiciteit (CLAUDE.md regel 5).
  const ops: Prisma.PrismaPromise<unknown>[] = [];

  if (plan.toExpire.length > 0) {
    const expireIds = plan.toExpire.map((c) => c.id);

    // Status van alle verlopen credentials in één keer bijwerken.
    ops.push(
      prisma.credential.updateMany({
        where: { id: { in: expireIds } },
        data: { status: "EXPIRED" },
      }),
    );

    // Eén notificatie per verlopen credential.
    for (const item of plan.toExpire) {
      ops.push(
        prisma.notification.create({
          data: {
            userId: item.userId,
            type: "CREDENTIAL_EXPIRED",
            title: "Certificaat verlopen",
            body: `Je certificaat "${item.title}" is verlopen. Vernieuw het en vraag opnieuw verificatie aan.`,
            link: "/certificaten",
          },
        }),
      );
    }

    // Eén auditregel voor de volledige batch.
    ops.push(
      prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId,
          action: "CREDENTIALS_EXPIRED",
          entityType: "Credential",
          entityId: "batch",
          metadata: { count: plan.toExpire.length, ids: expireIds },
        }),
      }),
    );
  }

  if (plan.toRemind.length > 0) {
    const remindIds = plan.toRemind.map((r) => r.id);

    // Per herinnering: notificatie + dedup-markering.
    for (const item of plan.toRemind) {
      ops.push(
        prisma.notification.create({
          data: {
            userId: item.userId,
            type: "CREDENTIAL_EXPIRING",
            title: "Certificaat verloopt binnenkort",
            body: `Je certificaat "${item.title}" verloopt over ${plural(item.daysLeft, "dag", "dagen")}. Vernieuw het op tijd om geverifieerd te blijven.`,
            link: "/certificaten",
          },
        }),
      );

      // Sla de vervaldatum op als dedup-anker zodat we niet dubbel herinneren.
      ops.push(
        prisma.credential.update({
          where: { id: item.id },
          data: { expiryReminderFor: item.expiresAt },
        }),
      );
    }

    // Eén auditregel voor de volledige herinneringsbatch.
    ops.push(
      prisma.auditLog.create({
        data: auditData({
          actorId: opts.actorId,
          action: "CREDENTIALS_EXPIRING_REMINDED",
          entityType: "Credential",
          entityId: "batch",
          metadata: { count: plan.toRemind.length, ids: remindIds },
        }),
      }),
    );
  }

  await prisma.$transaction(ops);

  return { expired: plan.toExpire.length, reminded: plan.toRemind.length };
}
