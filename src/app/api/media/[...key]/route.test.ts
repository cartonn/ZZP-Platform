// Tests voor de media/logo-route: toegangscontrole + de presigned-URL-seam. In productie (S3)
// redirect de route naar een kortlevende presigned URL; lokaal (driver geeft null) streamt hij de
// bytes zoals voorheen. De authz (ingelogd + bekende logoKey) blijft in beide gevallen server-side.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Actor } from "@/lib/authz";

let actor: Actor | null = { id: "u-1", role: "CLIENT", status: "ACTIVE", tenantId: null };

vi.mock("@/lib/authz", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authz")>("@/lib/authz");
  return {
    ...actual,
    requireActor: vi.fn(async () => {
      if (!actor) throw new actual.AuthorizationError("Niet ingelogd.", 401);
      return actor;
    }),
  };
});

const findFirstMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ prisma: { company: { findFirst: findFirstMock } } }));

const driver = vi.hoisted(() => ({
  exists: vi.fn(async () => true),
  get: vi.fn(async () => Buffer.from("logo-bytes")),
  getSignedDownloadUrl: vi.fn(async () => null as string | null),
}));
vi.mock("@/lib/services/storage", () => ({ getStorage: () => driver }));

import { GET } from "./route";

function ctx(parts: string[]) {
  return { params: Promise.resolve({ key: parts }) };
}
const req = new Request("http://localhost/api/media/2026/logo.png");

describe("GET /api/media/[...key]", () => {
  beforeEach(() => {
    actor = { id: "u-1", role: "CLIENT", status: "ACTIVE", tenantId: null };
    findFirstMock.mockReset().mockResolvedValue({ id: "c-1" });
    driver.exists.mockClear().mockResolvedValue(true);
    driver.get.mockClear().mockResolvedValue(Buffer.from("logo-bytes"));
    driver.getSignedDownloadUrl.mockClear().mockResolvedValue(null);
  });

  it("weigert een niet-ingelogde gebruiker (401)", async () => {
    actor = null;
    const res = await GET(req, ctx(["2026", "logo.png"]));
    expect(res.status).toBe(401);
    expect(driver.getSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it("geeft 404 voor een onbekende logoKey", async () => {
    findFirstMock.mockResolvedValue(null);
    const res = await GET(req, ctx(["2026", "logo.png"]));
    expect(res.status).toBe(404);
  });

  it("redirect (302) naar de presigned URL wanneer de driver er een levert", async () => {
    driver.getSignedDownloadUrl.mockResolvedValue("https://bucket.example/2026/logo.png?sig=abc");
    const res = await GET(req, ctx(["2026", "logo.png"]));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://bucket.example/2026/logo.png?sig=abc");
    expect(driver.get).not.toHaveBeenCalled();
    // Content-Type wordt afgeleid uit de extensie en doorgegeven aan de presigner.
    expect(driver.getSignedDownloadUrl).toHaveBeenCalledWith("2026/logo.png", {
      contentType: "image/png",
      disposition: { type: "inline" },
    });
  });

  it("streamt de bytes wanneer presigning niet beschikbaar is (lokaal)", async () => {
    const res = await GET(req, ctx(["2026", "logo.png"]));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(await res.text()).toBe("logo-bytes");
    expect(driver.get).toHaveBeenCalledWith("2026/logo.png");
  });
});
