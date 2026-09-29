import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "submission-reminder-window-"));
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
        email: `${id}@submission-reminder.test`,
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
  await db.performance.deleteMany();
  await db.collaboration.deleteMany();
  await db.application.deleteMany();
  await db.job.deleteMany();
});
afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});
it.each([999, 1000, 2001])(
  "reaches due submission after %i silent active collaborations",
  async (count) => {
    const ids = [
      ...Array.from({ length: count }, (_, i) => `old-${String(i).padStart(4, "0")}`),
      "zzz-fresh",
    ];
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
        status: "ACTIVE",
        contractStatus: "SIGNED",
      })),
    });
    await db.performance.create({
      data: {
        id: "due-hours",
        collaborationId: "zzz-fresh",
        type: "HOURS",
        status: "APPROVED",
        submittedAt: daysAgo(7),
      },
    });
    const { runPerformanceSubmissionReminderTask } =
      await import("./performance-submission-reminders-task");
    const first = await runPerformanceSubmissionReminderTask({ now: NOW });
    const repeat = await runPerformanceSubmissionReminderTask({ now: NOW });

    expect(repeat).toEqual({ reminded: 0 });
    expect(first).toEqual({ reminded: 1 });
    expect(
      await db.notification.findMany({ select: { userId: true, link: true, type: true } }),
    ).toEqual([
      {
        userId: "freelancer",
        link: "/samenwerkingen/zzz-fresh",
        type: "PERFORMANCE_SUBMISSION_REMINDER",
      },
    ]);
  },
  30000,
);

it("keeps latest anchors, open submissions and recipients correct across pages", async () => {
  await db.user.create({
    data: {
      id: "second-user",
      role: "FREELANCER",
      name: "Second",
      email: "second@synthetic.test",
      passwordHash: "fixture",
    },
  });
  await db.freelancerProfile.create({ data: { id: "second-profile", userId: "second-user" } });
  const ids = [
    ...Array.from({ length: 1000 }, (_, i) => `quiet-${i}`),
    "z-day7",
    "z-day14",
    "z-draft",
    "z-submitted",
    "z-recent",
    "z-unsigned",
    "z-completed",
  ];
  await db.job.createMany({
    data: ids.map((id) => ({
      id,
      companyId: "company",
      title: "Synthetic",
      description: "Fixture",
    })),
  });
  await db.application.createMany({
    data: ids.map((id) => ({
      id,
      jobId: id,
      freelancerId: id === "z-day14" ? "second-profile" : "profile",
      motivation: "Fixture",
    })),
  });
  await db.collaboration.createMany({
    data: ids.map((id) => ({
      id,
      applicationId: id,
      jobId: id,
      companyId: "company",
      freelancerId: id === "z-day14" ? "second-profile" : "profile",
      status: id === "z-completed" ? "COMPLETED" : "ACTIVE",
      contractStatus: id === "z-unsigned" ? "DRAFT" : "SIGNED",
    })),
  });
  await db.performance.createMany({
    data: ids.map((id) => ({
      id: `approved-${id}`,
      collaborationId: id,
      type: "HOURS",
      status: "APPROVED",
      submittedAt: daysAgo(id === "z-day14" ? 14 : 7),
    })),
  });
  await db.performance.createMany({
    data: ids
      .filter((id) => id.startsWith("quiet") || id === "z-draft" || id === "z-submitted")
      .map((id) => ({
        id: `open-${id}`,
        collaborationId: id,
        type: "MILESTONE",
        status: id === "z-submitted" ? "SUBMITTED" : "DRAFT",
      })),
  });
  await db.performance.create({
    data: {
      id: "latest",
      collaborationId: "z-recent",
      type: "HOURS",
      status: "APPROVED",
      submittedAt: daysAgo(1),
    },
  });
  const { runPerformanceSubmissionReminderTask } =
    await import("./performance-submission-reminders-task");
  expect(await runPerformanceSubmissionReminderTask({ now: NOW })).toEqual({ reminded: 2 });
  expect(
    await db.notification.findMany({
      select: { userId: true, link: true },
      orderBy: { link: "asc" },
    }),
  ).toEqual([
    { userId: "second-user", link: "/samenwerkingen/z-day14" },
    { userId: "freelancer", link: "/samenwerkingen/z-day7" },
  ]);
  expect(await db.domainEvent.count()).toBe(2);
  expect(await db.auditLog.count()).toBe(2);
  expect(await runPerformanceSubmissionReminderTask({ now: NOW })).toEqual({ reminded: 0 });
}, 30000);
