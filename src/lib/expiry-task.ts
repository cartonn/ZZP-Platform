// Geplande taakrunner voor vervaldatum-afhandeling: verlopen + herinneringen.
// Eén uitvoerpunt dat Prisma-operaties atomair uitvoert (CLAUDE.md regel 5 & 2).
// Geen auth hier — de aanroeper (route of serveractie) is verantwoordelijk voor autorisatie.

import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { planExpiryRun, EXPIRY_REMINDER_WINDOW_DAYS, type ExpiryCandidate } from "@/lib/expiry";
import {
  credentialEditPath,
  supersededVerifiedCredentialIds,
  coveredCredentialTypes,
  type SupersedeInput,
} from "@/lib/credentials";
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

  // Dekkings-context. De leesoppervlakken — badge (signals.ts), /acties (pending-tasks.ts),
  // roster (rosterExpiringByProfile) — onderdrukken bewust een "vernieuw dit certificaat"-nudge
  // zodra het type al gedekt wordt door een ander nu-geldig VERIFIED-certificaat. Deze cron mag
  // die surfaces niet tegenspreken. We laden daarom het VOLLEDIGE VERIFIED-dossier van de
  // kandidaat-profielen — óók langer-geldige/onbeperkte dekkers die buiten het 30-dagen-venster
  // vallen — en berekenen per profiel de superseded-ids en gedekte types. Twee-staps-patroon en
  // per-profiel-scoping spiegelen summarizeRosterExpiringSoon (data/roster-expiry.ts).
  const candidateProfileIds = [...new Set(rows.map((c) => c.freelancerProfileId))];

  const coverRows =
    candidateProfileIds.length > 0
      ? await prisma.credential.findMany({
          where: { status: "VERIFIED", freelancerProfileId: { in: candidateProfileIds } },
          select: { id: true, type: true, expiresAt: true, freelancerProfileId: true },
        })
      : [];

  // Groepeer per profiel: supersede/dekking MOET binnen één profiel gebeuren, anders botsen
  // gelijke types tussen verschillende ZZP'ers en dekt een cert van de één dat van de ander.
  const coverByProfile = new Map<string, SupersedeInput[]>();
  for (const c of coverRows) {
    const input: SupersedeInput = {
      id: c.id,
      type: c.type,
      status: "VERIFIED" as const,
      expiresAt: c.expiresAt,
    };
    const list = coverByProfile.get(c.freelancerProfileId);
    if (list) list.push(input);
    else coverByProfile.set(c.freelancerProfileId, [input]);
  }

  const supersededIds = new Set<string>();
  const coveredTypesByProfile = new Map<string, Set<string>>();
  for (const [profileId, list] of coverByProfile) {
    for (const id of supersededVerifiedCredentialIds(list, now)) supersededIds.add(id);
    coveredTypesByProfile.set(profileId, coveredCredentialTypes(list, now));
  }

  // Kandidaat-id → profiel + type, voor de dekkings-gate op het verloop-notificatiepad.
  const credMetaById = new Map<string, { profileId: string; type: string }>();
  for (const c of rows) {
    credMetaById.set(c.id, { profileId: c.freelancerProfileId, type: c.type });
  }

  const plan = planExpiryRun(candidates, now);

  // Herinnerings-pad: laat superseded certificaten vallen. Een ouder cert waarvan een nieuwer,
  // nu-geldig cert van hetzelfde type de compliance al draagt, hoeft niet vernieuwd te worden —
  // een "verloopt binnenkort"-nudge daarop is een valse melding (consistent met de surfaces).
  // Op plan-niveau gefilterd zodat de bestaande VERIFIED-herlezing (TOCTOU), de dedup-marker en
  // de `reminded`-telling vanzelf de gefilterde set volgen.
  plan.toRemind = plan.toRemind.filter((r) => !supersededIds.has(r.id));

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
          // Dekkings-gate op de MELDING (niet op de flip). Is het type van dit verlopen
          // certificaat al gedekt door een ander nu-geldig VERIFIED-certificaat van hetzelfde
          // profiel, dan sturen we GEEN "verlopen, vernieuw het"-notificatie — dat zou een valse
          // nudge zijn die de leesoppervlakken (coveredCredentialTypes) juist onderdrukken.
          // De EXPIRED-flip, de `expired`-telling en de audit-ids blijven de volledige geflipte
          // set (de overgang gebeurde echt; badges leunen op de server-side status).
          const meta = credMetaById.get(item.id);
          const covered = meta
            ? (coveredTypesByProfile.get(meta.profileId)?.has(meta.type) ?? false)
            : false;
          if (covered) continue; // gedekt type: geen valse "vernieuw"-nudge

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
