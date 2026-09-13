import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "admin-performance-escalations-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }), days: [3, 7] };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
vi.mock("@/lib/config", () => ({
  REMINDERS: {
    get performanceApprovalDays() {
      return fixture.days;
    },
  },
}));

const db = fixture.db;
// Crosses the Amsterdam autumn clock change: eligibility uses elapsed 24-hour days.
const NOW = new Date("2026-10-27T12:34:56.789Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);
async function load(now = NOW) {
  const { getAdminPerformanceEscalations } = await import("./admin-performance-escalations");
  return getAdminPerformanceEscalations(now);
}
async function performance(
  id: string,
  submittedAt: Date | null = daysAgo(8),
  status = "SUBMITTED",
) {
  await db.performance.create({
    data: {
      id,
      collaborationId: "collaboration",
      submittedAt,
      status,
      description: `Synthetic ${id}`,
    },
  });
}

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
    { env, timeout: 30_000, stdio: "pipe" },
  );
  for (const [id, role] of [
    ["client", "CLIENT"],
    ["freelancer", "FREELANCER"],
  ]) {
    await db.user.create({
      data: {
        id,
        role,
        email: `${id}@performance-escalation.test`,
        name: `Synthetic ${id}`,
        passwordHash: "synthetic-hash",
      },
    });
  }
  await db.company.create({ data: { id: "company", userId: "client", name: "Synthetic company" } });
  await db.freelancerProfile.create({ data: { id: "profile", userId: "freelancer" } });
  await db.job.create({
    data: {
      id: "job",
      companyId: "company",
      title: "Synthetic assignment",
      description: "Fixture",
    },
  });
  await db.application.create({
    data: { id: "application", jobId: "job", freelancerId: "profile", motivation: "Synthetic" },
  });
  await db.collaboration.create({
    data: {
      id: "collaboration",
      applicationId: "application",
      jobId: "job",
      companyId: "company",
      freelancerId: "profile",
      status: "ACTIVE",
    },
  });
}, 40_000);

beforeEach(async () => {
  fixture.days = [3, 7];
  vi.resetModules();
  await db.performance.deleteMany();
  await db.collaboration.update({
    where: { id: "collaboration" },
    data: { status: "ACTIVE", disputedAt: null },
  });
});

afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

describe("admin performance escalations against a real isolated database", () => {
  it("includes the exact eighth full day but not one millisecond before it", async () => {
    await performance("exact", daysAgo(8));
    await performance("older", new Date(daysAgo(8).getTime() - 1));
    await performance("too-young", new Date(daysAgo(8).getTime() + 1));
    await performance("last-reminder", daysAgo(7));
    await performance("future", new Date(NOW.getTime() + 1));
    await performance("missing-submission", null);
    expect(await load()).toEqual([
      {
        id: "older",
        collaborationId: "collaboration",
        submittedAt: new Date(daysAgo(8).getTime() - 1),
        description: "Synthetic older",
        collaboration: { job: { title: "Synthetic assignment" } },
      },
      {
        id: "exact",
        collaborationId: "collaboration",
        submittedAt: daysAgo(8),
        description: "Synthetic exact",
        collaboration: { job: { title: "Synthetic assignment" } },
      },
    ]);
  });

  it.each(["DRAFT", "APPROVED", "REJECTED"])(
    "removes a resolved or unsubmitted performance in status %s",
    async (status) => {
      await performance("performance");
      expect(await load()).toHaveLength(1);
      await db.performance.update({ where: { id: "performance" }, data: { status } });
      expect(await load()).toEqual([]);
    },
  );

  it.each(["PROPOSED", "COMPLETED", "CANCELLED"])(
    "removes performances when the collaboration becomes %s",
    async (status) => {
      await performance("performance");
      expect(await load()).toHaveLength(1);
      await db.collaboration.update({ where: { id: "collaboration" }, data: { status } });
      expect(await load()).toEqual([]);
    },
  );

  it("disappears during a dispute and returns after resolution without a reminder event", async () => {
    await performance("performance");
    expect(await load()).toHaveLength(1);
    expect(await load()).toHaveLength(1);
    await db.collaboration.update({
      where: { id: "collaboration" },
      data: { disputedAt: NOW },
    });
    expect(await load()).toEqual([]);
    await db.collaboration.update({
      where: { id: "collaboration" },
      data: { disputedAt: null },
    });
    expect(await load()).toHaveLength(1);
    expect(await db.domainEvent.count()).toBe(0);
    expect(await db.notification.count()).toBe(0);
    expect(await db.auditLog.count()).toBe(0);
  });

  it("uses the latest positive configured reminder plus one full day", async () => {
    fixture.days = [3, 10, 7, 0, -2];
    await performance("default-boundary", daysAgo(8));
    await performance("last-reminder", daysAgo(10));
    await performance("just-before", new Date(daysAgo(11).getTime() + 1));
    await performance("configured-boundary", daysAgo(11));
    expect((await load()).map((row) => row.id)).toEqual(["configured-boundary"]);
  });

  it.each([{ days: [] }, { days: [0, -2] }])(
    "keeps the eighth-day fallback for reminder configuration $days",
    async ({ days }) => {
      fixture.days = days;
      await performance("exact", daysAgo(8));
      await performance("just-before", new Date(daysAgo(8).getTime() + 1));
      expect((await load()).map((row) => row.id)).toEqual(["exact"]);
    },
  );

  it("returns the oldest fifty with a stable id tiebreaker and replaces resolved rows", async () => {
    const ids = Array.from(
      { length: 54 },
      (_, index) => `performance-${String(index).padStart(2, "0")}`,
    );
    await db.performance.createMany({
      data: [...ids].reverse().map((id) => ({
        id,
        collaborationId: "collaboration",
        status: "SUBMITTED",
        submittedAt: daysAgo(8),
      })),
    });
    await performance("z-oldest", daysAgo(9));
    expect((await load()).map((row) => row.id)).toEqual(["z-oldest", ...ids.slice(0, 49)]);
    await db.performance.update({ where: { id: "z-oldest" }, data: { status: "APPROVED" } });
    expect((await load()).map((row) => row.id)).toEqual(ids.slice(0, 50));
  });
});
