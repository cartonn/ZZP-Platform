// A09 audit-volledigheid: adminReply moet zijn vier neveneffecten (bericht, notificatie,
// toewijzing, statuswijziging) atomair in één $transaction uitvoeren én de status-/assignment-
// wijzigingen vastleggen in de SUPPORT_AGENT_REPLY-auditregel. Zonder transactie kan een halve
// reactie achterblijven; zonder de metadata is de wijziging niet herleidbaar. Deze test faalt dan.

import { describe, it, expect, vi, beforeEach } from "vitest";

const txOps = vi.hoisted(() => ({
  supportMessageCreate: vi.fn(),
  notificationCreate: vi.fn(),
  supportTicketUpdate: vi.fn(),
  supportTicketUpdateMany: vi.fn(async () => ({ count: 1 })),
}));

const ticketState = vi.hoisted(() => ({
  current: null as {
    id: string;
    userId: string;
    assignedToId: string | null;
    status: string;
  } | null,
}));

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({ id: "admin-1", role: "ADMIN", status: "ACTIVE" })),
}));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => {}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/db", () => ({
  prisma: {
    supportTicket: { findUnique: vi.fn(async () => ticketState.current) },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        supportMessage: { create: txOps.supportMessageCreate },
        notification: { create: txOps.notificationCreate },
        supportTicket: {
          update: txOps.supportTicketUpdate,
          updateMany: txOps.supportTicketUpdateMany,
        },
      }),
    ),
  },
}));

import { adminReply } from "./actions";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

type AuditMetadata = { statusChanged: boolean; assignedTo: string | null };
type AuditEntry = { action: string; metadata: AuditMetadata };

function lastAuditEntry(): AuditEntry {
  const calls = (audit as unknown as ReturnType<typeof vi.fn>).mock.calls;
  return calls[calls.length - 1]![0] as AuditEntry;
}

function form(body: string | null): FormData {
  const fd = new FormData();
  if (body !== null) fd.set("body", body);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  ticketState.current = null;
});

describe("adminReply — atomaire writes + volledige audit (A09)", () => {
  it("(a) onbehandeld ticket dat naar AWAITING_USER mag: transactie, toewijzing, statuswijziging, audit", async () => {
    ticketState.current = {
      id: "t-1",
      userId: "user-9",
      assignedToId: null,
      status: "ESCALATED",
    };

    await adminReply("t-1", form("Hallo, we kijken ernaar."));

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(txOps.supportMessageCreate).toHaveBeenCalledTimes(1);
    expect(txOps.notificationCreate).toHaveBeenCalledTimes(1);

    // Toewijzing aan de actor + statusovergang naar AWAITING_USER, beide via tx.supportTicket.update.
    expect(txOps.supportTicketUpdate).toHaveBeenCalledWith({
      where: { id: "t-1" },
      data: { assignedToId: "admin-1" },
    });
    // De statusovergang is compound-guarded (TOCTOU): alleen flippen als het ticket nog in
    // de gelezen status staat, anders zou een stale flip een intussen-heropend ticket wegzetten.
    expect(txOps.supportTicketUpdateMany).toHaveBeenCalledWith({
      where: { id: "t-1", status: "ESCALATED" },
      data: { status: "AWAITING_USER" },
    });

    expect(audit).toHaveBeenCalledTimes(1);
    const entry = lastAuditEntry();
    expect(entry.action).toBe("SUPPORT_AGENT_REPLY");
    expect(entry.metadata.statusChanged).toBe(true);
    expect(entry.metadata.assignedTo).toBe("admin-1");
  });

  it("(b) al-toegewezen ticket: geen toewijzings-update en metadata.assignedTo is null", async () => {
    ticketState.current = {
      id: "t-2",
      userId: "user-9",
      assignedToId: "admin-7",
      status: "ESCALATED",
    };

    await adminReply("t-2", form("Reactie."));

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // Geen assign-update; de enige update is de statusovergang.
    expect(txOps.supportTicketUpdate).not.toHaveBeenCalledWith({
      where: { id: "t-2" },
      data: { assignedToId: expect.anything() },
    });
    expect(txOps.supportTicketUpdateMany).toHaveBeenCalledWith({
      where: { id: "t-2", status: "ESCALATED" },
      data: { status: "AWAITING_USER" },
    });

    const entry = lastAuditEntry();
    expect(entry.metadata.assignedTo).toBeNull();
    expect(entry.metadata.statusChanged).toBe(true);
  });

  it("(c) lege body: safeParse faalt → geen transactie, geen audit", async () => {
    ticketState.current = {
      id: "t-3",
      userId: "user-9",
      assignedToId: null,
      status: "ESCALATED",
    };

    await adminReply("t-3", form(""));

    expect(prisma.supportTicket.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  // CWE-400: de body was begrensd op `.min(1)` maar niet op `.max()`, terwijl de gebruikerszijde
  // en `messageSchema` op 5000 cappen. Een body boven de cap moet vóór de DB worden geweigerd.
  it("(d) body van 5001 tekens: safeParse faalt → geen transactie, geen audit", async () => {
    ticketState.current = {
      id: "t-4",
      userId: "user-9",
      assignedToId: null,
      status: "ESCALATED",
    };

    await adminReply("t-4", form("a".repeat(5001)));

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  // TOCTOU: de aanvrager reageerde vlak vóór onze write (ticket staat niet meer op de gelezen
  // status) → de guarded updateMany raakt niets (count 0). De reactie zelf (bericht + notificatie)
  // blijft geldig en wordt vastgelegd; alleen de stale statusflip wordt niet doorgezet.
  it("(e) statusflip verliest de race (updateMany count 0): bericht + audit blijven, geen resurrectie", async () => {
    ticketState.current = {
      id: "t-5",
      userId: "user-9",
      assignedToId: "admin-7",
      status: "ESCALATED",
    };
    txOps.supportTicketUpdateMany.mockResolvedValueOnce({ count: 0 });

    await adminReply("t-5", form("Reactie."));

    expect(txOps.supportMessageCreate).toHaveBeenCalledTimes(1);
    expect(txOps.notificationCreate).toHaveBeenCalledTimes(1);
    expect(txOps.supportTicketUpdateMany).toHaveBeenCalledWith({
      where: { id: "t-5", status: "ESCALATED" },
      data: { status: "AWAITING_USER" },
    });
    expect(audit).toHaveBeenCalledTimes(1);
  });
});
