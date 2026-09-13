import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "handoff-cancel-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  const hooks = { afterRead: null as (() => Promise<void>) | null };
  const db = new PrismaClient({ datasourceUrl: url }).$extends({
    query: {
      shiftHandoff: {
        async findUnique({ args, query }) {
          const snapshot = await query(args);
          const afterRead = hooks.afterRead;
          hooks.afterRead = null;
          if (afterRead) await afterRead();
          return snapshot;
        },
      },
    },
  });
  return { directory, url, db, hooks, actorId: "freelancer" };
});

vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
vi.mock("@/lib/authz", () => ({
  requireRole: async () => ({ id: fixture.actorId, role: "FREELANCER", status: "ACTIVE" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { cancelShiftHandoff } from "./shift-handoff-actions";

const db = fixture.db;
const cancel = () => cancelShiftHandoff("handoff", undefined);
const current = () => db.shiftHandoff.findUniqueOrThrow({ where: { id: "handoff" } });

beforeAll(async () => {
  // All database mutations target a new synthetic database owned by this test.
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
  for (const id of ["client", "freelancer", "outsider"]) {
    await db.user.create({
      data: { id, email: `${id}@handoff.test`, name: id, passwordHash: "synthetic-unused" },
    });
  }
  await db.company.create({ data: { id: "company", userId: "client", name: "Synthetic" } });
  await db.freelancerProfile.create({ data: { id: "profile", userId: "freelancer" } });
  await db.job.create({
    data: { id: "job", companyId: "company", title: "Synthetic", description: "Test" },
  });
  await db.application.create({
    data: { id: "application", jobId: "job", freelancerId: "profile", motivation: "Test" },
  });
  await db.collaboration.create({
    data: {
      id: "collaboration",
      jobId: "job",
      applicationId: "application",
      companyId: "company",
      freelancerId: "profile",
    },
  });
  await db.shiftHandoff.create({
    data: {
      id: "handoff",
      collaborationId: "collaboration",
      requestedByUserId: "freelancer",
      reason: "Synthetic handoff request",
    },
  });
}, 40_000);

beforeEach(async () => {
  fixture.hooks.afterRead = null;
  fixture.actorId = "freelancer";
  await db.auditLog.deleteMany();
  await db.collaboration.update({
    where: { id: "collaboration" },
    data: { status: "ACTIVE", disputedAt: null },
  });
  await db.shiftHandoff.update({
    where: { id: "handoff" },
    data: { status: "OPEN", requestedByUserId: "freelancer" },
  });
});

afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

it("cancels its own open request once, with one audit", async () => {
  expect(await cancel()).toEqual({ ok: true });
  expect((await current()).status).toBe("CANCELLED");
  expect(await cancel()).toHaveProperty("error");
  const entries = await db.auditLog.findMany();
  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatchObject({
    actorId: "freelancer",
    action: "SHIFT_HANDOFF_CANCELLED",
    entityId: "handoff",
    metadata: JSON.stringify({ collaborationId: "collaboration" }),
  });
});

it.each(["PROPOSED", "COMPLETED", "CANCELLED", "INVALID"])(
  "does not withdraw a request on a %s collaboration",
  async (status) => {
    await db.collaboration.update({ where: { id: "collaboration" }, data: { status } });
    expect(await cancel()).toHaveProperty("error");
    expect((await current()).status).toBe("OPEN");
    expect(await db.auditLog.count()).toBe(0);
  },
);

it("does not withdraw a request during a dispute", async () => {
  await db.collaboration.update({
    where: { id: "collaboration" },
    data: { disputedAt: new Date() },
  });
  expect(await cancel()).toHaveProperty("error");
  expect((await current()).status).toBe("OPEN");
  expect(await db.auditLog.count()).toBe(0);
});

it.each(["APPROVED", "REJECTED", "CANCELLED"])("preserves the %s decision", async (status) => {
  await db.shiftHandoff.update({ where: { id: "handoff" }, data: { status } });
  expect(await cancel()).toHaveProperty("error");
  expect((await current()).status).toBe(status);
  expect(await db.auditLog.count()).toBe(0);
});

it("keeps unknown and foreign request errors identical, and audits only the denied foreign access", async () => {
  fixture.actorId = "outsider";
  expect(await cancel()).toEqual(await cancelShiftHandoff("missing", undefined));
  expect((await current()).status).toBe("OPEN");
  const entries = await db.auditLog.findMany();
  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatchObject({ action: "SHIFT_HANDOFF_CANCEL_DENIED" });
});

it.each([{ status: "CANCELLED" }, { status: "COMPLETED" }, { disputedAt: new Date() }])(
  "rejects a lifecycle change after the initial read: %j",
  async (data) => {
    fixture.hooks.afterRead = async () => {
      await db.collaboration.update({ where: { id: "collaboration" }, data });
    };
    expect(await cancel()).toHaveProperty("error");
    expect((await current()).status).toBe("OPEN");
    expect(await db.auditLog.count()).toBe(0);
  },
);

it("preserves a decision committed after the initial read", async () => {
  fixture.hooks.afterRead = async () => {
    await db.shiftHandoff.update({ where: { id: "handoff" }, data: { status: "APPROVED" } });
  };
  expect(await cancel()).toHaveProperty("error");
  expect((await current()).status).toBe("APPROVED");
  expect(await db.auditLog.count()).toBe(0);
});

it("does not reuse stale requester ownership", async () => {
  fixture.hooks.afterRead = async () => {
    await db.shiftHandoff.update({
      where: { id: "handoff" },
      data: { requestedByUserId: "outsider" },
    });
  };
  expect(await cancel()).toHaveProperty("error");
  expect((await current()).status).toBe("OPEN");
  expect(await db.auditLog.count()).toBe(0);
});

it("two requests with stale reads commit only one cancellation and audit", async () => {
  fixture.hooks.afterRead = async () => {
    expect(await cancel()).toEqual({ ok: true });
  };
  expect(await cancel()).toHaveProperty("error");
  expect((await current()).status).toBe("CANCELLED");
  expect(await db.auditLog.count()).toBe(1);
});

it("rolls back the withdrawal if its audit cannot be saved", async () => {
  await db.$executeRawUnsafe(
    "CREATE TRIGGER reject_handoff_audit BEFORE INSERT ON AuditLog BEGIN SELECT RAISE(ABORT, 'synthetic audit failure'); END;",
  );
  try {
    await expect(cancel()).rejects.toThrow();
    expect((await current()).status).toBe("OPEN");
    expect(await db.auditLog.count()).toBe(0);
  } finally {
    await db.$executeRawUnsafe("DROP TRIGGER reject_handoff_audit");
  }
});
