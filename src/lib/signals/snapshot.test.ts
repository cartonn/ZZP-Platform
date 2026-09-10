import { beforeEach, describe, expect, it, vi } from "vitest";

// De snapshot is een CACHE VAN DE UITKOMST: wat we hier vastleggen is dat hij (a) niets zelf telt —
// de badges komen altijd uit `navBadges`/`pendingTaskCount` — en (b) fail-safe is: elke fout aan de
// cache-kant valt terug op de volledige berekening, want een stille lege shell is erger dan een dure.

type SnapshotRow = {
  role: string;
  version: number;
  staleAfter: Date;
  computedAt: Date;
  pendingTaskCount: number;
  unreadNotifications: number;
  badges: { href: string; count: number; tone: string }[];
};

const snapshotFindUnique = vi.fn(
  (_a: unknown): Promise<SnapshotRow | null> => Promise.resolve(null),
);
const transaction = vi.fn((_ops: unknown[]): Promise<unknown[]> => Promise.resolve([]));
const notificationCount = vi.fn((_a: unknown): Promise<number> => Promise.resolve(0));
const upsert = vi.fn((a: unknown) => a);
const deleteMany = vi.fn((a: unknown) => a);
const createMany = vi.fn((a: unknown) => a);

vi.mock("@/lib/db", () => ({
  prisma: {
    userSignalSnapshot: {
      findUnique: (a: unknown) => snapshotFindUnique(a),
      upsert: (a: unknown) => upsert(a),
    },
    userSignalBadge: {
      deleteMany: (a: unknown) => deleteMany(a),
      createMany: (a: unknown) => createMany(a),
    },
    notification: { count: (a: unknown) => notificationCount(a) },
    $transaction: (ops: unknown[]) => transaction(ops),
  },
}));

const navBadges = vi.fn(
  (_role: string, _userId: string): Promise<Record<string, { count: number; tone: string }>> =>
    Promise.resolve({ "/certificaten": { count: 2, tone: "attention" } }),
);
vi.mock("@/lib/signals", () => ({ navBadges: (r: string, u: string) => navBadges(r, u) }));

const pendingTaskCount = vi.fn(
  (_userId: string, _role: string): Promise<number> => Promise.resolve(3),
);
vi.mock("@/lib/actions/pending-tasks", () => ({
  pendingTaskCount: (u: string, r: string) => pendingTaskCount(u, r),
}));

import {
  diffSignals,
  isSnapshotUsable,
  readSignalSnapshot,
  recomputeSignalSnapshot,
  SIGNAL_SNAPSHOT_TTL_MS,
  SIGNAL_SNAPSHOT_VERSION,
  toBadgeRows,
  toNavBadges,
} from "./snapshot";

const NOW = new Date("2026-09-04T12:00:00.000Z");

function usableRow(overrides: Partial<SnapshotRow> = {}): SnapshotRow {
  return {
    role: "FREELANCER",
    version: SIGNAL_SNAPSHOT_VERSION,
    // Ruim in de toekomst: `readSignalSnapshot` gebruikt de wandklok, dus een relatief vervalmoment
    // zou de test van de looptijd laten afhangen.
    staleAfter: new Date("2999-01-01T00:00:00.000Z"),
    computedAt: new Date(NOW.getTime() - 5_000),
    pendingTaskCount: 7,
    unreadNotifications: 4,
    badges: [{ href: "/berichten", count: 1, tone: "info" }],
    ...overrides,
  };
}

beforeEach(() => {
  snapshotFindUnique.mockClear();
  snapshotFindUnique.mockResolvedValue(null);
  transaction.mockClear();
  transaction.mockResolvedValue([]);
  notificationCount.mockClear();
  notificationCount.mockResolvedValue(5);
  navBadges.mockClear();
  pendingTaskCount.mockClear();
  upsert.mockClear();
  deleteMany.mockClear();
  createMany.mockClear();
});

