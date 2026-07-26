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

// Aparte state voor de createInvoice-tests (losse factuur): eigenaarschap + de tellingen die de
// dubbele-facturatie-gate leest, plus de aan te maken factuur.
const createState = vi.hoisted(() => ({
  collaboration: { freelancer: { userId: "user-1" }, company: { userId: "user-2" } } as null | {
    freelancer: { userId: string };
    company: { userId: string };
  },
  // Pre-transactionele gate-tellingen (fast-fail).
  performanceCount: 0,
  invoiceCount: 0,
  // In-transactie herverificatie-tellingen (TOCTOU-grendel). Standaard gelijk aan de pre-check;
  // een test kan ze op >0 zetten om een race te simuleren die pas ná de fast-fail ontstaat.
  txPerformanceCount: 0,
  txInvoiceCascadeCount: 0,
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
  // In-transactie herverificatie van de dubbele-facturatie-gate (usesCascadeFlow op de tx-client).
  performanceCount: vi.fn(async () => createState.txPerformanceCount),
  invoiceCascadeCount: vi.fn(async () => createState.txInvoiceCascadeCount),
}));

const db = vi.hoisted(() => ({
  invoiceCreate: vi.fn(async (_args: { data: { totalCents: number } }) => ({
    id: "inv-new",
    number: "2026-0002",
  })),
  auditCreate: vi.fn(async () => ({})),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(async (cb: (client: unknown) => Promise<unknown>) =>
      cb({
        invoice: {
          updateMany: tx.invoiceUpdateMany,
          count: tx.invoiceCascadeCount,
          create: db.invoiceCreate,
        },
        performance: { count: tx.performanceCount },
        notification: { create: tx.notificationCreate },
        auditLog: { create: tx.auditCreate },
      }),
    ),
    collaboration: {
      findUnique: vi.fn(async () => createState.collaboration),
    },
    performance: {
      count: vi.fn(async () => createState.performanceCount),
    },
    invoice: {
      findUnique: vi.fn(async () => invoiceState.found),
      count: vi.fn(async () => createState.invoiceCount),
      create: db.invoiceCreate,
    },
    auditLog: { create: db.auditCreate },
  },
}));

import { sendInvoice, markInvoicePaid, cancelInvoice, createInvoice } from "./actions";

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
  createState.collaboration = {
    freelancer: { userId: "user-1" },
    company: { userId: "user-2" },
  };
  createState.performanceCount = 0;
  createState.invoiceCount = 0;
  createState.txPerformanceCount = 0;
  createState.txInvoiceCascadeCount = 0;
});

// Bouwt de FormData zoals het factuurformulier die post (parallelle regelvelden).
function invoiceFormData(
  lines: Array<{ description: string; quantity: string; unit: string }>,
): FormData {
  const fd = new FormData();
  for (const l of lines) {
    fd.append("lineDescription", l.description);
    fd.append("lineQuantity", l.quantity);
    fd.append("lineUnit", l.unit);
  }
  return fd;
}

describe("createInvoice — losse factuur moet een positief totaal hebben", () => {
  it("weigert een factuur waarvan alle regels €0 zijn (totaal €0)", async () => {
    const fd = invoiceFormData([{ description: "Gratis advies", quantity: "2", unit: "0" }]);
    const res = await createInvoice("collab-1", undefined, fd);
    expect(res).toEqual({ error: "Het factuurbedrag moet groter dan € 0 zijn." });
    expect(db.invoiceCreate).not.toHaveBeenCalled();
  });

  it("maakt een factuur met een positief totaal wel aan", async () => {
    const fd = invoiceFormData([{ description: "Advies", quantity: "2", unit: "95" }]);
    const res = await createInvoice("collab-1", undefined, fd);
    // Geldig pad eindigt in een redirect (gemockt) → geen foutobject terug.
    expect(res).toBeUndefined();
    expect(db.invoiceCreate).toHaveBeenCalledTimes(1);
    const arg = db.invoiceCreate.mock.calls[0]![0] as { data: { totalCents: number } };
    expect(arg.data.totalCents).toBe(19000); // 2 × €95,00
  });
});

// TOCTOU-grendel: de pre-transactionele dubbele-facturatie-gate ziet nog "geen cascade", maar tussen
// die lees en de create-write ontstaat er een prestatie/cascade-factuur. Zonder de in-transactie-
// herverificatie zou er zowel een losse als een cascade-factuur landen (dubbele facturatie van dezelfde
// opdrachtgever). Rood→groen: pre-fix creëerde de losse factuur alsnog. Spiegelt de cascade-laag-guard.
describe("createInvoice — TOCTOU: cascade-flow ontstaat na de pre-check", () => {
  it("rolt de create terug en weigert wanneer de in-transactie-hercheck een prestatie ziet", async () => {
    createState.performanceCount = 0; // pre-check: nog geen cascade
    createState.invoiceCount = 0;
    createState.txPerformanceCount = 1; // in-tx: intussen een prestatie gecommit
    const fd = invoiceFormData([{ description: "Advies", quantity: "2", unit: "95" }]);
    const res = await createInvoice("collab-1", undefined, fd);
    expect(res).toEqual({
      error:
        "Deze samenwerking factureert via de uren- en prestatieflow. Maak de factuur daar aan, niet los.",
    });
    expect(db.invoiceCreate).not.toHaveBeenCalled();
  });

  it("weigert ook wanneer intussen een cascade-factuur (lifecycleStatus) is verschenen", async () => {
    createState.performanceCount = 0;
    createState.invoiceCount = 0;
    createState.txInvoiceCascadeCount = 1; // in-tx: intussen een cascade-factuur
    const fd = invoiceFormData([{ description: "Advies", quantity: "1", unit: "50" }]);
    const res = await createInvoice("collab-1", undefined, fd);
    expect(res).toEqual({
      error:
        "Deze samenwerking factureert via de uren- en prestatieflow. Maak de factuur daar aan, niet los.",
    });
    expect(db.invoiceCreate).not.toHaveBeenCalled();
  });

  it("maakt de factuur wél aan als er in de transactie nog steeds geen cascade is", async () => {
    // Regressie tegen over-blokkeren: gate leeg pre-check én in-tx → gewone create.
    const fd = invoiceFormData([{ description: "Advies", quantity: "2", unit: "95" }]);
    const res = await createInvoice("collab-1", undefined, fd);
    expect(res).toBeUndefined();
    expect(db.invoiceCreate).toHaveBeenCalledTimes(1);
  });
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
