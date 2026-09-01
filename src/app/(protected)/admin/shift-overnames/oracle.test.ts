// Contract van loadDecidableHandoff (approve/rejectShiftHandoff): een ONBEKEND handoff-id en een
// handoff van een ÁNDERE tenant moeten zich IDENTIEK gedragen — geen cross-tenant existence-oracle
// (CWE-203 / OWASP A01 Broken Access Control). Beide geven exact dezelfde melding
// ("Overname-aanvraag niet gevonden.") en raken nooit de status-/notificatie-/audit-schrijf.
// Rood→groen: vóór de fix gaf de cross-tenant tak een onderscheidbare AuthorizationError-melding
// ("Geen toegang tot deze bemiddeling-resource.") uit assertSameTenant, waarmee een franchiser kon
// aflezen dat een gegokt id bij een ándere bemiddeling hoorde. Spiegelt dienst-oracle.test.ts.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Actor } from "@/lib/authz";

const dbState = vi.hoisted(() => ({
  handoff: null as {
    id: string;
    status: string;
    requestedByUserId: string;
    collaboration: {
      id: string;
      status: string;
      disputedAt: Date | null;
      job: { title: string; tenantId: string };
    };
  } | null,
}));

const db = vi.hoisted(() => ({
  handoffFind: vi.fn(async () => dbState.handoff),
  handoffUpdateMany: vi.fn(async () => ({ count: 1 })),
  notificationCreate: vi.fn(async () => ({})),
  auditCreate: vi.fn(async () => ({})),
  tx: vi.fn(async () => []),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    shiftHandoff: { findUnique: db.handoffFind, updateMany: db.handoffUpdateMany },
    notification: { create: db.notificationCreate },
    auditLog: { create: db.auditCreate },
    $transaction: db.tx,
  },
}));

const actor: Actor = { id: "fr-1", role: "FRANCHISER", status: "ACTIVE", tenantId: "tenant-A" };
vi.mock("@/lib/authz", async (orig) => ({
  ...(await orig<typeof import("@/lib/authz")>()),
  requireRole: vi.fn(async () => actor),
}));

vi.mock("@/lib/tenancy", () => ({
  ownsViaTenant: (a: { role: string; tenantId?: string | null }, entityTenantId: string) =>
    a.role === "ADMIN" || (Boolean(a.tenantId) && a.tenantId === entityTenantId),
}));

// Faithful voor plain Dutch domeinfouten: die passeren woordelijk (net als de echte helper).
vi.mock("@/lib/safe-action-error", () => ({
  toSafeActionError: (e: unknown, fallback?: string) =>
    e instanceof Error ? e.message : (fallback ?? "Er ging iets mis."),
}));

