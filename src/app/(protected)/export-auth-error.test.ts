// Regressietest (persona-sweep DOEL 2, robuustheid: "onzin/verboden → nette status, nooit een 500").
// De vijf CSV-/template-download-route-handlers riepen requireActor()/requireRole() ONgevangen aan.
// Een mid-sessie geschorst of geanonimiseerd account houdt een geldige JWT (de middleware laat door op
// de stale "ACTIVE"-claim), maar requireActor()/requireRole() leest vers uit de DB en werpt een
// AuthorizationError (401/403). Zonder try/catch borrelt die ongevangen op → Next.js serveert een rauwe
// 500 i.p.v. de nette 401/403 die de 16 andere export/PDF/dossier-routes al teruggeven. Deze test faalt
// (throw i.p.v. response) zonder de guard in elke route en bewaakt de parity.

import { describe, it, expect, vi } from "vitest";
import { AuthorizationError } from "@/lib/authz";

vi.mock("@/lib/authz", async () => {
  const actual = await vi.importActual<typeof import("@/lib/authz")>("@/lib/authz");
  return {
    ...actual,
    requireActor: vi.fn(async () => {
      throw new AuthorizationError("Niet ingelogd.", 401);
    }),
    requireRole: vi.fn(async () => {
      throw new AuthorizationError("Geen toegang: vereist rol ADMIN.", 403);
    }),
  };
});

// Rate-limit + data-producenten worden nooit bereikt (requireActor werpt ervóór), maar de route-modules
// importeren ze op module-load — mock ze weg zodat de import geen neveneffect heeft.
vi.mock("@/lib/rate-limit-guard", () => ({ enforceRateLimit: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ prisma: { auditLog: { create: vi.fn() } } }));
vi.mock("@/lib/diensten", () => ({
  getDienstenForFreelancer: vi.fn(),
  exportDienstenCsv: vi.fn(),
}));
vi.mock("@/lib/data/payment-obligations", () => ({ getObligationItemsForClient: vi.fn() }));
vi.mock("@/lib/payment-obligations", () => ({ exportObligationsCsv: vi.fn() }));
vi.mock("@/lib/data/income-forecast", () => ({ getForecastItemsForFreelancer: vi.fn() }));
vi.mock("@/lib/income-forecast", () => ({ exportForecastCsv: vi.fn() }));
vi.mock("@/lib/prestaties", () => ({
  getPrestatiesForClient: vi.fn(),
  exportPrestatiesCsv: vi.fn(),
}));
vi.mock("@/lib/onboarding/import", () => ({ importTemplateCsv: vi.fn(() => "csv") }));

import { GET as dienstenGet } from "./diensten/export/route";
import { GET as verplichtingenGet } from "./verplichtingen/export/route";
import { GET as prognoseGet } from "./prognose/export/route";
import { GET as prestatiesGet } from "./prestaties/export/route";
import { GET as importTemplateGet } from "./admin/import/template/route";

describe("Download-routes — AuthorizationError geeft nette status, geen rauwe 500", () => {
  it("diensten-export vangt de 401 af tot een response i.p.v. te throwen", async () => {
    const res = await dienstenGet();
    expect(res.status).toBe(401);
  });

  it("betaalverplichtingen-export vangt de 401 af tot een response", async () => {
    const res = await verplichtingenGet();
    expect(res.status).toBe(401);
  });

  it("inkomstenprognose-export vangt de 401 af tot een response", async () => {
    const res = await prognoseGet();
    expect(res.status).toBe(401);
  });

  it("prestaties-export vangt de 401 af tot een response", async () => {
    const res = await prestatiesGet();
    expect(res.status).toBe(401);
  });

  it("admin import-template vangt de 403 af tot een response", async () => {
    const res = await importTemplateGet();
    expect(res.status).toBe(403);
  });
});
