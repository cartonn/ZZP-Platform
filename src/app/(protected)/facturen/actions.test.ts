// Contract van sendInvoice/markInvoicePaid/cancelInvoice: de statusmutatie gebeurt via een
// compound-guard `updateMany({ where: { id, status: from } })` bínnen de transactie, niet via een
// kaal `update({ where: { id } })`. Zo levert een gelijktijdige tweede submit (dubbelklik/race) —
// die dezelfde vóór-lees ziet en de transitiecheck passeert — géén dubbele notificatie + auditregel
// op: matcht de status niet meer, dan is count 0 en blijven de neveneffecten uit (idempotent).
// Regressietest voor de TOCTOU-hardening (defense-in-depth, spiegelt de cascade-laag).

import { describe, it, expect, vi, beforeEach } from "vitest";

const roleState = vi.hoisted(() => ({ role: "FREELANCER" as string }));
const invoiceState = vi.hoisted(() => ({
  found: null as null | {
    id: string;
    status: string;
    number: string;
    dueAt: Date | null;
    collaboration: { freelancer: { userId: string }; company: { userId: string } };
  },
  // count die de guarded updateMany teruggeeft: 1 = geclaimd, 0 = race verloren / al gewijzigd.
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

beforeEach(() => {
  vi.clearAllMocks();
  roleState.role = "FREELANCER";
  invoiceState.updateCount = 1;
  invoiceState.found = {
    id: "inv-1",
    status: "SENT",
    number: "2026-0001",
    dueAt: new Date("2026-08-01T00:00:00Z"),
    collaboration: { freelancer: { userId: "user-1" }, company: { userId: "user-1" } },
  };
});

describe("markInvoicePaid — compound-guard tegen dubbele-submit-race", () => {
  it("schrijft via updateMany met de statusguard `status: from`", async () => {
    roleState.role = "CLIENT";
    await markInvoicePaid("inv-1");
    expect(tx.invoiceUpdateMany).toHaveBeenCalledTimes(1);
    const arg = tx.invoiceUpdateMany.mock.calls[0]![0] as {
      where: { id: string; status: string };
      data: { status: string };
    };
    expect(arg.where).toEqual({ id: "inv-1", status: "SENT" });
    expect(arg.data.status).toBe("PAID");
  });

  it("bij een geldige claim (count 1): één notificatie + één auditregel", async () => {
    roleState.role = "CLIENT";
    invoiceState.updateCount = 1;
    await markInvoicePaid("inv-1");
    expect(tx.notificationCreate).toHaveBeenCalledTimes(1);
    expect(tx.auditCreate).toHaveBeenCalledTimes(1);
  });

  it("bij een verloren race (count 0): géén notificatie en géén auditregel", async () => {
    roleState.role = "CLIENT";
    invoiceState.updateCount = 0; // de eerste submit heeft de status al veranderd
    await markInvoicePaid("inv-1");
    expect(tx.invoiceUpdateMany).toHaveBeenCalledTimes(1);
    expect(tx.notificationCreate).not.toHaveBeenCalled();
    expect(tx.auditCreate).not.toHaveBeenCalled();
  });
});

describe("sendInvoice — compound-guard", () => {
  it("bij count 0: géén notificatie/auditregel (idempotent)", async () => {
    invoiceState.found!.status = "DRAFT"; // DRAFT -> SENT is de geldige transitie
    invoiceState.updateCount = 0;
    await sendInvoice("inv-1");
    const arg = tx.invoiceUpdateMany.mock.calls[0]![0] as { where: { status: string } };
    expect(arg.where.status).toBe("DRAFT"); // guardt op de vóór-lees-status (from)
    expect(tx.notificationCreate).not.toHaveBeenCalled();
    expect(tx.auditCreate).not.toHaveBeenCalled();
  });
});

describe("cancelInvoice — compound-guard", () => {
  it("bij count 0: géén auditregel (idempotent)", async () => {
    invoiceState.updateCount = 0;
    await cancelInvoice("inv-1");
    expect(tx.auditCreate).not.toHaveBeenCalled();
  });
});