describe("toNavBadges / toBadgeRows", () => {
  it("is een heen-en-weer-conversie zonder verlies", () => {
    const badges = {
      "/certificaten": { count: 2, tone: "attention" as const },
      "/berichten": { count: 9, tone: "info" as const },
    };
    expect(toNavBadges(toBadgeRows("u1", badges))).toEqual(badges);
  });

  it("sorteert de rijen op href (stabiele volgorde, leesbare diffs)", () => {
    const rows = toBadgeRows("u1", {
      "/opgeslagen": { count: 1, tone: "info" },
      "/berichten": { count: 2, tone: "info" },
    });
    expect(rows.map((r) => r.href)).toEqual(["/berichten", "/opgeslagen"]);
    expect(rows.every((r) => r.userId === "u1")).toBe(true);
  });

  it("toont geen badge met telling 0 en valt terug op de rustige toon bij een onbekende toon", () => {
    expect(
      toNavBadges([
        { href: "/leeg", count: 0, tone: "attention" },
        { href: "/raar", count: 3, tone: "onzin" },
      ]),
    ).toEqual({ "/raar": { count: 3, tone: "info" } });
  });
});

describe("isSnapshotUsable", () => {
  it("accepteert een verse rij van dezelfde rol en versie", () => {
    expect(isSnapshotUsable(usableRow(), "FREELANCER", NOW)).toBe(true);
  });

  it("weigert een ontbrekende rij, een andere rol, een oudere versie en een verlopen rij", () => {
    expect(isSnapshotUsable(null, "FREELANCER", NOW)).toBe(false);
    expect(isSnapshotUsable(usableRow({ role: "CLIENT" }), "FREELANCER", NOW)).toBe(false);
    expect(
      isSnapshotUsable(usableRow({ version: SIGNAL_SNAPSHOT_VERSION - 1 }), "FREELANCER", NOW),
    ).toBe(false);
    expect(
      isSnapshotUsable(usableRow({ staleAfter: new Date(NOW.getTime() - 1) }), "FREELANCER", NOW),
    ).toBe(false);
  });
});

describe("diffSignals", () => {
  const base = {
    badges: { "/certificaten": { count: 2, tone: "attention" as const } },
    pendingTaskCount: 3,
    unreadNotifications: 1,
  };

  it("ziet geen verschil bij gelijke standen", () => {
    expect(diffSignals(base, { ...base })).toEqual([]);
  });

  it("noemt de afwijkende sleutels — tellers, tonen en verdwenen badges", () => {
    expect(
      diffSignals(base, {
        badges: { "/berichten": { count: 1, tone: "info" } },
        pendingTaskCount: 4,
        unreadNotifications: 1,
      }),
    ).toEqual(["pendingTaskCount", "/berichten", "/certificaten"]);
    expect(
      diffSignals(base, {
        ...base,
        badges: { "/certificaten": { count: 2, tone: "info" } },
      }),
    ).toEqual(["/certificaten"]);
  });
});

