// Route-tests voor de verwerkingsregister-export (AVG). Gedrag: alleen ADMIN, rate-limit, en — de
// kern van deze test — élke export wordt geaudit (CLAUDE.md regel 5, pariteit met de andere
// export-routes). Een niet-ingelogde aanroep krijgt een nette JSON-fout i.p.v. een propagerende 500.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthorizationError } from "@/lib/authz";

const requireActorMock = vi.hoisted(() => vi.fn());
const auditCreateMock = vi.hoisted(() => vi.fn(async () => ({})));
const enforceRateLimitMock = vi.hoisted(() => vi.fn(async () => null));

vi.mock("@/lib/authz", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authz")>("@/lib/authz");
  return { ...actual, requireActor: requireActorMock };
});
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: null, userAgent: null })),
}));
vi.mock("@/lib/db", () => ({ prisma: { auditLog: { create: auditCreateMock } } }));
vi.mock("@/lib/rate-limit", () => ({ exportRateLimiter: {} }));
vi.mock("@/lib/rate-limit-guard", () => ({ enforceRateLimit: enforceRateLimitMock }));

import { GET } from "./route";

beforeEach(() => {
  requireActorMock.mockReset();
  auditCreateMock.mockClear();
  enforceRateLimitMock.mockReset();
  enforceRateLimitMock.mockResolvedValue(null);
});

describe("GET /admin/avg/export", () => {
  it("exporteert het register voor een ADMIN en schrijft een AVG_REGISTER_EXPORTED-auditregel", async () => {
    requireActorMock.mockResolvedValue({ id: "admin-1", role: "ADMIN", status: "ACTIVE" });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    // Kern: de export wordt geaudit (verantwoordingsplicht op compliance-materiaal).
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
    const entry = (auditCreateMock.mock.calls[0] as unknown[])[0] as {
      data: { action: string; actorId: string };
    };
    expect(entry.data.action).toBe("AVG_REGISTER_EXPORTED");
    expect(entry.data.actorId).toBe("admin-1");
  });

  it("weigert een niet-ADMIN met 403 en zonder auditregel/export", async () => {
    requireActorMock.mockResolvedValue({ id: "zzp-1", role: "FREELANCER", status: "ACTIVE" });
    const res = await GET();
    expect(res.status).toBe(403);
    expect(auditCreateMock).not.toHaveBeenCalled();
  });

  it("beantwoordt een niet-ingelogde aanroep met een nette JSON-401 i.p.v. een propagerende 500", async () => {
    requireActorMock.mockRejectedValue(new AuthorizationError("Niet ingelogd.", 401));
    const res = await GET();
    expect(res.status).toBe(401);
    expect(auditCreateMock).not.toHaveBeenCalled();
  });
});
