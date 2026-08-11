// Anti-oracle-contract voor reportNoShow (CWE-203 / OWASP A01 Broken Access Control).
//
// De server-action is direct aanroepbaar met een gegokt collaborationId. Vóór de fix onderscheidde een
// ONBEKEND id ("Samenwerking niet gevonden.") van een BESTAAND id waar de actor geen melder-partij is
// ("Alleen de opdrachtgever of de bemiddelaar kan een no-show melden."). De melding wordt verbatim naar
// de client gerenderd (NoShowReportState), dus élke ingelogde actor (incl. de ZZP'er zelf en een
// buitenstaander) kon zo het bestaan van een willekeurige samenwerking aftasten. Na de fix identiek.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const store = {
  actor: { id: "outsider-1", role: "FREELANCER", status: "ACTIVE", tenantId: null } as {
    id: string;
    role: string;
    status: string;
    tenantId: string | null;
  },
  collab: null as Record<string, unknown> | null,
};

const findUnique = vi.hoisted(() => vi.fn());
const rateCheck = vi.hoisted(() => vi.fn(async () => ({ allowed: true })));
const noShowFindFirst = vi.hoisted(() => vi.fn(async () => null as { id: string } | null));
const noShowCreate = vi.hoisted(() => vi.fn(async () => ({ id: "rep-1" })));
const notificationCreate = vi.hoisted(() => vi.fn(async () => ({ id: "not-1" })));
const auditLogCreate = vi.hoisted(() => vi.fn(async () => ({ id: "aud-1" })));
// Interactieve Serializable-transactie (dedup-race-guard): voer de callback uit met een tx-client
// die alle write-mocks deelt — create + notificatie + audit draaien atomair bínnen de transactie.
const runTransaction = vi.hoisted(() =>
  vi.fn(async (arg: unknown, _opts?: unknown) => {
    if (typeof arg === "function") {
      return (arg as (tx: unknown) => Promise<unknown>)({
        noShowReport: { findFirst: noShowFindFirst, create: noShowCreate },
        notification: { create: notificationCreate },
        auditLog: { create: auditLogCreate },
      });
    }
    return arg;
  }),
);

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/authz", () => ({ requireActor: vi.fn(async () => store.actor) }));
vi.mock("@/lib/audit", () => ({ auditData: (d: unknown) => d }));
vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: { findUnique },
    noShowReport: { findFirst: noShowFindFirst, create: noShowCreate },
    notification: { create: notificationCreate },
    auditLog: { create: auditLogCreate },
    $transaction: runTransaction,
  },
}));
vi.mock("@/lib/rate-limit", () => ({ noShowReportRateLimiter: { check: rateCheck } }));
vi.mock("@/lib/no-show", () => ({
  NO_SHOW_LIMIT: 3,
  noShowOccurredOnDayRange: () => ({ gte: new Date(), lt: new Date() }),
  noShowReportedNotificationBody: () => "No-show geregistreerd.",
}));
vi.mock("@/lib/format-date", () => ({ formatDateShortNl: () => "1 jan 2026" }));
// Zod-schema mag slagen: de oracle-poort ligt ná de validatie.
vi.mock("@/lib/validation", () => ({
  noShowReportSchema: {
    safeParse: () => ({
      success: true,
      data: { reason: "Niet komen opdagen.", occurredOn: new Date() },
    }),
  },
}));

import { reportNoShow } from "./no-show-actions";

function foreignCollab() {
  return {
    id: "col-1",
    status: "ACTIVE",
    company: { userId: "client-9" },
    freelancer: { id: "fp-9", userId: "zzp-9" },
    job: { title: "Nachtdienst", tenantId: "tenant-Z" },
  };
}

function form() {
  const fd = new FormData();
  fd.set("reason", "Niet komen opdagen.");
  fd.set("occurredOn", "2026-01-01");
  return fd;
}

beforeEach(() => {
  findUnique.mockReset();
  rateCheck.mockClear();
  noShowFindFirst.mockReset().mockResolvedValue(null);
  noShowCreate.mockClear();
  notificationCreate.mockClear();
  auditLogCreate.mockClear();
  runTransaction.mockClear();
  store.actor = { id: "outsider-1", role: "FREELANCER", status: "ACTIVE", tenantId: null };
});

