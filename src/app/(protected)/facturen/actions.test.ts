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
    collaboration: {
      freelancer: { userId: string };
      company: { userId: string };
      disputedAt: Date | null;
    };
  },
  // count die de guarded updateMany teruggeeft: 1 = geclaimd, 0 = race verloren / al gewijzigd.
  updateCount: 1,
}));

// Aparte state voor de createInvoice-tests (losse factuur): eigenaarschap + de tellingen die de
// dubbele-facturatie-gate leest, plus de aan te maken factuur.
const createState = vi.hoisted(() => ({
  collaboration: {
    freelancer: { userId: "user-1" },
    company: { userId: "user-2" },
    status: "ACTIVE",
    disputedAt: null as Date | null,
  } as null | {
    freelancer: { userId: string };
    company: { userId: string };
    status: string;
    disputedAt: Date | null;
  },
  // Pre-transactionele gate-tellingen (fast-fail).
  performanceCount: 0,
  invoiceCount: 0,
  // In-transactie herverificatie-tellingen (TOCTOU-grendel). Standaard gelijk aan de pre-check;
  // een test kan ze op >0 zetten om een race te simuleren die pas ná de fast-fail ontstaat.
  txPerformanceCount: 0,
  txInvoiceCascadeCount: 0,
  // In-transactie herlezing van de samenwerkingsstatus (factureerbaarheids-grendel). Standaard gelijk
  // aan de pre-check; een test kan dit op een terminale/gedisputeerde staat zetten om een race te
  // simuleren die pas ná de fast-fail ontstaat.
  txCollaboration: { status: "ACTIVE", disputedAt: null as Date | null } as null | {
    status: string;
    disputedAt: Date | null;
  },
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

// Rate-limiter op createInvoice: standaard toestaan zodat de bestaande tests niet op de teller
// aflopen; een test zet `allowed` op false om de rem te verifiëren.
const rateLimitState = vi.hoisted(() => ({ allowed: true }));
vi.mock("@/lib/rate-limit", () => ({
  invoiceCreateRateLimiter: {
    check: vi.fn(async () => ({
      allowed: rateLimitState.allowed,
      remaining: 0,
      retryAfterMs: rateLimitState.allowed ? 0 : 60_000,
    })),
  },
}));

// Per-partij factuurnummer-reeks (allocateInvoiceNumber): een test kan `lastSeq` zetten om het
// toegekende volgnummer te sturen. De allocator formatteert dit tot `2026-0001` etc.
const sequenceState = vi.hoisted(() => ({ lastSeq: 1 }));

const tx = vi.hoisted(() => ({
  invoiceUpdateMany: vi.fn(async (_args: { where: Record<string, unknown> }) => ({
    count: invoiceState.updateCount,
  })),
  notificationCreate: vi.fn(async () => ({})),
  auditCreate: vi.fn(async () => ({})),
  // In-transactie herverificatie van de dubbele-facturatie-gate (usesCascadeFlow op de tx-client).
  performanceCount: vi.fn(async () => createState.txPerformanceCount),
  invoiceCascadeCount: vi.fn(async () => createState.txInvoiceCascadeCount),
  // In-transactie herlezing van de samenwerkingsstatus (factureerbaarheids-grendel).
  collaborationFindUnique: vi.fn(async () => createState.txCollaboration),
  // Atomaire per-partij nummer-toewijzing (allocateInvoiceNumber → invoiceSequence.upsert).
  invoiceSequenceUpsert: vi.fn(async () => ({ lastSeq: sequenceState.lastSeq })),
}));

const db = vi.hoisted(() => ({
  invoiceCreate: vi.fn(
    async (args: { data: { number?: string; partyInvoiceNumber?: string } }) => ({
      id: "inv-new",
      number: args.data.number ?? "user-1:2026-0001",
      partyInvoiceNumber: args.data.partyInvoiceNumber ?? "2026-0001",
    }),
  ),
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
        collaboration: { findUnique: tx.collaborationFindUnique },
        notification: { create: tx.notificationCreate },
        auditLog: { create: tx.auditCreate },
        invoiceSequence: { upsert: tx.invoiceSequenceUpsert },
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
  rateLimitState.allowed = true;
  invoiceState.updateCount = 1;
  invoiceState.found = {
    id: "inv-1",
    status: "SENT",
    number: "2026-0001",
    dueAt: new Date("2026-08-01T00:00:00Z"),
    collaboration: {
      freelancer: { userId: "user-1" },
      company: { userId: "user-1" },
      disputedAt: null,
    },
  };
  createState.collaboration = {
    freelancer: { userId: "user-1" },
    company: { userId: "user-2" },
    status: "ACTIVE",
    disputedAt: null,
  };
  createState.performanceCount = 0;
  createState.invoiceCount = 0;
  createState.txPerformanceCount = 0;
  createState.txInvoiceCascadeCount = 0;
  createState.txCollaboration = { status: "ACTIVE", disputedAt: null };
  sequenceState.lastSeq = 1;
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

// Server-side factureerbaarheids-gate (persona-sweep DOEL 2, HIGH): een LOSSE factuur mag alleen op een
// lopende/afgeronde, niet-gedisputeerde samenwerking. De keuzelijst filtert hier al op, maar dat is
// slechts "tonen" — de action rechtstreeks aanroepen met een PROPOSED/CANCELLED/gedisputeerde
// collaborationId mocht vóór de fix tóch een factuur aanmaken (client toont, server beslist).
describe("createInvoice — factureerbaarheids-gate (status + dispuut, server-side waarheid)", () => {
  const NOT_BILLABLE =
    "Voor deze samenwerking kun je nu geen losse factuur opstellen: die moet lopend of afgerond zijn en zonder open dispuut.";

  it("weigert een factuur op een PROPOSED (ongetekend contract) samenwerking", async () => {
    createState.collaboration!.status = "PROPOSED";
    const fd = invoiceFormData([{ description: "Advies", quantity: "2", unit: "95" }]);
    const res = await createInvoice("collab-1", undefined, fd);
    expect(res).toEqual({ error: NOT_BILLABLE });
    expect(db.invoiceCreate).not.toHaveBeenCalled();
  });

  it("weigert een factuur op een CANCELLED samenwerking", async () => {
    createState.collaboration!.status = "CANCELLED";
    const fd = invoiceFormData([{ description: "Advies", quantity: "2", unit: "95" }]);
    const res = await createInvoice("collab-1", undefined, fd);
    expect(res).toEqual({ error: NOT_BILLABLE });
    expect(db.invoiceCreate).not.toHaveBeenCalled();
  });

  it("weigert een factuur op een gedisputeerde (bevroren) ACTIVE-samenwerking", async () => {
    createState.collaboration!.disputedAt = new Date("2026-07-01T00:00:00Z");
    const fd = invoiceFormData([{ description: "Advies", quantity: "2", unit: "95" }]);
    const res = await createInvoice("collab-1", undefined, fd);
    expect(res).toEqual({ error: NOT_BILLABLE });
    expect(db.invoiceCreate).not.toHaveBeenCalled();
  });

  it("staat een factuur op een ACTIVE, niet-gedisputeerde samenwerking wél toe", async () => {
    const fd = invoiceFormData([{ description: "Advies", quantity: "2", unit: "95" }]);
    const res = await createInvoice("collab-1", undefined, fd);
    expect(res).toBeUndefined();
    expect(db.invoiceCreate).toHaveBeenCalledTimes(1);
  });

  it("TOCTOU: rolt terug wanneer de samenwerking in het venster gedisputeerd raakt (in-tx hercheck)", async () => {
    // Pre-check ziet nog ACTIVE/niet-gedisputeerd; in-tx herlezing ziet een intussen geopend dispuut.
    createState.txCollaboration = {
      status: "ACTIVE",
      disputedAt: new Date("2026-07-02T00:00:00Z"),
    };
    const fd = invoiceFormData([{ description: "Advies", quantity: "2", unit: "95" }]);
    const res = await createInvoice("collab-1", undefined, fd);
    expect(res).toEqual({ error: NOT_BILLABLE });
    expect(db.invoiceCreate).not.toHaveBeenCalled();
  });

  it("TOCTOU: rolt terug wanneer de samenwerking in het venster wordt geannuleerd (in-tx hercheck)", async () => {
    createState.txCollaboration = { status: "CANCELLED", disputedAt: null };
    const fd = invoiceFormData([{ description: "Advies", quantity: "2", unit: "95" }]);
    const res = await createInvoice("collab-1", undefined, fd);
    expect(res).toEqual({ error: NOT_BILLABLE });
    expect(db.invoiceCreate).not.toHaveBeenCalled();
  });
});

// Regelplafond (persona-sweep DOEL 2, MED): `formData.getAll` is onbegrensd; een absurd aantal regels
// mag geen ongecontroleerde validatielus + geneste multi-row insert veroorzaken. Vroege, schone afwijzing.
describe("createInvoice — regelplafond (MAX_INVOICE_LINES)", () => {
  it("weigert een POST met meer dan 200 factuurregels zonder een factuur aan te maken", async () => {
    const lines = Array.from({ length: 201 }, (_, i) => ({
      description: `Regel ${i}`,
      quantity: "1",
      unit: "10",
    }));
    const res = await createInvoice("collab-1", undefined, invoiceFormData(lines));
    expect(res).toEqual({ error: "Een factuur mag maximaal 200 regels bevatten." });
    expect(db.invoiceCreate).not.toHaveBeenCalled();
  });
});

// Per-actor rate-limiter op createInvoice (persona-sweep DOEL 2, robuustheid/defense-in-depth): de
// zwaarste geldstroom-mutatie was de enige zonder rem. Bij overschrijding een schone afwijzing vóór
// enige DB-read/-write — geen 500, geen factuur, geen ownership-lek.
describe("createInvoice — per-actor rate-limiter", () => {
  const goodLines = [{ description: "Werk", quantity: "1", unit: "100" }];

  it("weigert schoon zodra de per-uur-limiet is bereikt, zonder een factuur aan te maken", async () => {
    rateLimitState.allowed = false;
    const res = await createInvoice("collab-1", undefined, invoiceFormData(goodLines));
    expect(res).toEqual({
      error: "Je hebt het maximum aantal facturen per uur bereikt. Probeer het later opnieuw.",
    });
    expect(db.invoiceCreate).not.toHaveBeenCalled();
  });

  it("de rem grijpt vóór de eigenaarschaps-/DB-reads (geen ownership-lek)", async () => {
    rateLimitState.allowed = false;
    // Zelfs met een onbekende/vreemde samenwerking blijft de melding de generieke rem-melding —
    // de limiter grijpt vóór loadOwnedCollaboration, dus er lekt niets over het bestaan.
    createState.collaboration = null;
    const res = await createInvoice("collab-x", undefined, invoiceFormData(goodLines));
    expect(res).toEqual({
      error: "Je hebt het maximum aantal facturen per uur bereikt. Probeer het later opnieuw.",
    });
    expect(db.invoiceCreate).not.toHaveBeenCalled();
  });

  it("laat een normale factuur door wanneer de limiet niet is bereikt", async () => {
    rateLimitState.allowed = true;
    const res = await createInvoice("collab-1", undefined, invoiceFormData(goodLines));
    // createInvoice eindigt in redirect() (gemockt) → geen error-object terug.
    expect(res).toBeUndefined();
    expect(db.invoiceCreate).toHaveBeenCalledTimes(1);
  });
});

// Jaarwissel-nummering (persona-sweep DOEL 2, correctheid): het jaarprefix van een (juridisch)
// factuurnummer moet met de Amsterdamse burgerlijke kalender meelopen, niet met server-UTC. Op de
// UTC-server (Railway) valt 31 dec 23:15 UTC binnen 1 jan Amsterdam; de eerste nieuwjaarsfactuur
// kreeg met `new Date().getFullYear()` nog het oude jaarprefix (reeks liep door i.p.v. reset naar 0001).
describe("createInvoice — jaarprefix volgt de Amsterdamse kalender op de jaarwissel", () => {
  const goodLines = [{ description: "Werk", quantity: "1", unit: "100" }];

  it("nummert een factuur op 31 dec 23:15 UTC (= 1 jan Amsterdam) onder het nieuwe jaar", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-31T23:15:00Z"));
    try {
      sequenceState.lastSeq = 1; // eerste factuur van het (Amsterdamse) nieuwe jaar
      const res = await createInvoice("collab-1", undefined, invoiceFormData(goodLines));
      expect(res).toBeUndefined();
      const arg = db.invoiceCreate.mock.calls[0]![0] as unknown as {
        data: { number: string; partyInvoiceNumber: string };
      };
      // Het (juridische) partij-nummer draagt het Amsterdamse jaarprefix; het globale nummer blijft
      // uniek via de `issuerKey:`-prefix.
      expect(arg.data.partyInvoiceNumber).toBe("2027-0001");
      expect(arg.data.number).toBe("user-1:2027-0001");
    } finally {
      vi.useRealTimers();
    }
  });
});

// Gatenvrije nummering PER UITSCHRIJVENDE PARTIJ (persona-sweep DOEL 1/2 — server-side waarheid, Wet
// OB art. 35a). Regressie-grendel: de losse-factuur-actie mag NIET meer platform-breed tellen
// (`invoice.count({ number: { startsWith } })`) — dat gaf elke ZZP'er gaten in zijn eigen reeks zodra
// een ander platform-lid factureerde. Ze deelt nu exact dezelfde per-partij-allocator als de cascade.
describe("createInvoice — gatenvrije factuurnummering per ZZP'er (geen platform-brede teller)", () => {
  const goodLines = [{ description: "Werk", quantity: "1", unit: "100" }];

  it("kent het nummer toe uit de eigen partij-reeks (issuerKey = de ZZP'er), niet platform-breed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    try {
      sequenceState.lastSeq = 7; // het 7e nummer in de eigen reeks van deze ZZP'er
      const res = await createInvoice("collab-1", undefined, invoiceFormData(goodLines));
      expect(res).toBeUndefined();
      const arg = db.invoiceCreate.mock.calls[0]![0] as unknown as {
        data: { number: string; partyInvoiceNumber: string; issuerKey: string };
      };
      // Partij-nummer uit de atomaire per-partij-allocator; globaal `number` uniek via issuerKey-prefix.
      expect(arg.data.partyInvoiceNumber).toBe("2026-0007");
      expect(arg.data.issuerKey).toBe("user-1");
      expect(arg.data.number).toBe("user-1:2026-0007");
      // De reeks wordt via de atomaire upsert-allocator toegewezen, niet via een platform-brede telling.
      expect(tx.invoiceSequenceUpsert).toHaveBeenCalledTimes(1);
      expect(db.invoiceCreate).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

// Dispuut-bevriezing op de geldstroom-acties (persona-sweep DOEL 2, MED): elke andere geld-mutatie in
// de cascade-laag blokkeert al op `disputedAt` (assertNotDisputed); de legacy factuuracties deden dat niet.
describe("sendInvoice/markInvoicePaid/cancelInvoice — bevroren bij een open dispuut", () => {
  const FROZEN = "De samenwerking is bevroren wegens een open dispuut. Los het dispuut eerst op.";

  it("sendInvoice weigert wanneer de samenwerking gedisputeerd is", async () => {
    invoiceState.found!.status = "DRAFT";
    invoiceState.found!.collaboration.disputedAt = new Date("2026-07-01T00:00:00Z");
    await expect(sendInvoice("inv-1")).rejects.toThrow(FROZEN);
    expect(tx.invoiceUpdateMany).not.toHaveBeenCalled();
  });

  it("markInvoicePaid weigert wanneer de samenwerking gedisputeerd is", async () => {
    roleState.role = "CLIENT";
    invoiceState.found!.collaboration.disputedAt = new Date("2026-07-01T00:00:00Z");
    await expect(markInvoicePaid("inv-1")).rejects.toThrow(FROZEN);
    expect(tx.invoiceUpdateMany).not.toHaveBeenCalled();
  });

  // Persona-sweep DOEL 2 (integriteit): cancelInvoice miste — anders dan zijn twee siblings — de
  // dispuut-rem. Een partij kon zo een verzonden factuur die ónder een open dispuut valt eenzijdig
  // annuleren (de gedisputeerde geldregel wissen vóór de admin het dispuut beslecht).
  it("cancelInvoice weigert wanneer de samenwerking gedisputeerd is (geen eenzijdige annulering)", async () => {
    invoiceState.found!.status = "SENT";
    invoiceState.found!.collaboration.disputedAt = new Date("2026-07-01T00:00:00Z");
    await expect(cancelInvoice("inv-1")).rejects.toThrow(FROZEN);
    expect(tx.invoiceUpdateMany).not.toHaveBeenCalled();
  });
});
