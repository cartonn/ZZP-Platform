import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "dispute-reminder-audit-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));

const db = fixture.db;
// Crosses the Amsterdam autumn clock change: eligibility uses elapsed 24-hour days.
const NOW = new Date("2026-10-27T12:34:56.789Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);
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
        email: `${id}@dispute-reminder.test`,
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
}, 40_000);
beforeEach(async () => {
  await db.notification.deleteMany();
  await db.auditLog.deleteMany();
  await db.domainEvent.deleteMany();
  await db.collaboration.deleteMany();
  await db.application.deleteMany();
  await db.job.deleteMany();
});
afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});
it.each([499, 500, 1001])(
  "reaches day3 dispute after %i previously escalated open disputes",
  async (count) => {
    const ids = [...Array.from({ length: count }, (_, i) => `old-${i}`), "fresh"];
    await db.job.createMany({
      data: ids.map((id) => ({
        id,
        companyId: "company",
        title: "Synthetic assignment",
        description: "Fixture",
      })),
    });
    await db.application.createMany({
      data: ids.map((id) => ({ id, jobId: id, freelancerId: "profile", motivation: "Synthetic" })),
    });
    await db.collaboration.createMany({
      data: ids.map((id) => ({
        id,
        applicationId: id,
        jobId: id,
        companyId: "company",
        freelancerId: "profile",
        status: "ACTIVE",
        contractStatus: "SIGNED",
        disputedAt: daysAgo(id === "fresh" ? 3 : 10),
      })),
    });
    await db.domainEvent.createMany({
      data: ids
        .filter((id) => id !== "fresh")
        .map((id) => ({
          type: "DISPUTE_ESCALATION",
          actorRole: "SYSTEM",
          subjectType: "Collaboration",
          subjectId: id,
          payload: "{}",
          dedupeKey: `dispute-escalation-${id}`,
        })),
    });
    const { runDisputeReminderTask } = await import("./dispute-reminders-task");
    const first = await runDisputeReminderTask({ now: NOW });
    const repeat = await runDisputeReminderTask({ now: NOW });
    const notifications = await db.notification.findMany({
      select: { userId: true, link: true, type: true },
    });

    expect(repeat).toEqual({ reminded: 0, escalated: 0 });
    expect(first).toEqual({ reminded: 2, escalated: 0 });
    expect(notifications.map((n) => n.userId).sort()).toEqual(["client", "freelancer"]);
    expect(
      notifications.every(
        (n) => n.link === "/samenwerkingen/fresh" && n.type === "DISPUTE_REMINDER",
      ),
    ).toBe(true);
  },
  30000,
);

async function seedDisputes(count: number, status: string, age: number, prefix: string) {
  const ids = Array.from(
    { length: count },
    (_, i) => `${prefix}-${String(count - i).padStart(4, "0")}`,
  );
  await db.job.createMany({
    data: ids.map((id) => ({
      id,
      companyId: "company",
      title: "Synthetic",
      description: "Fixture",
    })),
  });
  await db.application.createMany({
    data: ids.map((id) => ({ id, jobId: id, freelancerId: "profile", motivation: "Fixture" })),
  });
  await db.collaboration.createMany({
    data: ids.map((id) => ({
      id,
      applicationId: id,
      jobId: id,
      companyId: "company",
      freelancerId: "profile",
      status,
      contractStatus: "SIGNED",
      disputedAt: daysAgo(age),
    })),
  });
}
it("traverses equal timestamps across pages exactly once", async () => {
  await seedDisputes(501, "ACTIVE", 3, "tie");
  const { runDisputeReminderTask } = await import("./dispute-reminders-task");
  expect(await runDisputeReminderTask({ now: NOW })).toEqual({ reminded: 1002, escalated: 0 });
  expect(await db.notification.count()).toBe(1002);
  expect(await db.domainEvent.count()).toBe(1002);
  expect(await db.auditLog.count()).toBe(1002);
  expect(await runDisputeReminderTask({ now: NOW })).toEqual({ reminded: 0, escalated: 0 });
}, 30000);
it.each(["CANCELLED", "ACTIVE"])(
  "continues after a silent full page of %s disputes",
  async (status) => {
    await seedDisputes(500, status, status === "CANCELLED" ? 10 : 4, "quiet");
    await seedDisputes(1, "ACTIVE", 3, "fresh");
    const { runDisputeReminderTask } = await import("./dispute-reminders-task");
    expect(await runDisputeReminderTask({ now: NOW })).toEqual({ reminded: 2, escalated: 0 });
    const notes = await db.notification.findMany();
    expect(notes.every((n) => n.link === "/samenwerkingen/fresh-0001")).toBe(true);
    expect(await runDisputeReminderTask({ now: NOW })).toEqual({ reminded: 0, escalated: 0 });
  },
  30000,
);
it("escalates a later page to active admins without repeating earlier signals", async () => {
  await seedDisputes(500, "CANCELLED", 12, "quiet");
  await seedDisputes(1, "ACTIVE", 8, "fresh");
  await db.user.createMany({
    data: [
      {
        id: "admin",
        name: "Synthetic admin",
        role: "ADMIN",
        status: "ACTIVE",
        email: "admin@synthetic.test",
        passwordHash: "fixture",
      },
      {
        id: "inactive-admin",
        name: "Synthetic inactive admin",
        role: "ADMIN",
        status: "SUSPENDED",
        email: "inactive@synthetic.test",
        passwordHash: "fixture",
      },
    ],
  });
  const { runDisputeReminderTask } = await import("./dispute-reminders-task");
  expect(await runDisputeReminderTask({ now: NOW })).toEqual({ reminded: 0, escalated: 1 });
  expect(await db.notification.findMany({ select: { userId: true, link: true } })).toEqual([
    { userId: "admin", link: "/admin/disputen" },
  ]);
  expect(await db.auditLog.count()).toBe(1);
  expect(await runDisputeReminderTask({ now: NOW })).toEqual({ reminded: 0, escalated: 0 });
}, 30000);
