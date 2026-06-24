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
