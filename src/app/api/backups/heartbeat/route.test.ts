// Route-test voor het back-up-heartbeat-eindpunt (/api/backups/heartbeat). Bewijst de fail-closed
// autorisatie (geen CRON_SECRET → 503; verkeerde/ontbrekende Bearer → 401) en dat een geldige ping
// de heartbeat registreert met de juiste `ok` (default true, of de meegegeven booleaanse waarde),
// zonder ooit bij een niet-geautoriseerd verzoek te schrijven.

import { describe, it, expect, vi, beforeEach } from "vitest";

const recordMock = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("@/lib/observability/backup-heartbeat", () => ({ recordBackupHeartbeat: recordMock }));

import { POST } from "./route";

const SECRET = "test-cron-secret-minstens-16-tekens";

function req(opts: { auth?: string; body?: unknown } = {}): Request {
  const headers: Record<string, string> = {};
  if (opts.auth !== undefined) headers.authorization = opts.auth;
  return new Request("http://localhost/api/backups/heartbeat", {
    method: "POST",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

describe("POST /api/backups/heartbeat", () => {
  beforeEach(() => {
    recordMock.mockClear();
    process.env.CRON_SECRET = SECRET;
  });

  it("geeft 503 en schrijft niet zonder CRON_SECRET", async () => {
    delete process.env.CRON_SECRET;
    const res = await POST(req({ auth: `Bearer ${SECRET}` }));
    expect(res.status).toBe(503);
    expect(recordMock).not.toHaveBeenCalled();
  });

  it("geeft 401 en schrijft niet zonder Authorization-header", async () => {
    const res = await POST(req());
    expect(res.status).toBe(401);
    expect(recordMock).not.toHaveBeenCalled();
  });

  it("geeft 401 en schrijft niet bij een verkeerd secret", async () => {
    const res = await POST(req({ auth: "Bearer fout-geheim" }));
    expect(res.status).toBe(401);
    expect(recordMock).not.toHaveBeenCalled();
  });

  it("registreert een geslaagde back-up (default ok=true) bij een kale ping", async () => {
    const res = await POST(req({ auth: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
    expect(recordMock).toHaveBeenCalledWith(true);
    await expect(res.json()).resolves.toEqual({ recorded: true, ok: true });
  });

  it("registreert een mislukte back-up bij { ok: false }", async () => {
    const res = await POST(req({ auth: `Bearer ${SECRET}`, body: { ok: false } }));
    expect(res.status).toBe(200);
    expect(recordMock).toHaveBeenCalledWith(false);
    await expect(res.json()).resolves.toEqual({ recorded: true, ok: false });
  });

  it("valt terug op ok=true bij een niet-booleaanse ok in de body", async () => {
    const res = await POST(req({ auth: `Bearer ${SECRET}`, body: { ok: "nee" } }));
    expect(res.status).toBe(200);
    expect(recordMock).toHaveBeenCalledWith(true);
  });
});
