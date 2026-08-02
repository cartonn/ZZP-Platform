// Integriteits-regressie (CLAUDE.md regel 2/3 — server-side waarheid, compound-guarded write). De drie
// Application.status-schrijvers (changeApplicationStatus + bulkChangeApplicationStatus door de
// opdrachtgever, withdrawApplication door de ZZP'er) leunden op een stale pre-lees gevolgd door een
// blinde `update({ where: { id } })`. Twee VERSCHILLENDE actoren racen: in het TOCTOU-venster kan de
// ZZP'er zijn reactie intrekken (→ WITHDRAWN, terminaal in APPLICATION_TRANSITIONS) terwijl de
// opdrachtgever 'm afwijst/accepteert — de blinde write landde dan alsnog op de al-getransitioneerde rij
// (verboden overgang, bv. WITHDRAWN→REJECTED) + een valse notificatie. Deze tests bewijzen dat elke
// write nu een count-gated `updateMany({ where: { id, status: from } })` is: telt die 0, dan schrijven
// we niets, emitten geen audit/notificatie, en (single) melden we de wijziging / (bulk) tellen we de rij
// als overgeslagen.

import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.hoisted(() => vi.fn());
const findMany = vi.hoisted(() => vi.fn());
const updateMany = vi.hoisted(() => vi.fn());
const auditCreate = vi.hoisted(() => vi.fn(async () => ({})));
const notifCreate = vi.hoisted(() => vi.fn(async () => ({})));

const store = {
  actor: { id: "client-1", role: "CLIENT", status: "ACTIVE", tenantId: null } as {
    id: string;
    role: string;
    status: string;
    tenantId: string | null;
  },
};

const tx = {
  application: { updateMany },
  auditLog: { create: auditCreate },
  notification: { create: notifCreate },
};

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => store.actor),
  assertOwnership: vi.fn(),
}));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => {}), auditData: vi.fn((d) => d) }));
vi.mock("@/lib/rejection-reason", () => ({
  buildRejectionNotificationBody: vi.fn(() => "afgewezen"),
  optionalRejectionReasonSchema: { safeParse: vi.fn(() => ({ success: true, data: null })) },
}));
vi.mock("@/lib/text-bounds", () => ({ boundReason: vi.fn((v) => v) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    application: { findUnique, findMany },
    // Interactieve transactievorm: roept de callback aan met een tx die de guarded updateMany draagt.
    $transaction: vi.fn(async (arg: unknown) =>
      typeof arg === "function"
        ? (arg as (t: typeof tx) => unknown)(tx)
        : Promise.all(arg as unknown[]),
    ),
  },
}));

import { changeApplicationStatus, bulkChangeApplicationStatus } from "./actions";
import { withdrawApplication } from "../reacties/actions";

beforeEach(() => {
  findUnique.mockReset();
  findMany.mockReset();
  updateMany.mockReset();
  auditCreate.mockClear();
  notifCreate.mockClear();
  store.actor = { id: "client-1", role: "CLIENT", status: "ACTIVE", tenantId: null };
});

describe("changeApplicationStatus — compound-guarded tegen cross-actor TOCTOU", () => {
  const app = {
    status: "SHORTLIST",
    job: { title: "Klus", company: { userId: "client-1" } },
    freelancer: { userId: "zzp-1" },
    collaboration: null,
  };

  it("schrijft via een count-gated updateMany op de exact geziene status (niet blind op {id})", async () => {
    findUnique.mockResolvedValue(app);
    updateMany.mockResolvedValue({ count: 1 });

    await changeApplicationStatus("app-1", "REJECTED");

    expect(updateMany).toHaveBeenCalledTimes(1);
    const arg = updateMany.mock.calls[0]![0] as { where: unknown; data: unknown };
    expect(arg.where).toMatchObject({ id: "app-1", status: "SHORTLIST" });
    expect(arg.data).toMatchObject({ status: "REJECTED" });
    // Audit + notificatie volgen alleen na een geslaagde flip.
    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(notifCreate).toHaveBeenCalledTimes(1);
  });

  it("weigert zonder audit/notify als de rij in het venster wisselde (count 0)", async () => {
    findUnique.mockResolvedValue(app);
    updateMany.mockResolvedValue({ count: 0 });

    await expect(changeApplicationStatus("app-1", "REJECTED")).rejects.toThrow(
      /inmiddels gewijzigd/i,
    );
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(auditCreate).not.toHaveBeenCalled();
    expect(notifCreate).not.toHaveBeenCalled();
  });
});

describe("bulkChangeApplicationStatus — per-item compound-guard", () => {
  function form(ids: string[], target: string): FormData {
    const fd = new FormData();
    fd.set("target", target);
    for (const id of ids) fd.append("appId", id);
    return fd;
  }

  it("telt een geracete rij (count 0) als overgeslagen en emit er geen audit/notify voor", async () => {
    findMany.mockResolvedValue([
      {
        id: "a",
        status: "SHORTLIST",
        job: { title: "Klus A" },
        freelancer: { userId: "zzp-a" },
        collaboration: null,
      },
      {
        id: "b",
        status: "SHORTLIST",
        job: { title: "Klus B" },
        freelancer: { userId: "zzp-b" },
        collaboration: null,
      },
    ]);
    // a flipt (count 1), b is in het venster ingetrokken (count 0).
    updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    const res = await bulkChangeApplicationStatus(undefined, form(["a", "b"], "REJECTED"));

    expect(updateMany).toHaveBeenCalledTimes(2);
    for (const call of updateMany.mock.calls) {
      expect((call[0] as { where: Record<string, unknown> }).where).toMatchObject({
        status: "SHORTLIST",
      });
    }
    // Slechts één echte flip → één audit + één afwijzings-notificatie.
    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(notifCreate).toHaveBeenCalledTimes(1);
    expect(res?.ok).toMatch(/1 reactie\(s\) bijgewerkt, 1 overgeslagen/);
  });
});

describe("withdrawApplication — compound-guarded tegen cross-actor TOCTOU", () => {
  const app = {
    status: "SHORTLIST",
    job: { title: "Klus", company: { userId: "client-1" } },
    freelancer: { userId: "zzp-1" },
    collaboration: null,
  };

  beforeEach(() => {
    store.actor = { id: "zzp-1", role: "FREELANCER", status: "ACTIVE", tenantId: null };
  });

  it("schrijft via een count-gated updateMany op de exact geziene status", async () => {
    findUnique.mockResolvedValue(app);
    updateMany.mockResolvedValue({ count: 1 });

    await withdrawApplication("app-1");

    expect(updateMany).toHaveBeenCalledTimes(1);
    const arg = updateMany.mock.calls[0]![0] as { where: unknown; data: unknown };
    expect(arg.where).toMatchObject({ id: "app-1", status: "SHORTLIST" });
    expect(arg.data).toMatchObject({ status: "WITHDRAWN" });
    expect(notifCreate).toHaveBeenCalledTimes(1);
  });

  it("weigert zonder notify als de opdrachtgever de reactie in het venster besliste (count 0)", async () => {
    findUnique.mockResolvedValue(app);
    updateMany.mockResolvedValue({ count: 0 });

    await expect(withdrawApplication("app-1")).rejects.toThrow(/inmiddels gewijzigd/i);
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(auditCreate).not.toHaveBeenCalled();
    expect(notifCreate).not.toHaveBeenCalled();
  });
});
