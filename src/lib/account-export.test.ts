import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { buildAccountExport } from "./account-export";

// Geen database: we injecteren een fake Prisma-client die elke findMany/findUnique-aanroep
// vastlegt (table + args) en een canned rij teruggeeft. Zo kunnen we (1) bewijzen dat de export
// alle eigen-data-secties bevat en (2) de scoping/selects controleren — de AVG-kern: geen
// vrije-tekst-PII van derden, alleen aan de actor gerichte communicatie.

interface Call {
  table: string;
  method: string;
  args: Record<string, unknown>;
}

function fakeDb(rows: Record<string, unknown> = {}) {
  const calls: Call[] = [];
  const make = (table: string, method: string) => (args: Record<string, unknown>) => {
    calls.push({ table, method, args });
    return Promise.resolve(rows[table] ?? (method === "findMany" ? [] : null));
  };
  const db = {
    user: { findUnique: make("user", "findUnique") },
    freelancerProfile: { findUnique: make("freelancerProfile", "findUnique") },
    company: { findUnique: make("company", "findUnique") },
    application: { findMany: make("application", "findMany") },
    document: { findMany: make("document", "findMany") },
    notification: { findMany: make("notification", "findMany") },
    message: { findMany: make("message", "findMany") },
    review: { findMany: make("review", "findMany") },
    taxFilingRequest: { findMany: make("taxFilingRequest", "findMany") },
    supportTicket: { findMany: make("supportTicket", "findMany") },
    supportMessage: { findMany: make("supportMessage", "findMany") },
    ideaComment: { findMany: make("ideaComment", "findMany") },
    indirectHoursEntry: { findMany: make("indirectHoursEntry", "findMany") },
    idea: { findMany: make("idea", "findMany") },
    invoice: { findMany: make("invoice", "findMany") },
    performance: { findMany: make("performance", "findMany") },
    collaboration: { findMany: make("collaboration", "findMany") },
    favoriteFreelancer: { findMany: make("favoriteFreelancer", "findMany") },
    pushSubscription: { findMany: make("pushSubscription", "findMany") },
    expense: { findMany: make("expense", "findMany") },
    shiftHandoff: { findMany: make("shiftHandoff", "findMany") },
    availabilityWindow: { findMany: make("availabilityWindow", "findMany") },
    noShowReport: { findMany: make("noShowReport", "findMany") },
    leadContact: { findMany: make("leadContact", "findMany") },
    domainEvent: { findMany: make("domainEvent", "findMany") },
    conversationParticipant: { findMany: make("conversationParticipant", "findMany") },
  };
  return { db: db as unknown as PrismaClient, calls };
}

const ACTOR = "user-1";

