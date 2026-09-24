import { it, expect, vi, beforeAll, afterAll } from "vitest";

const authState = vi.hoisted(() => ({
  jwtRole: "CLIENT" as string,
  dbRole: "CLIENT" as string,
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
  getClientRevenueTrend: vi.fn(async () => ({ currentCents: 0, deltaPct: null })),
}));
vi.mock("@/lib/data/unbilled-invoices", () => ({
  getUnbilledInvoiceSummary: vi.fn(async () => null),
}));
vi.mock("@/lib/client-stats", () => ({
  getClientStats: vi.fn(async () => ({})),
  fillRateHint: vi.fn(() => null),
}));

import { execFileSync } from "node:child_process";
import type { Prisma } from "@prisma/client";
import { resolve } from "node:path";
const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "dashboard-window-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return {
    directory,
    url,
    db: new PrismaClient({ datasourceUrl: url }),
    queries: [] as Prisma.CollaborationFindManyArgs[],
    dashboardRows: [] as Prisma.CollaborationGetPayload<{
      include: typeof COLLABORATION_ALERT_INCLUDE;
    }>[],
  };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
import DashboardPage from "@/app/(protected)/dashboard/page";
import {
  clientCredentialAlerts,
  clientCredentialAlertsFromRows,
  COLLABORATION_ALERT_INCLUDE,
} from "@/lib/collaboration-alerts";
beforeAll(async () => {
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: fixture.url };
  delete env.RUST_LOG;
  execFileSync(
    process.execPath,
    [
      "node_modules/prisma/build/index.js",
      "db",
      "push",
      "--skip-generate",
      "--schema",
      resolve("prisma/schema.prisma"),
    ],
    { env, stdio: "pipe", timeout: 30000 },
  );
  const db = fixture.db;
  await db.user.createMany({
    data: [
      {
        id: "user-1",
        email: "client@synthetic.test",
        name: "Synthetic",
        passwordHash: "none",
        role: "CLIENT",
      },
      {
        id: "freelancer",
        email: "freelancer@synthetic.test",
        name: "Synthetic",
        passwordHash: "none",
        role: "FREELANCER",
      },
    ],
  });
  await db.company.create({ data: { id: "company", userId: "user-1", name: "Synthetic" } });
  await db.freelancerProfile.create({ data: { id: "freelancer", userId: "freelancer" } });
  await db.user.create({
    data: {
      id: "foreign",
      email: "foreign@synthetic.test",
      name: "Foreign",
      passwordHash: "none",
      role: "CLIENT",
    },
  });
  await db.company.create({ data: { id: "foreign", userId: "foreign", name: "Foreign" } });
  // 200 irrelevant rows, two actionable rows (older inserted second), then excluded rows.
  for (let i = 0; i < 205; i++) {
    const id = `collab-${String(i).padStart(3, "0")}`;
    await db.job.create({
      data: {
        id,
        companyId: i === 204 ? "foreign" : "company",
        title: id,
        description: "Synthetic",
        ...(i >= 200
          ? { credentialRequirements: { create: { credentialType: "VOG", required: true } } }
          : {}),
      },
    });
    await db.application.create({
      data: { id, jobId: id, freelancerId: "freelancer", motivation: "Synthetic" },
    });
    await db.collaboration.create({
      data: {
        id,
        jobId: id,
        applicationId: id,
        companyId: i === 204 ? "foreign" : "company",
        freelancerId: "freelancer",
        status: i === 203 ? "COMPLETED" : "ACTIVE",
        disputedAt: i === 202 ? new Date() : null,
        createdAt: new Date(i === 201 ? 2024 : 2025, 0, 1 + i),
      },
    });
  }
  const find = db.collaboration.findMany.bind(db.collaboration);
  vi.spyOn(db.collaboration, "findMany").mockImplementation((async (
    args?: Prisma.CollaborationFindManyArgs,
  ) => {
    const rows = await find(args);
    if (args?.take === 200) {
      fixture.queries.push(args);
      if (fixture.queries.length === 1)
        fixture.dashboardRows = rows as typeof fixture.dashboardRows;
    }
    return rows;
  }) as typeof db.collaboration.findMany);
}, 40000);
afterAll(async () => {
  await fixture.db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});
it("keeps dashboard alerts aligned with actions beyond 200 irrelevant collaborations", async () => {
  await DashboardPage();
  const canonical = await clientCredentialAlerts("user-1");
  expect(fixture.queries).toHaveLength(2);
  const dashboard = clientCredentialAlertsFromRows(fixture.dashboardRows);
  expect(dashboard.map((x) => x.collaborationId)).toEqual(["collab-201", "collab-200"]);
  expect(dashboard).toEqual(canonical);
  expect(fixture.queries[0]).toEqual(fixture.queries[1]);
});
