// Regressietest voor de rate-limit-rem (OWASP A04 — resource-uitputting) op de privé
// document-download (/api/documents/[id]). Dit is de énige route die de rauwe bytes van de
// gevoeligste bestanden (VOG, diploma, ID) serveert; anders dan de zuster-routes (dossier/PDF)
// had zij géén rem, waardoor een scripted enumeratie-loop over `Document.id` de DB/storage/het
// auditlog ongebreideld kon belasten. De test bewaakt dat:
//   1. binnen de limiet een geautoriseerde download 200 geeft (rem is doorgeefpoort), en
//   2. zodra de rem dichtklapt (429) de route kort-sluit VÓÓR de DB-lookup/storage-read en er
//      dus geen bytes worden geserveerd en geen DOCUMENT_ACCESSED-audit wordt geschreven.
// Zonder de rem-wiring in de route heeft de gemockte enforceRateLimit geen effect → de route zou
// 200 teruggeven en de test faalt (rood→groen).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { type Actor } from "@/lib/authz";

const store = {
  document: null as Record<string, unknown> | null,
};

const auditMock = vi.hoisted(() => vi.fn(async () => {}));
const storageGet = vi.hoisted(() => vi.fn(async () => Buffer.from("bytes")));
const storageExists = vi.hoisted(() => vi.fn(async () => true));
const enforceRateLimitMock = vi.hoisted(() => vi.fn(async (): Promise<Response | null> => null));

let actor: Actor | null = { id: "owner", role: "FREELANCER", status: "ACTIVE", tenantId: null };

vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "203.0.113.9", userAgent: "vitest" })),
}));
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
vi.mock("@/lib/db", () => ({
  prisma: {
    document: { findUnique: vi.fn(async () => store.document) },
  },
}));
vi.mock("@/lib/services/storage", () => ({
  getStorage: () => ({ exists: storageExists, get: storageGet }),
}));
// Sentinel-limiter + gemockte guard: zo kunnen we bewijzen dat de route de rem daadwerkelijk
// aanroept met de juiste limiter en actor-key, en dat een 429 de rest kort-sluit.
vi.mock("@/lib/rate-limit", () => ({ documentDownloadRateLimiter: { __sentinel: "docdl" } }));
vi.mock("@/lib/rate-limit-guard", () => ({ enforceRateLimit: enforceRateLimitMock }));

import { GET } from "@/app/api/documents/[id]/route";
import { documentDownloadRateLimiter } from "@/lib/rate-limit";

const req = new Request("http://localhost/api/documents/doc-1");
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  auditMock.mockClear();
  storageGet.mockClear();
  storageExists.mockClear();
  enforceRateLimitMock.mockReset();
  enforceRateLimitMock.mockResolvedValue(null);
  actor = { id: "owner", role: "FREELANCER", status: "ACTIVE", tenantId: null };
  store.document = {
    ownerId: "owner",
    storageKey: "docs/abc.pdf",
    mimeType: "application/pdf",
    filename: "vog.pdf",
  };
});

describe("/api/documents/[id]: rate-limit-rem tegen enumeratie/resource-uitputting", () => {
  it("roept de rem aan met de document-download-limiter en de actor-id", async () => {
    await GET(req, ctx("doc-1"));
    expect(enforceRateLimitMock).toHaveBeenCalledTimes(1);
    expect(enforceRateLimitMock).toHaveBeenCalledWith(documentDownloadRateLimiter, "owner");
  });

  it("binnen de limiet: eigenaar krijgt 200 en de bytes worden geserveerd", async () => {
    const res = await GET(req, ctx("doc-1"));
    expect(res.status).toBe(200);
    expect(storageGet).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "DOCUMENT_ACCESSED", entityId: "doc-1" }),
    );
  });

  it("boven de limiet: 429 kort-sluit vóór de DB-lookup — geen bytes, geen DOCUMENT_ACCESSED-audit", async () => {
    enforceRateLimitMock.mockResolvedValue(
      NextResponse.json({ error: "Te veel verzoeken." }, { status: 429 }),
    );
    const res = await GET(req, ctx("doc-1"));
    expect(res.status).toBe(429);
    // Niets van de gevoelige weg mag zijn geraakt: geen storage-read, geen toegang-audit.
    expect(storageGet).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "DOCUMENT_ACCESSED" }),
    );
  });
});

describe("/api/documents/[id]: geen existence-oracle (CWE-203)", () => {
  it("onbekend id → 404 'Niet gevonden.'", async () => {
    store.document = null;
    const res = await GET(req, ctx("onbekend"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Niet gevonden." });
    expect(storageGet).not.toHaveBeenCalled();
  });

  it("geldig id van een ander → identiek 404 'Niet gevonden.' (niet 403), maar wél DENIED-audit", async () => {
    // Regressie: een 403 op andermans (bestaand) VOG/diploma-document verraadde het bestaan ervan —
    // ononderscheidbaar maken van een onbekend id sluit de oracle. De DENIED-audit blijft bestaan.
    store.document = {
      ownerId: "iemand-anders",
      storageKey: "docs/geheim.pdf",
      mimeType: "application/pdf",
      filename: "vog.pdf",
    };
    const res = await GET(req, ctx("doc-van-ander"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Niet gevonden." });
    // Geen bytes geserveerd, geen toegang-audit; wél een geweigerd-toegang-audit voor het spoor.
    expect(storageGet).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "DOCUMENT_ACCESSED" }),
    );
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "DOCUMENT_ACCESS_DENIED", entityId: "doc-van-ander" }),
    );
  });
});
