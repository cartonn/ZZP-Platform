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
    collaboration: { findMany: make("collaboration", "findMany") },
    favoriteFreelancer: { findMany: make("favoriteFreelancer", "findMany") },
    pushSubscription: { findMany: make("pushSubscription", "findMany") },
    expense: { findMany: make("expense", "findMany") },
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
      "cancelledCollaborations",
      "favoriteNotes",
      "pushSubscriptions",
      "expenses",
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

  it("neemt alleen door de actor geschreven ondersteuningsberichten mee (geen admin-antwoorden)", async () => {
    const { db, calls } = fakeDb();
    await buildAccountExport(db, ACTOR);

    const sm = calls.find((c) => c.table === "supportMessage");
    expect((sm?.args.where as Record<string, unknown>).authorId).toBe(ACTOR);
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

  it("geeft de canned rijen door in de juiste secties", async () => {
    const { db } = fakeDb({
      taxFilingRequest: [{ taxYear: 2025, kind: "IB" }],
      indirectHoursEntry: [{ hours: 2.5, category: "ADMIN" }],
    });
    const payload = await buildAccountExport(db, ACTOR);

    expect(payload.taxFilingRequests).toEqual([{ taxYear: 2025, kind: "IB" }]);
    expect(payload.indirectHours).toEqual([{ hours: 2.5, category: "ADMIN" }]);
  });
});
