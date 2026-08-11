// DOEL-2 robuustheid (CWE-400): de support-body's (nieuw ticket én reactie) waren begrensd op
// `.min()` maar niet op `.max()`, terwijl `subject` (140) en elk ander vrije-tekstveld in de repo
// (bericht 5000, bio 2000) wél een bovengrens hebben. Zonder cap stroomt tot 12 MB tekst
// (server-action-limiet) ongefilterd naar de TEXT-kolom + de triage-scan. Deze test grendelt de
// 5000-cap: een body vlak onder de grens slaagt, een body erboven wordt geweigerd vóór de write.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/authz", () => ({
  AuthorizationError: class AuthorizationError extends Error {},
  requireActor: vi.fn(async () => ({ id: "user-1", role: "FREELANCER", status: "ACTIVE" })),
}));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => {}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const redirectMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirectMock(url);
    // Next's redirect() gooit intern; boots dat na zodat code ná de redirect niet doorloopt.
    throw new Error("NEXT_REDIRECT");
  },
}));

const ticketState = vi.hoisted(() => ({
  current: null as { id: string; userId: string; status: string } | null,
}));

const dbMocks = vi.hoisted(() => ({
  ticketCreate: vi.fn(async () => ({ id: "t-new" })),
  messageCreate: vi.fn(async () => ({})),
  ticketUpdate: vi.fn(async () => ({})),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    supportTicket: {
      create: dbMocks.ticketCreate,
      findUnique: vi.fn(async () => ticketState.current),
      update: dbMocks.ticketUpdate,
    },
    supportMessage: { create: dbMocks.messageCreate },
  },
}));

import { createTicket, replyToTicket } from "./actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  ticketState.current = { id: "t-1", userId: "user-1", status: "ESCALATED" };
});

describe("support body-cap (CWE-400)", () => {
  it("createTicket: body van 5001 tekens → geweigerd, geen create, geen redirect", async () => {
    const res = await createTicket(undefined, form({ subject: "Hulp", body: "a".repeat(5001) }));
    expect(res).toEqual({
      error: "Controleer je invoer.",
      fieldErrors: { body: expect.any(String) },
    });
    expect(dbMocks.ticketCreate).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("createTicket: body van precies 5000 tekens → geldig, ticket wordt aangemaakt", async () => {
    await expect(
      createTicket(undefined, form({ subject: "Hulp", body: "a".repeat(5000) })),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(dbMocks.ticketCreate).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/support/t-new");
  });

  it("replyToTicket: body van 5001 tekens → geweigerd, geen bericht geschreven", async () => {
    await replyToTicket("t-1", form({ body: "a".repeat(5001) }));
    expect(dbMocks.messageCreate).not.toHaveBeenCalled();
  });

  it("replyToTicket: body van precies 5000 tekens → geaccepteerd, bericht geschreven", async () => {
    await replyToTicket("t-1", form({ body: "a".repeat(5000) }));
    expect(dbMocks.messageCreate).toHaveBeenCalledTimes(1);
  });
});
