import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { DbaAuditData } from "@/lib/dba-audit";

const state = vi.hoisted(() => ({
  actor: { id: "worker", role: "FREELANCER" },
  config: null as null | {
    dbaMinDurationMonths: number;
    dbaStrongDurationMonths: number;
    dbaRevenueConcentrationPct: number;
  },
  missing: false,
  configRead: vi.fn(),
  pdf: vi.fn(async (_data: DbaAuditData) => Buffer.from("pdf")),
  audit: vi.fn(),
  denied: vi.fn(),
}));
vi.mock("@/lib/authz", () => ({
  AuthorizationError: class extends Error {},
  requireActor: async () => state.actor,
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    platformConfig: {
      findUnique: (...args: unknown[]) => {
        state.configRead(...args);
        return state.config;
      },
    },
    collaboration: {
      findUnique: async () =>
        state.missing
          ? null
          : {
              id: "synthetic",
              startDate: new Date(2026, 0, 1),
              endDate: null,
              rate: 50,
              agreementType: null,
              agreementFreelancerSignedAt: null,
              agreementClientSignedAt: null,
              company: { userId: "client", name: "Testbedrijf" },
              freelancer: {
                userId: "worker",
                user: { name: "Testwerker" },
                kvkNumber: null,
                btwNumber: null,
                credentials: [],
              },
              job: {
                title: "Test",
                dbaDirectSupervision: false,
                dbaEmbedded: false,
                dbaFixedSchedule: false,
                dbaNoSubstitution: false,
                dbaExclusive: false,
                dbaWeakEntrepreneurship: false,
                dbaDurationMonths: null,
              },
            },
    },
  },
}));
vi.mock("@/lib/dba-audit-pdf", () => ({ buildDbaAuditPdf: state.pdf }));
vi.mock("@/lib/audit", () => ({ audit: state.audit }));
vi.mock("@/lib/security/access-audit", () => ({ auditDeniedAccess: state.denied }));
vi.mock("@/lib/request-meta", () => ({ requestMeta: async () => ({}) }));
vi.mock("@/lib/rate-limit", () => ({ documentPdfRateLimiter: {} }));
vi.mock("@/lib/rate-limit-guard", () => ({ enforceRateLimit: async () => null }));
import { GET } from "./route";
import { DBA_AUDIT_FOOTER } from "@/lib/dba-audit";

const render = () =>
  GET(new Request("http://localhost/test"), {
    params: Promise.resolve({ id: "synthetic" }),
  });
function exportedData() {
  const data = state.pdf.mock.calls[0]?.[0];
  if (!data) throw new Error("Expected PDF export data");
  return data;
}
function assessment() {
  return exportedData().dbaAssessment;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 3, 15));
  state.actor = { id: "worker", role: "FREELANCER" };
  state.missing = false;
  state.config = {
    dbaMinDurationMonths: 3,
    dbaStrongDurationMonths: 9,
    dbaRevenueConcentrationPct: 80,
  };
});
afterEach(() => vi.useRealTimers());

it.each([
  ["worker", "FREELANCER"],
  ["client", "CLIENT"],
  ["admin", "ADMIN"],
])("exports configured duration signals for authorized %s", async (id, role) => {
  state.actor = { id, role };
  const response = await render();
  expect(response.status).toBe(200);
  expect(assessment()).toMatchObject({ level: "VERHOOGD", durationMonths: 3 });
  expect(assessment().indicators.find((indicator) => indicator.key === "duur")?.level).toBe(
    "VERHOOGD",
  );
  expect(state.configRead).toHaveBeenCalledExactlyOnceWith({ where: { id: "singleton" } });
  expect(exportedData().footer).toBe(DBA_AUDIT_FOOTER);
  expect(assessment().disclaimer).toContain("geen juridisch advies");
  expect(response.headers.get("content-type")).toBe("application/pdf");
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("cross-origin-resource-policy")).toBe("same-origin");
  expect(state.audit).toHaveBeenCalledWith(
    expect.objectContaining({
      actorId: id,
      action: "DBA_DOSSIER_EXPORTED",
      metadata: { dbaLevel: "VERHOOGD", verifiedCredentials: 0 },
    }),
  );
});
it("keeps default six-month signals without a configuration row", async () => {
  state.config = null;
  await render();
  expect(assessment().level).toBe("LAAG");
  state.pdf.mockClear();
  vi.setSystemTime(new Date(2026, 6, 15));
  await render();
  expect(assessment().level).toBe("VERHOOGD");
});
it("preserves the strong boundary for legacy inverted thresholds", async () => {
  state.config = {
    dbaMinDurationMonths: 12,
    dbaStrongDurationMonths: 6,
    dbaRevenueConcentrationPct: 80,
  };
  vi.setSystemTime(new Date(2026, 6, 15));
  await render();
  expect(assessment().level).toBe("HOOG");
  expect(assessment().indicators.find((indicator) => indicator.key === "duur")?.level).toBe("HOOG");
});
it.each([false, true])("rejects outsider/missing=%s before config or PDF work", async (missing) => {
  state.actor.id = "outsider";
  state.missing = missing;
  expect((await render()).status).toBe(404);
  expect(state.configRead).not.toHaveBeenCalled();
  expect(state.pdf).not.toHaveBeenCalled();
  expect(state.audit).not.toHaveBeenCalled();
  expect(state.denied).toHaveBeenCalledWith(
    expect.objectContaining({
      action: "DBA_DOSSIER_ACCESS_DENIED",
      outcome: missing ? "not-found" : "forbidden",
    }),
  );
});
