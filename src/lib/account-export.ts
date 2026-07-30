import type { PrismaClient } from "@prisma/client";
import { collaborationsWithActiveDisputeOpenedBy } from "@/lib/dispute-ownership";

// AVG recht op inzage/dataportabiliteit (art. 15/20): bundelt de eigen persoonsgegevens van de
// actor tot één JSON-export. Server-side waarheid; uitsluitend de eigen gegevens — geen
// documentinhoud en geen vrije-tekst-PII van derden. De selects zijn bewust smal: van
// tegenpartijen lekt hooguit een onveranderlijke id (geen naam/e-mail), zoals de actor die ook
// in-app al ziet. Pure dataverzamelaar: de aanroeper (route) doet auth, rate-limit en audit.
//
// De `db`-parameter is structureel getypeerd zodat de unit-test een fake Prisma-client kan
// injecteren (zoals apply.test.ts) — geen module-mocks, geen database.

export interface AccountExportPayload {
  exportedAt: string;
  notice: string;
  user: unknown;
  freelancerProfile: unknown;
  company: unknown;
  applications: unknown;
  documents: unknown;
  notifications: unknown;
  sentMessages: unknown;
  receivedMessages: unknown;
  reviews: unknown;
  taxFilingRequests: unknown;
  supportTickets: unknown;
  supportMessages: unknown;
  ideaComments: unknown;
  indirectHours: unknown;
  ideas: unknown;
  invoices: unknown;
  performances: unknown;
  cancelledCollaborations: unknown;
  favoriteNotes: unknown;
  pushSubscriptions: unknown;
  expenses: unknown;
  // AVG art. 15/20 — eigen-datacategorieën die eerder ontbraken (zie SECURITY-PRIVACY-BACKLOG):
  receivedReviews: unknown;
  clientApplicationNotes: unknown;
  shiftHandoffRequests: unknown;
  shiftHandoffDecisions: unknown;
  availabilityNotes: unknown;
  noShowReports: unknown;
  leadContacts: unknown;
  openDisputeReasons: unknown;
}

const EXPORT_NOTICE =
  "Dit zijn je eigen persoonsgegevens in dit platform (geen documentinhoud, geen gegevens van anderen). " +
  "Bij ontvangen berichten en ondersteuningsgesprekken is alleen de aan jou gerichte communicatie opgenomen.";

