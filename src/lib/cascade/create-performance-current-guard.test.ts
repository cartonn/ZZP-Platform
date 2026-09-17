import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "performance-current-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  const hooks = { afterGuard: null as (() => Promise<void>) | null, failCreate: false };
  const db = new PrismaClient({ datasourceUrl: url }).$extends({
    query: {
      performance: {
        async create({ args, query }) {
          if (hooks.failCreate) throw new Error("Synthetic draft storage failure");
          return query(args);
        },
      },
      collaboration: {
        async findUnique({ args, query }) {
          const snapshot = await query(args);
          if (args.select?.disputedAt && hooks.afterGuard) {
            const change = hooks.afterGuard;
            hooks.afterGuard = null;
            await change();
          }
          return snapshot;
        },
      },
    },
  });
  return { directory, url, db, hooks };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
import { createPerformance } from "./performance-commands";
const db = fixture.db;
const actor = { id: "freelancer", role: "FREELANCER" as const, status: "ACTIVE" };
const input = {
  collaborationId: "collaboration",
  type: "HOURS" as const,
  hours: 8,
  rateCents: 5000,
};

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
    { env, timeout: 30000, stdio: "pipe" },
  );
  for (const id of ["client", "freelancer", "outsider"]) {
    await db.user.create({
      data: { id, email: `${id}@synthetic.test`, name: id, passwordHash: "synthetic-unused" },
    });
  }
  await db.company.create({ data: { id: "company", userId: "client", name: "Synthetic" } });
  for (const id of ["freelancer", "outsider"]) {
    await db.freelancerProfile.create({ data: { id, userId: id } });
  }
  await db.job.create({
    data: { id: "job", companyId: "company", title: "Synthetic", description: "Test" },
  });
  await db.application.create({
    data: { id: "application", jobId: "job", freelancerId: "freelancer", motivation: "Test" },
  });
  await db.collaboration.create({
    data: {
      id: "collaboration",
      jobId: "job",
      applicationId: "application",
      companyId: "company",
      freelancerId: "freelancer",
      status: "ACTIVE",
    },
  });
}, 40000);
beforeEach(async () => {
  fixture.hooks.afterGuard = null;
  fixture.hooks.failCreate = false;
  await db.performance.deleteMany();
  await db.collaboration.update({
    where: { id: "collaboration" },
    data: { status: "ACTIVE", disputedAt: null, freelancerId: "freelancer" },
  });
});
afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

it.each([
  { name: "new dispute", data: { disputedAt: new Date("2026-09-17T14:00:00Z") } },
  { name: "cancelled collaboration", data: { status: "CANCELLED" } },
  { name: "completed collaboration", data: { status: "COMPLETED" } },
  { name: "changed freelancer", data: { freelancerId: "outsider" } },
])("refuses a draft after $name changes following the guard read", async ({ data }) => {
  fixture.hooks.afterGuard = async () => {
    await db.collaboration.update({ where: { id: "collaboration" }, data });
  };
  await expect.soft(createPerformance(actor, input)).rejects.toThrow();
  expect(await db.performance.count()).toBe(0);
});
it("creates the normal owned active draft", async () => {
  const id = await createPerformance(actor, input);
  expect(
    await db.performance.findUnique({
      where: { id },
      select: { status: true, hours: true, rateCents: true },
    }),
  ).toEqual({ status: "DRAFT", hours: 8, rateCents: 5000 });
});

it("preserves the administrator's existing draft-creation authority", async () => {
  const id = await createPerformance(
    { ...actor, id: "administrator", role: "ADMIN" },
    { ...input, type: "MILESTONE", amountCents: 25000, milestoneTitle: "Synthetic delivery" },
  );
  expect(
    await db.performance.findUnique({
      where: { id },
      select: { status: true, type: true, amountCents: true, hours: true },
    }),
  ).toEqual({ status: "DRAFT", type: "MILESTONE", amountCents: 25000, hours: null });
});
it("does not let administrator authority bypass a newly opened dispute", async () => {
  fixture.hooks.afterGuard = async () => {
    await db.collaboration.update({
      where: { id: "collaboration" },
      data: { disputedAt: new Date() },
    });
  };
  await expect(
    createPerformance({ ...actor, id: "administrator", role: "ADMIN" }, input),
  ).rejects.toThrow(/gewijzigd|bevroren/i);
  expect(await db.performance.count()).toBe(0);
});
it("rolls back the parent guard when storing the draft fails", async () => {
  const updatedAt = new Date("2020-01-01T00:00:00Z");
  await db.collaboration.update({ where: { id: "collaboration" }, data: { updatedAt } });
  fixture.hooks.failCreate = true;
  await expect(createPerformance(actor, input)).rejects.toThrow("Synthetic draft storage failure");
  expect(await db.performance.count()).toBe(0);
  expect(
    (await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } })).updatedAt,
  ).toEqual(updatedAt);
});
