import type { PrismaClient } from "@prisma/client";

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
  cancelledCollaborations: unknown;
  favoriteNotes: unknown;
  pushSubscriptions: unknown;
}

const EXPORT_NOTICE =
  "Dit zijn je eigen persoonsgegevens in dit platform (geen documentinhoud, geen gegevens van anderen). " +
  "Bij ontvangen berichten en ondersteuningsgesprekken is alleen de aan jou gerichte communicatie opgenomen.";

export async function buildAccountExport(
  db: PrismaClient,
  actorId: string,
  now: Date = new Date(),
): Promise<AccountExportPayload> {
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
    cancelledCollaborations,
    favoriteNotes,
    pushSubscriptions,
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
    cancelledCollaborations,
    favoriteNotes,
    pushSubscriptions,
  };
}
