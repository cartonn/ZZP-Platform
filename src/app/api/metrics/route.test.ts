// Route-test voor het metrics-endpoint (/api/metrics). Bewijst de fail-closed autorisatie (geen
// CRON_SECRET → 503; ontbrekende/verkeerde Bearer → 401), de Prometheus-tekstexpositie bij een
// geldig verzoek, de JSON-variant (?format=json), en dat een DB-ping-fout de respons niet omverhaalt
// (zzp_db_reachable 0 i.p.v. een 500). Geen echte DB — Prisma + heartbeat-lezers zijn gemockt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const queryRawMock = vi.hoisted(() => vi.fn(async () => [{ "1": 1 }]));
const countMock = vi.hoisted(() => vi.fn(async () => 4));
vi.mock("@/lib/db", () => ({
  prisma: { $queryRaw: queryRawMock, credential: { count: countMock } },
}));

const cronMock = vi.hoisted(() =>
  vi.fn(async () => ({
    status: "fresh",
    lastRunAt: new Date("2026-07-23T11:00:00Z"),
    lastOk: true,
    ageHours: 1,
    maxAgeHours: 36,
  })),
);
const backupMock = vi.hoisted(() =>
  vi.fn(async () => ({
    status: "fresh",
    lastRunAt: new Date("2026-07-23T10:00:00Z"),
    lastOk: true,
    ageHours: 2,
    maxAgeHours: 48,
  })),
);
vi.mock("@/lib/observability/cron-heartbeat", () => ({ getCronFreshness: cronMock }));
vi.mock("@/lib/observability/backup-heartbeat", () => ({ getBackupFreshness: backupMock }));
vi.mock("@/lib/observability/report", () => ({ reportError: vi.fn(async () => undefined) }));

import { GET } from "./route";

const SECRET = "test-cron-secret-minstens-16-tekens";

function req(opts: { auth?: string; query?: string } = {}): Request {
  const headers: Record<string, string> = {};
  if (opts.auth !== undefined) headers.authorization = opts.auth;
  return new Request(`http://localhost/api/metrics${opts.query ?? ""}`, { method: "GET", headers });
}

describe("GET /api/metrics", () => {
  beforeEach(() => {
    queryRawMock.mockClear();
    queryRawMock.mockResolvedValue([{ "1": 1 }]);
    countMock.mockClear();
    countMock.mockResolvedValue(4);
    cronMock.mockClear();
    backupMock.mockClear();
    process.env.CRON_SECRET = SECRET;
    delete process.env.MAINTENANCE_MODE;
  });

  it("geeft 503 zonder CRON_SECRET", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    expect(res.status).toBe(503);
  });

  it("geeft 401 zonder Authorization-header", async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it("geeft 401 bij een verkeerd secret", async () => {
    const res = await GET(req({ auth: "Bearer fout-geheim" }));
    expect(res.status).toBe(401);
  });

  it("geeft de Prometheus-expositie bij een geldig verzoek", async () => {
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.text();
    expect(body).toContain("zzp_up 1");
    expect(body).toContain("zzp_db_reachable 1");
    expect(body).toContain("zzp_verification_queue 4");
    expect(body).toContain("zzp_maintenance_mode 0");
    expect(body).toContain("# TYPE zzp_cron_heartbeat_age_seconds gauge");
  });

  it("telt de verificatie-wachtrij en de expiry-backlog als aparte queries", async () => {
    // Eerste count = verificatie-wachtrij (SUBMITTED), tweede count = overdue-expiry (VERIFIED, verlopen).
    countMock.mockResolvedValueOnce(4).mockResolvedValueOnce(9);
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    const body = await res.text();
    expect(body).toContain("zzp_verification_queue 4");
    expect(body).toContain("zzp_credentials_overdue_expiry 9");
    expect(countMock).toHaveBeenCalledTimes(2);
  });

  it("meldt zzp_maintenance_mode 1 als MAINTENANCE_MODE aanstaat", async () => {
    process.env.MAINTENANCE_MODE = "true";
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    const body = await res.text();
    expect(body).toContain("zzp_maintenance_mode 1");
  });

  it("laat een falende expiry-backlog-telling de respons niet omverhalen (geen 500)", async () => {
    // Verificatie-wachtrij lukt (4), de tweede telling (overdue-expiry) faalt → 0, respons blijft 200.
    countMock.mockResolvedValueOnce(4).mockRejectedValueOnce(new Error("count kapot"));
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("zzp_verification_queue 4");
    expect(body).toContain("zzp_credentials_overdue_expiry 0");
  });

  it("geeft JSON bij ?format=json", async () => {
    const res = await GET(req({ auth: `Bearer ${SECRET}`, query: "?format=json" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const json = (await res.json()) as { metrics: Record<string, number>; time: string };
    expect(json.metrics.zzp_up).toBe(1);
    expect(json.metrics.zzp_verification_queue).toBe(4);
    expect(typeof json.time).toBe("string");
  });

  it("meldt db_reachable 0 en telt de wachtrij niet bij een DB-ping-fout (geen 500)", async () => {
    queryRawMock.mockRejectedValueOnce(new Error("db down"));
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("zzp_db_reachable 0");
    expect(countMock).not.toHaveBeenCalled();
  });

  it("markeert een stale cron-heartbeat als stale=1", async () => {
    cronMock.mockResolvedValueOnce({
      status: "stale",
      lastRunAt: new Date("2026-07-20T00:00:00Z"),
      lastOk: true,
      ageHours: 80,
      maxAgeHours: 36,
    });
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    const body = await res.text();
    expect(body).toContain("zzp_cron_heartbeat_stale 1");
  });
});
