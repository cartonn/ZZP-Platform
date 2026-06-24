// Regressietest voor de AVG-auditplicht (CLAUDE.md regel 5) op de on-demand PDF-routes die
// gevoelige PII-documenten serveren: factuur, urenstaat/oplevering en modelovereenkomst. Vóór deze
// fix logden deze routes géén toegang (in tegenstelling tot de dossier-routes en /api/documents/[id]).
// De test faalt zonder de audit()-aanroep in elke route en bewaakt dat:
//   1. een geautoriseerde inzage een audit-regel met de juiste actie schrijft, en
//   2. een geweigerde inzage (geen partij) een 403 geeft en niets serveert.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Actor } from "@/lib/authz";

const store = {
  invoice: null as Record<string, unknown> | null,
  performance: null as Record<string, unknown> | null,
  collaboration: null as Record<string, unknown> | null,
};

const auditMock = vi.hoisted(() => vi.fn(async () => {}));
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
  prisma: {
    invoice: { findUnique: vi.fn(async () => store.invoice) },
    performance: { findUnique: vi.fn(async () => store.performance) },
    collaboration: { findUnique: vi.fn(async () => store.collaboration) },
  },
}));

// De PDF-builders zijn elders los getest; hier vervangen we ze door een stub zodat de test
// alleen de authz+audit-keten van de route valideert.
vi.mock("@/lib/invoice-pdf", () => ({ buildInvoicePdf: vi.fn(async () => Buffer.from("pdf")) }));
vi.mock("@/lib/performance-pdf", () => ({
  buildPerformancePdf: vi.fn(async () => Buffer.from("pdf")),
}));
vi.mock("@/lib/contract-pdf", () => ({
  buildModelAgreementPdf: vi.fn(async () => Buffer.from("pdf")),
}));

import { GET as invoicePdf } from "@/app/api/facturen/[id]/pdf/route";
import { GET as performancePdf } from "@/app/api/prestaties/[id]/pdf/route";
import { GET as modelAgreementPdf } from "@/app/api/samenwerkingen/[id]/modelovereenkomst/route";

const req = new Request("http://localhost/test");
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  auditMock.mockClear();
  actor = { id: "user-1", role: "FREELANCER", status: "ACTIVE", tenantId: null };
  store.invoice = {
    number: "F-1",
    partyInvoiceNumber: null,
    issuedAt: new Date(),
    dueAt: new Date(),
    subtotalCents: 100,
    vatCents: 21,
    totalCents: 121,
    vatRegime: "STANDARD_HIGH",
    issuerUserId: "user-1",
    counterpartyUserId: "user-2",
    lines: [],
    collaboration: {
      job: { title: "Klus" },
      company: { name: "ACME", userId: "user-2" },
      freelancer: { userId: "user-1", kvkNumber: "123", btwNumber: "NL1", user: { name: "Zara" } },
    },
  };
  store.performance = {
    type: "HOURS",
    hours: 8,
    rateCents: 5000,
    amountCents: null,
    milestoneTitle: null,
    periodStart: new Date(),
    periodEnd: new Date(),
    description: "",
    ortSegments: null,
    submittedAt: new Date(),
    createdAt: new Date(),
    collaboration: {
      ortProfile: null,
      ortCustomRates: null,
      job: { title: "Klus" },
      company: { name: "ACME", userId: "user-2" },
      freelancer: { userId: "user-1", user: { name: "Zara" } },
    },
  };
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

describe("PDF-routes auditen documenttoegang (AVG, CLAUDE.md regel 5)", () => {
  it("factuur-PDF: geautoriseerde inzage schrijft INVOICE_PDF_ACCESSED", async () => {
    const res = await invoicePdf(req, ctx("inv-1"));
    expect(res.status).toBe(200);
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "INVOICE_PDF_ACCESSED",
        entityType: "Invoice",
        entityId: "inv-1",
        actorId: "user-1",
      }),
    );
  });

  it("factuur-PDF: niet-partij krijgt 403 en er wordt niets geaudit/geserveerd", async () => {
    actor = { id: "outsider", role: "FREELANCER", status: "ACTIVE", tenantId: null };
    const res = await invoicePdf(req, ctx("inv-1"));
    expect(res.status).toBe(403);
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("urenstaat-PDF: geautoriseerde inzage schrijft PERFORMANCE_PDF_ACCESSED", async () => {
    const res = await performancePdf(req, ctx("perf-1"));
    expect(res.status).toBe(200);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PERFORMANCE_PDF_ACCESSED",
        entityType: "Performance",
        entityId: "perf-1",
      }),
    );
  });

  it("urenstaat-PDF: niet-partij krijgt 403, geen audit", async () => {
    actor = { id: "outsider", role: "FREELANCER", status: "ACTIVE", tenantId: null };
    const res = await performancePdf(req, ctx("perf-1"));
    expect(res.status).toBe(403);
    expect(auditMock).not.toHaveBeenCalled();
  });

  it("modelovereenkomst-PDF: geautoriseerde inzage schrijft MODEL_AGREEMENT_ACCESSED", async () => {
    const res = await modelAgreementPdf(req, ctx("col-1"));
    expect(res.status).toBe(200);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "MODEL_AGREEMENT_ACCESSED",
        entityType: "Collaboration",
        entityId: "col-1",
      }),
    );
  });

  it("modelovereenkomst-PDF: niet-partij krijgt 403, geen audit", async () => {
    actor = { id: "outsider", role: "FREELANCER", status: "ACTIVE", tenantId: null };
    const res = await modelAgreementPdf(req, ctx("col-1"));
    expect(res.status).toBe(403);
    expect(auditMock).not.toHaveBeenCalled();
  });
});