vi.mock("@/lib/audit", () => ({ auditData: (d: unknown) => d }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { approveShiftHandoff, rejectShiftHandoff } from "./actions";

const NOT_FOUND = "Overname-aanvraag niet gevonden.";

function rejectForm(): FormData {
  const fd = new FormData();
  fd.set("note", "Niet akkoord met deze overname.");
  return fd;
}

describe("shift-overname existence-oracle (CWE-203)", () => {
  beforeEach(() => {
    dbState.handoff = null;
    db.handoffUpdateMany.mockClear();
    db.notificationCreate.mockClear();
    db.auditCreate.mockClear();
  });

  it("approve: onbekend id → generieke 'niet gevonden', geen mutatie/audit", async () => {
    dbState.handoff = null;
    const res = await approveShiftHandoff("does-not-exist", undefined);
    expect(res).toEqual({ error: NOT_FOUND });
    expect(db.handoffUpdateMany).not.toHaveBeenCalled();
    expect(db.auditCreate).not.toHaveBeenCalled();
  });

  it("approve: cross-tenant handoff → IDENTIEKE 'niet gevonden' (geen oracle), geen mutatie", async () => {
    dbState.handoff = {
      id: "h-x",
      status: "OPEN",
      requestedByUserId: "zzp-9",
      collaboration: {
        id: "c-9",
        status: "ACTIVE",
        disputedAt: null,
        job: { title: "Dienst", tenantId: "tenant-B" },
      },
    };
    const res = await approveShiftHandoff("h-x", undefined);
    // Cross-tenant mag NIET onderscheidbaar zijn van onbekend.
    expect(res).toEqual({ error: NOT_FOUND });
    expect(db.handoffUpdateMany).not.toHaveBeenCalled();
    expect(db.auditCreate).not.toHaveBeenCalled();
  });

  it("reject: cross-tenant handoff → IDENTIEKE 'niet gevonden'", async () => {
    dbState.handoff = {
      id: "h-y",
      status: "OPEN",
      requestedByUserId: "zzp-9",
      collaboration: {
        id: "c-9",
        status: "ACTIVE",
        disputedAt: null,
        job: { title: "Dienst", tenantId: "tenant-B" },
      },
    };
    const res = await rejectShiftHandoff("h-y", undefined, rejectForm());
    expect(res).toEqual({ error: NOT_FOUND });
    expect(db.handoffUpdateMany).not.toHaveBeenCalled();
  });

  it("approve: eigen-tenant OPEN handoff passeert de poort (geen vals positief)", async () => {
    dbState.handoff = {
      id: "h-own",
      status: "OPEN",
      requestedByUserId: "zzp-1",
      collaboration: {
        id: "c-1",
        status: "ACTIVE",
        disputedAt: null,
        job: { title: "Dienst", tenantId: "tenant-A" },
      },
    };
    const res = await approveShiftHandoff("h-own", undefined);
    expect(res).toEqual({ ok: true });
    expect(db.handoffUpdateMany).toHaveBeenCalledOnce();
  });
});

// Server-side waarheid (CLAUDE.md regel 1): een OPEN-aanvraag op een terminale/bevroren samenwerking
// mag niet alleen uit de lijst gefilterd worden maar moet ook hard geweigerd worden door de mutatie —
// anders blijft de "eeuwig hangende beslissing" server-side beslisbaar (agent-review BLOCK, run 104).
describe("shift-overname — beslissing geweigerd op een terminale/bevroren samenwerking", () => {
  beforeEach(() => {
    dbState.handoff = null;
    db.handoffUpdateMany.mockClear();
    db.notificationCreate.mockClear();
    db.auditCreate.mockClear();
  });

  for (const status of ["CANCELLED", "COMPLETED"] as const) {
    it(`approve: eigen-tenant OPEN handoff op een ${status} inzet → geweigerd, geen mutatie/audit`, async () => {
      dbState.handoff = {
        id: "h-term",
        status: "OPEN",
        requestedByUserId: "zzp-1",
        collaboration: {
          id: "c-1",
          status,
          disputedAt: null,
          job: { title: "Dienst", tenantId: "tenant-A" },
        },
      };
      const res = await approveShiftHandoff("h-term", undefined);
      expect(res).toEqual({
        error: "Deze samenwerking is afgerond of geannuleerd; de aanvraag vervalt.",
      });
      expect(db.handoffUpdateMany).not.toHaveBeenCalled();
      expect(db.auditCreate).not.toHaveBeenCalled();
    });
  }

  it("reject: eigen-tenant OPEN handoff op een inzet in dispuut → geweigerd (freeze), geen mutatie", async () => {
    dbState.handoff = {
      id: "h-disp",
      status: "OPEN",
      requestedByUserId: "zzp-1",
      collaboration: {
        id: "c-1",
        status: "ACTIVE",
        disputedAt: new Date("2026-08-01"),
        job: { title: "Dienst", tenantId: "tenant-A" },
      },
    };
    const res = await rejectShiftHandoff("h-disp", undefined, rejectForm());
    expect(res).toEqual({
      error: "Deze samenwerking staat in dispuut; het werkproces is bevroren.",
    });
    expect(db.handoffUpdateMany).not.toHaveBeenCalled();
    expect(db.auditCreate).not.toHaveBeenCalled();
  });
});
