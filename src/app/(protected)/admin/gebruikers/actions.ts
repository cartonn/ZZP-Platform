"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { canModerateUser } from "@/lib/admin";
import { requestMeta } from "@/lib/request-meta";
import { getStorage } from "@/lib/services/storage";
import {
  canAnonymizeUser,
  companyAnonymizationData,
  freelancerProfileAnonymizationData,
  userAnonymizationData,
} from "@/lib/account-anonymization";
import { prisma } from "@/lib/db";
import { userStatusSchema } from "@/lib/enums";

export async function setUserStatus(userId: string, target: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  const status = userStatusSchema.parse(target);

  if (!canModerateUser(actor.id, userId)) {
    throw new Error("Je kunt je eigen account niet wijzigen.");
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true },
  });
  if (!user) throw new Error("Gebruiker niet gevonden.");

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { status } }),
    prisma.notification.create({
      data: {
        userId,
        type: "ACCOUNT_STATUS",
        title: status === "SUSPENDED" ? "Account geschorst" : "Account geactiveerd",
        body:
          status === "SUSPENDED"
            ? "Je account is geschorst door een beheerder."
            : "Je account is weer actief.",
      },
    }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "USER_STATUS_CHANGED",
        entityType: "User",
        entityId: userId,
        metadata: { from: user.status, to: status },
      }),
    }),
  ]);
  revalidatePath("/admin/gebruikers");
}

/** AVG "recht op verwijdering": beheer voert een openstaand verwijderverzoek uit door het account
 *  onomkeerbaar te anonimiseren. Persoonsgegevens (User/profiel/bedrijf) worden overschreven,
 *  certificaten en documenten — de gevoeligste PII — worden verwijderd. Facturen blijven bestaan
 *  i.v.m. de fiscale bewaarplicht; berichten/notificaties blijven als gezamenlijke records staan,
 *  maar zijn niet meer naar een persoon herleidbaar. Mutatieketen: auth → rol → guard → actie → audit. */
export async function anonymizeUser(userId: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, deletionRequestedAt: true, anonymizedAt: true },
  });
  if (!user) throw new Error("Gebruiker niet gevonden.");

  const check = canAnonymizeUser(actor, user);
  if (!check.ok) throw new Error(check.reason);

  // Storage-sleutels vóór de transactie ophalen voor best-effort opruimen ná het wegschrijven.
  const documents = await prisma.document.findMany({
    where: { ownerId: userId },
    select: { storageKey: true },
  });

  const now = new Date();
  const meta = await requestMeta();
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: userAnonymizationData(userId, now) }),
    prisma.freelancerProfile.updateMany({
      where: { userId },
      data: freelancerProfileAnonymizationData(),
    }),
    prisma.company.updateMany({ where: { userId }, data: companyAnonymizationData() }),
    prisma.credential.deleteMany({ where: { freelancerProfile: { userId } } }),
    prisma.document.deleteMany({ where: { ownerId: userId } }),
    prisma.auditLog.create({
      data: auditData({
        actorId: actor.id,
        action: "ACCOUNT_ANONYMIZED",
        entityType: "User",
        entityId: userId,
        metadata: { documentsDeleted: documents.length },
        ...meta,
      }),
    }),
  ]);

  // Bestanden in de opslag opruimen — best-effort, faalt de transactie niet.
  if (documents.length > 0) {
    const storage = getStorage();
    await Promise.all(
      documents.map((d) =>
        storage.delete(d.storageKey).catch(() => {
          /* opslag-opruiming is best-effort; de DB-anonimisering is al definitief */
        }),
      ),
    );
  }

  revalidatePath("/admin/gebruikers");
}