describe("buildAccountExport", () => {
  it("bevat alle eigen-data-secties (AVG art. 15/20)", async () => {
    const { db } = fakeDb();
    const payload = await buildAccountExport(db, ACTOR, new Date("2026-06-24T10:00:00Z"));

    expect(payload.exportedAt).toBe("2026-06-24T10:00:00.000Z");
    // De secties die eerder ontbraken, zijn nu present.
    for (const key of [
      "receivedMessages",
      "reviews",
      "taxFilingRequests",
      "supportTickets",
      "supportMessages",
      "ideaComments",
      "indirectHours",
      "ideas",
      "invoices",
      "performances",
      "cancelledCollaborations",
      "favoriteNotes",
      "pushSubscriptions",
      "expenses",
      "receivedReviews",
      "clientApplicationNotes",
      "shiftHandoffRequests",
      "shiftHandoffDecisions",
      "availabilityNotes",
      "noShowReports",
      "leadContacts",
      "openDisputeReasons",
      "readReceipts",
    ] as const) {
      expect(payload).toHaveProperty(key);
    }
    // En de bestaande secties blijven behouden.
    expect(payload).toHaveProperty("sentMessages");
    expect(payload).toHaveProperty("user");
  });

  it("scope't ontvangen berichten op de actor en sluit eigen verzonden berichten uit", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const messageCalls = calls.filter((c) => c.table === "message");
    expect(messageCalls).toHaveLength(2);

    const sent = messageCalls.find(
      (c) => (c.args.where as Record<string, unknown>).senderId === ACTOR,
    );
    expect(sent).toBeDefined();

    const received = messageCalls.find((c) => {
      const senderId = (c.args.where as Record<string, unknown>).senderId;
      return typeof senderId === "object" && (senderId as { not?: string } | null)?.not === ACTOR;
    });
    expect(received).toBeDefined();
    // Alleen gesprekken waarin de actor deelneemt.
    expect(received?.args.where).toMatchObject({
      conversation: { participants: { some: { userId: ACTOR } } },
    });
  });

  it("neemt de eigen leesbevestigingen mee, gescopet op de actor (AVG art. 15/20)", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const cp = calls.find((c) => c.table === "conversationParticipant");
    expect(cp).toBeDefined();
    // Uitsluitend de eigen deelname-rijen — nooit de leesstaat van een tegenpartij.
    expect((cp?.args.where as Record<string, unknown>).userId).toBe(ACTOR);
    // Alleen conversationId + het leestijdstip; geen bredere PII van de tegenpartij.
    expect(cp?.args.select).toEqual({ conversationId: true, lastReadAt: true });
  });

  it("neemt alleen door de actor geschreven ondersteuningsberichten mee (geen admin-antwoorden)", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const sm = calls.find((c) => c.table === "supportMessage");
    expect((sm?.args.where as Record<string, unknown>).authorId).toBe(ACTOR);
  });

  it("neemt de eigen, door de bron bevestigde identiteit mee (AVG art. 15/20)", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const userCall = calls.find((c) => c.table === "user");
    expect(userCall).toBeDefined();
    const select = userCall?.args.select as Record<string, unknown>;
    // De iDIN/eIDAS-bevestigde juridische naam en het verificatiemoment zijn eigen
    // persoonsgegevens; ze moeten in de eigen-data-inzage zitten (ontbraken eerder).
    expect(select.verifiedLegalName).toBe(true);
    expect(select.identityVerifiedAt).toBe(true);
    // De eigen login-recency (`lastLoginAt`/`previousLoginAt`) is eigen persoonsgegeven dat de
    // server óver de betrokkene bewaart/verwerkt (inzetbaarheids-/dormancy-signalen); het hoort in
    // de inzage/portabiliteit en is symmetrisch met de erasure die het wist. Ontbrak eerder.
    expect(select.lastLoginAt).toBe(true);
    expect(select.previousLoginAt).toBe(true);
  });

  it("lekt de identiteit van de beoordeelde tegenpartij niet (geen subjectId in de select)", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const review = calls.find((c) => c.table === "review");
    expect((review?.args.where as Record<string, unknown>).authorId).toBe(ACTOR);
    expect((review?.args.select as Record<string, unknown>).subjectId).toBeUndefined();
    expect((review?.args.select as Record<string, unknown>).comment).toBe(true);
  });

  it("scope't de eigen ideeën, annuleerredenen en push-abonnementen op de actor (AVG art. 15)", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const idea = calls.find((c) => c.table === "idea");
    expect((idea?.args.where as Record<string, unknown>).authorId).toBe(ACTOR);
    expect((idea?.args.select as Record<string, unknown>).description).toBe(true);

    // Annuleerreden alleen waar de actor zelf annuleerde; identiteit van de derde lekt niet mee.
    const collab = calls.find((c) => c.table === "collaboration");
    expect((collab?.args.where as Record<string, unknown>).cancelledById).toBe(ACTOR);
    expect((collab?.args.select as Record<string, unknown>).cancellationReason).toBe(true);
    expect((collab?.args.select as Record<string, unknown>).companyId).toBeUndefined();
    expect((collab?.args.select as Record<string, unknown>).freelancerId).toBeUndefined();

    // Push-abonnementen: endpoint/userAgent wel, cryptografische secrets niet.
    const push = calls.find((c) => c.table === "pushSubscription");
    expect((push?.args.where as Record<string, unknown>).userId).toBe(ACTOR);
    expect((push?.args.select as Record<string, unknown>).endpoint).toBe(true);
    expect((push?.args.select as Record<string, unknown>).p256dh).toBeUndefined();
    expect((push?.args.select as Record<string, unknown>).auth).toBeUndefined();
  });

  it("neemt de eigen favorieten-notities mee, gescopet op de eigen bedrijven, zonder derde-partij-identiteit (AVG art. 15)", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const fav = calls.find((c) => c.table === "favoriteFreelancer");
    expect(fav).toBeDefined();
    const where = fav?.args.where as Record<string, unknown>;
    expect(where.company).toEqual({ userId: ACTOR });
    // Alleen rijen met een notitie; de eigen vrije tekst wel, de id van de ZZP'er niet.
    expect((where.note as Record<string, unknown>).not).toBeNull();
    const select = fav?.args.select as Record<string, unknown>;
    expect(select.note).toBe(true);
    expect(select.freelancerProfileId).toBeUndefined();
  });

  it("over-fetcht het bedrijfsprofiel niet: geen interne tenantId/logoKey (AVG art. 5 dataminimalisatie)", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const company = calls.find((c) => c.table === "company");
    const select = company?.args.select as Record<string, unknown> | undefined;
    // Smalle select verplicht (geen kale findUnique die alle kolommen teruggeeft).
    expect(select).toBeDefined();
    expect(select?.name).toBe(true);
    expect(select?.tenantId).toBeUndefined();
    expect(select?.logoKey).toBeUndefined();
  });

  it("neemt de eigen zakelijke uitgaven mee, gescopet op de actor (AVG art. 15/20)", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const expense = calls.find((c) => c.table === "expense");
    expect(expense).toBeDefined();
    expect((expense?.args.where as Record<string, unknown>).userId).toBe(ACTOR);
    const select = expense?.args.select as Record<string, unknown>;
    expect(select.description).toBe(true);
    expect(select.netCents).toBe(true);
    expect(select.vatCents).toBe(true);
    // Interne grootboek-id lekt niet mee.
    expect(select.id).toBeUndefined();
  });

  it("neemt ontvangen beoordelingen mee (subject == actor), maar alleen PUBLISHED en zonder auteur-identiteit (AVG art. 15 / double-blind)", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const reviewCalls = calls.filter((c) => c.table === "review");
    expect(reviewCalls).toHaveLength(2);
    const received = reviewCalls.find(
      (c) => (c.args.where as Record<string, unknown>).subjectId === ACTOR,
    );
    expect(received).toBeDefined();
    // Alleen onthulde beoordelingen — een PENDING_REVEAL-oordeel blijft vóór de reveal verborgen.
    expect((received?.args.where as Record<string, unknown>).status).toBe("PUBLISHED");
    const select = received?.args.select as Record<string, unknown>;
    expect(select.comment).toBe(true);
    expect(select.rating).toBe(true);
    // De identiteit van de beoordelende tegenpartij lekt niet mee.
    expect(select.authorId).toBeUndefined();
    expect(select.subjectId).toBeUndefined();
  });

  it("neemt eigen CLIENT-kandidaatnotities mee, gescopet op de eigen bedrijfsopdrachten, zonder sollicitant-identiteit", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const appCalls = calls.filter((c) => c.table === "application");
    expect(appCalls).toHaveLength(2);
    const notes = appCalls.find((c) => (c.args.where as Record<string, unknown>).job !== undefined);
    expect(notes).toBeDefined();
    expect((notes?.args.where as Record<string, unknown>).job).toEqual({
      company: { userId: ACTOR },
    });
    expect(
      ((notes?.args.where as Record<string, unknown>).note as Record<string, unknown>).not,
    ).toBeNull();
    const select = notes?.args.select as Record<string, unknown>;
    expect(select.note).toBe(true);
    // Alleen de eigen notitie — geen motivatie/identiteit van de sollicitant.
    expect(select.motivation).toBeUndefined();
    expect(select.freelancerId).toBeUndefined();
  });

  it("exporteert het vrije-tekst-beschikbaarheidsveld van de eigen reacties (Application.availability, AVG art. 15/20)", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    // De freelancer-gescopete reactie-export (eigen sollicitaties) moet het door de betrokkene
    // getypte `availability`-veld meenemen — anders is de inzage/portabiliteit onvolledig (rood→groen).
    const own = calls
      .filter((c) => c.table === "application")
      .find((c) => (c.args.where as Record<string, unknown>).freelancer !== undefined);
    expect(own).toBeDefined();
    const select = own?.args.select as Record<string, unknown>;
    expect(select.motivation).toBe(true);
    expect(select.availability).toBe(true);
  });

  it("scheidt shift-overname-tekst per zijde: eigen reason (aanvrager) en eigen decisionNote (beslisser), nooit die van de ander", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const handoffCalls = calls.filter((c) => c.table === "shiftHandoff");
    expect(handoffCalls).toHaveLength(2);

    const requested = handoffCalls.find(
      (c) => (c.args.where as Record<string, unknown>).requestedByUserId === ACTOR,
    );
    expect(requested).toBeDefined();
    const reqSelect = requested?.args.select as Record<string, unknown>;
    expect(reqSelect.reason).toBe(true);
    expect(reqSelect.decisionNote).toBeUndefined();

    const decided = handoffCalls.find(
      (c) => (c.args.where as Record<string, unknown>).decidedByUserId === ACTOR,
    );
    expect(decided).toBeDefined();
    const decSelect = decided?.args.select as Record<string, unknown>;
    expect(decSelect.decisionNote).toBe(true);
    expect(decSelect.reason).toBeUndefined();
  });

  it("neemt eigen beschikbaarheidsnoten, no-show-meldingen en lead-contactnotities mee, gescopet op de actor", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const avail = calls.find((c) => c.table === "availabilityWindow");
    expect((avail?.args.where as Record<string, unknown>).freelancerProfile).toEqual({
      userId: ACTOR,
    });
    expect((avail?.args.select as Record<string, unknown>).note).toBe(true);

    const noShow = calls.find((c) => c.table === "noShowReport");
    expect((noShow?.args.where as Record<string, unknown>).reportedById).toBe(ACTOR);
    const nsSelect = noShow?.args.select as Record<string, unknown>;
    expect(nsSelect.reason).toBe(true);
    // Admin-oordeel en de identiteit van de gemelde ZZP'er lekken niet mee.
    expect(nsSelect.verdictNote).toBeUndefined();
    expect(nsSelect.freelancerProfileId).toBeUndefined();

    const lead = calls.find((c) => c.table === "leadContact");
    expect((lead?.args.where as Record<string, unknown>).createdById).toBe(ACTOR);
    expect((lead?.args.select as Record<string, unknown>).body).toBe(true);
  });

  it("scope't open dispuutredenen op het eigen, nog-open dispuut, nooit die van de tegenpartij (AVG art. 15)", async () => {
    // Eén nog-open dispuut door de actor zelf: het live veld is dan van de actor → wél in de export.
    const { db, calls } = fakeDb({
      domainEvent: [{ subjectId: "collab-9", type: "DISPUTE_OPENED", actorId: ACTOR }],
    });
    await buildAccountExport(db, ACTOR);

    const de = calls.find((c) => c.table === "domainEvent");
    expect(de?.args.where).toMatchObject({ type: "DISPUTE_OPENED", actorId: ACTOR });

    const collabCalls = calls.filter((c) => c.table === "collaboration");
    expect(collabCalls).toHaveLength(2);
    const dispute = collabCalls.find(
      (c) => (c.args.where as Record<string, unknown>).disputeReason !== undefined,
    );
    expect(dispute).toBeDefined();
    const where = dispute?.args.where as Record<string, unknown>;
    expect((where.id as Record<string, unknown>).in).toEqual(["collab-9"]);
    expect((where.disputeReason as Record<string, unknown>).not).toBeNull();
    expect((dispute?.args.select as Record<string, unknown>).disputeReason).toBe(true);
  });

  it("lekt de LIVE dispuutreden van de tegenpartij niet na een oplossing + heropening (AVG art. 5(1)(f) / A01, rood→groen)", async () => {
    // Scenario: de actor opende een dispuut op collab-9, admin loste het op (disputeReason genulld),
    // daarna opende de TEGENPARTIJ een nieuw dispuut op dezelfde samenwerking. `Collaboration.disputeReason`
    // bevat nu de reden van de tegenpartij. Een naïeve scope op alle-tijd eigen DISPUTE_OPENED-events zou
    // collab-9 nog steeds matchen en die vreemde reden in de eigen export van de actor lekken.
    const { db, calls } = fakeDb({
      domainEvent: [
        { subjectId: "collab-9", type: "DISPUTE_OPENED", actorId: ACTOR },
        { subjectId: "collab-9", type: "DISPUTE_RESOLVED", actorId: "admin-1" },
        { subjectId: "collab-9", type: "DISPUTE_OPENED", actorId: "other-party" },
      ],
    });
    await buildAccountExport(db, ACTOR);

    const dispute = calls
      .filter((c) => c.table === "collaboration")
      .find((c) => (c.args.where as Record<string, unknown>).disputeReason !== undefined);
    expect(dispute).toBeDefined();
    // Groen: de huidige opener is de tegenpartij → geen enkele samenwerking-id in scope, dus de query
    // kan de live reden van de tegenpartij nooit teruggeven. Zonder de fix zou `in` ["collab-9"] zijn.
    expect((dispute?.args.where as { id: { in: string[] } }).id.in).toEqual([]);
  });

  it("neemt de eigen facturen mee als partij, zonder tegenpartij-id of factuurregel-tekst (AVG art. 15/20)", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const invoice = calls.find((c) => c.table === "invoice");
    expect(invoice).toBeDefined();
    // De actor is partij als uitschrijver, opdrachtgever, of via de samenwerking (legacy-facturen).
    const or = (invoice?.args.where as Record<string, unknown>).OR as Record<string, unknown>[];
    expect(or).toContainEqual({ issuerUserId: ACTOR });
    expect(or).toContainEqual({ counterpartyUserId: ACTOR });
    expect(or).toContainEqual({ collaboration: { freelancer: { userId: ACTOR } } });
    expect(or).toContainEqual({ collaboration: { company: { userId: ACTOR } } });

    const select = invoice?.args.select as Record<string, unknown>;
    // Gestructureerde eigen transactievelden wel.
    expect(select.number).toBe(true);
    expect(select.totalCents).toBe(true);
    expect(select.subtotalCents).toBe(true);
    // Tegenpartij-id's en vrije tekst lekken niet mee.
    expect(select.counterpartyUserId).toBeUndefined();
    expect(select.issuerUserId).toBeUndefined();
    expect(select.rejectionReason).toBeUndefined();
    expect(select.lines).toBeUndefined();
  });

  it("neemt de eigen urenstaten mee, gescopet op de eigen samenwerkingen als ZZP'er, zonder afkeurnotitie van de tegenpartij (AVG art. 15/20)", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const perf = calls.find((c) => c.table === "performance");
    expect(perf).toBeDefined();
    expect((perf?.args.where as Record<string, unknown>).collaboration).toEqual({
      freelancer: { userId: ACTOR },
    });
    const select = perf?.args.select as Record<string, unknown>;
    // Eigen gewerkte uren + omschrijving wel.
    expect(select.hours).toBe(true);
    expect(select.description).toBe(true);
    expect(select.ortSegments).toBe(true);
    // De afkeurreden is door de goedkeurende tegenpartij geschreven — hoort er niet in.
    expect(select.rejectionReason).toBeUndefined();
  });

  it("geeft de canned rijen door in de juiste secties", async () => {
    const { db } = fakeDb({
      taxFilingRequest: [{ taxYear: 2025, kind: "IB" }],
      indirectHoursEntry: [{ hours: 2.5, category: "ADMIN" }],
      invoice: [{ number: "2025-001", totalCents: 12100 }],
      performance: [{ hours: 8, description: "Nachtdienst" }],
    });
    const payload = await buildAccountExport(db, ACTOR);

    expect(payload.taxFilingRequests).toEqual([{ taxYear: 2025, kind: "IB" }]);
    expect(payload.indirectHours).toEqual([{ hours: 2.5, category: "ADMIN" }]);
    expect(payload.invoices).toEqual([{ number: "2025-001", totalCents: 12100 }]);
    expect(payload.performances).toEqual([{ hours: 8, description: "Nachtdienst" }]);
  });
});
