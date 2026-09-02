// Unit-tests voor het weesblob-grootboek + reconciliatie. Prisma-laag + storage-driver volledig
// gemockt; klok via vaste datum geïnjecteerd. Dekt: gefaalde-opruiming vastleggen (create/increment/
// heropenen/fail-safe), reconciliatie (reclaim, opnieuw-falen bumpt, oudste-eerst, limiet, retentie-snoei)
// en de audit-registratie van de taak.

import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

// --- In-memory store --------------------------------------------------------
type Row = {
  id: string;
  storageKey: string;
  source: string;
  attempts: number;
  firstFailedAt: Date;
  lastAttemptAt: Date;
  reclaimedAt: Date | null;
  lastError: string | null;
};

const store = {
  rows: [] as Row[],
  auditLogs: [] as Array<Record<string, unknown>>,
};

let idSeq = 0;

function applyData(row: Row, data: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(data)) {
    if (
      value &&
      typeof value === "object" &&
      "increment" in (value as Record<string, unknown>) &&
      key === "attempts"
    ) {
      row.attempts += (value as { increment: number }).increment;
    } else {
      (row as Record<string, unknown>)[key] = value;
    }
  }
}

const prismaMock = {
  orphanedStorageObject: {
    upsert: vi.fn(
      async (args: {
        where: { storageKey: string };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => {
        const existing = store.rows.find((r) => r.storageKey === args.where.storageKey);
        if (existing) {
          applyData(existing, args.update);
          return { ...existing };
        }
        const row: Row = {
          id: `o${++idSeq}`,
          storageKey: args.where.storageKey,
          source: "",
          attempts: 1,
          firstFailedAt: new Date(0),
          lastAttemptAt: new Date(0),
          reclaimedAt: null,
          lastError: null,
          ...(args.create as Partial<Row>),
        } as Row;
        store.rows.push(row);
        return { ...row };
      },
    ),
    findMany: vi.fn(
      async (args?: {
        where?: { reclaimedAt?: null };
        orderBy?: { firstFailedAt?: "asc" | "desc" };
        take?: number;
        select?: Record<string, boolean>;
      }) => {
        let rows = store.rows.filter((r) =>
          args?.where && "reclaimedAt" in args.where ? r.reclaimedAt === null : true,
        );
        if (args?.orderBy?.firstFailedAt === "asc") {
          rows = [...rows].sort((a, b) => a.firstFailedAt.getTime() - b.firstFailedAt.getTime());
        }
        if (typeof args?.take === "number") rows = rows.slice(0, args.take);
        return rows.map((r) => ({ id: r.id, storageKey: r.storageKey }));
      },
    ),
    update: vi.fn(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = store.rows.find((r) => r.id === args.where.id);
      if (!row) throw new Error("not found");
      applyData(row, args.data);
      return { ...row };
    }),
    deleteMany: vi.fn(async (args: { where: { reclaimedAt: { lt: Date } } }) => {
      const cutoff = args.where.reclaimedAt.lt;
      const before = store.rows.length;
      store.rows = store.rows.filter(
        (r) => !(r.reclaimedAt !== null && r.reclaimedAt.getTime() < cutoff.getTime()),
      );
      return { count: before - store.rows.length };
    }),
    count: vi.fn(async (args?: { where?: { reclaimedAt?: null } }) => {
      return store.rows.filter((r) =>
        args?.where && "reclaimedAt" in args.where ? r.reclaimedAt === null : true,
      ).length;
    }),
  },
  auditLog: {
    create: vi.fn(async (args: { data: Record<string, unknown> }) => {
      store.auditLogs.push(args.data);
      return args.data;
    }),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const logSpy = vi.fn();
vi.mock("@/lib/observability/storage-failure", () => ({
  logStorageCleanupFailure: (...args: unknown[]) => logSpy(...args),
}));

// Dynamische import (na de hoisted vi.mock + top-level mockdefinities), zoals de andere task-tests —
// een statische import wordt boven de mockdefinities gehesen en faalt op "before initialization".
let recordStorageCleanupFailure: typeof import("./storage-orphans").recordStorageCleanupFailure;
let reconcileOrphanedStorageObjects: typeof import("./storage-orphans").reconcileOrphanedStorageObjects;
let runStorageOrphanReconcileTask: typeof import("./storage-orphans").runStorageOrphanReconcileTask;
let openOrphanedStorageWhere: typeof import("./storage-orphans").openOrphanedStorageWhere;

beforeAll(async () => {
  ({
    recordStorageCleanupFailure,
    reconcileOrphanedStorageObjects,
    runStorageOrphanReconcileTask,
    openOrphanedStorageWhere,
  } = await import("./storage-orphans"));
});

beforeEach(() => {
  store.rows = [];
  store.auditLogs = [];
  idSeq = 0;
  logSpy.mockClear();
  prismaMock.orphanedStorageObject.upsert.mockClear();
});

describe("openOrphanedStorageWhere", () => {
  it("selecteert uitsluitend nog-openstaande weesblobs (reclaimedAt = null)", () => {
    expect(openOrphanedStorageWhere()).toEqual({ reclaimedAt: null });
  });
});

describe("recordStorageCleanupFailure", () => {
  it("logt PII-veilig én legt een nieuwe weesblob vast", async () => {
    await recordStorageCleanupFailure("avg-erasure", "docs/u1/vog.pdf", new Error("S3 timeout"));
    expect(logSpy).toHaveBeenCalledWith("[avg-erasure]", "docs/u1/vog.pdf", expect.any(Error));
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]).toMatchObject({
      storageKey: "docs/u1/vog.pdf",
      source: "avg-erasure",
      attempts: 1,
      reclaimedAt: null,
    });
    expect(store.rows[0].lastError).toContain("S3 timeout");
  });

  it("bumpt de teller bij herhaald falen van dezelfde sleutel (idempotent op storageKey)", async () => {
    await recordStorageCleanupFailure("document-delete", "docs/u1/a.pdf", new Error("blip 1"));
    await recordStorageCleanupFailure("document-delete", "docs/u1/a.pdf", new Error("blip 2"));
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0].attempts).toBe(2);
    expect(store.rows[0].lastError).toContain("blip 2");
  });

  it("heropent een eerder gereclaimede rij die opnieuw faalt", async () => {
    await recordStorageCleanupFailure("logo-replace", "logos/x.png", new Error("boom"));
    store.rows[0].reclaimedAt = new Date("2026-01-01T00:00:00Z");
    await recordStorageCleanupFailure("logo-replace", "logos/x.png", new Error("again"));
    expect(store.rows[0].reclaimedAt).toBeNull();
  });

  it("is fail-safe: werpt niet als het grootboek niet te schrijven is (log blijft vangnet)", async () => {
    prismaMock.orphanedStorageObject.upsert.mockRejectedValueOnce(new Error("db down"));
    await expect(
      recordStorageCleanupFailure("certificate-delete", "docs/u2/dip.pdf", new Error("x")),
    ).resolves.toBeUndefined();
    // Eén log voor de opruimfout, één voor de mislukte grootboek-schrijf.
    expect(logSpy).toHaveBeenCalledTimes(2);
  });

  it("maskeert een e-mailachtige waarde in de foutmelding vóór opslag (lastError is een persistente sink)", async () => {
    await recordStorageCleanupFailure(
      "avg-erasure",
      "docs/u3/vog.pdf",
      new Error("weigering voor jan.jansen@firma.nl"),
    );
    expect(store.rows[0].lastError).toContain("j***@firma.nl");
    expect(store.rows[0].lastError).not.toContain("jan.jansen@firma.nl");
  });
});

