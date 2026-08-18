// Route-test voor het metrics-endpoint (/api/metrics). Bewijst de fail-closed autorisatie (geen
// CRON_SECRET → 503; ontbrekende/verkeerde Bearer → 401), de Prometheus-tekstexpositie bij een
// geldig verzoek, de JSON-variant (?format=json), en dat een DB-ping-fout de respons niet omverhaalt
// (zzp_db_reachable 0 i.p.v. een 500). Geen echte DB — Prisma + heartbeat-lezers zijn gemockt.

import { describe, it, expect, vi, beforeEach } from "vitest";

const queryRawMock = vi.hoisted(() => vi.fn(async () => [{ "1": 1 }]));
const countMock = vi.hoisted(() => vi.fn(async () => 4));
const subscriptionCountMock = vi.hoisted(() => vi.fn(async () => 0));
const invoiceCountMock = vi.hoisted(() => vi.fn(async () => 0));
const reviewCountMock = vi.hoisted(() => vi.fn(async () => 0));
const performanceCountMock = vi.hoisted(() => vi.fn(async () => 0));
vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: queryRawMock,
    credential: { count: countMock },
    subscription: { count: subscriptionCountMock },
    invoice: { count: invoiceCountMock },
    review: { count: reviewCountMock },
    performance: { count: performanceCountMock },
  },
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
    subscriptionCountMock.mockClear();
    subscriptionCountMock.mockResolvedValue(0);
    invoiceCountMock.mockClear();
    invoiceCountMock.mockResolvedValue(0);
    reviewCountMock.mockClear();
    reviewCountMock.mockResolvedValue(0);
    performanceCountMock.mockClear();
    performanceCountMock.mockResolvedValue(0);
    cronMock.mockClear();
    backupMock.mockClear();
    process.env.CRON_SECRET = SECRET;
    delete process.env.MAINTENANCE_MODE;
    delete process.env.PERFORMANCE_GRACE_DAYS;
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
    // Eerste subscription.count = overdue-expiry (ACTIVE verlopen), tweede = stale-pending (PENDING te lang).
    subscriptionCountMock.mockResolvedValueOnce(3);
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    const body = await res.text();
    expect(body).toContain("zzp_verification_queue 4");
    expect(body).toContain("zzp_credentials_overdue_expiry 9");
    expect(body).toContain("zzp_subscriptions_overdue_expiry 3");
    expect(countMock).toHaveBeenCalledTimes(2);
    expect(subscriptionCountMock).toHaveBeenCalledTimes(2);
  });

  it("telt de vastgelopen-PENDING-abonnementen (checkout die de webhook nooit bevestigde) als aparte query", async () => {
    // Tweede subscription.count = stale-pending; de eerste (overdue-expiry) valt op de default (0).
    subscriptionCountMock.mockResolvedValueOnce(0).mockResolvedValueOnce(11);
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    const body = await res.text();
    expect(body).toContain("zzp_subscriptions_stale_pending 11");
    expect(subscriptionCountMock).toHaveBeenCalledTimes(2);
  });

  it("laat een falende vastgelopen-PENDING-telling de respons niet omverhalen (geen 500)", async () => {
    subscriptionCountMock
      .mockResolvedValueOnce(0)
      .mockRejectedValueOnce(new Error("subscription count kapot"));
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("zzp_subscriptions_stale_pending 0");
  });

  it("telt de betaal-verval-backlog (cascade-facturen APPROVED met verstreken vervaldatum) door", async () => {
    invoiceCountMock.mockResolvedValueOnce(7);
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    const body = await res.text();
    expect(body).toContain("zzp_invoices_overdue_unflipped 7");
    expect(invoiceCountMock).toHaveBeenCalledTimes(1);
  });

  it("telt de reveal-backlog (PENDING_REVEAL met verstreken revealDeadline) door", async () => {
    reviewCountMock.mockResolvedValueOnce(6);
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    const body = await res.text();
    expect(body).toContain("zzp_reviews_overdue_reveal 6");
    expect(reviewCountMock).toHaveBeenCalledTimes(1);
  });

  it("telt de grace-backlog (SUBMITTED prestaties over hun grace-venster) door als het venster aanstaat", async () => {
    process.env.PERFORMANCE_GRACE_DAYS = "3";
    performanceCountMock.mockResolvedValueOnce(5);
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    const body = await res.text();
    expect(body).toContain("zzp_performances_overdue_grace 5");
    expect(performanceCountMock).toHaveBeenCalledTimes(1);
  });

  it("telt de grace-backlog niet als het grace-venster uit staat (pilot-default) → gauge 0", async () => {
    // Geen PERFORMANCE_GRACE_DAYS → geen auto-goedkeuring → geen achterstand per definitie; de
    // count-query mag niet eens draaien (geen misleidend signaal, geen onnodige DB-read).
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    const body = await res.text();
    expect(body).toContain("zzp_performances_overdue_grace 0");
    expect(performanceCountMock).not.toHaveBeenCalled();
  });

  it("laat een falende grace-backlog-telling de respons niet omverhalen (geen 500)", async () => {
    process.env.PERFORMANCE_GRACE_DAYS = "3";
    performanceCountMock.mockRejectedValueOnce(new Error("performance count kapot"));
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("zzp_verification_queue 4");
    expect(body).toContain("zzp_performances_overdue_grace 0");
  });

  it("laat een falende reveal-backlog-telling de respons niet omverhalen (geen 500)", async () => {
    reviewCountMock.mockRejectedValueOnce(new Error("review count kapot"));
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("zzp_verification_queue 4");
    expect(body).toContain("zzp_reviews_overdue_reveal 0");
  });

  it("laat een falende betaal-verval-telling de respons niet omverhalen (geen 500)", async () => {
    invoiceCountMock.mockRejectedValueOnce(new Error("invoice count kapot"));
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("zzp_verification_queue 4");
    expect(body).toContain("zzp_invoices_overdue_unflipped 0");
  });

  it("laat een falende abonnements-verval-telling de respons niet omverhalen (geen 500)", async () => {
    // De abonnements-telling (derde query) faalt → 0, de credential-tellingen + respons blijven intact.
    subscriptionCountMock.mockRejectedValueOnce(new Error("subscription count kapot"));
    const res = await GET(req({ auth: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("zzp_verification_queue 4");
    expect(body).toContain("zzp_subscriptions_overdue_expiry 0");
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
    expect(subscriptionCountMock).not.toHaveBeenCalled();
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
