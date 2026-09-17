import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "roster-expired-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
import { pendingTasks } from "./pending-tasks";
import { navBadges } from "@/lib/signals";
const db = fixture.db;
const now = new Date("2026-09-17T08:00:00Z");
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
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  await db.user.createMany({
    data: ["owner", "other-owner", "a", "b", "foreign"].map((id) => ({
      id,
      name: id,
      email: `${id}@synthetic.test`,
      passwordHash: "synthetic",
      identityVerifiedAt: now,
      lastLoginAt: now,
    })),
  });
  await db.tenant.create({
    data: { id: "own", name: "Synthetic", slug: "synthetic", ownerUserId: "owner" },
  });
  await db.tenant.create({
    data: { id: "other", name: "Other", slug: "other", ownerUserId: "other-owner" },
  });
  await db.freelancerProfile.create({
    data: { id: "foreign", userId: "foreign", tenantId: "other" },
  });
  await db.user.update({ where: { id: "owner" }, data: { tenantId: "own", role: "FRANCHISER" } });
  await db.freelancerProfile.createMany({
    data: ["a", "b"].map((id) => ({
      id,
      userId: id,
      tenantId: "own",
      completeness: 100,
      availability: "AVAILABLE",
    })),
  });
  await db.credential.createMany({
    data: ["a", "b"].flatMap((freelancerProfileId) =>
      ["VOG", "INSURANCE"].map((type) => ({
        id: `mandatory-${freelancerProfileId}-${type}`,
        freelancerProfileId,
        type,
        title: type,
        status: "VERIFIED",
        expiresAt: null,
      })),
    ),
  });
  await db.credential.createMany({
    data: Array.from({ length: 50 }, (_, i) => ({
      freelancerProfileId: "a",
      type: "LICENSE",
      title: "Old",
      status: "EXPIRED",
      expiresAt: new Date(now.getTime() - (100 - i) * 86400000),
    })),
  });
  await db.credential.createMany({
    data: [
      {
        id: "a-current",
        freelancerProfileId: "a",
        type: "LICENSE",
        title: "Replacement",
        status: "VERIFIED",
        expiresAt: null,
      },
      {
        id: "target",
        freelancerProfileId: "b",
        type: "LICENSE",
        title: "Expired",
        status: "EXPIRED",
        expiresAt: new Date(now.getTime() - 86400000),
      },
    ],
  });
}, 40000);
afterAll(async () => {
  vi.useRealTimers();
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});
beforeEach(async () => {
  await db.credential.upsert({
    where: { id: "mandatory-b-VOG" },
    create: {
      id: "mandatory-b-VOG",
      freelancerProfileId: "b",
      type: "VOG",
      title: "VOG",
      status: "VERIFIED",
    },
    update: {},
  });
  await db.credential.update({ where: { id: "a-current" }, data: { expiresAt: null } });
  await db.credential.deleteMany({ where: { id: { startsWith: "extra-" } } });
  await db.credential.update({
    where: { id: "target" },
    data: { type: "LICENSE", status: "EXPIRED", expiresAt: new Date(now.getTime() - 86400000) },
  });
});
async function expectAlert(count: number) {
  const tasks = await pendingTasks({ id: "owner", role: "FRANCHISER", status: "ACTIVE" });
  const badges = await navBadges("FRANCHISER", "owner");
  expect
    .soft(tasks.filter((t) => t.kind === "franchise-credential-expired").map((t) => t.id))
    .toEqual(count ? ["franchise-credential-expired:b"] : []);
  expect.soft(badges["/franchise/zzpers"]?.count ?? 0).toBe(count);
}
it.each(["EXPIRED", "VERIFIED"])(
  "keeps an uncovered %s profile after 50 covered history rows",
  async (status) => {
    await db.credential.update({ where: { id: "target" }, data: { status } });
    await expectAlert(1);
  },
);
it("treats exactly-now expiry like the dossier helper", async () => {
  await db.credential.update({
    where: { id: "target" },
    data: { status: "VERIFIED", expiresAt: now },
  });
  await expectAlert(1);
});
it.each([null, new Date(now.getTime() + 100 * 86400000)])(
  "suppresses a current replacement expiring %s",
  async (expiresAt) => {
    await db.credential.create({
      data: {
        id: "extra-replacement",
        freelancerProfileId: "b",
        type: "LICENSE",
        title: "Replacement",
        status: "VERIFIED",
        expiresAt,
      },
    });
    await expectAlert(0);
  },
);
it.each(["DRAFT", "SUBMITTED", "REJECTED", "EXPIRED"])(
  "does not accept a %s replacement as coverage",
  async (status) => {
    await db.credential.create({
      data: {
        id: "extra-replacement",
        freelancerProfileId: "b",
        type: "LICENSE",
        title: "Replacement",
        status,
        expiresAt: null,
      },
    });
    await expectAlert(1);
  },
);
it("does not accept another type or another profile as coverage", async () => {
  await db.credential.createMany({
    data: [
      {
        id: "extra-other-type",
        freelancerProfileId: "b",
        type: "DIPLOMA",
        title: "Diploma",
        status: "VERIFIED",
      },
      {
        id: "extra-foreign-cover",
        freelancerProfileId: "foreign",
        type: "LICENSE",
        title: "Foreign",
        status: "VERIFIED",
      },
      {
        id: "extra-foreign-expired",
        freelancerProfileId: "foreign",
        type: "CERTIFICATE",
        title: "Foreign",
        status: "EXPIRED",
      },
    ],
  });
  await expectAlert(1);
});
it("keeps mandatory types in their existing engageability flow", async () => {
  await db.credential.update({ where: { id: "target" }, data: { type: "VOG" } });
  await expectAlert(0);
});

