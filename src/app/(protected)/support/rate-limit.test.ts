// SECURITY/robuustheid (CWE-770 — ongecontroleerde resource-consumptie): de support-hub was het
// enige authenticated UGC-mutatie-oppervlak zónder volume-rem. `createTicket` en `replyToTicket`
// staan open voor élke ingelogde gebruiker, schrijven vrije tekst naar een TEXT-kolom, draaien de
// triage-scan en doen notificatie-/audit-fan-out naar de helpdesk — een scripted of gecompromitteerd
// account kon zo onbegrensd SupportTicket/SupportMessage-rijen aanmaken (DB-/storage-bloat +
// helpdesk-flood). Deze test grendelt de per-gebruiker-rem: bij een uitgeputte bucket wordt de
// write GEWEIGERD vóór er iets naar de DB stroomt; met ruimte in de bucket gaat de actie door.
// Rood→groen: zonder de rem-check in `actions.ts` wordt `create` óók bij een geweigerde bucket
// aangeroepen — dan falen de "geen write"-asserties.

import { describe, it, expect, vi, beforeEach } from "vitest";

const limiterMock = vi.hoisted(() => ({ allowed: true }));
vi.mock("@/lib/rate-limit", () => ({
  supportTicketRateLimiter: {
    check: vi.fn(async () => ({ allowed: limiterMock.allowed, retryAfterMs: 1000 })),
  },
}));

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
  ticketFindUnique: vi.fn(async () => ticketState.current),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    supportTicket: {
      create: dbMocks.ticketCreate,
      findUnique: dbMocks.ticketFindUnique,
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
  limiterMock.allowed = true;
  ticketState.current = { id: "t-1", userId: "user-1", status: "ESCALATED" };
});

describe("support rate-limit (CWE-770)", () => {
  it("createTicket: uitgeputte bucket → geweigerd, geen create, geen redirect", async () => {
    limiterMock.allowed = false;
    const res = await createTicket(undefined, form({ subject: "Hulp", body: "Ik heb een vraag." }));
    expect(res).toEqual({
      error: "Te veel support-verzoeken kort achter elkaar. Probeer het later opnieuw.",
    });
    expect(dbMocks.ticketCreate).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("createTicket: ruimte in de bucket → ticket wordt aangemaakt", async () => {
    await expect(
      createTicket(undefined, form({ subject: "Hulp", body: "Ik heb een vraag." })),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(dbMocks.ticketCreate).toHaveBeenCalledTimes(1);
  });

  it("replyToTicket: uitgeputte bucket → werpt, geen ownership-lookup, geen bericht", async () => {
    limiterMock.allowed = false;
    await expect(replyToTicket("t-1", form({ body: "Nog een vraag." }))).rejects.toThrow(
      "Te veel support-verzoeken",
    );
    // De rem vuurt vóór de ownership-lookup: geen DB-read en geen write.
    expect(dbMocks.ticketFindUnique).not.toHaveBeenCalled();
    expect(dbMocks.messageCreate).not.toHaveBeenCalled();
  });

  it("replyToTicket: ruimte in de bucket → bericht wordt geschreven", async () => {
    await replyToTicket("t-1", form({ body: "Nog een vraag." }));
    expect(dbMocks.messageCreate).toHaveBeenCalledTimes(1);
  });
});
