"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { canModerateUser } from "@/lib/admin";
import { requestMeta } from "@/lib/request-meta";
import { getStorage } from "@/lib/services/storage";
import { logStorageCleanupFailure } from "@/lib/observability/storage-failure";
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
  revalidatePath("/acties");
  revalidatePath("/dashboard");
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

  // De attributie van een dispuutreden zit niet op de Collaboration-rij maar in het
  // DISPUTE_OPENED-domeinevent (actorId) — net zoals cancellationReason via cancelledById wordt
  // gescopet. Verzamel de samenwerkingen waar déze betrokkene het dispuut opende, zodat we straks
  // alleen zíjn eigen vrije tekst wissen en niet die van de tegenpartij.
  const ownDisputeCollabIds = (
    await prisma.domainEvent.findMany({
      where: { type: "DISPUTE_OPENED", actorId: userId },
      select: { subjectId: true },
    })
  ).map((e) => e.subjectId);

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
    // AVG: verzonden berichten blijven als gespreksgeschiedenis bestaan, maar de vrije tekst kan
    // PII bevatten (naam/adres/telefoon) → redacten zodat de betrokkene niet meer herleidbaar is.
    prisma.message.updateMany({
      where: { senderId: userId },
      data: { body: "[Bericht verwijderd op verzoek van de gebruiker]" },
    }),
    // AVG art. 17 (recht op verwijdering): álle vrije-tekstvelden die de betrokkene zélf schreef en
    // die PII kunnen bevatten worden onomkeerbaar overschreven. Een `user.update` triggert geen
    // cascade op deze kindrijen, dus ze moeten expliciet mee in de transactie — anders blijft
    // herleidbare PII (naam/adres/telefoon) achter in motivatiebrieven, support-, idee- en
    // beoordelingsteksten. (NoShowReport.reason is door een ándere partij geschreven over de ZZP'er
    // en heeft mogelijk een bewaargrond bij een arbeidsgeschil — bewust niet hier; zie backlog.)
    prisma.application.updateMany({
      where: { freelancer: { userId } },
      data: { motivation: "[Verwijderd op verzoek van de gebruiker]" },
    }),
    // Interne kandidaatnotitie die de betrokkene als CLIENT zelf schreef bij reacties op de eigen
    // opdrachten (Application.note, vrije tekst met mogelijk persoonlijke opmerkingen). Gescopet op de
    // eigen bedrijfsopdrachten (job.company.userId) — nooit de motivatie/notitie van een andere partij.
    prisma.application.updateMany({
      where: { job: { company: { userId } } },
      data: { note: null },
    }),
    prisma.supportMessage.updateMany({
      where: { authorId: userId },
      data: { body: "[Bericht verwijderd op verzoek van de gebruiker]" },
    }),
    // Het onderwerp van een eigen supportticket is vrije tekst die de betrokkene zélf typte bij het
    // openen (kan naam/adres/telefoon/documentdetail bevatten). De ticket blijft als geanonimiseerd
    // record staan (operationele historie + `userId`), maar het onderwerp moet mee — anders blijft de
    // persoon herleidbaar uit zijn eigen woorden (spiegelbeeld van de SupportMessage.body-redactie
    // hierboven; het veld is niet-nullable → neutrale redactiestring).
    prisma.supportTicket.updateMany({
      where: { userId },
      data: { subject: "[Verwijderd op verzoek van de gebruiker]" },
    }),
    prisma.ideaComment.updateMany({
      where: { authorId: userId },
      data: { body: "[Reactie verwijderd op verzoek van de gebruiker]" },
    }),
    prisma.review.updateMany({
      where: { authorId: userId },
      data: { comment: null },
    }),
    prisma.shiftHandoff.updateMany({
      where: { requestedByUserId: userId },
      data: { reason: "[Verwijderd op verzoek van de gebruiker]" },
    }),
    // Beslisnotitie die de betrokkene als FRANCHISER/beslisser zelf schreef bij het afwijzen van een
    // shift-overname (ShiftHandoff.decisionNote, vrije tekst die de aanvrager/kandidaat kan benoemen).
    // Gescopet op decidedByUserId — het spiegelbeeld van de reason-redactie hierboven (aanvragerskant).
    prisma.shiftHandoff.updateMany({
      where: { decidedByUserId: userId },
      data: { decisionNote: null },
    }),
    // Beschikbaarheidsnoten: vrije tekst die de ZZP'er zelf schreef en die een reden of (medische)
    // details kan bevatten ("ziek", agenda-info). FreelancerProfile wordt geüpdatet (niet verwijderd),
    // dus de onDelete:Cascade op AvailabilityWindow vuurt niet → expliciet wissen.
    prisma.availabilityWindow.updateMany({
      where: { freelancerProfile: { userId } },
      data: { note: null },
    }),
    // Indirecte-uren-notities (urencriterium): vrije tekst die de betrokkene zelf schreef en
    // namen/details kan bevatten. De urenadministratie blijft staan (fiscale grond), maar de noot wist.
    prisma.indirectHoursEntry.updateMany({
      where: { userId },
      data: { note: null },
    }),
    // Eigen ideeën: titel + omschrijving zijn door de betrokkene geschreven vrije tekst (PII-risico);
    // het idee blijft als geanonimiseerd record op het bord staan.
    prisma.idea.updateMany({
      where: { authorId: userId },
      data: {
        title: "[Verwijderd op verzoek van de gebruiker]",
        description: "[Verwijderd op verzoek van de gebruiker]",
      },
    }),
    // Annuleerreden die de betrokkene zélf schreef (cancelledById == userId). Alleen de eigen tekst —
    // een door de tegenpartij geschreven reden blijft (die valt onder diens eigen verwerking).
    prisma.collaboration.updateMany({
      where: { cancelledById: userId },
      data: { cancellationReason: null },
    }),
    // Eigen dispuutreden: vrije tekst die de betrokkene schreef bij het openen van een dispuut.
    // resolveDispute wist 'm normaliter bij oplossing; staat een dispuut nog open op het moment van
    // anonimisering, dan blijft die tekst anders herleidbaar achter. Gescopet op de eigen
    // DISPUTE_OPENED-events (zie ownDisputeCollabIds) — nooit de reden van de tegenpartij.
    prisma.collaboration.updateMany({
      where: { id: { in: ownDisputeCollabIds }, disputeReason: { not: null } },
      data: { disputeReason: null },
    }),
    // Contactnotities die de betrokkene als FRANCHISER zelf schreef bij leads (LeadContact.body,
    // vrije tekst — bel-/gespreksnotities die de betrokkene identificeren). Gescopet op createdById.
    // Het veld is niet-nullable, dus overschrijven met een neutrale redactiestring i.p.v. null.
    // (De derde-partij-lead-PII zelf — contactName/email/phone/notes — valt onder de aparte
    // verwerkingsregister-/bewaartermijn-backlogitem, niet onder de erasure van déze betrokkene.)
    prisma.leadContact.updateMany({
      where: { createdById: userId },
      data: { body: "[Verwijderd op verzoek van de gebruiker]" },
    }),
    // Privé favorieten-notitie die de betrokkene als CLIENT zelf schreef over een ZZP'er
    // (FavoriteFreelancer.note, vrije tekst — een subjectief oordeel dat de betrokkene identificeert
    // als auteur). De Company wordt geüpdatet (niet verwijderd), dus de onDelete:Cascade op
    // FavoriteFreelancer vuurt niet → expliciet wissen. Gescopet op de eigen bedrijven (company.userId)
    // — nooit de notitie van een andere opdrachtgever.
    prisma.favoriteFreelancer.updateMany({
      where: { company: { userId } },
      data: { note: null },
    }),
    // Push-abonnementen: het endpoint is een persistente toestel-/browser-identifier (en userAgent
    // aanvullende PII). Een `user.update` triggert geen cascade-delete → expliciet verwijderen.
    prisma.pushSubscription.deleteMany({ where: { userId } }),
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
        storage.delete(d.storageKey).catch((err) =>
          // Opslag-opruiming is best-effort; de DB-anonimisering is al definitief. Wél loggen,
          // want dit is het AVG-vergetelheidspad — een achtergebleven bestand moet zichtbaar zijn.
          logStorageCleanupFailure("[gebruikers] AVG", d.storageKey, err),
        ),
      ),
    );
  }

  revalidatePath("/admin/gebruikers");
}