describe("reportNoShow — existence-oracle (CWE-203)", () => {
  it("onbekend id → 'Samenwerking niet gevonden.'", async () => {
    findUnique.mockResolvedValue(null);
    const res = await reportNoShow("nope", undefined, form());
    expect(res).toEqual({ error: "Samenwerking niet gevonden." });
  });

  it("bestaande samenwerking waar de actor geen melder-partij is → IDENTIEKE melding (geen oracle)", async () => {
    findUnique.mockResolvedValue(foreignCollab());
    const res = await reportNoShow("col-1", undefined, form());
    expect(res).toEqual({ error: "Samenwerking niet gevonden." });
  });

  it("de twee meldingen zijn niet te onderscheiden", async () => {
    findUnique.mockResolvedValueOnce(null);
    const unknown = await reportNoShow("nope", undefined, form());
    findUnique.mockResolvedValueOnce(foreignCollab());
    const foreign = await reportNoShow("col-1", undefined, form());
    expect(foreign).toEqual(unknown);
  });
});

describe("reportNoShow — same-day dedup in één Serializable transactie (race-guard)", () => {
  function ownCollab() {
    return { ...foreignCollab(), company: { userId: "client-1" } };
  }

  function p2034() {
    return new Prisma.PrismaClientKnownRequestError("serialization conflict", {
      code: "P2034",
      clientVersion: "test",
    });
  }

  beforeEach(() => {
    store.actor = { id: "client-1", role: "CLIENT", status: "ACTIVE", tenantId: null };
  });

  it("bestaande melding voor dezelfde dag → geweigerd, geen rij/notificatie/audit", async () => {
    findUnique.mockResolvedValue(ownCollab());
    noShowFindFirst.mockResolvedValue({ id: "rep-bestaand" });
    const res = await reportNoShow("col-1", undefined, form());
    expect(res).toEqual({
      error: "Voor deze dag is al een no-show geregistreerd voor deze samenwerking.",
    });
    expect(noShowCreate).not.toHaveBeenCalled();
    expect(notificationCreate).not.toHaveBeenCalled();
    expect(auditLogCreate).not.toHaveBeenCalled();
  });

  it("verse dag → create + notificatie + audit atomair bínnen één Serializable transactie", async () => {
    findUnique.mockResolvedValue(ownCollab());
    const res = await reportNoShow("col-1", undefined, form());
    expect(res).toEqual({ ok: true });
    expect(noShowCreate).toHaveBeenCalledTimes(1);
    expect(notificationCreate).toHaveBeenCalledTimes(1);
    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    // Eén interactieve transactie (callback-vorm) met Serializable-isolatie.
    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(typeof runTransaction.mock.calls[0]?.[0]).toBe("function");
    expect(runTransaction.mock.calls[0]?.[1]).toMatchObject({
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it("P2034-serialisatieconflict → begrensde retry; verliezer ziet de gecommitte rij en weigert zonder dubbele side-effects", async () => {
    findUnique.mockResolvedValue(ownCollab());
    // Poging 1: conflict (de racende winnaar committe eerst). Poging 2: de check ziet die rij.
    runTransaction.mockRejectedValueOnce(p2034());
    noShowFindFirst.mockResolvedValue({ id: "rep-van-winnaar" });
    const res = await reportNoShow("col-1", undefined, form());
    expect(res).toEqual({
      error: "Voor deze dag is al een no-show geregistreerd voor deze samenwerking.",
    });
    expect(runTransaction).toHaveBeenCalledTimes(2);
    expect(noShowCreate).not.toHaveBeenCalled();
    expect(notificationCreate).not.toHaveBeenCalled();
    expect(auditLogCreate).not.toHaveBeenCalled();
  });

  it("P2034 gevolgd door een schone retry → precies één rij + notificatie + audit", async () => {
    findUnique.mockResolvedValue(ownCollab());
    runTransaction.mockRejectedValueOnce(p2034());
    const res = await reportNoShow("col-1", undefined, form());
    expect(res).toEqual({ ok: true });
    expect(runTransaction).toHaveBeenCalledTimes(2);
    expect(noShowCreate).toHaveBeenCalledTimes(1);
    expect(notificationCreate).toHaveBeenCalledTimes(1);
    expect(auditLogCreate).toHaveBeenCalledTimes(1);
  });

  it("een niet-P2034-fout wordt niet her-geprobeerd maar gepropageerd", async () => {
    findUnique.mockResolvedValue(ownCollab());
    runTransaction.mockRejectedValueOnce(new Error("db down"));
    await expect(reportNoShow("col-1", undefined, form())).rejects.toThrow("db down");
    expect(runTransaction).toHaveBeenCalledTimes(1);
  });
});
