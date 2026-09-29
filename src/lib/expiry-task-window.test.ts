import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "expiry-cap-repro-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
const db = fixture.db;
const NOW = new Date("2026-09-29T08:22:00Z");
const OLD_EXPIRY = new Date("2026-10-09T08:22:00Z");
const NEW_EXPIRY = new Date("2026-10-19T08:22:00Z");
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
  for (const id of ["old", "fresh"]) {
    await db.user.create({
      data: {
        id,
        role: "FREELANCER",
        email: `${id}@synthetic.test`,
        name: id,
        passwordHash: "synthetic",
      },
    });
    await db.freelancerProfile.create({ data: { id, userId: id } });
  }
}, 40000);
beforeEach(async () => {
  await db.notification.deleteMany();
  await db.auditLog.deleteMany();
  await db.credential.deleteMany();
});
afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});
it.each([1999, 2000, 4001])(
  "reminds a fresh certificate behind %i already reminded credentials",
  async (count) => {
    await db.credential.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        id: `old-${i}`,
        freelancerProfileId: "old",
        type: "CERTIFICATE",
        title: `Synthetic old ${i}`,
        status: "VERIFIED",
        expiresAt: OLD_EXPIRY,
        expiryReminderFor: OLD_EXPIRY,
      })),
    });
    await db.credential.create({
      data: {
        id: "new",
        freelancerProfileId: "fresh",
        type: "CERTIFICATE",
        title: "Synthetic fresh",
        status: "VERIFIED",
        expiresAt: NEW_EXPIRY,
      },
    });
    const { runExpiryTask } = await import("./expiry-task");
    const first = await runExpiryTask({ actorId: null, now: NOW });
    const second = await runExpiryTask({ actorId: null, now: NOW });
    const notifications = await db.notification.count({
      where: { userId: "fresh", type: "CREDENTIAL_EXPIRING" },
    });
    const credential = await db.credential.findUniqueOrThrow({ where: { id: "new" } });

    expect({ first, second, notifications, marker: credential.expiryReminderFor }).toEqual({
      first: { expired: 0, reminded: 1 },
      second: { expired: 0, reminded: 0 },
      notifications: 1,
      marker: NEW_EXPIRY,
    });
  },
);

it("traverses equal expiry timestamps using the id tie-breaker", async () => {
  await db.credential.createMany({
    data: Array.from({ length: 2001 }, (_, i) => ({
      id: `old-${String(i).padStart(4, "0")}`,
      freelancerProfileId: "old",
      type: "CERTIFICATE",
      title: "Synthetic",
      status: "VERIFIED",
      expiresAt: OLD_EXPIRY,
      expiryReminderFor: OLD_EXPIRY,
    })),
  });
  await db.credential.create({
    data: {
      id: "zz-fresh",
      freelancerProfileId: "fresh",
      type: "CERTIFICATE",
      title: "Synthetic fresh",
      status: "VERIFIED",
      expiresAt: OLD_EXPIRY,
    },
  });
  const { runExpiryTask } = await import("./expiry-task");
  expect(await runExpiryTask({ actorId: null, now: NOW })).toEqual({ expired: 0, reminded: 1 });
  expect(await db.notification.count({ where: { userId: "fresh" } })).toBe(1);
  expect(await runExpiryTask({ actorId: null, now: NOW })).toEqual({ expired: 0, reminded: 0 });
});
it("continues past a page suppressed by permanent coverage without crossing profiles", async () => {
  await db.credential.createMany({
    data: Array.from({ length: 2000 }, (_, i) => ({
      id: `old-${i}`,
      freelancerProfileId: "old",
      type: "CERTIFICATE",
      title: "Synthetic",
      status: "VERIFIED",
      expiresAt: OLD_EXPIRY,
    })),
  });
  await db.credential.create({
    data: {
      id: "cover",
      freelancerProfileId: "old",
      type: "CERTIFICATE",
      title: "Permanent cover",
      status: "VERIFIED",
    },
  });
  await db.credential.create({
    data: {
      id: "fresh-item",
      freelancerProfileId: "fresh",
      type: "CERTIFICATE",
      title: "Synthetic fresh",
      status: "VERIFIED",
      expiresAt: NEW_EXPIRY,
    },
  });
  const { runExpiryTask } = await import("./expiry-task");
  expect(await runExpiryTask({ actorId: null, now: NOW })).toEqual({ expired: 0, reminded: 1 });
  expect(await db.notification.count({ where: { userId: "old" } })).toBe(0);
  expect(await db.notification.count({ where: { userId: "fresh" } })).toBe(1);
  expect(
    await db.credential.count({
      where: { freelancerProfileId: "old", expiryReminderFor: { not: null } },
    }),
  ).toBe(0);
  expect(await runExpiryTask({ actorId: null, now: NOW })).toEqual({ expired: 0, reminded: 0 });
});
it("expires every page without offset skips when processed rows leave the query", async () => {
  await db.credential.createMany({
    data: Array.from({ length: 2001 }, (_, i) => ({
      id: `expired-${String(i).padStart(4, "0")}`,
      freelancerProfileId: "old",
      type: "CERTIFICATE",
      title: "Synthetic",
      status: "VERIFIED",
      expiresAt: NOW,
    })),
  });
  const { runExpiryTask } = await import("./expiry-task");
  expect(await runExpiryTask({ actorId: null, now: NOW })).toEqual({ expired: 2001, reminded: 0 });
  expect(await db.credential.count({ where: { status: "EXPIRED" } })).toBe(2001);
  expect(await db.notification.count({ where: { type: "CREDENTIAL_EXPIRED" } })).toBe(2001);
  expect(await db.auditLog.count({ where: { action: "CREDENTIALS_EXPIRED" } })).toBe(2);
  expect(await runExpiryTask({ actorId: null, now: NOW })).toEqual({ expired: 0, reminded: 0 });
  expect(await db.notification.count()).toBe(2001);
}, 20000);
