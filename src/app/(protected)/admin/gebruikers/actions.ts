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
import { collaborationsWithActiveDisputeOpenedBy } from "@/lib/dispute-ownership";

export async function setUserStatus(userId: string, target: string): Promise<void> {
  const actor = await requireRole("ADMIN");
  // safeParse (geen throwing .parse): een geknutselde admin-POST met een `target` buiten de enum
  // mag geen onafgevangen ZodError/500 geven, maar een nette domeinfout — spiegelt de hardening
  // in franchise/diensten/actions.ts.
  const parsedStatus = userStatusSchema.safeParse(target);
  if (!parsedStatus.success) throw new Error("Ongeldige accountstatus.");
  const status = parsedStatus.data;

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
      // Bezit de betrokkene nog een vestiging (Tenant.ownerUserId)? De anonimiseringstransactie
      // raakt de tenant niet; anonimiseren met een levende eigen tenant zou de (mogelijk
      // persoonsafgeleide) tenant-naam + owner-verwijzing laten staan (AVG art. 17). De guard
      // weigert dan fail-closed tot de vestiging is overgedragen/gesloten.
      ownedTenant: { select: { id: true } },
    },
  });
  if (!user) throw new Error("Gebruiker niet gevonden.");

  const check = canAnonymizeUser(actor, { ...user, ownsTenant: user.ownedTenant !== null });
  if (!check.ok) throw new Error(check.reason);

  // Storage-sleutels vóór de transactie ophalen voor best-effort opruimen ná het wegschrijven.
  // unbounded-allow: account-verwijdering-actie, niet een lijst-view
  const documents = await prisma.document.findMany({
    where: { ownerId: userId },
    select: { storageKey: true },
  });

  // Ook het bedrijfslogo staat als losse blob in de opslag (Company.logoKey, geüpload via
  // bedrijf/actions.ts — géén Document-rij, dus een tweede, onafhankelijk storage.put-callsite). De
  // anonimiseringstransactie zet `logoKey` op null (companyAnonymizationData) maar raakt het bestand
  // zélf niet; zonder deze fetch+delete blijft de afbeelding — voor een eenmanszaak mogelijk een
  // persoonlijke (pas)foto — als weesblob voor altijd in de opslag staan. Erger nog: zodra `logoKey`
  // genulld is verwijst niets in de DB er meer naar, dus geen enkele latere opruim-sweep kan hem nog
  // vinden → een stil half-voltooide AVG-verwijdering (art. 17). Vóór de transactie ophalen, ná het
  // wegschrijven best-effort wissen (spiegelt de document-opruiming hieronder).
  const companyLogo = await prisma.company.findUnique({
    where: { userId },
    select: { logoKey: true },
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
  // notificaties (die de vrije-tekstreden in hun body dragen) terug te vinden en te redacten. Bewust de
  // BREDE set (alle-tijd eigen disputen): een admin-notificatie met de eigen reden blijft ook na
  // oplossing bestaan en moet gewist worden.
  const ownDisputeLinks = ownDisputeCollabIds.map((id) => `/samenwerkingen/${id}`);
  // De LIVE `Collaboration.disputeReason` is één muteerbaar veld — na oplossing kan de tegenpartij een
  // nieuw dispuut openen op dezelfde samenwerking, waardoor het veld hún reden bevat terwijl de brede
  // set (op oude eigen events) die samenwerking nog steeds bevat. Alleen de samenwerkingen waar de
  // betrokkene het HUIDIGE, nog-open dispuut opende mogen we leegmaken; anders vernietigen we het
  // lopende dispuutbewijs van de tegenpartij. Zie `dispute-ownership.ts`.
  const activeOwnDisputeCollabIds = await collaborationsWithActiveDisputeOpenedBy(prisma, userId);

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

  // AVG art. 17: de credential-rijen worden hard verwijderd (regel 4: de gevoeligste PII), maar hun
  // auditregels overleven dat. De `CREDENTIAL_REJECTED`-regel draagt in `metadata.reason` de door de
  // beheerder getypte, vrije-tekst afwijsreden — die kan de naam of de (mogelijk art. 9-)inhoud van een
  // VOG/diploma noemen. Die regel wordt door de PII-scrub hierboven NIET geraakt: `actorId` is de
  // beheerder (niet de betrokkene) en `entityType` is "Credential" (niet "User"), en de value-scrub
  // matcht alleen op exact e-mail/naam, nooit op een vrije zin. Zelfde patroon als de DISPUTE_OPENED-
  // reden (die via `actorId === userId` wél al werd gedekt). Verzamel daarom de credential-id's vóór de
  // verwijdering en redact de metadata van élke auditregel over die (aan deze betrokkene toebehorende,
  // dus uniek herleidbare) credentials binnen dezelfde transactie. De regel zelf (actor/actie/tijd)
  // blijft als verantwoordingsspoor staan; alleen de PII-dragende metadata verdwijnt.
  // unbounded-allow: AVG art. 17: alle credential-id's van één betrokkene (inherent klein, owner-gescoopt) om hun auditregels te redacten; een take zou stilletjes PII kunnen laten staan
  const ownCredentialIds = (
    await prisma.credential.findMany({
      where: { freelancerProfile: { userId } },
      select: { id: true },
    })
  ).map((c) => c.id);

  // AVG art. 17: de door de ZZP'er ZÉLF getypte creditreden. Wanneer de betrokkene een eigen factuur
  // crediteert (`creditInvoice`, cascade → `planInvoiceCreditedEvent`) schrijft de handler die vrije
  // tekst in DRIE kopieën: `Invoice.rejectionReason` (lifecycleStatus "CREDITED"), de
  // `INVOICE_CREDITED`-auditmetadata (`{ reason }`) én de notificatiebody van BEIDE partijen. De
  // overschrijving van User/profiel raakt geen daarvan. Anders dan de AFKEUR-reden (REJECTED, door de
  // OPDRACHTGEVER over de ZZP'er geschreven — bewust geparkeerd, zelfde kolom) is de credit-reden
  // zelf-geschreven en hoort dus gewist; spiegelt exact de drie-kopie-behandeling van de eigen
  // dispuutreden. Gescopet op de eigen credit-facturen (issuerUserId == de betrokkene, lifecycleStatus
  // "CREDITED"); counterpartyUserId + partyInvoiceNumber reconstrueren straks de exacte
  // tegenpartij-notificatie-body (die notificatie heeft geen deep-link om op te scopen).
  // unbounded-allow: AVG art. 17: alle eigen credit-facturen met reden van één betrokkene; een take zou stilletjes PII laten staan
  const ownCreditedInvoices = await prisma.invoice.findMany({
    where: { issuerUserId: userId, lifecycleStatus: "CREDITED", rejectionReason: { not: null } },
    select: {
      id: true,
      rejectionReason: true,
      partyInvoiceNumber: true,
      counterpartyUserId: true,
    },
  });
  const ownCreditedInvoiceIds = ownCreditedInvoices.map((i) => i.id);

  const now = new Date();
  const meta = await requestMeta();
  await prisma.$transaction([
    ...auditScrubOps,
    ...(ownCredentialIds.length
      ? [
          prisma.auditLog.updateMany({
            where: { entityType: "Credential", entityId: { in: ownCredentialIds } },
            data: { metadata: null },
          }),
        ]
      : []),
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
    // AVG art. 17: de notificaties die de betrokkene zélf ontving dragen vrije tekst met PII in hun
    // body — afwijs-/annulerings-/no-show-/creditredenen en de zelf-getypte certificaattitel (o.a.
    // NO_SHOW_REPORTED — mogelijk een gezondheidsgegeven, art. 9 —, PERFORMANCE_REJECTED,
    // INVOICE_REJECTED, INVOICE_CREDITED, COLLABORATION_STATUS, CREDENTIAL_REJECTED,
    // SHIFT_HANDOFF_REJECTED). Deze kopie leeft alleen op de `Notification`-rij (userId == de
    // betrokkene) en werd tot nu toe nergens geraakt: de `user.update` triggert geen cascade en de
    // enige bestaande notification-redactie hieronder is de DISPUTE_OPENED-admin-fanout in ándermans
    // feed. Na anonimisering is het account SUSPENDED met lege passwordHash en kan het zijn feed nooit
    // meer inzien, dus de body heeft geen operationeel doel meer → onomkeerbaar redacten voor álle
    // eigen notificaties. Robuust: een toekomstig reden-dragend type valt hier automatisch onder. De
    // titel blijft staan (generiek, geen PII).
    prisma.notification.updateMany({
      where: { userId },
      data: { body: "[Verwijderd op verzoek van de gebruiker]" },
    }),
    // AVG art. 17 (recht op verwijdering): álle vrije-tekstvelden die de betrokkene zélf schreef en
    // die PII kunnen bevatten worden onomkeerbaar overschreven. Een `user.update` triggert geen
    // cascade op deze kindrijen, dus ze moeten expliciet mee in de transactie — anders blijft
    // herleidbare PII (naam/adres/telefoon) achter in motivatiebrieven, support-, idee- en
    // beoordelingsteksten. (NoShowReport.reason is door een ándere partij geschreven over de ZZP'er
    // en heeft mogelijk een bewaargrond bij een arbeidsgeschil — bewust niet hier; zie backlog.)
    prisma.application.updateMany({
      where: { freelancer: { userId } },
      // Naast de motivatiebrief draagt ook het vrije-tekst-`availability`-veld (≤200 tekens, bv.
      // "bereikbaar op 06-…, kan per direct starten") door de betrokkene getypte PII → mee wissen.
      data: { motivation: "[Verwijderd op verzoek van de gebruiker]", availability: null },
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
    // Prestatie-vrije-tekst die de ZZP'er zélf schreef bij het indienen van uren/mijlpalen
    // (Performance.description — werkomschrijving die opdrachtgever/locatie/persoonsdetails kan
    // bevatten — en milestoneTitle). De prestatie/urenstaat blijft staan als factuur-/fiscale historie
    // (de afgeleide Invoice draagt een bewaargrond), maar de zelf-getypte tekst moet mee: de
    // Collaboration wordt niet verwijderd, dus de onDelete:Cascade op Performance vuurt niet →
    // expliciet redacten. Spiegelt Application.motivation/AvailabilityWindow.note/ShiftHandoff.reason.
    // description is niet-nullable (@default("")) → neutrale redactiestring; milestoneTitle is nullable
    // → null. rejectionReason is door de OPDRACHTGEVER geschreven over de ZZP'er en heeft mogelijk een
    // bewaargrond bij een facturatie-/urengeschil — bewust niet hier (zie backlog, zoals NoShowReport).
    prisma.performance.updateMany({
      where: { collaboration: { freelancer: { userId } } },
      data: {
        description: "[Verwijderd op verzoek van de gebruiker]",
        milestoneTitle: null,
      },
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
    // anonimisering, dan blijft die tekst anders herleidbaar achter. Gescopet op de samenwerkingen waar
    // de betrokkene het HUIDIGE, nog-open dispuut opende (`activeOwnDisputeCollabIds`) — nooit de reden
    // van de tegenpartij, die na een oplossing+heropening in ditzelfde veld kan staan.
    prisma.collaboration.updateMany({
      where: { id: { in: activeOwnDisputeCollabIds }, disputeReason: { not: null } },
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
    // AVG art. 17 (zie de `ownCreditedInvoices`-toelichting hierboven): de zelf-geschreven creditreden
    // in zijn drie kopieën. (1) De reden op de eigen credit-facturen wissen.
    ...(ownCreditedInvoiceIds.length
      ? [
          prisma.invoice.updateMany({
            where: { id: { in: ownCreditedInvoiceIds } },
            data: { rejectionReason: null },
          }),
          // (2) De reden in de `INVOICE_CREDITED`-auditmetadata van die facturen redacten (de metadata
          // draagt enkel `{ reason }`); actor/actie/tijd blijven als verantwoordingsspoor. Scope op de
          // credit-actie + de eigen factuur-id's raakt nooit een `INVOICE_REJECTED`-regel (tegenpartij).
          prisma.auditLog.updateMany({
            where: {
              action: "INVOICE_CREDITED",
              entityType: "Invoice",
              entityId: { in: ownCreditedInvoiceIds },
            },
            data: { metadata: JSON.stringify({ reason: AUDIT_PII_REDACTED }) },
          }),
        ]
      : []),
    // (3) De tegenpartij (opdrachtgever) ontving een `INVOICE_CREDITED`-notificatie met de reden
    // verbatim in de body. Die notificatie heeft geen deep-link (link = "/facturen"), dus scope op de
    // exacte, deterministisch reconstrueerbare body per credit-factuur (factuurnummer + reden) op de
    // eigen feed van de tegenpartij — zo raken we nooit de credit van een ándere ZZP'er. De eigen kopie
    // van de betrokkene (userId == de betrokkene) is al gedekt door de brede notification.updateMany.
    ...ownCreditedInvoices
      .filter((i) => i.counterpartyUserId)
      .map((i) =>
        prisma.notification.updateMany({
          where: {
            userId: i.counterpartyUserId as string,
            type: "INVOICE_CREDITED",
            body: `Factuur ${i.partyInvoiceNumber ?? "concept"} is gecrediteerd door de ZZP'er. Reden: ${i.rejectionReason}.`,
          },
          data: { body: "[Verwijderd op verzoek van de gebruiker]" },
        }),
      ),
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

  // Bestanden in de opslag opruimen — best-effort, faalt de transactie niet. Naast de gevoelige
  // documenten óók het losse bedrijfslogo (Company.logoKey): dat heeft geen Document-rij en zou
  // anders als weesblob achterblijven (AVG art. 17, zie de fetch hierboven).
  const storageKeysToDelete = [
    ...documents.map((d) => d.storageKey),
    ...(companyLogo?.logoKey ? [companyLogo.logoKey] : []),
  ];
  if (storageKeysToDelete.length > 0) {
    const storage = getStorage();
    await Promise.all(
      storageKeysToDelete.map((key) =>
        storage.delete(key).catch((err) =>
          // Opslag-opruiming is best-effort; de DB-anonimisering is al definitief. Wél loggen,
          // want dit is het AVG-vergetelheidspad — een achtergebleven bestand moet zichtbaar zijn.
          logStorageCleanupFailure("[gebruikers] AVG", key, err),
        ),
      ),
    );
  }

  revalidatePath("/admin/gebruikers");
}
