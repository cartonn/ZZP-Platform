// Regressietest (OWASP A04 / CLAUDE.md defense-in-depth): de on-demand modelovereenkomst-PDF is een
// CPU-belastende, cross-party PII-download. Net als de zuster-PDF/dossier-routes (facturen/prestaties/
// dossier/dba-dossier, PR #586) moet 'n scripted loop worden geremd met `documentPdfRateLimiter` —
// deze route werd bij #586 gemist. De test faalt zonder de `enforceRateLimit`-gate in de route:
//   1. bij een 429 van de limiter geeft de route 429 en genereert géén PDF en schrijft géén audit;
//   2. bij toestemming loopt de route normaal door naar 200.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { type Actor } from "@/lib/authz";

const store = { collaboration: null as Record<string, unknown> | null };
const auditMock = vi.hoisted(() => vi.fn(async () => {}));
const pdfMock = vi.hoisted(() => vi.fn(async () => Buffer.from("pdf")));
const enforceMock = vi.hoisted(() =>
  vi.fn(async (_limiter: unknown, _key: string) => null as NextResponse | null),
);
let actor: Actor | null = { id: "user-1", role: "FREELANCER", status: "ACTIVE", tenantId: null };

vi.mock("@/lib/audit", () => ({ audit: auditMock }));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: "203.0.113.7", userAgent: "vitest" })),
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
  prisma: { collaboration: { findUnique: vi.fn(async () => store.collaboration) } },
}));
vi.mock("@/lib/contract-pdf", () => ({ buildModelAgreementPdf: pdfMock }));
vi.mock("@/lib/rate-limit-guard", () => ({ enforceRateLimit: enforceMock }));

import { GET as modelAgreementPdf } from "@/app/api/samenwerkingen/[id]/modelovereenkomst/route";

const req = new Request("http://localhost/test");
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  auditMock.mockClear();
  pdfMock.mockClear();
  enforceMock.mockReset();
  enforceMock.mockResolvedValue(null);
  actor = { id: "user-1", role: "FREELANCER", status: "ACTIVE", tenantId: null };
  store.collaboration = {
    rate: 50,
    startDate: new Date(),
    endDate: new Date(),
    agreementType: null,
    agreementFreelancerSignedAt: null,
    agreementClientSignedAt: null,
    company: { name: "ACME", userId: "user-2" },
    freelancer: { userId: "user-1", user: { name: "Zara" } },
    job: {
      title: "Klus",
      description: "x",
      modelAgreementType: null,
      dbaDirectSupervision: false,
      dbaEmbedded: false,
      dbaFixedSchedule: false,
      dbaNoSubstitution: false,
      dbaExclusive: false,
      dbaWeakEntrepreneurship: false,
      dbaDurationMonths: null,
    },
  };
});

describe("modelovereenkomst-PDF is rate-limited (A04 defense-in-depth, PR #586-parity)", () => {
  it("remt met documentPdfRateLimiter op de actor-id, ná auth", async () => {
    await modelAgreementPdf(req, ctx("col-1"));
    expect(enforceMock).toHaveBeenCalledTimes(1);
    // Sleutel = actor.id (parity met facturen/prestaties/dossier/dba-dossier).
    expect(enforceMock.mock.calls[0]?.[1]).toBe("user-1");
  });

  it("bij een 429 van de limiter: geen PDF, geen audit, geeft 429 door", async () => {
    enforceMock.mockResolvedValue(
      NextResponse.json({ error: "Te veel verzoeken." }, { status: 429 }),
    );
    const res = await modelAgreementPdf(req, ctx("col-1"));
    expect(res.status).toBe(429);
    expect(pdfMock).not.toHaveBeenCalled();
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("bij toestemming loopt de route normaal door naar 200 (+ audit)", async () => {
    const res = await modelAgreementPdf(req, ctx("col-1"));
    expect(res.status).toBe(200);
    expect(pdfMock).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "MODEL_AGREEMENT_ACCESSED", entityId: "col-1" }),
    );
  });
});
