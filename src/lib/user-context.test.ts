import { beforeEach, describe, expect, it, vi } from "vitest";

// De gedeelde gebruikerscontext is puur "feiten ophalen"; wat we hier vastleggen is de VORM van die
// queries — scope (eigenaar), select (velden die élke consument nodig heeft) en het aantal queries.
// Dat is precies wat een consument stilzwijgend aanneemt: laat je de scope of het aantal wegdrijven,
// dan drijven de badge en het actiecentrum mee zonder dat een gedragstest dat merkt.

type FindManyArgs = { where?: Record<string, unknown>; orderBy?: unknown; select?: unknown };
type GroupByArgs = { by: string[]; where: Record<string, unknown>; _max: unknown };

const credentialFindMany = vi.fn((_a: FindManyArgs): Promise<unknown[]> => Promise.resolve([]));
const participantFindMany = vi.fn(
  (_a: FindManyArgs): Promise<{ conversationId: string; lastReadAt: Date | null }[]> =>
    Promise.resolve([]),
);
const messageGroupBy = vi.fn(
  (_a: GroupByArgs): Promise<{ conversationId: string; _max: { createdAt: Date | null } }[]> =>
    Promise.resolve([]),
);
const userFindUnique = vi.fn(
  (_a: unknown): Promise<{ tenantId: string | null } | null> => Promise.resolve(null),
);
const companyFindUnique = vi.fn(
  (_a: unknown): Promise<{ id: string } | null> => Promise.resolve(null),
);

vi.mock("@/lib/db", () => ({
  prisma: {
    credential: { findMany: (a: FindManyArgs) => credentialFindMany(a) },
    conversationParticipant: { findMany: (a: FindManyArgs) => participantFindMany(a) },
    message: { groupBy: (a: GroupByArgs) => messageGroupBy(a) },
    user: { findUnique: (a: unknown) => userFindUnique(a) },
    company: { findUnique: (a: unknown) => companyFindUnique(a) },
  },
}));

import {
  getCredentialDossier,
  getUnreadConversationState,
  getUserCompanyId,
  getUserTenantId,
} from "./user-context";

beforeEach(() => {
  credentialFindMany.mockClear();
  participantFindMany.mockClear();
  messageGroupBy.mockClear();
  userFindUnique.mockClear();
  companyFindUnique.mockClear();
});

describe("getCredentialDossier", () => {
  it("haalt het VOLLEDIGE dossier van één profiel op in één query", async () => {
    await getCredentialDossier("fp-1");
    expect(credentialFindMany).toHaveBeenCalledTimes(1);
    const args = credentialFindMany.mock.calls[0]![0];
    // Eigenaar-gescoopt en zonder statusfilter: alle consumenten (afgewezen, VERIFIED-set, verplichte
    // typen, plaatsings-/gatencheck) leiden hun deelverzameling in-memory af uit deze ene set.
    expect(args.where).toEqual({ freelancerProfileId: "fp-1" });
    expect(args.select).toEqual({
      id: true,
      title: true,
      type: true,
      status: true,
      expiresAt: true,
    });
  });
});

describe("getUnreadConversationState", () => {
  it("doet geen tweede query als de gebruiker in geen enkel gesprek zit", async () => {
    participantFindMany.mockResolvedValueOnce([]);
    const state = await getUnreadConversationState("u-1");
    expect(state.participants).toEqual([]);
    expect(state.latestForeign.size).toBe(0);
    expect(messageGroupBy).not.toHaveBeenCalled();
  });

  it("ordent deterministisch en koppelt het laatste bericht van een ánder per gesprek", async () => {
    const at = new Date("2026-05-01T10:00:00.000Z");
    participantFindMany.mockResolvedValueOnce([
      { conversationId: "c-1", lastReadAt: null },
      { conversationId: "c-2", lastReadAt: at },
    ]);
    messageGroupBy.mockResolvedValueOnce([{ conversationId: "c-1", _max: { createdAt: at } }]);

    const state = await getUnreadConversationState("u-2");

    // Stabiele volgorde: het actiecentrum snijdt deze lijst af op zijn eigen maximum en zou zonder
    // vaste ordening tussen requests een andere selectie tonen (flikkerende berichttaak).
    expect(participantFindMany.mock.calls[0]![0].orderBy).toEqual({ conversationId: "asc" });
    // Alleen berichten van een ánder tellen mee — een eigen bericht maakt een gesprek niet ongelezen.
    expect(messageGroupBy.mock.calls[0]![0].where).toMatchObject({
      conversationId: { in: ["c-1", "c-2"] },
      senderId: { not: "u-2" },
    });
    expect(state.latestForeign.get("c-1")).toEqual(at);
    expect(state.latestForeign.get("c-2")).toBeUndefined();
  });
});

describe("getUserTenantId / getUserCompanyId", () => {
  it("geeft null zonder franchise-lidmaatschap en het id met", async () => {
    userFindUnique.mockResolvedValueOnce(null);
    expect(await getUserTenantId("u-3")).toBeNull();
    userFindUnique.mockResolvedValueOnce({ tenantId: null });
    expect(await getUserTenantId("u-4")).toBeNull();
    userFindUnique.mockResolvedValueOnce({ tenantId: "t-1" });
    expect(await getUserTenantId("u-5")).toBe("t-1");
  });

  it("geeft null zonder bedrijfsprofiel en het id met", async () => {
    companyFindUnique.mockResolvedValueOnce(null);
    expect(await getUserCompanyId("u-6")).toBeNull();
    companyFindUnique.mockResolvedValueOnce({ id: "co-1" });
    expect(await getUserCompanyId("u-7")).toBe("co-1");
  });
});