describe("readSignalSnapshot", () => {
  it("leest een bruikbare snapshot met ÉÉN query en herberekent niets", async () => {
    snapshotFindUnique.mockResolvedValue(usableRow());
    const result = await readSignalSnapshot("u1", "FREELANCER");
    expect(snapshotFindUnique).toHaveBeenCalledTimes(1);
    expect(navBadges).not.toHaveBeenCalled();
    expect(pendingTaskCount).not.toHaveBeenCalled();
    expect(notificationCount).not.toHaveBeenCalled();
    expect(result.recomputed).toBe(false);
    expect(result.pendingTaskCount).toBe(7);
    expect(result.unreadNotifications).toBe(4);
    expect(result.badges).toEqual({ "/berichten": { count: 1, tone: "info" } });
  });

  it("herberekent bij een verlopen rij (fallback = het huidige gedrag)", async () => {
    snapshotFindUnique.mockResolvedValue(
      usableRow({ staleAfter: new Date("2000-01-01T00:00:00.000Z") }),
    );
    const result = await readSignalSnapshot("u2", "FREELANCER");
    expect(navBadges).toHaveBeenCalledWith("FREELANCER", "u2");
    expect(pendingTaskCount).toHaveBeenCalledWith("u2", "FREELANCER");
    expect(result.recomputed).toBe(true);
    expect(result.badges).toEqual({ "/certificaten": { count: 2, tone: "attention" } });
    expect(result.pendingTaskCount).toBe(3);
    expect(result.unreadNotifications).toBe(5);
  });

  it("herberekent bij een rol-wissel, zodat nooit andermans-rol-badges worden getoond", async () => {
    snapshotFindUnique.mockResolvedValue(usableRow({ role: "CLIENT" }));
    const result = await readSignalSnapshot("u3", "FREELANCER");
    expect(result.recomputed).toBe(true);
    expect(navBadges).toHaveBeenCalledWith("FREELANCER", "u3");
  });

  it("valt terug op de berekening als de snapshot-lezing zelf faalt", async () => {
    snapshotFindUnique.mockRejectedValue(new Error("db weg"));
    const result = await readSignalSnapshot("u4", "FREELANCER");
    expect(result.recomputed).toBe(true);
    expect(result.pendingTaskCount).toBe(3);
  });

  it("wacht niet op het terugschrijven van de cache", async () => {
    // De render mag nooit op een cache-vulling wachten (op SQLite blokkeert zo'n write ook nog eens
    // gelijktijdige lezers). De lezer keert dus terug vóórdat de write klaar is.
    let releaseWrite: (() => void) | undefined;
    transaction.mockReturnValue(
      new Promise<unknown[]>((resolve) => {
        releaseWrite = () => resolve([]);
      }),
    );
    const result = await readSignalSnapshot("u7", "FREELANCER");
    expect(result.recomputed).toBe(true);
    expect(result.pendingTaskCount).toBe(3);
    releaseWrite?.();
  });

  it("schrijft hooguit één keer tegelijk per gebruiker (prefetch-storm)", async () => {
    // Next rendert de shell ook voor élke prefetch; die missen allemaal dezelfde koude cache. Zonder
    // grendel levert één navigatie een handvol gelijktijdige writes op.
    let releaseWrite: (() => void) | undefined;
    transaction.mockReturnValue(
      new Promise<unknown[]>((resolve) => {
        releaseWrite = () => resolve([]);
      }),
    );
    await Promise.all([
      readSignalSnapshot("u8", "FREELANCER"),
      readSignalSnapshot("u8", "FREELANCER"),
      readSignalSnapshot("u8", "FREELANCER"),
    ]);
    expect(transaction).toHaveBeenCalledTimes(1);
    releaseWrite?.();
  });
});

describe("recomputeSignalSnapshot", () => {
  it("schrijft de uitkomst weg: upsert + badges vervangen, in één transactie", async () => {
    const result = await recomputeSignalSnapshot("u5", "FREELANCER", NOW);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: "u5" } });
    expect(createMany).toHaveBeenCalledWith({
      data: [{ userId: "u5", href: "/certificaten", count: 2, tone: "attention" }],
    });
    const upserted = upsert.mock.calls[0]?.[0] as {
      create: { staleAfter: Date; version: number; role: string };
    };
    expect(upserted.create.role).toBe("FREELANCER");
    expect(upserted.create.version).toBe(SIGNAL_SNAPSHOT_VERSION);
    expect(upserted.create.staleAfter.getTime()).toBe(NOW.getTime() + SIGNAL_SNAPSHOT_TTL_MS);
    expect(result.computedAt).toEqual(NOW);
  });

  it("geeft de verse waarden ook terug als het wegschrijven faalt (cache breekt nooit een render)", async () => {
    transaction.mockRejectedValue(new Error("rij weg"));
    const result = await recomputeSignalSnapshot("u6", "FREELANCER", NOW);
    expect(result.pendingTaskCount).toBe(3);
    expect(result.badges).toEqual({ "/certificaten": { count: 2, tone: "attention" } });
  });
});
