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

// Interactieve-transactie-opties. De array-vorm had geen wall-clock-limiet; Prisma's
// interactieve default is 5000ms. Bij een piek richting de `take: 2000`-cap (juist de
// spike waarvoor die cap bestaat) kunnen de sequentiële round-trips die 5s overschrijden
// → de héle batch rolt terug en de run maakt geen voortgang. Een ruime timeout herstelt
// de pariteit met de oude vorm; `maxWait` begrenst het wachten op een transactieslot.
const EXPIRY_TX_OPTIONS = { timeout: 120_000, maxWait: 10_000 } as const;

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

    let reminded = 0;

    if (plan.toRemind.length > 0) {
      // Symmetrisch met het verloop-pad: herinner alleen credentials die nú (in de
      // transactie) nog VERIFIED zijn. Zonder deze her-lezing stuurde het pad een
      // "verloopt binnenkort"-melding ook naar een credential dat intussen opnieuw is
      // ingediend (SUBMITTED) — misleidend, want dat certificaat is niet meer geldig en
      // verloopt niet. De compound-guarded marker-write onderdrukte alleen de dedup-
      // markering, niet de melding zelf. Nu dekt de melding exact de nog-geldige set.
      const remindIds = plan.toRemind.map((r) => r.id);
      const stillVerified = await tx.credential.findMany({
        where: { id: { in: remindIds }, status: "VERIFIED" },
        select: { id: true },
      });
      const verifiedIds = new Set(stillVerified.map((c) => c.id));
      const remindItems = plan.toRemind.filter((r) => verifiedIds.has(r.id));
      reminded = remindItems.length;

      if (reminded > 0) {
        // Per herinnering: notificatie + dedup-markering.
        for (const item of remindItems) {
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
          // Compound-guarded op VERIFIED: veilig ook als de status net na de her-lezing
          // nog wisselt (consistent met de verloop-guard hierboven).
          await tx.credential.updateMany({
            where: { id: item.id, status: "VERIFIED" },
            data: { expiryReminderFor: item.expiresAt },
          });
        }

        // Eén auditregel voor de volledige herinneringsbatch (alleen de echt-herinnerde).
        await tx.auditLog.create({
          data: auditData({
            actorId: opts.actorId,
            action: "CREDENTIALS_EXPIRING_REMINDED",
            entityType: "Credential",
            entityId: "batch",
            metadata: { count: reminded, ids: remindItems.map((i) => i.id) },
          }),
        });
      }
    }

    return { expired, reminded };
  }, EXPIRY_TX_OPTIONS);

  return result;
}
