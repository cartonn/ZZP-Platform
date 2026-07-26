// Unit-tests voor runRoutingCacheRetentionTask — verlopen routing-cacherijen (GeocodeCache,
// TravelRouteCache) worden fysiek verwijderd (AVG art. 5(1)(e)), niet-verlopen rijen blijven staan,
// gebatchte verwijdering, idempotentie, en het snoei-auditrecord (zonder PII). Prisma-laag in-memory
// gemockt; klok geïnjecteerd.

import { describe, it, expect, vi, beforeEach } from "vitest";

interface GeocodeRow {
  id: string;
  expiresAt: Date;
}

interface RouteRow {
  id: string;
  expiresAt: Date;
}

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: string | null;
  createdAt: Date;
}

const store = {
  geocode: [] as GeocodeRow[],
  route: [] as RouteRow[],
  auditLogs: [] as AuditRow[],
};
let idSeq = 0;

vi.mock("@/lib/db", () => ({
  prisma: {
    geocodeCache: {
      findMany: vi.fn(async (args: { where: { expiresAt: { lt: Date } }; take: number }) => {
        const cutoff = args.where.expiresAt.lt;
        return store.geocode
          .filter((r) => r.expiresAt < cutoff)
          .slice(0, args.take)
          .map((r) => ({ id: r.id }));
      }),
      deleteMany: vi.fn(async (args: { where: { id: { in: string[] } } }) => {
        const ids = new Set(args.where.id.in);
        const before = store.geocode.length;
        store.geocode = store.geocode.filter((r) => !ids.has(r.id));
        return { count: before - store.geocode.length };
      }),
    },
    travelRouteCache: {
      findMany: vi.fn(async (args: { where: { expiresAt: { lt: Date } }; take: number }) => {
        const cutoff = args.where.expiresAt.lt;
        return store.route
          .filter((r) => r.expiresAt < cutoff)
          .slice(0, args.take)
          .map((r) => ({ id: r.id }));
      }),
      deleteMany: vi.fn(async (args: { where: { id: { in: string[] } } }) => {
        const ids = new Set(args.where.id.in);
        const before = store.route.length;
        store.route = store.route.filter((r) => !ids.has(r.id));
        return { count: before - store.route.length };
      }),
    },
    auditLog: {
      create: vi.fn(async (args: { data: Omit<AuditRow, "id" | "createdAt"> }) => {
        const row: AuditRow = { id: `audit-${idSeq++}`, createdAt: new Date(), ...args.data };
        store.auditLogs.push(row);
        return row;
      }),
    },
  },
}));

import { runRoutingCacheRetentionTask } from "@/lib/routing-cache-retention-task";

const NOW = new Date("2026-07-26T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function seedGeocode(count: number, expiresInDays: number, prefix: string): void {
  for (let i = 0; i < count; i++) {
    store.geocode.push({
      id: `geo-${prefix}-${i}`,
      expiresAt: new Date(NOW.getTime() + expiresInDays * DAY),
    });
  }
}

function seedRoute(count: number, expiresInDays: number, prefix: string): void {
  for (let i = 0; i < count; i++) {
    store.route.push({
      id: `route-${prefix}-${i}`,
      expiresAt: new Date(NOW.getTime() + expiresInDays * DAY),
    });
  }
}

beforeEach(() => {
  store.geocode = [];
  store.route = [];
  store.auditLogs = [];
  idSeq = 0;
});

describe("runRoutingCacheRetentionTask", () => {
  it("bevestigt eerst dat verlopen rijen zónder sweep zouden blijven staan (rood-bewijs)", () => {
    // De leeslaag negeert verlopen rijen alleen lazy; zonder deze sweep persisteert de PII fysiek.
    seedGeocode(2, -10, "old");
    seedRoute(2, -10, "old");
    expect(store.geocode).toHaveLength(2);
    expect(store.route).toHaveLength(2);
  });

  it("verwijdert verlopen rijen uit BEIDE tabellen en laat niet-verlopen rijen staan", async () => {
    seedGeocode(3, -5, "old"); // verlopen → weg
    seedGeocode(2, 30, "fresh"); // nog geldig → blijft
    seedRoute(4, -1, "old"); // verlopen → weg
    seedRoute(1, 10, "fresh"); // nog geldig → blijft

    const res = await runRoutingCacheRetentionTask({ now: NOW });

    expect(res.geocodePruned).toBe(3);
    expect(res.routePruned).toBe(4);
    expect(store.geocode.filter((r) => r.id.startsWith("geo-fresh"))).toHaveLength(2);
    expect(store.geocode.filter((r) => r.id.startsWith("geo-old"))).toHaveLength(0);
    expect(store.route.filter((r) => r.id.startsWith("route-fresh"))).toHaveLength(1);
    expect(store.route.filter((r) => r.id.startsWith("route-old"))).toHaveLength(0);
  });

  it("laat rijen die exact op de klok verlopen (expiresAt === now) staan (strikt < cutoff)", async () => {
    seedGeocode(1, 0, "edge");
    seedRoute(1, 0, "edge");
    const res = await runRoutingCacheRetentionTask({ now: NOW });
    expect(res.geocodePruned).toBe(0);
    expect(res.routePruned).toBe(0);
    expect(store.geocode).toHaveLength(1);
    expect(store.route).toHaveLength(1);
  });

  it("verwerkt meerdere batches (> BATCH_SIZE) in één run", async () => {
    seedGeocode(1200, -30, "old");
    seedRoute(1100, -30, "old");
    const res = await runRoutingCacheRetentionTask({ now: NOW });
    expect(res.geocodePruned).toBe(1200);
    expect(res.routePruned).toBe(1100);
    expect(store.geocode).toHaveLength(0);
    expect(store.route).toHaveLength(0);
  });

  it("schrijft één snoei-auditrecord (zonder PII) alleen bij daadwerkelijk snoeien", async () => {
    seedGeocode(1, -10, "old");
    seedRoute(2, -10, "old");
    await runRoutingCacheRetentionTask({ now: NOW });
    const records = store.auditLogs.filter((r) => r.action === "ROUTING_CACHE_PRUNED");
    expect(records).toHaveLength(1);
    expect(records[0]?.entityType).toBe("GeocodeCache");
    // Metadata bevat alleen aantallen + cutoff — geen query/plaatsnaam-PII.
    const meta = JSON.parse(records[0]?.metadata ?? "{}");
    expect(meta).toEqual({ geocodePruned: 1, routePruned: 2, cutoff: NOW.toISOString() });
  });

  it("schrijft geen auditrecord als er niets te snoeien is", async () => {
    seedGeocode(2, 30, "fresh");
    seedRoute(2, 30, "fresh");
    const res = await runRoutingCacheRetentionTask({ now: NOW });
    expect(res.geocodePruned).toBe(0);
    expect(res.routePruned).toBe(0);
    expect(store.auditLogs).toHaveLength(0);
  });

  it("is idempotent: een tweede run met dezelfde klok snoeit niets meer", async () => {
    seedGeocode(3, -10, "old");
    seedRoute(3, -10, "old");
    await runRoutingCacheRetentionTask({ now: NOW });
    const second = await runRoutingCacheRetentionTask({ now: NOW });
    expect(second.geocodePruned).toBe(0);
    expect(second.routePruned).toBe(0);
  });
});