describe("upcoming expiry candidate coverage", () => {
  const day = 86400000;
  beforeEach(async () => {
    await db.credential.createMany({
      data: Array.from({ length: 50 }, (_, i) => ({
        id: `extra-upcoming-${i}`,
        freelancerProfileId: "a",
        type: "LICENSE",
        title: "Old upcoming",
        status: "VERIFIED",
        expiresAt: new Date(now.getTime() + (i + 1) * 3600000),
      })),
    });
    await db.credential.update({
      where: { id: "target" },
      data: { status: "VERIFIED", expiresAt: new Date(now.getTime() + 10 * day) },
    });
  });
  async function expectUpcoming(ids: string[], badgeCount = ids.length) {
    const tasks = await pendingTasks({ id: "owner", role: "FRANCHISER", status: "ACTIVE" });
    const badges = await navBadges("FRANCHISER", "owner");
    expect
      .soft(
        tasks
          .filter((t) => t.kind === "franchise-credential-expiry")
          .map((t) => t.id)
          .sort(),
      )
      .toEqual(ids.map((id) => `franchise-credential-expiry:${id}`));
    expect.soft(badges["/franchise/zzpers"]?.count ?? 0).toBe(badgeCount);
  }
  it.each([null, new Date(now.getTime() + 31 * day)])(
    "keeps the uncovered reminder behind 50 replaced rows (replacement expires %s)",
    async (expiresAt) => {
      await db.credential.update({ where: { id: "a-current" }, data: { expiresAt } });
      await expectUpcoming(["b"]);
    },
  );
  it.each([20, 30])(
    "still warns when the replacement expires within the window at day %i",
    async (days) => {
      await db.credential.deleteMany({
        where: { id: { startsWith: "extra-upcoming-" }, NOT: { id: "extra-upcoming-0" } },
      });
      await db.credential.update({
        where: { id: "a-current" },
        data: { expiresAt: new Date(now.getTime() + days * day) },
      });
      await expectUpcoming(["a", "b"]);
    },
  );
  it.each(["DRAFT", "SUBMITTED", "REJECTED", "EXPIRED"])(
    "does not let a %s replacement cover an upcoming expiry",
    async (status) => {
      await db.credential.create({
        data: {
          id: "extra-b-cover",
          freelancerProfileId: "b",
          type: "LICENSE",
          title: "Unapproved",
          status,
          expiresAt: null,
        },
      });
      await expectUpcoming(["b"]);
    },
  );
  it("keeps foreign credentials and other types out of coverage", async () => {
    await db.credential.createMany({
      data: [
        {
          id: "extra-foreign",
          freelancerProfileId: "foreign",
          type: "CERTIFICATE",
          title: "Foreign expiry",
          status: "VERIFIED",
          expiresAt: new Date(now.getTime() + day),
        },
        {
          id: "extra-foreign-cover",
          freelancerProfileId: "foreign",
          type: "LICENSE",
          title: "Foreign coverage",
          status: "VERIFIED",
          expiresAt: null,
        },
        {
          id: "extra-other-type",
          freelancerProfileId: "b",
          type: "DIPLOMA",
          title: "Other type",
          status: "VERIFIED",
          expiresAt: null,
        },
      ],
    });
    await expectUpcoming(["b"]);
  });
  it("keeps mandatory upcoming reminders when no replacement covers them", async () => {
    await db.credential.deleteMany({ where: { freelancerProfileId: "b", type: "VOG" } });
    await db.credential.update({ where: { id: "target" }, data: { type: "VOG" } });
    await expectUpcoming(["b"]);
  });
  it("keeps exactly-now expiry out of upcoming candidate slots", async () => {
    await db.credential.update({ where: { id: "a-current" }, data: { expiresAt: now } });
    await db.credential.updateMany({
      where: { id: { startsWith: "extra-upcoming-" } },
      data: { expiresAt: now },
    });
    // A now has an expired alert; B still has its separate upcoming alert.
    await expectUpcoming(["b"], 2);
  });
});
