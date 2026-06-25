// Regressietest voor de AVG-auditplicht (CLAUDE.md regel 5) op de dossier-export-routes die
// cross-party PII bundelen (namen, KvK/BTW, certificaatstatus): het compliance-dossier en het
// DBA-dossier. Vóór deze fix logden deze routes wél de geslaagde export, maar NIET de geweigerde
// inzage — anders dan /api/documents/[id] (DOCUMENT_ACCESS_DENIED). Daardoor was IDOR-enumeratie
// op collaboration-id's onzichtbaar in het auditspoor. De test bewaakt dat:
//   1. een geautoriseerde export een audit-regel met de juiste *_EXPORTED-actie schrijft, en
//   2. een geweigerde inzage (geen partij) een 403 geeft, niets serveert, én een
//      *_ACCESS_DENIED-auditregel schrijft.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Actor } from "@/lib/authz";

const store = {
  collaboration: null as Record<string, unknown> | null,
};

const auditMock = vi.hoisted(() => vi.fn(async () => {}));
let actor: Actor | null = { id: "owner-client", role: "CLIENT", status: "ACTIVE", tenantId: null };

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
    collaboration: { findUnique: vi.fn(async () => store.collaboration) },
  },
}));

// De dossier-/PDF-builders zijn elders los getest; hier vervangen we ze door stubs zodat de test
// alleen de authz+audit-keten van de route valideert.
vi.mock("@/lib/compliance/dossier", () => ({
  buildComplianceDossier: vi.fn(() => ({
    jobTitle: "Klus",
    freelancerName: "Zelf Standig",
    companyName: "Opdracht BV",
    attentionCount: 0,
    sections: [],
    timeline: [],
  })),
}));
vi.mock("@/lib/dba-audit", () => ({
  buildDbaAuditData: vi.fn(() => ({
    dbaAssessment: { level: "LAAG" },
    entrepreneurship: { verifiedCredentialCount: 2 },
  })),
}));
vi.mock("@/lib/dba-audit-pdf", () => ({
  buildDbaAuditPdf: vi.fn(async () => Buffer.from("pdf")),
}));

import { GET as dossier } from "@/app/api/samenwerkingen/[id]/dossier/route";
import { GET as dbaDossier } from "@/app/api/samenwerkingen/[id]/dba-dossier/route";

const req = new Request("http://localhost/test");
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

// Een samenwerking met een bekende eigenaar (CLIENT) en ZZP'er. Alle velden die beide routes
// selecteren staan erin zodat de findUnique-stub voor beide werkt.
const collab = {
  id: "col-1",
  contractStatus: "ACTIVE",
  startDate: new Date("2026-01-01"),
  endDate: null,
  rate: 8000,
  agreementType: "MODEL",
  agreementFreelancerSignedAt: null,
  agreementClientSignedAt: null,
  createdAt: new Date("2025-12-01"),
  company: { name: "Opdracht BV", userId: "owner-client" },
  freelancer: {
    userId: "the-zzper",
    kvkNumber: "12345678",
    btwNumber: "NL001234567B01",
    user: { name: "Zelf Standig" },
    credentials: [],
  },
  performances: [],
  invoices: [],
  job: {
    title: "Klus",
    dbaRisk: "LAAG",
    dbaReasons: null,
    modelAgreementType: "GEEN",
    dbaDirectSupervision: false,
    dbaEmbedded: false,
    dbaFixedSchedule: false,
    dbaNoSubstitution: false,
    dbaExclusive: false,
    dbaWeakEntrepreneurship: false,
    dbaDurationMonths: 1,
  },
};

beforeEach(() => {
  auditMock.mockClear();
  store.collaboration = collab;
  actor = { id: "owner-client", role: "CLIENT", status: "ACTIVE", tenantId: null };
});

describe("dossier-routes: auditplicht bij export én geweigerde inzage", () => {
  it("compliance-dossier: eigenaar krijgt 200 + DOSSIER_EXPORTED-audit", async () => {
    const res = await dossier(req, ctx("col-1"));
    expect(res.status).toBe(200);
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DOSSIER_EXPORTED",
        entityType: "Collaboration",
        entityId: "col-1",
        ipAddress: "203.0.113.9",
      }),
    );
  });

  it("compliance-dossier: niet-partij krijgt 403 + DOSSIER_ACCESS_DENIED, geen serve", async () => {
    actor = { id: "outsider", role: "FREELANCER", status: "ACTIVE", tenantId: null };
    const res = await dossier(req, ctx("col-1"));
    expect(res.status).toBe(403);
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DOSSIER_ACCESS_DENIED",
        entityType: "Collaboration",
        entityId: "col-1",
      }),
    );
    // Geen export-audit op de geweigerde weg.
    expect(auditMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: "DOSSIER_EXPORTED" }),
    );
  });

  it("DBA-dossier: betrokken ZZP'er krijgt 200 + DBA_DOSSIER_EXPORTED-audit", async () => {
    actor = { id: "the-zzper", role: "FREELANCER", status: "ACTIVE", tenantId: null };
    const res = await dbaDossier(req, ctx("col-1"));
    expect(res.status).toBe(200);
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DBA_DOSSIER_EXPORTED",
        entityType: "Collaboration",
        entityId: "col-1",
        ipAddress: "203.0.113.9",
      }),
    );
  });

  it("DBA-dossier: niet-partij krijgt 403 + DBA_DOSSIER_ACCESS_DENIED, geen serve", async () => {
    actor = { id: "outsider", role: "CLIENT", status: "ACTIVE", tenantId: null };
    const res = await dbaDossier(req, ctx("col-1"));
    expect(res.status).toBe(403);
    expect(auditMock).toHaveBeenCalledTimes(1);
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "DBA_DOSSIER_ACCESS_DENIED",
        entityType: "Collaboration",
        entityId: "col-1",
      }),
    );
  });
});
