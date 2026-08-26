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
import { NO_SHOW_REASON_REDACTED, noShowReportedNotificationBody } from "@/lib/no-show";
import { messageNotificationBody } from "@/lib/messaging";
import { ideaCommentNotificationTitle, ideaStatusNotificationTitle } from "@/lib/ideas";
import { shiftHandoffRejectedNotificationBody } from "@/lib/shift-handoff";
import {
  invoiceRejectedNotificationBody,
  performanceRejectedNotificationBody,
  collaborationCancelledNotificationBody,
} from "@/lib/cascade/notification-bodies";

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

  // Aantal documenten vóór de transactie — enkel voor de audit-metadata (intentiegetal). De
  // wérkelijke verwijdering (rij + blob) gebeurt PAS ná de transactie, race-vrij: op dat punt is het
  // account al SUSPENDED/geanonimiseerd (userAnonymizationData) en kan de betrokkene niets meer
  // uploaden, dus de dan-gelezen storagesleutels dekken exact de te wissen rijen. Zie onder (CWE-367).
  const documentCount = await prisma.document.count({ where: { ownerId: userId } });

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

  // AVG art. 17: de door de betrokkene ingediende ideeën blijven als geanonimiseerd record op het
  // bord staan, maar naast titel/omschrijving draagt óók `Idea.declineReason` — de vrije tekst die
  // een beheerder bij het afwijzen typte — herleidbare informatie. De AVG-data-export
  // (`account-export.ts`) toont dit veld expliciet aan de betrokkene als deel van zijn inzage
  // (art. 15), dus moet de erasure het spiegelbeeldig kunnen wissen (art. 17). Die reden staat in
  // twee kopieën: op de Idea-rij (in de idea.updateMany hieronder → `declineReason: null`) én
  // verbatim in de metadata (`{ ..., reason }`) van het `IDEA_STATUS_SET`-auditrecord. De generieke
  // email/naam-scrub raakt vrije tekst niet en dat auditrecord heeft `actorId` = beheerder +
  // `entityType` = "Idea" (nooit de eigen actor/entity van de betrokkene), dus overleeft de reden
  // art. 17. Verzamel daarom de eigen idee-id's, lees hun IDEA_STATUS_SET-auditregels en redact
  // alleen de `reason`-sleutel — `from`/`to` (de statusovergang, geen PII) blijven als
  // verantwoordingsspoor staan (spiegelt de per-rij scrub-mechaniek van `auditScrubOps` hierboven).
  // unbounded-allow: AVG art. 17: alle eigen ideeën van één betrokkene om hun status-auditregels én
  // hun (naar ándermans feed gekopieerde) notificatietitels te redacten; een take zou stilletjes PII laten staan
  const ownIdeas = await prisma.idea.findMany({
    where: { authorId: userId },
    select: { id: true, title: true },
  });
  const ownIdeaIds = ownIdeas.map((i) => i.id);
  // AVG art. 17: de idee-titel (door de betrokkene geschreven vrije tekst) is verbatim in de TITEL van
  // de IDEA_STATUS-/IDEA_COMMENT-notificaties gekopieerd — óók naar de feeds van ándere gebruikers
  // (stemmers/reageerders, `userId != de betrokkene`). De brede `notification.updateMany({ where:
  // { userId } })` hieronder raakt alleen de EIGEN feed van de betrokkene én enkel de body; deze
  // titel-kopie op ándermans feed werd nergens geraakt, overleefde art. 17 en werd bovendien via
  // `account-export.ts` (dat `Notification.title` prijsgeeft) aan die andere gebruiker getoond. Redact
  // de exact reconstrueerde titels (gedeelde helpers → geen drift met de bron in `ideeen/actions.ts`).
  // Gescopet op de twee idee-notificatietypes + de exacte titel-strings; een toevallige titel-collisie
  // met het idee van een ánder wist méér PII, nooit minder (veilige kant, spiegelt de dispuut-/credit-scrub).
  const ideaNotificationTitles = ownIdeas.flatMap((i) => [
    ideaStatusNotificationTitle(i.title),
    ideaCommentNotificationTitle(i.title),
  ]);
  const ideaTitleNotificationScrubOps = ideaNotificationTitles.length
    ? [
        prisma.notification.updateMany({
          where: {
            type: { in: ["IDEA_STATUS", "IDEA_COMMENT"] },
            title: { in: ideaNotificationTitles },
          },
          data: { title: "[Verwijderd op verzoek van de gebruiker]" },
        }),
      ]
    : [];
  const ideaStatusAuditScrubOps = ownIdeaIds.length
    ? // unbounded-allow: AVG art. 17: alle IDEA_STATUS_SET-auditregels van de eigen ideeën; een take zou stilletjes PII laten staan
      (
        await prisma.auditLog.findMany({
          where: { action: "IDEA_STATUS_SET", entityType: "Idea", entityId: { in: ownIdeaIds } },
          select: { id: true, metadata: true },
        })
      ).flatMap((row) => {
        if (!row.metadata) return [];
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(row.metadata) as Record<string, unknown>;
        } catch {
          return [];
        }
        // Alleen de afwijs-regels dragen een vrije-tekstreden; niet-afwijs-overgangen ({ from, to })
        // blijven ongemoeid zodat we geen loze `reason`-sleutel toevoegen of from/to weggooien.
        if (!("reason" in parsed)) return [];
        return [
          prisma.auditLog.update({
            where: { id: row.id },
            data: { metadata: JSON.stringify({ ...parsed, reason: AUDIT_PII_REDACTED }) },
          }),
        ];
      })
    : [];

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

  // AVG art. 17: de door de OPDRACHTGEVER (counterparty) ZÉLF getypte AFKEUR-reden bij een factuur.
  // `rejectInvoice` (cascade → `planInvoiceRejectedEvent`) — enkel de opdrachtgever mag afkeuren
  // (`actor.id === inv.counterpartyUserId`) — schrijft die vrije tekst in DRIE kopieën:
  // `Invoice.rejectionReason` (lifecycleStatus "REJECTED"), de `INVOICE_REJECTED`-auditmetadata
  // (`{ reason }`) én de body van de `INVOICE_REJECTED`-notificatie op de feed van de ZZP'er
  // (`issuerUserId`, een ándere gebruiker dan de schrijver). Spiegelbeeld van `ownCreditedInvoices`:
  // dáár is de reden door de ZZP'er (issuer) geschreven en wordt hij gewist bij diens erasure; hier is
  // de reden door de OPDRACHTGEVER geschreven en moet hij gewist worden bij díens erasure. Dezelfde
  // `rejectionReason`-kolom, maar strikt gescheiden via `lifecycleStatus` + de eigenaars-scope, zodat we
  // nooit een reden van de tegenpartij raken. Gescopet op de eigen afgekeurde facturen
  // (counterpartyUserId == de betrokkene, REJECTED); `issuerUserId` reconstrueert straks de exacte
  // ZZP'er-notificatie-body (die notificatie heeft geen deep-link om op te scopen).
  // unbounded-allow: AVG art. 17: alle eigen afgekeurde facturen met reden van één betrokkene; een take zou stilletjes PII laten staan
  const ownRejectedInvoices = await prisma.invoice.findMany({
    where: {
      counterpartyUserId: userId,
      lifecycleStatus: "REJECTED",
      rejectionReason: { not: null },
    },
    select: { id: true, rejectionReason: true, issuerUserId: true },
  });
  const ownRejectedInvoiceIds = ownRejectedInvoices.map((i) => i.id);

  // AVG art. 17: de door de OPDRACHTGEVER ZÉLF getypte AFKEUR-reden bij een prestatie/urenstaat.
  // `rejectPerformance` (cascade → `planPerformanceRejectedEvent`) — enkel de opdrachtgever mag afkeuren
  // (`actor.id === perf.clientUserId`) — schrijft die vrije tekst in DRIE kopieën: `Performance.
  // rejectionReason` (status "REJECTED"), de `PERFORMANCE_REJECTED`-auditmetadata (`{ reason }`) én de
  // body van de `PERFORMANCE_REJECTED`-notificatie op de ZZP'er-feed (`collaboration.freelancer.userId`,
  // een ándere gebruiker dan de schrijver). De erasure van de ZZP'er redact al `Performance.description`/
  // `milestoneTitle` (zelf-geschreven), maar bewust NIET `rejectionReason` (door de tegenpartij
  // geschreven, mogelijke geschil-bewaargrond) — dus die reden hoort bij de erasure van de OPDRACHTGEVER
  // (de auteur). Gescopet op de eigen bedrijfsprestaties (collaboration.company.userId == de betrokkene,
  // REJECTED); de ZZP'er-userId reconstrueert straks de exacte notificatie-body.
  // unbounded-allow: AVG art. 17: alle eigen afgekeurde prestaties met reden van één betrokkene; een take zou stilletjes PII laten staan
  const ownRejectedPerformances = await prisma.performance.findMany({
    where: {
      status: "REJECTED",
      rejectionReason: { not: null },
      collaboration: { company: { userId } },
    },
    select: {
      id: true,
      rejectionReason: true,
      collaboration: { select: { freelancer: { select: { userId: true } } } },
    },
  });
  const ownRejectedPerformanceIds = ownRejectedPerformances.map((p) => p.id);

  // AVG art. 17: de door de MÉLDER (opdrachtgever/franchiser) ZÉLF getypte no-show-reden. `reportNoShow`
  // schrijft die vrije tekst in TWEE kopieën: (1) `NoShowReport.reason` en (2) verbatim in de body van de
  // `NO_SHOW_REPORTED`-notificatie op de feed van de gemelde ZZP'er (`Reden: <reden>`). De AVG-data-export
  // (`account-export.ts`, `reportedById == actor`) erkent dit veld expliciet als de EIGEN PII van de melder
  // onder art. 15/20 — dus moet de erasure het spiegelbeeldig wissen wanneer de melder wordt verwijderd. De
  // overschrijving van User/profiel raakt geen van beide kopieën. (De AFWEZIGHEID van deze redactie bij de
  // erasure van de gemélde ZZP'er blijft correct: dan is de reden door een ándere partij over de ZZP'er
  // geschreven — enkel bij de MÉLDER is het eigen PII. Spiegelt de dispuut-/credit-drie-kopie-behandeling.)
  // De notificatie heeft een deep-link naar de samenwerking, maar meerdere no-show-notificaties kunnen naar
  // dezelfde samenwerking wijzen (per dag één) → scope op de exacte, deterministisch reconstrueerbare body
  // (opdrachttitel + datum + reden via de gedeelde `noShowReportedNotificationBody`), zodat we nooit de
  // no-show-notificatie van een ándere melder op diezelfde feed raken.
  // unbounded-allow: AVG art. 17: alle eigen no-show-meldingen met reden van één betrokkene; een take zou stilletjes PII laten staan
  const ownNoShowReports = await prisma.noShowReport.findMany({
    where: { reportedById: userId, reason: { not: NO_SHOW_REASON_REDACTED } },
    select: {
      id: true,
      reason: true,
      occurredOn: true,
      collaboration: {
        select: { freelancer: { select: { userId: true } }, job: { select: { title: true } } },
      },
    },
  });
  const ownNoShowReportIds = ownNoShowReports.map((r) => r.id);

  // AVG art. 17: de door de BESLISSER (FRANCHISER/ADMIN) zélf getypte afwijsreden bij een shift-overname.
  // `rejectShiftHandoff` schrijft die vrije tekst in TWEE kopieën: (1) `ShiftHandoff.decisionNote` en
  // (2) verbatim in de body van de `SHIFT_HANDOFF_REJECTED`-notificatie — die op de feed van de
  // AANVRAGER (`requestedByUserId`) landt, een ÁNDERE gebruiker dan de beslisser. De generieke
  // eigen-feed-wipe (`notification.updateMany({ where: { userId } })`) raakt alleen de notificaties die
  // de betrokkene zélf ontving en dekt deze kopie dus NIET wanneer de betrokkene de beslisser is. Zonder
  // deze reconstruct-en-redact overleeft de zelf-geschreven reden art. 17 op andermans feed (en in diens
  // eigen inzage-export, die `Notification.body` prijsgeeft). Spiegelt de no-show-/credit-drie-kopie-
  // behandeling: scope op de exacte, deterministisch reconstrueerbare body zodat we nooit de afwijzing
  // van een ándere beslisser op diezelfde feed raken.
  // unbounded-allow: AVG art. 17: alle eigen afgewezen-handoff-beslissingen met reden van één betrokkene; een take zou stilletjes PII laten staan
  const ownDecidedRejectedHandoffs = await prisma.shiftHandoff.findMany({
    where: { decidedByUserId: userId, status: "REJECTED", decisionNote: { not: null } },
    select: {
      requestedByUserId: true,
      decisionNote: true,
      collaboration: { select: { job: { select: { title: true } } } },
    },
  });

  // AVG art. 17: de door de ANNULEERDER zélf getypte annuleerreden bij een samenwerking.
  // `changeCollaborationStatus` (annulering is symmetrisch — de annuleerder kan de opdrachtgever óf de
  // ZZP'er zijn, reden verplicht) schrijft die vrije tekst in DRIE kopieën: (1) `Collaboration.
  // cancellationReason`, (2) de `COLLABORATION_STATUS_CHANGED`-auditmetadata (`{ from, to, reason,
  // chargeable }`) én (3) verbatim in de body van de `COLLABORATION_STATUS`-notificatie op de feed van
  // de TEGENPARTIJ (`otherUserId`, een ándere gebruiker dan de annuleerder). Kopie 1 werd al gewist
  // (`collaboration.updateMany({ cancelledById: userId })` in de transactie), maar kopie 2 en 3 werden
  // nergens geraakt: de generieke `scrubAuditMetadataPii`-pass matcht een vrije-tekstreden nooit, en de
  // brede eigen-feed-wipe (`notification.updateMany({ where: { userId } })`) raakt alleen de EIGEN feed
  // van de betrokkene — niet de kopie op de tegenpartij-feed. Zonder deze reconstruct-en-redact overleeft
  // de zelf-getypte reden (mogelijk art. 9 — bv. een ziekte-reden) art. 17 op andermans feed, in diens
  // AVG-inzage-export (`account-export.ts` geeft `Notification.body` prijs) én in het auditlogboek.
  // Spiegelt exact de `ownRejectedInvoices`/`ownRejectedPerformances`-drie-kopie-behandeling. Snapshot
  // vóór de transactie; `company.userId`/`freelancer.userId` reconstrueren de tegenpartij (de partij ≠
  // de annuleerder) en de exacte, deterministische body (via de gedeelde
  // `collaborationCancelledNotificationBody`, geen deep-link om op te scopen).
  // unbounded-allow: AVG art. 17: alle eigen geannuleerde samenwerkingen met reden van één betrokkene; een take zou stilletjes PII-kopieën laten staan
  const ownCancelledCollaborations = await prisma.collaboration.findMany({
    where: { cancelledById: userId, cancellationReason: { not: null } },
    select: {
      id: true,
      cancellationReason: true,
      cancellationChargeable: true,
      company: { select: { userId: true } },
      freelancer: { select: { userId: true } },
    },
  });
  const ownCancelledCollaborationIds = ownCancelledCollaborations.map((c) => c.id);
  // (2) De reden in de `COLLABORATION_STATUS_CHANGED`-auditmetadata redacten. Anders dan de
  // INVOICE_REJECTED-metadata draagt deze méér dan `{ reason }` (`{ from, to, chargeable }` is het
  // verantwoordingsspoor van de statusovergang, geen PII) → parse-en-patch alleen de `reason`-sleutel,
  // exact zoals `ideaStatusAuditScrubOps`. Alleen annuleer-regels dragen een `reason`; een gewone
  // statuswijziging ({ from, to }) blijft ongemoeid.
  const collabCancelAuditScrubOps = ownCancelledCollaborationIds.length
    ? // unbounded-allow: AVG art. 17: alle annuleer-auditregels van de eigen samenwerkingen; een take zou stilletjes PII laten staan
      (
        await prisma.auditLog.findMany({
          where: {
            action: "COLLABORATION_STATUS_CHANGED",
            entityType: "Collaboration",
            entityId: { in: ownCancelledCollaborationIds },
          },
          select: { id: true, metadata: true },
        })
      ).flatMap((row) => {
        if (!row.metadata) return [];
        let parsed: Record<string, unknown>;
        try {
          parsed = JSON.parse(row.metadata) as Record<string, unknown>;
        } catch {
          return [];
        }
        if (!("reason" in parsed)) return [];
        return [
          prisma.auditLog.update({
            where: { id: row.id },
            data: { metadata: JSON.stringify({ ...parsed, reason: AUDIT_PII_REDACTED }) },
          }),
        ];
      })
    : [];

  // AVG art. 17: elk door de betrokkene VERZONDEN bericht is óók verbatim (≤120 tekens) naar de body
  // van de MESSAGE-notificatie op de feed van de ONTVANGER gekopieerd (`sendMessage` in
  // `berichten/actions.ts`, via `messageNotificationBody`). Die kopie leeft op andermans
  // `Notification`-rij (userId == ontvanger) en wordt dus NIET geraakt door de brede eigen-feed-wipe
  // in de transactie (die alleen `userId == betrokkene` matcht) — noch door de `Message.body`-redactie
  // (andere tabel). Zonder deze redactie overleeft de vrije berichttekst (telefoon/adres/mogelijke
  // gezondheidsdetails) art. 17 op de ontvangersfeed én in diens AVG-inzage-export
  // (`account-export.ts` geeft `Notification.body` onvoorwaardelijk prijs). Spiegelt de no-show-/
  // handoff-/dispuut-drie-kopie-behandeling. Snapshot vóór de transactie (dus vóór de
  // `Message.body`-redactie), zodat we de originele tekst nog kunnen reconstrueren; de exacte match
  // (type + gespreks-deep-link + body-slice) raakt nooit een bericht van een ándere afzender.
  // unbounded-allow: AVG art. 17: alle eigen verzonden berichten van één betrokkene; een take zou stilletjes PII-kopieën laten staan
  const ownSentMessages = await prisma.message.findMany({
    where: { senderId: userId },
    select: { conversationId: true, body: true },
  });
  const ownMessageNotificationCopies = Array.from(
    new Map(
      ownSentMessages.map((m) => {
        const body = messageNotificationBody(m.body);
        return [`${m.conversationId} ${body}`, { conversationId: m.conversationId, body }];
      }),
    ).values(),
  );

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
    // NB: de document-rijen worden bewust NIET hier verwijderd, maar race-vrij ná de transactie
    // (zie onder, CWE-367/art. 17). Credential → Document is `onDelete: SetNull`, dus het verwijderen
    // van de credentials hierboven blijft correct terwijl de documenten nog even bestaan.
    // AVG: verzonden berichten blijven als gespreksgeschiedenis bestaan, maar de vrije tekst kan
    // PII bevatten (naam/adres/telefoon) → redacten zodat de betrokkene niet meer herleidbaar is.
    prisma.message.updateMany({
      where: { senderId: userId },
      data: { body: "[Bericht verwijderd op verzoek van de gebruiker]" },
    }),
    // AVG art. 17: de notificaties die de betrokkene zélf ONTVING dragen vrije tekst met PII in hun
    // body — afwijs-/annulerings-/no-show-/creditredenen en de zelf-getypte certificaattitel (o.a.
    // NO_SHOW_REPORTED — mogelijk een gezondheidsgegeven, art. 9 —, PERFORMANCE_REJECTED,
    // INVOICE_REJECTED, INVOICE_CREDITED, COLLABORATION_STATUS, CREDENTIAL_REJECTED). Deze kopieën leven
    // op de eigen `Notification`-rij (userId == de betrokkene) en werden tot nu toe nergens geraakt: de
    // `user.update` triggert geen cascade en de enige andere notification-redactie is de
    // DISPUTE_OPENED-admin-fanout in ándermans feed. Na anonimisering is het account SUSPENDED met lege
    // passwordHash en kan het zijn feed nooit meer inzien, dus de body heeft geen operationeel doel meer
    // → onomkeerbaar redacten voor álle eigen notificaties. Robuust: een toekomstig reden-dragend type
    // dat de betrokkene ONTVANGT valt hier automatisch onder. De titel blijft staan (generiek, geen PII).
    // (NB — SHIFT_HANDOFF_REJECTED en de annuleer-variant van COLLABORATION_STATUS vallen hier NIET
    // onder wanneer de betrokkene de AUTEUR is: die notificatie landt op de feed van de TEGENPARTIJ
    // (aanvrager resp. de andere samenwerkingspartij), terwijl de vrije tekst door de betrokkene zélf
    // is geschreven. Die kopie wordt daarom apart, per gereconstrueerde body, geredact via
    // `ownDecidedRejectedHandoffs` resp. `ownCancelledCollaborations` in de transactie. De EIGEN-feed-
    // kopie van een COLLABORATION_STATUS-annulering die de betrokkene ONTVING als tegenpartij valt wél
    // gewoon onder deze brede wipe.)
    // AVG art. 17: naast de body wordt óók `readAt` gewist. Dat is een door de betrokkene zélf gezette
    // gedrags-/engagement-timestamp (het exacte moment waarop hij een melding las) die na anonimisering
    // toewijsbaar blijft aan de (hernoemde, maar identieke) `User.id` — dezelfde residuele-gedragsmetadata-
    // klasse die we al dichtten voor `User.lastLoginAt`/`previousLoginAt` en `ConversationParticipant.
    // lastReadAt`. De export (`account-export.ts`) gaf `readAt` al prijs; deze erasure maakt dat symmetrisch.
    prisma.notification.updateMany({
      where: { userId },
      data: { body: "[Verwijderd op verzoek van de gebruiker]", readAt: null },
    }),
    // AVG art. 17 (tweede kopie): de verbatim berichttekst in de MESSAGE-notificatie op de feed van
    // de ONTVANGER (userId == ontvanger, dus buiten de eigen-feed-wipe hierboven). Per uniek
    // (gesprek, body-slice) gereconstrueerd uit `ownSentMessages` (snapshot vóór deze transactie).
    // De match op type + exacte deep-link + exacte body-slice is precies genoeg om nooit een bericht
    // van een ándere afzender in hetzelfde gesprek te raken; matcht toevallig ook de kopie op de eigen
    // feed (al geredact hierboven) — idempotent, wist nooit minder. Titel ("Nieuw bericht") is
    // generiek en blijft staan.
    ...ownMessageNotificationCopies.map((c) =>
      prisma.notification.updateMany({
        where: { type: "MESSAGE", link: `/berichten/${c.conversationId}`, body: c.body },
        data: { body: "[Bericht verwijderd op verzoek van de gebruiker]" },
      }),
    ),
    // AVG art. 17 (recht op verwijdering): álle vrije-tekstvelden die de betrokkene zélf schreef en
    // die PII kunnen bevatten worden onomkeerbaar overschreven. Een `user.update` triggert geen
    // cascade op deze kindrijen, dus ze moeten expliciet mee in de transactie — anders blijft
    // herleidbare PII (naam/adres/telefoon) achter in motivatiebrieven, support-, idee- en
    // beoordelingsteksten. (NoShowReport.reason wordt bij de erasure van de MÉLDER wél gewist — die
    // schreef de reden zelf; zie de `ownNoShowReports`-behandeling hieronder. Bij de erasure van de
    // gemélde ZZP'er blijft de reden juist staan: dan is het door een ándere partij geschreven.)
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
    // Beschikbaarheidsvensters: naast de vrije-tekst-`note` (reden/medische details, bv. "ziek") is óók
    // de rest van de rij — `startDate`/`endDate`/`type`/`hoursPerWeek` — de eigen agenda-/gezondheids-
    // historie van de betrokkene (een patroon van UNAVAILABLE-vensters kan omstandigheden prijsgeven),
    // gekoppeld aan de behouden `FreelancerProfile.id`. FreelancerProfile wordt geüpdatet (niet
    // verwijderd), dus de onDelete:Cascade op AvailabilityWindow vuurt niet. De rij heeft geen
    // tegenpartij-/fiscale bewaargrond (anders dan Invoice/Expense/Performance) → volledig wissen
    // (spiegel WorkExperience/SavedJob), niet enkel de note redacten. Eerdere ronde dekte alleen `note`
    // (AVG art. 17: residuele gedragsmetadata mocht niet blijven staan).
    prisma.availabilityWindow.deleteMany({ where: { freelancerProfile: { userId } } }),
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
    // → null. rejectionReason is door de OPDRACHTGEVER geschreven over de ZZP'er en blijft hier bewust
    // staan (mogelijke geschil-bewaargrond, geen PII van de ZZP'er); die reden wordt bij de erasure van
    // de OPDRACHTGEVER — de auteur — gewist via `ownRejectedPerformances` onderaan de transactie.
    prisma.performance.updateMany({
      where: { collaboration: { freelancer: { userId } } },
      data: {
        description: "[Verwijderd op verzoek van de gebruiker]",
        milestoneTitle: null,
      },
    }),
    // Zakelijke uitgaven (kostenregistratie): `Expense.description` is zelf-getypte vrije tekst die de
    // ZZP'er bij een aftrekbare uitgave schreef — kan een opdrachtgever/locatie/persoon benoemen. De
    // AVG-data-export (`account-export.ts`) erkent dit veld expliciet als eigen PII onder art. 15/20;
    // de erasure moet het dan óók wissen (spiegel van die inzage). De Expense-rij zelf blijft staan als
    // fiscale bewaargrond (bedrag/btw/datum/categorie — net als Invoice/IndirectHoursEntry/Performance),
    // dus non-nullable `description` → neutrale redactiestring, niet de rij verwijderen. Gescopet op de
    // eigen uitgaven (userId == de betrokkene). Spiegelt Performance.description / Application.motivation.
    //
    // NB (AVG art. 17(3)(b) — bewust NIET geraakt): `TaxFilingRequest` blijft volledig staan. De rij
    // draagt geen door de betrokkene getypte vrije tekst (`partnerName` = de naam van het belastingkantoor,
    // `mandateKind` is een enum) en valt onder de fiscale bewaarplicht (7 jaar, art. 52 AWR) die het
    // verwerkingsregister (`lib/compliance/processing-register.ts`) als grondslag registreert — dezelfde
    // grond die ook de Invoice-/Expense-/Performance-kernvelden bewaart. De inzage-export
    // (`account-export.ts`) toont `taxFilingRequests` wél (art. 15/20); die asymmetrie is hier bewust en
    // rechtmatig. Expliciet gedocumenteerd zodat een volgende pass de rij niet per abuis wist of de stilte
    // als een omissie leest.
    prisma.expense.updateMany({
      where: { userId },
      data: { description: "[Verwijderd op verzoek van de gebruiker]" },
    }),
    // Factuurregel-omschrijvingen (InvoiceLine.description): vrije tekst die de ZZP'er (uitschrijver)
    // zélf typte op een handmatige/cascade-factuur — kan opdrachtgever/locatie/persoonsdetails bevatten
    // ("Werkzaamheden bij mevr. De Vries, Julianalaan 12"). De Invoice-rij blijft staan als fiscale
    // bewaargrond (bedrag/btw/nummer/datum — net als Expense/Performance/IndirectHoursEntry), maar de
    // zelf-getypte omschrijving moet mee: de factuur wordt niet verwijderd, dus de onDelete:Cascade op
    // InvoiceLine vuurt niet → expliciet redacten. Spiegelt exact Performance.description /
    // Expense.description. Gescopet op de EIGEN facturen van de ZZP'er (issuerUserId == de betrokkene
    // voor cascade-facturen, óf de samenwerking-freelancer-link voor legacy loose-facturen zonder
    // issuerUserId). description is non-nullable → neutrale redactiestring. Een opdrachtgever die enkel
    // tegenpartij is (counterpartyUserId) schrijft deze tekst niet, dus die scope blijft er bewust uit.
    prisma.invoiceLine.updateMany({
      where: {
        invoice: {
          OR: [{ issuerUserId: userId }, { collaboration: { freelancer: { userId } } }],
        },
      },
      data: { description: "[Verwijderd op verzoek van de gebruiker]" },
    }),
    // Eigen ideeën: titel + omschrijving zijn door de betrokkene geschreven vrije tekst (PII-risico);
    // het idee blijft als geanonimiseerd record op het bord staan. `declineReason` (de vrije tekst
    // die een beheerder bij het afwijzen schreef) wordt door de AVG-inzage aan de betrokkene getoond
    // (`account-export.ts`) en moet daarom óók erasbaar zijn — mee wissen (art. 17). De tweede kopie
    // in de IDEA_STATUS_SET-auditmetadata wordt via `ideaStatusAuditScrubOps` hierboven geredact.
    ...ideaStatusAuditScrubOps,
    // De idee-titel is óók naar de notificatietitels op ándermans feed gekopieerd (stemmers/reageerders);
    // die kopie wist de brede notification-scrub niet. Zie de opbouw van `ideaTitleNotificationScrubOps`.
    ...ideaTitleNotificationScrubOps,
    prisma.idea.updateMany({
      where: { authorId: userId },
      data: {
        title: "[Verwijderd op verzoek van de gebruiker]",
        description: "[Verwijderd op verzoek van de gebruiker]",
        declineReason: null,
      },
    }),
    // Annuleerreden die de betrokkene zélf schreef (cancelledById == userId), in drie kopieën (zie de
    // `ownCancelledCollaborations`-toelichting hierboven). (1) De reden op de eigen geannuleerde
    // samenwerkingen wissen. Alleen de eigen tekst — een door de tegenpartij geschreven reden blijft
    // (die valt onder diens eigen verwerking).
    prisma.collaboration.updateMany({
      where: { cancelledById: userId },
      data: { cancellationReason: null },
    }),
    // (2) De reden in de `COLLABORATION_STATUS_CHANGED`-auditmetadata redacten (parse-en-patch: enkel de
    // `reason`-sleutel; from/to/chargeable blijven als verantwoordingsspoor).
    ...collabCancelAuditScrubOps,
    // (3) De tegenpartij ontving een `COLLABORATION_STATUS`-notificatie met de reden verbatim in de body
    // (link = "/samenwerkingen", geen deep-link). Reconstrueer die body deterministisch via de gedeelde
    // `collaborationCancelledNotificationBody` en redact precies díe notificatie op de tegenpartij-feed
    // (de partij ≠ de annuleerder) — nooit de annulering van een ándere gebruiker.
    ...ownCancelledCollaborations
      .map((c) => ({
        counterpartyUserId: c.company.userId === userId ? c.freelancer.userId : c.company.userId,
        reason: c.cancellationReason,
        chargeable: c.cancellationChargeable,
      }))
      .filter((c) => c.counterpartyUserId && c.reason)
      .map((c) =>
        prisma.notification.updateMany({
          where: {
            userId: c.counterpartyUserId as string,
            type: "COLLABORATION_STATUS",
            body: collaborationCancelledNotificationBody(c.reason as string, c.chargeable),
          },
          data: { body: "[Verwijderd op verzoek van de gebruiker]" },
        }),
      ),
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
    // AVG art. 17 — de eigen favorieten die de betrokkene als CLIENT bijhield (`FavoriteFreelancer`):
    // niet alleen de privé-notitie (vrije tekst, een subjectief oordeel dat de auteur identificeert),
    // maar de héle rij — welke ZZP'ers de nu-verwijderde opdrachtgever bookmarkte en wanneer
    // (`createdAt`) — is zíjn eigen gedragsmetadata zonder tegenpartij-waarde (de ZZP'er ziet deze
    // privé-bookmark nooit). De Company wordt geüpdatet (niet verwijderd), dus de onDelete:Cascade op
    // FavoriteFreelancer vuurt niet → expliciet wissen (hard delete i.p.v. enkel de notitie redacten,
    // zodat geen relatie+timestamp achterblijft). Spiegelbeeld van de `SavedJob`-wis aan de ZZP-kant.
    // Gescopet op de eigen bedrijven (company.userId) — nooit een favoriet van een andere opdrachtgever.
    prisma.favoriteFreelancer.deleteMany({
      where: { company: { userId } },
    }),
    // Push-abonnementen: het endpoint is een persistente toestel-/browser-identifier (en userAgent
    // aanvullende PII). Een `user.update` triggert geen cascade-delete → expliciet verwijderen.
    prisma.pushSubscription.deleteMany({ where: { userId } }),
    // AVG art. 17 — leesbevestigingen (`ConversationParticipant.lastReadAt`). Dit is gedragsmetadata
    // óver de betrokkene: de tegenpartij ziet aan de "Gezien"-markering (afgeleid uit dit veld) wanneer
    // de betrokkene voor het laatst las. Zonder wissen overleeft die frozen leesstaat de erasure en
    // blijft toewijsbaar aan het verwijderde individu. De ConversationParticipant-rij zelf blijft staan
    // (de gesprekshistorie/berichten van de tegenpartij blijven intact), maar het tijdstip → null, net
    // zoals push-abonnementen als toestel-/gedragsmetadata worden gewist. Gescopet op `userId`.
    prisma.conversationParticipant.updateMany({
      where: { userId },
      data: { lastReadAt: null },
    }),
    // AVG art. 17 — engagement-/gedragsmetadata die de betrokkene zelf genereerde: welke lessen hij
    // afrondde (`LessonCompletion`) en op welke ideeën hij stemde (`IdeaVote`), telkens mét het exacte
    // tijdstip (`completedAt`/`createdAt`). Beide rijen dragen uitsluitend zíjn `userId` + een
    // zelf-actie-timestamp — er zit geen gedeelde/tegenpartij-waarde in — dus ze horen volledig te
    // verdwijnen, net als `workExperience`/`pushSubscription` (rij = enkel persoonlijke data → hard
    // delete i.p.v. redact). Het schema markeert ze al als wegwerpbaar (`onDelete: Cascade` vanaf zowel
    // User als Idea/Lesson). Een `user.update` triggert geen cascade → expliciet verwijderen. Zonder dit
    // overleeft toewijsbare gedragsmetadata (wat las/stemde deze persoon, en wanneer) een art. 17-verzoek.
    // Spiegelbeeld: de export (`account-export.ts`) geeft deze twee nu óók prijs (art. 15/20-symmetrie).
    prisma.lessonCompletion.deleteMany({ where: { userId } }),
    prisma.ideaVote.deleteMany({ where: { userId } }),
    // AVG art. 17 — de eigen opgeslagen opdrachten (`SavedJob`): welke vacatures de betrokkene als
    // ZZP'er bewaarde en wanneer (`createdAt`). Spiegelbeeld van `FavoriteFreelancer` aan de
    // opdrachtgeverskant. De rij draagt uitsluitend zíjn `freelancerProfileId` + een zelf-actie-
    // timestamp — geen gedeelde/tegenpartij-waarde — dus hoort volledig te verdwijnen (hard delete),
    // net als `lessonCompletion`/`ideaVote`. Het `FreelancerProfile` wordt geüpdatet (niet verwijderd),
    // dus de `onDelete: Cascade` op `SavedJob.freelancerProfileId` vuurt niet → expliciet wissen.
    // Gescopet op het eigen profiel (`freelancer.userId`), nooit de bookmarks van een andere ZZP'er.
    // Zonder dit overleeft toewijsbare gedragsmetadata (wat deze persoon bewaarde, en wanneer) een
    // art. 17-verzoek; symmetrisch is de rij nu ook exporteerbaar (`account-export.ts`, art. 15/20).
    prisma.savedJob.deleteMany({ where: { freelancer: { userId } } }),
    // AVG art. 17 — de eigen bewaarde zoekopdrachten (`SavedJobSearch`): de door de betrokkene zelf
    // getypte naam (vrije tekst — kan een persoon/plaats/opdrachtgever benoemen) én de opgeslagen
    // zoekfilter (`query`) + het aanmaakmoment (`createdAt`). Dit is eigen gedrags-/voorkeurmetadata
    // (waar de betrokkene als ZZP'er naar werk zocht, en wanneer) zonder gedeelde/tegenpartij- of
    // fiscale bewaarwaarde — exact het profiel van `SavedJob` hierboven. Het `FreelancerProfile` wordt
    // geüpdatet (niet verwijderd), dus de `onDelete: Cascade` op `SavedJobSearch.freelancerProfileId`
    // vuurt niet → expliciet hard verwijderen (spiegel `savedJob`/`workExperience`/`availabilityWindow`).
    // Gescopet op het eigen profiel (`freelancer.userId`), nooit de bewaarde zoekopdrachten van een
    // andere ZZP'er. Zonder dit overleeft toewijsbare gedragsmetadata een art. 17-verzoek; symmetrisch
    // is de rij nu ook exporteerbaar (`account-export.ts`, art. 15/20).
    prisma.savedJobSearch.deleteMany({ where: { freelancer: { userId } } }),
    // AVG art. 17 — de eigen e-mailvoorkeuren (`NotificationPreference`): per categorie of de
    // betrokkene e-mail aan/uit zette. Opt-out-/gedragsconfiguratie gebonden aan zíjn `userId`; een
    // `user.update` triggert de `onDelete: Cascade` niet → expliciet wissen (hard delete — de rij is
    // enkel persoonlijke voorkeurstaat zonder tegenpartij-/retentiewaarde).
    prisma.notificationPreference.deleteMany({ where: { userId } }),
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
    // AVG art. 17 (zie de `ownNoShowReports`-toelichting hierboven): de zelf-getypte no-show-reden in
    // haar twee kopieën. (1) De reden op de eigen NoShowReport-rijen redacten; de rij zelf blijft als
    // geschil-/verantwoordingshistorie (verdict/verdictNote/datum), maar de niet-nullable `reason` →
    // neutrale redactiestring. Gescopet op de eigen meldingen (reportedById == de betrokkene).
    ...(ownNoShowReportIds.length
      ? [
          prisma.noShowReport.updateMany({
            where: { id: { in: ownNoShowReportIds } },
            data: { reason: NO_SHOW_REASON_REDACTED },
          }),
        ]
      : []),
    // (2) De gemelde ZZP'er ontving een `NO_SHOW_REPORTED`-notificatie met de reden verbatim in de body.
    // Reconstrueer de exacte body per melding via de gedeelde `noShowReportedNotificationBody` en redact
    // precies díe notificatie op de feed van de ZZP'er — nooit de no-show van een ándere melder.
    ...ownNoShowReports
      .filter((r) => r.collaboration?.freelancer?.userId)
      .map((r) =>
        prisma.notification.updateMany({
          where: {
            userId: r.collaboration!.freelancer.userId,
            type: "NO_SHOW_REPORTED",
            body: noShowReportedNotificationBody({
              jobTitle: r.collaboration!.job.title,
              occurredOn: r.occurredOn,
              reason: r.reason,
            }),
          },
          data: { body: "[Verwijderd op verzoek van de gebruiker]" },
        }),
      ),
    // Tweede kopie van de shift-overname-afwijsreden (zie de `ownDecidedRejectedHandoffs`-toelichting
    // hierboven): de AANVRAGER ontving een `SHIFT_HANDOFF_REJECTED`-notificatie met de door de beslisser
    // getypte reden verbatim in de body. Reconstrueer die body deterministisch via de gedeelde
    // `shiftHandoffRejectedNotificationBody` en redact precies díe notificatie op de aanvragersfeed —
    // nooit de afwijzing van een ándere beslisser. (De `decisionNote`-bronredactie hierboven, gescopet op
    // `decidedByUserId`, dekt kopie 1.)
    ...ownDecidedRejectedHandoffs.map((h) =>
      prisma.notification.updateMany({
        where: {
          userId: h.requestedByUserId,
          type: "SHIFT_HANDOFF_REJECTED",
          body: shiftHandoffRejectedNotificationBody({
            jobTitle: h.collaboration.job.title,
            note: h.decisionNote as string,
          }),
        },
        data: { body: "[Verwijderd op verzoek van de gebruiker]" },
      }),
    ),
    // AVG art. 17 (zie de `ownRejectedInvoices`-toelichting hierboven): de door de OPDRACHTGEVER zélf
    // getypte factuur-afkeurreden in zijn drie kopieën. (1) De reden op de eigen afgekeurde facturen
    // wissen.
    ...(ownRejectedInvoiceIds.length
      ? [
          prisma.invoice.updateMany({
            where: { id: { in: ownRejectedInvoiceIds } },
            data: { rejectionReason: null },
          }),
          // (2) De reden in de `INVOICE_REJECTED`-auditmetadata redacten (de metadata draagt enkel
          // `{ reason }`); actor/actie/tijd blijven als verantwoordingsspoor. De generieke
          // `scrubAuditMetadataPii`-pass raakt een vrije-tekstreden nooit (die matcht geen e-mail/naam),
          // dus dit is de enige plek waar deze kopie sneuvelt. Scope op de afkeur-actie + de eigen
          // factuur-id's raakt nooit een `INVOICE_CREDITED`-regel (ZZP'er-kant).
          prisma.auditLog.updateMany({
            where: {
              action: "INVOICE_REJECTED",
              entityType: "Invoice",
              entityId: { in: ownRejectedInvoiceIds },
            },
            data: { metadata: JSON.stringify({ reason: AUDIT_PII_REDACTED }) },
          }),
        ]
      : []),
    // (3) De ZZP'er (crediteur) ontving een `INVOICE_REJECTED`-notificatie met de reden verbatim in de
    // body. Die notificatie heeft geen deep-link (link = "/facturen"), dus scope op de exacte,
    // deterministisch reconstrueerbare body (via de gedeelde `invoiceRejectedNotificationBody`) op de
    // feed van de ZZP'er (`issuerUserId`) — zo raken we nooit de afkeuring van een ándere opdrachtgever.
    ...ownRejectedInvoices
      .filter((i) => i.issuerUserId && i.rejectionReason)
      .map((i) =>
        prisma.notification.updateMany({
          where: {
            userId: i.issuerUserId as string,
            type: "INVOICE_REJECTED",
            body: invoiceRejectedNotificationBody(i.rejectionReason as string),
          },
          data: { body: "[Verwijderd op verzoek van de gebruiker]" },
        }),
      ),
    // AVG art. 17 (zie de `ownRejectedPerformances`-toelichting hierboven): de door de OPDRACHTGEVER zélf
    // getypte prestatie-afkeurreden in zijn drie kopieën. (1) De reden op de eigen afgekeurde prestaties
    // wissen.
    ...(ownRejectedPerformanceIds.length
      ? [
          prisma.performance.updateMany({
            where: { id: { in: ownRejectedPerformanceIds } },
            data: { rejectionReason: null },
          }),
          // (2) De reden in de `PERFORMANCE_REJECTED`-auditmetadata redacten (enkel `{ reason }`).
          prisma.auditLog.updateMany({
            where: {
              action: "PERFORMANCE_REJECTED",
              entityType: "Performance",
              entityId: { in: ownRejectedPerformanceIds },
            },
            data: { metadata: JSON.stringify({ reason: AUDIT_PII_REDACTED }) },
          }),
        ]
      : []),
    // (3) De ZZP'er ontving een `PERFORMANCE_REJECTED`-notificatie met de reden verbatim in de body
    // (link = "/samenwerkingen", geen deep-link). Reconstrueer die body deterministisch via de gedeelde
    // `performanceRejectedNotificationBody` en redact precies díe notificatie op de ZZP'er-feed — nooit
    // de afkeuring van een ándere opdrachtgever.
    ...ownRejectedPerformances
      .filter((p) => p.collaboration?.freelancer?.userId && p.rejectionReason)
      .map((p) =>
        prisma.notification.updateMany({
          where: {
            userId: p.collaboration!.freelancer.userId,
            type: "PERFORMANCE_REJECTED",
            body: performanceRejectedNotificationBody(p.rejectionReason as string),
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
        metadata: { documentsDeleted: documentCount },
        ...meta,
      }),
    }),
  ]);

  // Documenten (rij + blob) PAS ná de anonimiseringstransactie verwijderen. Op dit punt is het account
  // SUSPENDED, de passwordHash gewist en anonymizedAt gezet (userAnonymizationData) → currentActor()
  // geeft null en de betrokkene kan geen nieuw document meer uploaden. Daardoor is dit read-then-delete
  // race-vrij: de storagesleutels die we hier lezen dekken exact de rijen die we verwijderen — geen
  // weesblob. Vóór deze wijziging werd de sleutellijst vóór de transactie gesnapshot terwijl de
  // rij-verwijdering pas meerdere DB-rondes later in de transactie liep; een upload in dat venster kreeg
  // zijn rij door de deleteMany verwijderd terwijl zijn blob buiten de snapshot viel → een onvindbare
  // weesblob met een (mogelijk art. 9-)VOG/diploma overleefde de "verwijdering" (TOCTOU, CWE-367, art. 17).
  // unbounded-allow: AVG-verwijdering: alle document-storagesleutels van één betrokkene; geen take (een cap zou stilletjes een blob laten staan)
  const documents = await prisma.document.findMany({
    where: { ownerId: userId },
    select: { storageKey: true },
  });
  if (documents.length > 0) {
    await prisma.document.deleteMany({ where: { ownerId: userId } });
  }

  // Bestanden in de opslag opruimen — best-effort, faalt de anonimisering niet. Naast de gevoelige
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
