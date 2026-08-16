// Server-side cascade-grendel op de legacy factuuracties (server-side waarheid, CLAUDE.md regel 1/2/5):
// een cascade-factuur (`lifecycleStatus != null`) loopt via de uren-/prestatieflow en houdt haar legacy
// `status` bewust op DRAFT. `INVOICE_TRANSITIONS.DRAFT` staat DRAFT→CANCELLED/SENT toe, dus zonder deze
// rem kon een legacy-actie (annuleren/versturen/betaald) — rechtstreeks door de eigenaar aangeroepen —
// de legacy-status van een cascade-factuur muteren, een valse audit-regel schrijven en de factuur uit de
// omzet-dashboards duwen (revenue-trend `status != CANCELLED`). De UI verbergt deze knoppen al (page.tsx
// `cascade`-gate); deze test dwingt dat die regel óók server-side geldt. Rood→groen: pre-fix muteerde de
// cascade-factuur alsnog.

import { describe, it, expect, vi, beforeEach } from "vitest";

const roleState = vi.hoisted(() => ({ role: "FREELANCER" as string }));
const invoiceState = vi.hoisted(() => ({
  found: null as null | {
    id: string;
    status: string;
    number: string;
    dueAt: Date | null;
    lifecycleStatus: string | null;
    collaboration: {
      freelancer: { userId: string };
      company: { userId: string };
      disputedAt: Date | null;
    };
  },
  updateCount: 1,
}));

const { FakeAuthError } = vi.hoisted(() => ({ FakeAuthError: class extends Error {} }));

vi.mock("@/lib/authz", () => ({
  AuthorizationError: FakeAuthError,
  requireRole: vi.fn(async (...roles: string[]) => {
    if (!roles.includes(roleState.role)) throw new FakeAuthError("Geen toegang.");
    return { id: "user-1", role: roleState.role, status: "ACTIVE" };
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/audit", () => ({ auditData: vi.fn((d: unknown) => d) }));
vi.mock("@/lib/rate-limit", () => ({
  invoiceCreateRateLimiter: {
    check: vi.fn(async () => ({ allowed: true, remaining: 0, retryAfterMs: 0 })),
  },
}));

const tx = vi.hoisted(() => ({
  invoiceUpdateMany: vi.fn(async (_args: { where: Record<string, unknown> }) => ({
    count: invoiceState.updateCount,
  })),
  notificationCreate: vi.fn(async () => ({})),
  auditCreate: vi.fn(async () => ({})),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(async (cb: (client: unknown) => Promise<unknown>) =>
      cb({
        invoice: { updateMany: tx.invoiceUpdateMany },
        notification: { create: tx.notificationCreate },
        auditLog: { create: tx.auditCreate },
      }),
    ),
    invoice: {
      findUnique: vi.fn(async () => invoiceState.found),
    },
  },
}));

import { sendInvoice, markInvoicePaid, cancelInvoice } from "./actions";

const CASCADE_FLOW_MESSAGE =
  "Deze samenwerking factureert via de uren- en prestatieflow. Maak de factuur daar aan, niet los.";

beforeEach(() => {
  vi.clearAllMocks();
  roleState.role = "FREELANCER";
  invoiceState.updateCount = 1;
  invoiceState.found = {
    id: "inv-1",
    status: "DRAFT",
    number: "2026-0001",
    dueAt: null,
    lifecycleStatus: null,
    collaboration: {
      freelancer: { userId: "user-1" },
      company: { userId: "user-1" },
      disputedAt: null,
    },
  };
});

describe("cascade-factuur (lifecycleStatus != null) is server-side afgeschermd van de legacy-acties", () => {
  it("cancelInvoice weigert een cascade-factuur zonder status te muteren of te auditen", async () => {
    invoiceState.found!.lifecycleStatus = "SUBMITTED";
    await expect(cancelInvoice("inv-1")).rejects.toThrow(CASCADE_FLOW_MESSAGE);
    expect(tx.invoiceUpdateMany).not.toHaveBeenCalled();
    expect(tx.auditCreate).not.toHaveBeenCalled();
  });

  it("sendInvoice weigert een cascade-factuur zonder status te muteren of te auditen", async () => {
    invoiceState.found!.lifecycleStatus = "SUBMITTED";
    await expect(sendInvoice("inv-1")).rejects.toThrow(CASCADE_FLOW_MESSAGE);
    expect(tx.invoiceUpdateMany).not.toHaveBeenCalled();
    expect(tx.auditCreate).not.toHaveBeenCalled();
    expect(tx.notificationCreate).not.toHaveBeenCalled();
  });

  it("markInvoicePaid weigert een cascade-factuur zonder status te muteren of te auditen", async () => {
    roleState.role = "CLIENT";
    invoiceState.found!.lifecycleStatus = "APPROVED";
    await expect(markInvoicePaid("inv-1")).rejects.toThrow(CASCADE_FLOW_MESSAGE);
    expect(tx.invoiceUpdateMany).not.toHaveBeenCalled();
    expect(tx.auditCreate).not.toHaveBeenCalled();
    expect(tx.notificationCreate).not.toHaveBeenCalled();
  });
});

describe("controle: een echte legacy-factuur (lifecycleStatus == null) loopt gewoon door", () => {
  it("cancelInvoice muteert de status en schrijft een auditregel", async () => {
    invoiceState.found!.lifecycleStatus = null;
    invoiceState.found!.status = "DRAFT";
    await cancelInvoice("inv-1");
    expect(tx.invoiceUpdateMany).toHaveBeenCalledTimes(1);
    const arg = tx.invoiceUpdateMany.mock.calls[0]![0] as {
      where: { id: string; status: string };
      data: { status: string };
    };
    expect(arg.where).toEqual({ id: "inv-1", status: "DRAFT" });
    expect(arg.data.status).toBe("CANCELLED");
    expect(tx.auditCreate).toHaveBeenCalledTimes(1);
  });

  it("sendInvoice muteert de status en notificeert de opdrachtgever", async () => {
    invoiceState.found!.lifecycleStatus = null;
    invoiceState.found!.status = "DRAFT";
    await sendInvoice("inv-1");
    expect(tx.invoiceUpdateMany).toHaveBeenCalledTimes(1);
    expect(tx.notificationCreate).toHaveBeenCalledTimes(1);
    expect(tx.auditCreate).toHaveBeenCalledTimes(1);
  });

  it("markInvoicePaid muteert de status en notificeert de ZZP'er", async () => {
    roleState.role = "CLIENT";
    invoiceState.found!.lifecycleStatus = null;
    invoiceState.found!.status = "SENT";
    await markInvoicePaid("inv-1");
    expect(tx.invoiceUpdateMany).toHaveBeenCalledTimes(1);
    expect(tx.notificationCreate).toHaveBeenCalledTimes(1);
    expect(tx.auditCreate).toHaveBeenCalledTimes(1);
  });
});
