// Contract van adminResolve: het afronden wordt geclaimd via een compound-guard
// `updateMany({ where: { id, status: from } })` bínnen de transactie. Twee gelijktijdige admins die
// hetzelfde ticket afronden passeren beide de vóór-lees; de guard laat alleen de eerste committen,
// de tweede matcht niet meer (count 0) → geen dubbele SUPPORT_TICKET_RESOLVED-auditregel.
// Regressietest voor de TOCTOU-hardening.

import { describe, it, expect, vi, beforeEach } from "vitest";

const ticketState = vi.hoisted(() => ({
  found: null as null | { id: string; status: string },
  updateCount: 1,
}));

vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({ id: "admin-1", role: "ADMIN", status: "ACTIVE" })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({
  audit: vi.fn(async () => {}),
  auditData: vi.fn((d: unknown) => d),
}));

const tx = vi.hoisted(() => ({
  ticketUpdateMany: vi.fn(async (_args: { where: Record<string, unknown> }) => ({
    count: ticketState.updateCount,
  })),
  auditCreate: vi.fn(async () => ({})),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(async (cb: (client: unknown) => Promise<unknown>) =>
      cb({
        supportTicket: { updateMany: tx.ticketUpdateMany },
        auditLog: { create: tx.auditCreate },
      }),
    ),
    supportTicket: { findUnique: vi.fn(async () => ticketState.found) },
  },
}));

import { adminResolve } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  ticketState.updateCount = 1;
  ticketState.found = { id: "t-1", status: "ESCALATED" };
});

describe("adminResolve — compound-guard tegen dubbele afronding", () => {
  it("claimt via updateMany met de guard `status: from`", async () => {
    await adminResolve("t-1");
    expect(tx.ticketUpdateMany).toHaveBeenCalledTimes(1);
    const arg = tx.ticketUpdateMany.mock.calls[0]![0] as {
      where: { id: string; status: string };
      data: { status: string };
    };
    expect(arg.where).toEqual({ id: "t-1", status: "ESCALATED" });
    expect(arg.data.status).toBe("RESOLVED");
    expect(tx.auditCreate).toHaveBeenCalledTimes(1);
  });

  it("bij een verloren race (count 0): schrijft géén auditregel", async () => {
    ticketState.updateCount = 0;
    await adminResolve("t-1");
    expect(tx.ticketUpdateMany).toHaveBeenCalledTimes(1);
    expect(tx.auditCreate).not.toHaveBeenCalled();
  });

  it("onbestaand ticket: geen transactie", async () => {
    ticketState.found = null;
    await adminResolve("weg");
    expect(tx.ticketUpdateMany).not.toHaveBeenCalled();
    expect(tx.auditCreate).not.toHaveBeenCalled();
  });
});
