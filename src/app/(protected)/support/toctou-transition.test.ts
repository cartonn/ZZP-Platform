// SECURITY (TOCTOU statusovergang-bypass, CLAUDE.md regel 3 — "Ongeldige overgang moet worden
// geweigerd door assertTransition"): de gebruiker-zijde support-acties (`replyToTicket`,
// `markResolved`) toetsten de statusovergang tegen een vóór-transactionele snapshot en schreven
// daarna met een KALE `prisma.supportTicket.update({ where: { id } })` — zónder de compound-guard
// `where: { id, status: from }` die élk ander statuswijzigend oppervlak in de repo gebruikt
// (admin/support, admin/no-shows, facturen, certificaten). Daardoor kon een race de live status
// blind overschrijven en een overgang forceren die de transitie-map verbiedt.
//
// Repro (race): ticket staat AWAITING_USER. De aanvrager roept `replyToTicket` (AWAITING_USER→
// ESCALATED, legale overgang t.o.v. de snapshot). Gelijktijdig rondt een ADMIN het ticket af →
// RESOLVED (compound-guarded, commit eerst). De kale user-write zette daarna ESCALATED, ook al is
// RESOLVED→ESCALATED géén toegestane overgang → invariant gebroken, admin-besluit stil teruggedraaid.
//
// Deze test bootst de race na door de compound-guard-`updateMany` de "iemand won"-uitkomst te laten
// geven (count 0 wanneer de live status niet meer `from` is) en grendelt: (1) de status-write loopt
// via `updateMany` mét de statusguard, niet via een kale `update`; (2) bij een verloren race wordt
// er geen fantoom-audit geschreven. Rood→groen: met de oude kale `update` bestaat er geen
// `updateMany`-aanroep met `status`-guard en faalt de eerste assertie.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/authz", () => ({
  AuthorizationError: class AuthorizationError extends Error {},
  requireActor: vi.fn(async () => ({ id: "user-1", role: "FREELANCER", status: "ACTIVE" })),
}));
type AuditCall = { action: string; metadata?: Record<string, unknown> };
const auditMock = vi.hoisted(() => vi.fn(async (_entry: AuditCall) => {}));
vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  supportTicketRateLimiter: { check: vi.fn(async () => ({ allowed: true, retryAfterMs: 0 })) },
}));

const ticketState = vi.hoisted(() => ({
  current: null as { id: string; userId: string; status: string } | null,
}));

const dbMocks = vi.hoisted(() => ({
  // updateMany geeft { count } terug — de compound-guard. Per test instelbaar zodat we een
  // gewonnen (count 1) én een verloren race (count 0) kunnen simuleren.
  updateManyCount: 1,
  ticketUpdate: vi.fn(async () => ({})),
  ticketUpdateMany: vi.fn(
    async (_args: { where: Record<string, unknown>; data: { status: string } }) => ({
      count: dbMocks.updateManyCount,
    }),
  ),
  messageCreate: vi.fn(async () => ({})),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    supportTicket: {
      findUnique: vi.fn(async () => ticketState.current),
      update: dbMocks.ticketUpdate,
      updateMany: dbMocks.ticketUpdateMany,
    },
    supportMessage: { create: dbMocks.messageCreate },
  },
}));

import { replyToTicket, markResolved } from "./actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.updateManyCount = 1;
});

describe("support statusovergang TOCTOU-guard (CLAUDE.md regel 3)", () => {
  it("replyToTicket op AWAITING_USER: status-flip loopt via updateMany mét compound-guard, nooit via kale update", async () => {
    ticketState.current = { id: "t-1", userId: "user-1", status: "AWAITING_USER" };
    await replyToTicket("t-1", form({ body: "Mijn reactie op de helpdesk." }));

    // De kale, guard-loze update mag niet meer gebruikt worden voor de statuswijziging.
    expect(dbMocks.ticketUpdate).not.toHaveBeenCalled();
    // De statusflip loopt via updateMany mét de status-guard `where: { id, status: from }`.
    expect(dbMocks.ticketUpdateMany).toHaveBeenCalledTimes(1);
    expect(dbMocks.ticketUpdateMany).toHaveBeenCalledWith({
      where: { id: "t-1", status: "AWAITING_USER" },
      data: { status: "ESCALATED" },
    });
  });

  it("replyToTicket verliest de race (count 0): geen statusovergang-audit met from/to", async () => {
    ticketState.current = { id: "t-1", userId: "user-1", status: "AWAITING_USER" };
    dbMocks.updateManyCount = 0; // ADMIN verplaatste het ticket ondertussen (bv. RESOLVED)
    await replyToTicket("t-1", form({ body: "Mijn reactie." }));

    // Bericht is geschreven, maar de statusflip won niet: de audit draagt geen from/to-overgang.
    const replyAudit = auditMock.mock.calls.find(
      (c) => c[0]?.action === "SUPPORT_TICKET_REPLY",
    )?.[0];
    expect(replyAudit).toBeTruthy();
    expect(replyAudit?.metadata).toBeUndefined();
  });

  it("markResolved: resolve loopt via updateMany mét compound-guard, nooit via kale update", async () => {
    ticketState.current = { id: "t-2", userId: "user-1", status: "AUTO_ANSWERED" };
    await markResolved("t-2");

    expect(dbMocks.ticketUpdate).not.toHaveBeenCalled();
    expect(dbMocks.ticketUpdateMany).toHaveBeenCalledTimes(1);
    const arg = dbMocks.ticketUpdateMany.mock.calls[0]?.[0];
    expect(arg?.where).toEqual({ id: "t-2", status: "AUTO_ANSWERED" });
    expect(arg?.data.status).toBe("RESOLVED");
  });

  it("markResolved verliest de race (count 0): geen SUPPORT_TICKET_RESOLVED-fantoomaudit", async () => {
    ticketState.current = { id: "t-2", userId: "user-1", status: "AUTO_ANSWERED" };
    dbMocks.updateManyCount = 0; // aanvrager reageerde elders → REOPENED, of admin loste al op
    await markResolved("t-2");

    const resolvedAudit = auditMock.mock.calls.find(
      (c) => c[0]?.action === "SUPPORT_TICKET_RESOLVED",
    );
    expect(resolvedAudit).toBeUndefined();
  });
});
