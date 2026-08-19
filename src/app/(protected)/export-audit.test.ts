// Regressietest voor de AVG-auditplicht (art. 5(2) verantwoording, CLAUDE.md regel 5) op de vier
// CSV-exportroutes die financiële PII naar buiten brengen: diensten, betaalverplichtingen,
// inkomstenprognose en prestaties. Vóór deze fix logden deze routes — in tegenstelling tot de
// administratie-/audit-exportroutes — géén auditregel. De test faalt zonder de auditLog.create-aanroep
// in elke route en bewaakt dat een geslaagde export exact één auditregel met de juiste actie schrijft.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Actor } from "@/lib/authz";

const store = {
  actor: { id: "u-1", role: "FREELANCER", status: "ACTIVE", tenantId: null } as Actor,
};

const auditCreateMock = vi.hoisted(() =>
  vi.fn(async (args: { data: Record<string, unknown> }) => args.data),
);

vi.mock("@/lib/authz", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authz")>("@/lib/authz");
  return { ...actual, requireActor: vi.fn(async () => store.actor) };
});
vi.mock("@/lib/rate-limit-guard", () => ({ enforceRateLimit: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({
  prisma: {
    auditLog: { create: auditCreateMock },
    invoice: {
      findMany: vi.fn(async () => [
        {
          number: "2026-001",
          status: "PAID",
          lifecycleStatus: "PAID",
          issuedAt: new Date("2026-03-10T10:00:00Z"),
          dueAt: new Date("2026-04-09T10:00:00Z"),
          updatedAt: new Date("2026-04-01T10:00:00Z"),
          totalCents: 121000,
          subtotalCents: 100000,
          vatCents: 21000,
          collaboration: {
            job: { title: "Nachtdiensten" },
            company: { name: "De Linde" },
            freelancer: { user: { name: "Sanne" } },
          },
        },
      ]),
    },
  },
}));

// Dataproducenten + CSV-serializers gemockt: de export-inhoud is hier irrelevant, alleen de auditregel telt.
vi.mock("@/lib/diensten", () => ({
  getDienstenForFreelancer: vi.fn(async () => [{}, {}]),
  exportDienstenCsv: vi.fn(() => "csv"),
}));
vi.mock("@/lib/data/payment-obligations", () => ({
  getObligationItemsForClient: vi.fn(async () => [{}, {}, {}]),
}));
vi.mock("@/lib/payment-obligations", () => ({ exportObligationsCsv: vi.fn(() => "csv") }));
vi.mock("@/lib/data/income-forecast", () => ({
  getForecastItemsForFreelancer: vi.fn(async () => [{}]),
}));
vi.mock("@/lib/income-forecast", () => ({ exportForecastCsv: vi.fn(() => "csv") }));
vi.mock("@/lib/prestaties", () => ({
  getPrestatiesForClient: vi.fn(async () => [{}, {}, {}, {}]),
  exportPrestatiesCsv: vi.fn(() => "csv"),
}));

import { GET as dienstenGet } from "./diensten/export/route";
import { GET as verplichtingenGet } from "./verplichtingen/export/route";
import { GET as prognoseGet } from "./prognose/export/route";
import { GET as prestatiesGet } from "./prestaties/export/route";
import { GET as facturenGet } from "./facturen/export/route";

beforeEach(() => {
  auditCreateMock.mockClear();
});

describe("CSV-exportroutes — AVG-auditplicht", () => {
  it("diensten-export (FREELANCER) schrijft een DIENSTEN_EXPORTED-auditregel", async () => {
    store.actor = { id: "u-1", role: "FREELANCER", status: "ACTIVE", tenantId: null };
    const res = await dienstenGet();
    expect(res.status).toBe(200);
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
    expect(auditCreateMock.mock.calls[0]![0].data).toMatchObject({ action: "DIENSTEN_EXPORTED" });
  });

  it("betaalverplichtingen-export (CLIENT) schrijft een OBLIGATIONS_EXPORTED-auditregel", async () => {
    store.actor = { id: "u-2", role: "CLIENT", status: "ACTIVE", tenantId: null };
    const res = await verplichtingenGet();
    expect(res.status).toBe(200);
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
    expect(auditCreateMock.mock.calls[0]![0].data).toMatchObject({
      action: "OBLIGATIONS_EXPORTED",
    });
  });

  it("inkomstenprognose-export (FREELANCER) schrijft een FORECAST_EXPORTED-auditregel", async () => {
    store.actor = { id: "u-3", role: "FREELANCER", status: "ACTIVE", tenantId: null };
    const res = await prognoseGet();
    expect(res.status).toBe(200);
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
    expect(auditCreateMock.mock.calls[0]![0].data).toMatchObject({ action: "FORECAST_EXPORTED" });
  });

  it("prestaties-export (CLIENT) schrijft een PRESTATIES_EXPORTED-auditregel", async () => {
    store.actor = { id: "u-4", role: "CLIENT", status: "ACTIVE", tenantId: null };
    const res = await prestatiesGet();
    expect(res.status).toBe(200);
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
    expect(auditCreateMock.mock.calls[0]![0].data).toMatchObject({ action: "PRESTATIES_EXPORTED" });
  });

  it("factuurregister-export (FREELANCER) schrijft een INVOICE_REGISTER_EXPORTED-auditregel", async () => {
    store.actor = { id: "u-5", role: "FREELANCER", status: "ACTIVE", tenantId: null };
    const res = await facturenGet();
    expect(res.status).toBe(200);
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
    expect(auditCreateMock.mock.calls[0]![0].data).toMatchObject({
      action: "INVOICE_REGISTER_EXPORTED",
    });
  });

  it("factuurregister-export weigert een ADMIN (geen eigen register)", async () => {
    store.actor = { id: "u-6", role: "ADMIN", status: "ACTIVE", tenantId: null };
    const res = await facturenGet();
    expect(res.status).toBe(403);
    expect(auditCreateMock).not.toHaveBeenCalled();
  });
});