describe("reconcileOrphanedStorageObjects", () => {
  function seed(rows: Partial<Row>[]): void {
    store.rows = rows.map((r, i) => ({
      id: `o${i + 1}`,
      storageKey: `k${i + 1}`,
      source: "avg-erasure",
      attempts: 1,
      firstFailedAt: new Date(2026, 0, i + 1),
      lastAttemptAt: new Date(2026, 0, i + 1),
      reclaimedAt: null,
      lastError: "boom",
      ...r,
    }));
  }

  it("reclaimt een weesblob wanneer de delete nu slaagt (zet reclaimedAt, wist lastError)", async () => {
    seed([{ storageKey: "docs/u1/vog.pdf" }]);
    const storage = { delete: vi.fn(async () => {}) };
    const now = new Date("2026-02-01T00:00:00Z");
    const res = await reconcileOrphanedStorageObjects({ storage: storage as never, now });
    expect(storage.delete).toHaveBeenCalledWith("docs/u1/vog.pdf");
    expect(res).toMatchObject({ attempted: 1, reclaimed: 1, stillFailing: 0 });
    expect(store.rows[0].reclaimedAt).toEqual(now);
    expect(store.rows[0].lastError).toBeNull();
  });

  it("laat een weesblob openstaan en bumpt de teller wanneer de delete opnieuw faalt", async () => {
    seed([{ attempts: 2 }]);
    const storage = { delete: vi.fn(async () => Promise.reject(new Error("still down"))) };
    const res = await reconcileOrphanedStorageObjects({
      storage: storage as never,
      now: new Date(),
    });
    expect(res).toMatchObject({ reclaimed: 0, stillFailing: 1 });
    expect(store.rows[0].reclaimedAt).toBeNull();
    expect(store.rows[0].attempts).toBe(3);
    expect(store.rows[0].lastError).toContain("still down");
  });

  it("verwerkt de oudste openstaande weesblob eerst en respecteert de limiet", async () => {
    seed([
      { storageKey: "new", firstFailedAt: new Date(2026, 0, 10) },
      { storageKey: "old", firstFailedAt: new Date(2026, 0, 1) },
    ]);
    const deleted: string[] = [];
    const storage = { delete: vi.fn(async (k: string) => void deleted.push(k)) };
    await reconcileOrphanedStorageObjects({ storage: storage as never, now: new Date(), limit: 1 });
    expect(deleted).toEqual(["old"]);
  });

  it("snoeit oude, al-gereclaimede grootboekrijen (retentie) maar laat verse staan", async () => {
    const now = new Date("2026-03-01T00:00:00Z");
    const old = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000); // 40 dagen — buiten venster
    const recent = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 dagen — binnen venster
    seed([
      { storageKey: "oldreclaimed", reclaimedAt: old },
      { storageKey: "recentreclaimed", reclaimedAt: recent },
    ]);
    const storage = { delete: vi.fn(async () => {}) };
    const res = await reconcileOrphanedStorageObjects({ storage: storage as never, now });
    expect(res.pruned).toBe(1);
    expect(store.rows.map((r) => r.storageKey)).toEqual(["recentreclaimed"]);
    // Reeds gereclaimede rijen tellen niet als "openstaand" → geen delete-poging.
    expect(storage.delete).not.toHaveBeenCalled();
  });
});