export async function buildAccountExport(
  db: PrismaClient,
  actorId: string,
  now: Date = new Date(),
): Promise<AccountExportPayload> {
  // De LIVE dispuutreden (`Collaboration.disputeReason`) is één muteerbaar veld: na oplossing kan de
  // TEGENPARTIJ een nieuw dispuut op dezelfde samenwerking openen, waardoor het veld hún tekst bevat.
  // Scope daarom op de samenwerkingen waar déze betrokkene het HUIDIGE, nog-open dispuut opende (niet
  // op alle-tijd DISPUTE_OPENED-events), zodat de export alleen zíjn eigen live reden bevat en niet die
  // van de tegenpartij. Zie `dispute-ownership.ts` voor de onderbouwing.
  const ownDisputeCollabIds = await collaborationsWithActiveDisputeOpenedBy(db, actorId);

  const [
    user,
    profile,
    company,
    applications,
    documents,
    notifications,
    sentMessages,
    receivedMessages,
    reviews,
    taxFilingRequests,
    supportTickets,
    supportMessages,
    ideaComments,
    indirectHours,
    ideas,
    invoices,
    performances,
    cancelledCollaborations,
    favoriteNotes,
    pushSubscriptions,
    expenses,
    receivedReviews,
    clientApplicationNotes,
    shiftHandoffRequests,
    shiftHandoffDecisions,
    availabilityNotes,
    noShowReports,
    leadContacts,
    openDisputeReasons,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: actorId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        deletionRequestedAt: true,
        // AVG art. 15/20 — de door de bron (iDIN/eIDAS) bevestigde juridische naam + het
        // verificatiemoment zijn eigen persoonsgegevens van de betrokkene (gebruikt voor
        // vertrouwensscoring); ze horen dus in de eigen-data-inzage. Eerder ontbraken ze.
        identityVerifiedAt: true,
        verifiedLegalName: true,
      },
    }),
    db.freelancerProfile.findUnique({
      where: { userId: actorId },
      include: {
        skills: { select: { skillId: true } },
        industries: { select: { industryId: true } },
        credentials: {
          select: {
            type: true,
            title: true,
            issuer: true,
            status: true,
            issuedAt: true,
            expiresAt: true,
            visibility: true,
          },
        },
        workExperiences: {
          select: {
            role: true,
            organization: true,
            startYear: true,
            endYear: true,
            description: true,
            createdAt: true,
          },
        },
      },
    }),
    // Eigen bedrijfsprofiel. Smalle select: interne velden (tenantId, logoKey, userId) blijven eruit —
    // dat is geen persoonsgegeven van de betrokkene maar interne tenant-/storage-administratie.
    db.company.findUnique({
      where: { userId: actorId },
      select: {
        name: true,
        industryId: true,
        description: true,
        website: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.application.findMany({
      where: { freelancer: { userId: actorId } },
      select: {
        jobId: true,
        status: true,
        motivation: true,
        availability: true,
        proposedRate: true,
        matchScore: true,
        createdAt: true,
      },
    }),
    db.document.findMany({
      where: { ownerId: actorId },
      select: { kind: true, filename: true, mimeType: true, size: true, createdAt: true },
    }),
    db.notification.findMany({
      where: { userId: actorId },
      select: { type: true, title: true, body: true, readAt: true, createdAt: true },
    }),
    db.message.findMany({
      where: { senderId: actorId },
      select: { conversationId: true, body: true, createdAt: true },
    }),
    // Ontvangen berichten: aan de actor gerichte communicatie (gesprekken waarin hij deelneemt,
    // niet door hemzelf verstuurd). senderId is een onveranderlijke id van de tegenpartij die de
    // actor in-app al ziet — geen naam/e-mail.
    db.message.findMany({
      where: {
        senderId: { not: actorId },
        conversation: { participants: { some: { userId: actorId } } },
      },
      select: { conversationId: true, senderId: true, body: true, createdAt: true },
    }),
    // Eigen beoordelingen (door de actor geschreven). Het oordeel/de toelichting is eigen tekst;
    // subjectId blijft eruit (zou de identiteit van de beoordeelde tegenpartij prijsgeven).
    db.review.findMany({
      where: { authorId: actorId },
      select: {
        collaborationId: true,
        direction: true,
        rating: true,
        comment: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    db.taxFilingRequest.findMany({
      where: { userId: actorId },
      select: {
        taxYear: true,
        kind: true,
        quarter: true,
        status: true,
        partnerName: true,
        mandateKind: true,
        consentShareAt: true,
        consentMandateAt: true,
        conceptAmountCents: true,
        clientApprovedAt: true,
        submittedAt: true,
        aanslagCents: true,
        revokedAt: true,
        createdAt: true,
      },
    }),
    db.supportTicket.findMany({
      where: { userId: actorId },
      select: {
        subject: true,
        category: true,
        status: true,
        priority: true,
        resolvedAt: true,
        createdAt: true,
      },
    }),
    // Eigen ondersteuningsberichten: alleen door de actor geschreven (USER). Antwoorden van een
    // admin/assistent (andere authorId) blijven eruit — dat is communicatie van derden.
    db.supportMessage.findMany({
      where: { authorId: actorId },
      select: { ticketId: true, body: true, createdAt: true },
    }),
    db.ideaComment.findMany({
      where: { authorId: actorId },
      select: { ideaId: true, body: true, createdAt: true },
    }),
    db.indirectHoursEntry.findMany({
      where: { userId: actorId },
      select: { workedOn: true, hours: true, category: true, note: true, createdAt: true },
    }),
    // Eigen ideeën (vrije tekst van de actor). declineReason is door het platform geschreven maar gaat
    // rechtstreeks over het eigen idee van de actor — hoort bij de inzage.
    db.idea.findMany({
      where: { authorId: actorId },
      select: {
        title: true,
        description: true,
        status: true,
        audience: true,
        theme: true,
        declineReason: true,
        createdAt: true,
      },
    }),
    // Eigen facturen: de actor is partij (uitschrijver = ZZP'er via issuerUserId, of opdrachtgever
    // via counterpartyUserId; legacy-facturen zonder die velden herleiden we via de samenwerking).
    // Deze financiële transactierecords zijn eigen persoonsgegevens (art. 15/20). Bewust alleen de
    // gestructureerde bedragen/status/nummer — géén vrije tekst (factuurregel-omschrijvingen zouden
    // voor de opdrachtgever de tekst van de tegenpartij zijn) en géén tegenpartij-id.
    db.invoice.findMany({
      where: {
        OR: [
          { issuerUserId: actorId },
          { counterpartyUserId: actorId },
          { collaboration: { freelancer: { userId: actorId } } },
          { collaboration: { company: { userId: actorId } } },
        ],
      },
      select: {
        number: true,
        status: true,
        lifecycleStatus: true,
        issuedAt: true,
        dueAt: true,
        subtotalCents: true,
        vatCents: true,
        totalCents: true,
        vatRegime: true,
        createdAt: true,
      },
    }),
    // Eigen urenstaten/opleveringen (Performance): de gewerkte uren/perioden/tarief die de ZZP'er
    // zelf indiende — kernwerk-records die onder de inzage vallen. Gescopet op de eigen samenwerkingen
    // als ZZP'er (freelancer.userId). description/ortSegments zijn eigen tekst; rejectionReason
    // (geschreven door de goedkeurende tegenpartij) blijft er bewust uit.
    db.performance.findMany({
      where: { collaboration: { freelancer: { userId: actorId } } },
      select: {
        type: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        hours: true,
        rateCents: true,
        ortSegments: true,
        milestoneTitle: true,
        amountCents: true,
        description: true,
        submittedAt: true,
        approvedAt: true,
        createdAt: true,
      },
    }),
    // Annuleerredenen die de actor zelf schreef (vrije tekst). Scoping op cancelledById == actor zodat
    // de reden van de tegenpartij niet meelekt; companyId/freelancerId blijven eruit (identiteit derde).
    db.collaboration.findMany({
      where: { cancelledById: actorId },
      select: { cancellationReason: true, cancelledAt: true, createdAt: true },
    }),
    // Eigen favorieten-notities die de actor als CLIENT schreef over een ZZP'er (FavoriteFreelancer.note).
    // Dit is eigen vrije tekst en valt onder de inzage. Gescopet op de eigen bedrijven (company.userId);
    // de identiteit van de gemarkeerde ZZP'er blijft eruit (freelancerProfileId is een interne id, geen
    // naam/e-mail) — net als de actor die al in-app ziet. Alleen rijen met een notitie.
    db.favoriteFreelancer.findMany({
      where: { company: { userId: actorId }, note: { not: null } },
      select: { note: true, createdAt: true },
    }),
    // Eigen push-abonnementen. endpoint is een persistente toestel-/browser-identifier van de actor —
    // een persoonsgegeven dat onder de inzage valt. De cryptografische sleutels (p256dh/auth) blijven
    // eruit: dat zijn secrets, geen voor de betrokkene betekenisvolle persoonsgegevens.
    db.pushSubscription.findMany({
      where: { userId: actorId },
      select: { endpoint: true, userAgent: true, createdAt: true },
    }),
    // Eigen zakelijke uitgaven (kostenregistratie door de ZZP'er). Omschrijving is eigen vrije tekst;
    // de bedragen/categorie/datum zijn eigen administratie van de betrokkene en vallen onder de inzage.
    // Gescopet op de eigen userId; interne grootboek-id's blijven eruit.
    db.expense.findMany({
      where: { userId: actorId },
      select: {
        description: true,
        category: true,
        netCents: true,
        vatCents: true,
        occurredAt: true,
        createdAt: true,
      },
    }),
    // Ontvangen beoordelingen (over de actor geschreven, subjectId == actor). Het oordeel/de
    // toelichting gaat over de betrokkene en valt onder de inzage. Uitsluitend PUBLISHED — een
    // PENDING_REVEAL-beoordeling is bewust nog niet onthuld (double-blind tegen vergelding); die vóór
    // de reveal via de export prijsgeven zou dat mechanisme breken en de rechten van de auteur raken.
    // authorId blijft eruit (identiteit van de beoordelende tegenpartij).
    db.review.findMany({
      where: { subjectId: actorId, status: "PUBLISHED" },
      select: {
        collaborationId: true,
        direction: true,
        rating: true,
        comment: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    // Interne kandidaatnotities die de actor als CLIENT zelf schreef bij reacties op de eigen
    // opdrachten (Application.note, vrije tekst). Gescopet op de eigen bedrijfsopdrachten
    // (job.company.userId) — nooit de motivatie/notitie van een andere partij. Alleen rijen met een
    // notitie; de identiteit van de sollicitant blijft eruit (freelancerId is een interne id).
    db.application.findMany({
      where: { job: { company: { userId: actorId } }, note: { not: null } },
      select: { jobId: true, note: true, createdAt: true },
    }),
    // Shift-overname-aanvragen die de actor zelf deed (ShiftHandoff.reason, aanvragerskant). Eigen
    // vrije tekst; decisionNote (beslisserskant) blijft hier eruit — dat is de tekst van een ander.
    db.shiftHandoff.findMany({
      where: { requestedByUserId: actorId },
      select: { collaborationId: true, reason: true, status: true, createdAt: true },
    }),
    // Beslisnotities die de actor als FRANCHISER/beslisser zelf schreef bij het afwijzen van een
    // shift-overname (ShiftHandoff.decisionNote, beslisserskant). Eigen vrije tekst; reason
    // (aanvragerskant) blijft eruit. Alleen rijen met een notitie.
    db.shiftHandoff.findMany({
      where: { decidedByUserId: actorId, decisionNote: { not: null } },
      select: { collaborationId: true, decisionNote: true, status: true, decidedAt: true },
    }),
    // Beschikbaarheidsnoten die de actor als ZZP'er zelf schreef (AvailabilityWindow.note, vrije
    // tekst met mogelijk een reden of details). Gescopet op het eigen profiel. Alleen rijen met noot.
    db.availabilityWindow.findMany({
      where: { freelancerProfile: { userId: actorId }, note: { not: null } },
      select: { startDate: true, endDate: true, type: true, note: true, createdAt: true },
    }),
    // No-show-meldingen die de actor als melder (opdrachtgever/franchiser) zelf schreef
    // (NoShowReport.reason). Eigen vrije tekst; verdictNote (admin-oordeel) blijft eruit en de
    // identiteit van de gemelde ZZP'er (freelancerProfileId) blijft eruit.
    db.noShowReport.findMany({
      where: { reportedById: actorId },
      select: {
        collaborationId: true,
        reason: true,
        occurredOn: true,
        verdict: true,
        createdAt: true,
      },
    }),
    // Contactnotities die de actor als FRANCHISER zelf schreef bij leads (LeadContact.body,
    // bel-/gespreksnotities). Eigen vrije tekst; de derde-partij-lead-PII (naam/e-mail/telefoon van
    // het prospect) valt onder het aparte verwerkingsregister-item, niet onder deze eigen-data-inzage.
    db.leadContact.findMany({
      where: { createdById: actorId },
      select: { leadId: true, body: true, createdAt: true },
    }),
    // Dispuutredenen die de actor zelf schreef en die nog openstaan (resolveDispute wist ze bij
    // oplossing). Gescopet op de eigen DISPUTE_OPENED-events — nooit de reden van de tegenpartij.
    db.collaboration.findMany({
      where: { id: { in: ownDisputeCollabIds }, disputeReason: { not: null } },
      select: { disputeReason: true, disputedAt: true, createdAt: true },
    }),
  ]);

  return {
    exportedAt: now.toISOString(),
    notice: EXPORT_NOTICE,
    user,
    freelancerProfile: profile,
    company,
    applications,
    documents,
    notifications,
    sentMessages,
    receivedMessages,
    reviews,
    taxFilingRequests,
    supportTickets,
    supportMessages,
    ideaComments,
    indirectHours,
    ideas,
    invoices,
    performances,
    cancelledCollaborations,
    favoriteNotes,
    pushSubscriptions,
    expenses,
    receivedReviews,
    clientApplicationNotes,
    shiftHandoffRequests,
    shiftHandoffDecisions,
    availabilityNotes,
    noShowReports,
    leadContacts,
    openDisputeReasons,
  };
}
