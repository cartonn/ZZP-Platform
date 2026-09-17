import { it, expect, vi, afterEach, describe } from "vitest";

const authState = vi.hoisted(() => ({
  jwtRole: "FRANCHISER" as string,
  dbRole: "FRANCHISER" as string,
  id: "user-1",
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: authState.id, role: authState.jwtRole, name: "Testgebruiker" },
  })),
}));

vi.mock("@/lib/authz", () => ({
  requireActor: vi.fn(async () => ({
    id: authState.id,
    role: authState.dbRole,
    status: "ACTIVE",
  })),
  AuthorizationError: class extends Error {},
}));

vi.mock("@/lib/i18n/server", () => ({
  getTranslator: vi.fn(async () => ({ locale: "nl", t: (s: string) => s })),
}));

const recommendedJobs = vi.hoisted(() => vi.fn(async () => []));
vi.mock("@/lib/recommendations", () => ({ recommendedJobs }));
vi.mock("@/lib/actions/pending-tasks", () => ({ pendingTasks: vi.fn(async () => []) }));
vi.mock("@/lib/jobs/saved-search-alerts", () => ({
  getSavedSearchAlertsForFreelancer: vi.fn(async () => []),
}));
vi.mock("@/lib/data/freelancer-profile", () => ({
  getCompletenessProfile: vi.fn(async () => null),
}));
vi.mock("@/lib/revenue-trend", () => ({
  getFreelancerRevenueTrend: vi.fn(async () => null),
  getClientRevenueTrend: vi.fn(async () => null),
}));
vi.mock("@/lib/data/unbilled-invoices", () => ({
  getUnbilledInvoiceSummary: vi.fn(async () => null),
}));
vi.mock("@/lib/client-stats", () => ({
  getClientStats: vi.fn(async () => ({})),
  fillRateHint: vi.fn(() => null),
}));

const userCount = vi.hoisted(() => vi.fn(async () => 0));
vi.mock("@/lib/db", () => ({
  prisma: {
    application: { count: vi.fn(async () => 0) },
    credential: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0) },
    collaboration: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0) },
    user: {
      findUnique: vi.fn(async () => ({
        tenantId: "own",
        identityVerifiedAt: null,
        lastLoginAt: null,
      })),
      count: userCount,
    },
    job: { count: vi.fn(async () => 0) },
    company: { findUnique: vi.fn(async () => null), count: vi.fn(async () => 0) },
    freelancerProfile: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    lead: { count: vi.fn(async () => 0) },
  },
}));

const summary = vi.hoisted(() =>
  vi.fn<(tenant: string, now: Date, soon: Date) => Promise<{ profiles: number; certs: number }>>(),
);
vi.mock("@/lib/data/roster-expiry", () => ({ summarizeRosterExpiringSoon: summary }));
vi.mock("@/lib/franchise/pool-outstanding", () => ({
  getPoolOutstandingGlance: vi.fn(async () => null),
}));
import DashboardPage from "./page";
const originalTz = process.env.TZ;
afterEach(() => {
  vi.useRealTimers();
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
  vi.clearAllMocks();
});
describe.each(["Europe/Amsterdam", "UTC"])("expiry window in %s", (timezone) => {
  it.each([
    ["2026-03-15T12:00:00Z", "2026-04-14T12:00:00Z"],
    ["2026-10-15T12:00:00Z", "2026-11-14T12:00:00Z"],
    ["2026-07-15T12:00:00Z", "2026-08-14T12:00:00Z"],
  ])(
    "keeps the dashboard's expiry boundary equal to tasks and badges from %s",
    async (start, expected) => {
      process.env.TZ = timezone;
      summary.mockResolvedValue({ profiles: 0, certs: 0 });
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(start));
      await DashboardPage();
      expect(summary).toHaveBeenCalledOnce();
      expect(summary.mock.calls[0]?.[0]).toBe("own");
      expect(summary.mock.calls[0]?.[1].toISOString()).toBe(start.replace("Z", ".000Z"));
      expect(summary.mock.calls[0]?.[2].toISOString()).toBe(expected.replace("Z", ".000Z"));
    },
  );
});
