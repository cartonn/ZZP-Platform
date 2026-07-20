// Regressietest — het dashboard vertakt op de LIVE DB-rol (requireActor), niet op de mogelijk
// verouderde rol in de JWT (session.user.role). De sessie is een stateless JWT (tot 8u geldig, geen
// server-side revocatie): een rolwijziging in de DB — de enige weg waarop een ADMIN/FRANCHISER-rol
// verandert — mag een nog-geldige oude sessie niet het platformbrede admin-dashboard laten tonen
// (kruis-tenant gebruikers-/opdracht-tellingen + namen van andere partijen). OWASP A01 / CWE-613;
// CLAUDE.md regel 1 (server-side is de waarheid). Rood→groen: brancht de pagina op `session.user.role`
// (stale JWT), dan draait de admin-only `prisma.user.count()` voor een live niet-admin (leak),
// en draait de admin-tak niet voor een live admin met een verouderde JWT.

import { describe, it, expect, vi, beforeEach } from "vitest";

const authState = vi.hoisted(() => ({
  jwtRole: "ADMIN" as string,
  dbRole: "FREELANCER" as string,
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

// Directe data-afhankelijkheden van de pagina: no-op/leeg zodat alleen het rol-vertakkingsgedrag
// wordt getest. `recommendedJobs` is FREELANCER-only in de pagina → gebruikt als tegenproef.
const recommendedJobs = vi.hoisted(() => vi.fn(async () => []));
vi.mock("@/lib/recommendations", () => ({ recommendedJobs }));
vi.mock("@/lib/actions/pending-tasks", () => ({ pendingTasks: vi.fn(async () => []) }));
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

// Prisma: alle modellen die de pagina over de takken heen raakt. `user.count` is UITSLUITEND de
// platformbrede admin-query — de spy waarop de leak-assertie steunt.
const userCount = vi.hoisted(() => vi.fn(async () => 0));
vi.mock("@/lib/db", () => ({
  prisma: {
    application: { count: vi.fn(async () => 0) },
    credential: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0) },
    collaboration: { findMany: vi.fn(async () => []), count: vi.fn(async () => 0) },
    user: {
      findUnique: vi.fn(async () => ({ identityVerifiedAt: null, lastLoginAt: null })),
      count: userCount,
    },
    job: { count: vi.fn(async () => 0) },
    company: { findUnique: vi.fn(async () => null), count: vi.fn(async () => 0) },
    freelancerProfile: { count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    lead: { count: vi.fn(async () => 0) },
  },
}));

import DashboardPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DashboardPage — vertakt op de live DB-rol, niet op de JWT-rol", () => {
  it("een live FREELANCER met een stale ADMIN-JWT krijgt NOOIT de platformbrede admin-query", async () => {
    authState.jwtRole = "ADMIN"; // verouderde JWT beweert admin
    authState.dbRole = "FREELANCER"; // live waarheid: niet-admin

    await DashboardPage();

    // De admin-only platform-telling mag niet draaien voor een live niet-admin (anders lekken
    // kruis-tenant gebruikers-/opdracht-tellingen naar een gedegradeerde sessie).
    expect(userCount).not.toHaveBeenCalled();
  });

  it("een live ADMIN met een stale FREELANCER-JWT krijgt WEL het admin-dashboard (en niet de ZZP-tak)", async () => {
    authState.jwtRole = "FREELANCER"; // verouderde JWT beweert freelancer
    authState.dbRole = "ADMIN"; // live waarheid: admin

    await DashboardPage();

    // De admin-tak draait (platformbrede telling), en de FREELANCER-only aanbevelingen niet.
    expect(userCount).toHaveBeenCalledTimes(1);
    expect(recommendedJobs).not.toHaveBeenCalled();
  });
});
