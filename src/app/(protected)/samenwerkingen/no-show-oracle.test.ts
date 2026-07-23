// Anti-oracle-contract voor reportNoShow (CWE-203 / OWASP A01 Broken Access Control).
//
// De server-action is direct aanroepbaar met een gegokt collaborationId. Vóór de fix onderscheidde een
// ONBEKEND id ("Samenwerking niet gevonden.") van een BESTAAND id waar de actor geen melder-partij is
// ("Alleen de opdrachtgever of de bemiddelaar kan een no-show melden."). De melding wordt verbatim naar
// de client gerenderd (NoShowReportState), dus élke ingelogde actor (incl. de ZZP'er zelf en een
// buitenstaander) kon zo het bestaan van een willekeurige samenwerking aftasten. Na de fix identiek.

import { describe, it, expect, vi, beforeEach } from "vitest";

const store = {
  actor: { id: "outsider-1", role: "FREELANCER", status: "ACTIVE", tenantId: null } as {
    id: string;
    role: string;
    status: string;
    tenantId: string | null;
  },
  collab: null as Record<string, unknown> | null,
};

const findUnique = vi.hoisted(() => vi.fn());
const rateCheck = vi.hoisted(() => vi.fn(async () => ({ allowed: true })));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/authz", () => ({ requireActor: vi.fn(async () => store.actor) }));
vi.mock("@/lib/audit", () => ({ auditData: (d: unknown) => d }));
vi.mock("@/lib/db", () => ({
  prisma: {
    collaboration: { findUnique },
    noShowReport: { findFirst: vi.fn(async () => null), create: vi.fn() },
    notification: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/rate-limit", () => ({ noShowReportRateLimiter: { check: rateCheck } }));
vi.mock("@/lib/no-show", () => ({
  NO_SHOW_LIMIT: 3,
  noShowOccurredOnDayRange: () => ({ gte: new Date(), lt: new Date() }),
}));
vi.mock("@/lib/format-date", () => ({ formatDateShortNl: () => "1 jan 2026" }));
// Zod-schema mag slagen: de oracle-poort ligt ná de validatie.
vi.mock("@/lib/validation", () => ({
  noShowReportSchema: {
    safeParse: () => ({
      success: true,
      data: { reason: "Niet komen opdagen.", occurredOn: new Date() },
    }),
  },
}));

import { reportNoShow } from "./no-show-actions";

function foreignCollab() {
  return {
    id: "col-1",
    status: "ACTIVE",
    company: { userId: "client-9" },
    freelancer: { id: "fp-9", userId: "zzp-9" },
    job: { title: "Nachtdienst", tenantId: "tenant-Z" },
  };
}

function form() {
  const fd = new FormData();
  fd.set("reason", "Niet komen opdagen.");
  fd.set("occurredOn", "2026-01-01");
  return fd;
}

beforeEach(() => {
  findUnique.mockReset();
  rateCheck.mockClear();
  store.actor = { id: "outsider-1", role: "FREELANCER", status: "ACTIVE", tenantId: null };
});

describe("reportNoShow — existence-oracle (CWE-203)", () => {
  it("onbekend id → 'Samenwerking niet gevonden.'", async () => {
    findUnique.mockResolvedValue(null);
    const res = await reportNoShow("nope", undefined, form());
    expect(res).toEqual({ error: "Samenwerking niet gevonden." });
  });

  it("bestaande samenwerking waar de actor geen melder-partij is → IDENTIEKE melding (geen oracle)", async () => {
    findUnique.mockResolvedValue(foreignCollab());
    const res = await reportNoShow("col-1", undefined, form());
    expect(res).toEqual({ error: "Samenwerking niet gevonden." });
  });

  it("de twee meldingen zijn niet te onderscheiden", async () => {
    findUnique.mockResolvedValueOnce(null);
    const unknown = await reportNoShow("nope", undefined, form());
    findUnique.mockResolvedValueOnce(foreignCollab());
    const foreign = await reportNoShow("col-1", undefined, form());
    expect(foreign).toEqual(unknown);
  });
});
