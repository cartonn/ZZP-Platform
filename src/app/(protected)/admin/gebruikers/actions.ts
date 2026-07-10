"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { auditData } from "@/lib/audit";
import { canModerateUser } from "@/lib/admin";
import { requestMeta } from "@/lib/request-meta";
import { getStorage } from "@/lib/services/storage";
import { logStorageCleanupFailure } from "@/lib/observability/storage-failure";
import {
  AUDIT_PII_REDACTED,
  canAnonymizeUser,
  companyAnonymizationData,
  freelancerProfileAnonymizationData,
  scrubAuditMetadataPii,
  userAnonymizationData,
} from "@/lib/account-anonymization";
import { prisma } from "@/lib/db";
import { userStatusSchema } from "@/lib/enums";
import { DISPUTE_ADMIN_NOTIFICATION_TITLE } from "@/lib/cascade/dispute-commands";

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
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      deletionRequestedAt: true,
      anonymizedAt: true,
    },
  });
  if (!user) throw new Error("Gebruiker niet gevonden.");

  const check = canAnonymizeUser(actor, user);
  if (!check.ok) throw new Error(check.reason);

  // Storage-sleutels vóór de transactie ophalen voor best-effort opruimen ná het wegschrijven.
  // unbounded-allow: account-verwijdering-actie, niet een lijst-view
  const documents = await prisma.document.findMany({
    where: { ownerId: userId },
    select: { storageKey: true },
  });

  // De attributie van een dispuutreden zit niet op de Collaboration-rij maar in het
  // DISPUTE_OPENED-domeinevent (actorId) — net zoals cancellationReason via cancelledById wordt
  // gescopet. Verzamel de samenwerkingen waar déze betrokkene het dispuut opende, zodat we straks
  // alleen zíjn eigen vrije tekst wissen en niet die van de tegenpartij.
  const ownDisputeCollabIds =
    // unbounded-allow: AVG-verwijdering: eigen DISPUTE_OPENED-events van één gebruiker; bewust geen take (alle eigen dispuutredenen moeten gewist worden, een cap zou er stilletjes overslaan)
    (
      await prisma.domainEvent.findMany({
        where: { type: "DISPUTE_OPENED", actorId: userId },
        select: { subjectId: true },
      })
    ).map((e) => e.subjectId);
  // Deep-links van de admin-fanout-notificaties bij deze eigen disputen — nodig om straks exact díe
  // notificaties (die de vrije-tekstreden in hun body dragen) terug te vinden en te redacten.
  const ownDisputeLinks = ownDisputeCollabIds.map((id) => `/samenwerkingen/${id}`);

  // AVG art. 17 dekt óók de auditlog: PII van de betrokkene staat in de metadata van eerdere
  // audit-events (e-mail bij mislukte login/rate-limit/bulk-import; de volledige naam bij
  // `FRANCHISE_FREELANCER_ADDED`, dat óók het e-mailadres als `entityId` bewaart) en overleeft de
  // overschrijving van `User.email`/`User.name`. Bovendien is het IP-adres/user-agent op de eigen
  // auditregels van de betrokkene persoonsgegeven. Zoek elke auditregel die aan deze gebruiker raakt —
  // via actor/entity, via het originele e-mailadres in de metadata, óf via het e-mailadres als
  // `entityId` (franchise-toevoeging) — en redact de PII eruit binnen dezelfde transactie. De
  // exact-match op e-mail/naam voorkomt dat we de auditregel van een ander (die de waarde slechts als
  // substring bevat) raken.
  const originalEmail = user.email;
  const originalName = user.name;
  // unbounded-allow: AVG art. 17: alle auditregels met PII (e-mail/naam/IP, incl. e-mail-als-entityId) van één gebruiker; bewust geen take (een cap zou stilletjes PII laten staan bij de vergetelheid-actie)
  const piiAuditRows = await prisma.auditLog.findMany({
    where: {
      OR: [
        { actorId: userId },
        { entityType: "User", entityId: userId },
        ...(originalEmail
          ? [{ metadata: { contains: originalEmail } }, { entityId: originalEmail }]
          : []),
      ],
    },
    select: {
      id: true,
      actorId: true,
      entityType: true,
      entityId: true,
      metadata: true,
      ipAddress: true,
      userAgent: true,
    },
  });
  const auditScrubOps = piiAuditRows.flatMap((row) => {
    const owned = row.actorId === userId || (row.entityType === "User" && row.entityId === userId);
    // Franchise-toevoeging bewaart het e-mailadres als `entityId`: die rij gaat aantoonbaar over deze
    // betrokkene (e-mail is uniek), dus zowel het adres (entityId) als de naam (metadata) mag weg.
    const entityIsEmail =
      !!originalEmail &&
      typeof row.entityId === "string" &&
      row.entityId.toLowerCase() === originalEmail.toLowerCase();
    // Naam alleen redacten op rijen die aantoonbaar over deze betrokkene gaan (eigen actor/entity of
    // e-mail-als-entityId) — nooit op een rij die zijn adres slechts terloops in de metadata noemt,
    // waar `name` een derde partij kan zijn.
    const piiValues = owned || entityIsEmail ? [originalEmail, originalName] : [originalEmail];
    const scrubbedMeta = scrubAuditMetadataPii(row.metadata, piiValues);
    const metaMatched = scrubbedMeta !== row.metadata;
    // Alleen rijen die echt over deze betrokkene gaan (eigen actor/entity, e-mail-als-entityId) of
    // waar zijn PII in de metadata stond mogen we wissen — nooit de auditregel van een ander.
    if (!owned && !entityIsEmail && !metaMatched) return [];
    const data: {
      metadata?: string | null;
      ipAddress?: null;
      userAgent?: null;
      entityId?: string;
    } = {};
    if (metaMatched) data.metadata = scrubbedMeta;
    if (entityIsEmail) data.entityId = AUDIT_PII_REDACTED;
    if (row.ipAddress !== null) data.ipAddress = null;
    if (row.userAgent !== null) data.userAgent = null;
    if (Object.keys(data).length === 0) return [];
    return [prisma.auditLog.update({ where: { id: row.id }, data })];
  });

  const now = new Date();
  const meta = await requestMeta();
  await prisma.$transaction([
    ...auditScrubOps,
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
    // Werkervaring: rol/organisatie/omschrijving zijn zelf-gerapporteerde vrije tekst die de
    // betrokkene op zijn (publieke) profiel toonde — kan namen/opdrachtgevers/identificerende
    // details bevatten. FreelancerProfile wordt geüpdatet (niet verwijderd), dus de
    // onDelete:Cascade op WorkExperience vuurt niet → expliciet verwijderen. De hele rij is PII van
    // de betrokkene zonder operationele/fiscale bewaargrond (anders dan Invoice/Expense), dus
    // volledig wissen (spiegel credential/document.deleteMany), niet redacten.
    prisma.workExperience.deleteMany({ where: { freelancerProfile: { userId } } }),
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
    // Dezelfde dispuutreden staat óók verbatim in de payload van het DISPUTE_OPENED-domeinevent
    // (`{ reason }`, zie cascade/dispute-commands.ts) — een tweede PII-kopie die de `user.update`
    // niet raakt en die de erasure-code al kent (ze wordt hierboven gelezen om `ownDisputeCollabIds`
    // te bepalen). Zonder deze regel overleeft de vrije tekst art. 17 in de event-store. Gescopet op
    // de eigen events (actorId == de betrokkene); payload → "{}" (spiegelt DISPUTE_RESOLVED, dat al
    // een lege payload schrijft — de reden is het enige veld en is juist de te wissen PII).
    prisma.domainEvent.updateMany({
      where: { type: "DISPUTE_OPENED", actorId: userId },
      data: { payload: "{}" },
    }),
    // Diezelfde reden staat ook verbatim in de metadata van het eigen DISPUTE_OPENED-auditrecord
    // (`{ reason }`, zie cascade/dispute-commands.ts). De generieke `scrubAuditMetadataPii`-pass
    // hierboven redact alleen metadata-velden die exact gelijk zijn aan e-mail/naam — een
    // vrije-tekstreden matcht daar nooit op en overleeft art. 17 dus. Redact 'm expliciet op de eigen
    // dispuut-auditregels (actorId == de betrokkene); DISPUTE_OPENED-metadata draagt enkel `reason`.
    prisma.auditLog.updateMany({
      where: { actorId: userId, action: "DISPUTE_OPENED" },
      data: { metadata: JSON.stringify({ reason: AUDIT_PII_REDACTED }) },
    }),
    // En de derde kopie: de admin-fanout-notificatie zet de reden verbatim in haar body
    // (`Dispuut bij "<opdracht>": <reden>`). Notificaties worden nergens anders aangeraakt, dus zonder
    // deze redactie blijft de vrije tekst herleidbaar bij élke admin. Gescopet op de admin-variant
    // (titel-constante) + de deep-links van de eigen disputen — nooit de generieke, reden-loze
    // tegenpartij-notificatie. (Edge: is dezelfde samenwerking ook door de tegenpartij bedisputeerd,
    // dan valt hun admin-notificatie er ook onder — dat wist méér PII, nooit minder; veilige kant.)
    prisma.notification.updateMany({
      where: {
        type: "DISPUTE_OPENED",
        title: DISPUTE_ADMIN_NOTIFICATION_TITLE,
        link: { in: ownDisputeLinks },
      },
      data: { body: "[Verwijderd op verzoek van de gebruiker]" },
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