describe("runStorageOrphanReconcileTask", () => {
  it("audit bij een betekenisvolle uitkomst (iets gereclaimed)", async () => {
    store.rows = [
      {
        id: "o1",
        storageKey: "k1",
        source: "avg-erasure",
        attempts: 1,
        firstFailedAt: new Date(2026, 0, 1),
        lastAttemptAt: new Date(2026, 0, 1),
        reclaimedAt: null,
        lastError: "boom",
      },
    ];
    const spy = vi
      .spyOn(await import("./storage"), "getStorage")
      .mockReturnValue({ delete: vi.fn(async () => {}) } as never);
    const res = await runStorageOrphanReconcileTask({ actorId: null, now: new Date() });
    expect(res.reclaimed).toBe(1);
    expect(store.auditLogs).toHaveLength(1);
    expect(store.auditLogs[0]).toMatchObject({ action: "STORAGE_ORPHANS_RECONCILED" });
    spy.mockRestore();
  });

  it("audit NIET bij een lege run (geen achterstand, niets gesnoeid)", async () => {
    store.rows = [];
    const spy = vi
      .spyOn(await import("./storage"), "getStorage")
      .mockReturnValue({ delete: vi.fn(async () => {}) } as never);
    await runStorageOrphanReconcileTask({ actorId: null, now: new Date() });
    expect(store.auditLogs).toHaveLength(0);
    spy.mockRestore();
  });
});
