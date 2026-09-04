// Regressietest (CLAUDE.md regel 1 — server-side waarheid / geen periode-drift): het BTW-CSV-jaar
// volgt de Amsterdamse burgerlijke kalender (`fiscalYearOf`), niet server-UTC. Op een UTC-server
// (Railway) valt 31 dec 23:15 UTC al binnen 1 jan Amsterdam; met `new Date().getFullYear()`
// exporteerde die eerste nieuwjaarsochtend nog het vorige jaar (verkeerd bestandslabel + verkeerde
// kwartalen, want `vatYear`/`vatReturn` filteren intern op `fiscalYearOf(occurredAt) === year`).
// Zelfde bugklasse als #1329 (factuurnummering). De test faalt met `getFullYear()` (jaar 2026) en
// slaagt met `fiscalYearOf` (jaar 2027).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { type Actor } from "@/lib/authz";

const auditCreateMock = vi.hoisted(() => vi.fn(async () => ({})));
const findManyMock = vi.hoisted(() => vi.fn(async () => [] as unknown[]));
const enforceMock = vi.hoisted(() => vi.fn(async () => null as unknown));
let actor: Actor | null = { id: "user-1", role: "FREELANCER", status: "ACTIVE", tenantId: null };

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
    administrationEntry: { findMany: findManyMock },
    auditLog: { create: auditCreateMock },
  },
}));
vi.mock("@/lib/rate-limit-guard", () => ({ enforceRateLimit: enforceMock }));

import { GET as btwCsv } from "@/app/api/administratie/btw/route";

beforeEach(() => {
  auditCreateMock.mockClear();
  findManyMock.mockReset();
  findManyMock.mockResolvedValue([]);
  enforceMock.mockReset();
  enforceMock.mockResolvedValue(null);
  actor = { id: "user-1", role: "FREELANCER", status: "ACTIVE", tenantId: null };
});

afterEach(() => {
  vi.useRealTimers();
});

describe("BTW-CSV-export volgt de Amsterdamse burgerlijke kalender op de jaarwissel (#1329-parity)", () => {
  it("op 31 dec 23:15 UTC (= 1 jan Amsterdam) exporteert het het nieuwe jaar", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-31T23:15:00Z"));

    const res = await btwCsv();

    expect(res.status).toBe(200);
    // Het bestandslabel én het audit-jaar zijn het Amsterdamse jaar (2027), niet het UTC-jaar (2026).
    expect(res.headers.get("Content-Disposition")).toContain('filename="btw-2027.csv"');
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
    // `auditData` JSON-stringificeert de metadata; het gelogde jaar is óók het Amsterdamse jaar.
    // (De mock is untyped `(...args) => Promise`, dus `mock.calls[0]` typet als `[]` onder
    // `noUncheckedIndexedAccess` — we casten via `unknown` naar de vorm die de route echt oplevert.)
    const call = auditCreateMock.mock.calls[0] as unknown as [
      { data?: { metadata?: string | null } } | undefined,
    ];
    expect(call[0]?.data?.metadata).toBe(JSON.stringify({ year: 2027 }));
  });

  it("midden in het jaar valt het UTC- en het Amsterdamse jaar samen (geen drift)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));

    const res = await btwCsv();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain('filename="btw-2026.csv"');
  });
});
