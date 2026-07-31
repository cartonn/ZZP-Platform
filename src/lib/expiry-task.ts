// Geplande taakrunner voor vervaldatum-afhandeling: verlopen + herinneringen.
// Eén uitvoerpunt dat Prisma-operaties atomair uitvoert (CLAUDE.md regel 5 & 2).
// Geen auth hier — de aanroeper (route of serveractie) is verantwoordelijk voor autorisatie.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { planExpiryRun, EXPIRY_REMINDER_WINDOW_DAYS, type ExpiryCandidate } from "@/lib/expiry";
import { credentialEditPath } from "@/lib/credentials";
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
    // Defensieve cap (patroon van de andere taakrunners): eerst wat het eerst verloopt.
    // Een datapiek kan één cron-tick anders in een zeer grote transactie veranderen;
    // de rest volgt vanzelf in de volgende run.
    orderBy: { expiresAt: "asc" },
    take: 2000,
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

  // Alles in één interactieve $transaction voor atomiciteit (CLAUDE.md regel 5).
  // Interactief (niet de array-vorm) zodat de verloop-write compound-guarded kan zijn
  // — de kandidaten komen uit een findMany-snapshot van vóór de transactie; een
  // credential dat intussen opnieuw is ingediend (VERIFIED → SUBMITTED, certificaten/
  // actions.ts) mag niet blind terug naar EXPIRED worden geschreven. Dat zou een
  // ongeldige overgang zijn (SUBMITTED → EXPIRED staat niet in CREDENTIAL_TRANSITIONS)
  // en de zojuist ingediende herbeoordeling stilletjes overschrijven met een valse
  // "verlopen"-notificatie. Alle andere status-writes in de cascade gebruiken diezelfde
  // compound `updateMany({ where: { id, status } })` om precies deze TOCTOU te sluiten.
  const result = await prisma.$transaction(async (tx) => {
    let expired = 0;

    if (plan.toExpire.length > 0) {
      const expireIds = plan.toExpire.map((c) => c.id);

      // Compound-guarded: alleen credentials die nú (in de transactie) nog VERIFIED
      // zijn overgaan naar EXPIRED. Een intussen opnieuw ingediende (SUBMITTED)
      // credential valt buiten de WHERE en blijft ongemoeid.
      await tx.credential.updateMany({
        where: { id: { in: expireIds }, status: "VERIFIED" },
        data: { status: "EXPIRED" },
      });

      // Lees exact terug welke rijen daadwerkelijk zijn verlopen. Alleen deze cron
      // laat credentials verlopen en de bron-findMany was VERIFIED-only, dus de
      // EXPIRED-rijen binnen expireIds zijn precies de rijen die wíj net flipten.
      const flipped = await tx.credential.findMany({
        where: { id: { in: expireIds }, status: "EXPIRED" },
        select: { id: true },
      });
      const flippedIds = new Set(flipped.map((c) => c.id));
      const expiredItems = plan.toExpire.filter((item) => flippedIds.has(item.id));
      expired = expiredItems.length;

      if (expired > 0) {
        // Eén notificatie per daadwerkelijk verlopen credential.
        for (const item of expiredItems) {
          await tx.notification.create({
            data: {
              userId: item.userId,
              type: "CREDENTIAL_EXPIRED",
              title: "Certificaat verlopen",
              body: `Je certificaat "${item.title}" is verlopen. Vernieuw het en vraag opnieuw verificatie aan.`,
              link: credentialEditPath(item.id),
            },
          });
        }

        // Eén auditregel voor de volledige batch (alleen de echt verlopen ids).
        await tx.auditLog.create({
          data: auditData({
            actorId: opts.actorId,
            action: "CREDENTIALS_EXPIRED",
            entityType: "Credential",
            entityId: "batch",
            metadata: { count: expired, ids: expiredItems.map((i) => i.id) },
          }),
        });
      }
    }

    if (plan.toRemind.length > 0) {
      const remindIds = plan.toRemind.map((r) => r.id);

      // Per herinnering: notificatie + dedup-markering.
      for (const item of plan.toRemind) {
        await tx.notification.create({
          data: {
            userId: item.userId,
            type: "CREDENTIAL_EXPIRING",
            title: "Certificaat verloopt binnenkort",
            body: `Je certificaat "${item.title}" verloopt over ${plural(item.daysLeft, "dag", "dagen")}. Vernieuw het op tijd om geverifieerd te blijven.`,
            link: credentialEditPath(item.id),
          },
        });

        // Sla de vervaldatum op als dedup-anker zodat we niet dubbel herinneren.
        // Compound-guarded op VERIFIED: herinner nooit een credential dat intussen
        // is opnieuw ingediend/afgekeurd (consistent met de verloop-guard hierboven).
        await tx.credential.updateMany({
          where: { id: item.id, status: "VERIFIED" },
          data: { expiryReminderFor: item.expiresAt },
        });
      }

      // Eén auditregel voor de volledige herinneringsbatch.
      await tx.auditLog.create({
        data: auditData({
          actorId: opts.actorId,
          action: "CREDENTIALS_EXPIRING_REMINDED",
          entityType: "Credential",
          entityId: "batch",
          metadata: { count: plan.toRemind.length, ids: remindIds },
        }),
      });
    }

    return { expired, reminded: plan.toRemind.length };
  });

  return result;
}
