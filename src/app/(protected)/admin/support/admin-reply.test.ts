// A09 audit-volledigheid: adminReply moet zijn vier neveneffecten (bericht, notificatie,
// toewijzing, statuswijziging) atomair in één $transaction uitvoeren én de status-/assignment-
// wijzigingen vastleggen in de SUPPORT_AGENT_REPLY-auditregel. Zonder transactie kan een halve
// reactie achterblijven; zonder de metadata is de wijziging niet herleidbaar. Deze test faalt dan.

import { describe, it, expect, vi, beforeEach } from "vitest";

const txOps = vi.hoisted(() => ({
  supportMessageCreate: vi.fn(),
  notificationCreate: vi.fn(),
  supportTicketUpdate: vi.fn(),
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
        supportTicket: { update: txOps.supportTicketUpdate },
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
    expect(txOps.supportTicketUpdate).toHaveBeenCalledWith({
      where: { id: "t-1" },
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
    expect(txOps.supportTicketUpdate).toHaveBeenCalledWith({
      where: { id: "t-2" },
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
});
