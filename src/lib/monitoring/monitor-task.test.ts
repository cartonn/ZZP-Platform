import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock de DB-laag: we voeden audit-rijen in en controleren dat de runner een incident
// aanmaakt en admins waarschuwt bij CRITICAL — zonder echte database.

const store = {
  auditRows: [] as Array<Record<string, unknown>>,
  incidents: new Map<string, unknown>(),
  created: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
};

vi.mock("@/lib/db", () => ({
  prisma: {
    auditLog: { findMany: vi.fn(async () => store.auditRows) },
    healthIncident: {
      findUnique: vi.fn(
        async ({ where }: { where: { dedupeKey: string } }) =>
          store.incidents.get(where.dedupeKey) ?? null,
      ),
      create: vi.fn(async ({ data }: { data: { dedupeKey: string } }) => {
        store.incidents.set(data.dedupeKey, data);
        store.created.push(data);
        return data;
      }),
    },
    user: { findMany: vi.fn(async () => [{ id: "admin-1" }, { id: "admin-2" }]) },
    notification: {
      createMany: vi.fn(async ({ data }: { data: Array<Record<string, unknown>> }) => {
        store.notifications.push(...data);
        return { count: data.length };
      }),
    },
  },
}));

vi.mock("@/lib/audit", () => ({ audit: vi.fn(async () => {}) }));

const now = new Date("2026-06-01T14:30:00Z");
function failedLogin(ip: string) {
  return {
    action: "USER_LOGIN_FAILED",
    actorId: null,
    ipAddress: ip,
    metadata: null,
    createdAt: now,
  };
}

describe("runMonitorTask", () => {
  beforeEach(() => {
    store.auditRows = [];
    store.incidents.clear();
    store.created = [];
    store.notifications = [];
  });

  it("maakt een CRITICAL incident en waarschuwt alle admins bij een grote login-burst", async () => {
    store.auditRows = Array.from({ length: 15 }, () => failedLogin("6.6.6.6"));
    const { runMonitorTask } = await import("@/lib/monitoring/monitor-task");
    const result = await runMonitorTask({ now });

    expect(result.newIncidents).toBe(1);
    expect(store.created[0]?.severity).toBe("CRITICAL");
    expect(store.created[0]?.code).toBe("LOGIN_BURST");
    // 2 admins gewaarschuwd.
    expect(result.adminsNotified).toBe(2);
    expect(store.notifications).toHaveLength(2);
  });

  it("is idempotent: tweede run met hetzelfde signaal maakt geen nieuw incident", async () => {
    store.auditRows = Array.from({ length: 6 }, () => failedLogin("7.7.7.7"));
    const { runMonitorTask } = await import("@/lib/monitoring/monitor-task");
    const first = await runMonitorTask({ now });
    const second = await runMonitorTask({ now });
    expect(first.newIncidents).toBe(1);
    expect(second.newIncidents).toBe(0);
  });

  it("geen anomalie → geen incidenten, geen notificaties", async () => {
    store.auditRows = [failedLogin("8.8.8.8")]; // 1 < drempel
    const { runMonitorTask } = await import("@/lib/monitoring/monitor-task");
    const result = await runMonitorTask({ now });
    expect(result.newIncidents).toBe(0);
    expect(store.notifications).toHaveLength(0);
  });
});
