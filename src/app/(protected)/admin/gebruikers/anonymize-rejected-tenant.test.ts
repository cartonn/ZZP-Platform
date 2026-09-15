import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "rejected-tenant-erasure-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({ id: "admin", role: "ADMIN", status: "ACTIVE" })),
}));
vi.mock("@/lib/request-meta", () => ({
  requestMeta: vi.fn(async () => ({ ipAddress: null, userAgent: null })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/services/storage", () => ({
  getStorage: () => {
    throw new Error("No storage calls expected in this synthetic fixture");
  },
}));
import { anonymizeUser } from "./actions";

const db = fixture.db;
const registration = { slug: "synthetic-owner-bureau", status: "PENDING", kvkNumber: "12345678" };
const rejection = {
  from: "PENDING",
  to: "REJECTED",
  reason: "Synthetic private application detail",
};

beforeAll(() => {
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
}, 40_000);

beforeEach(async () => {
  await db.$executeRawUnsafe("DROP TRIGGER IF EXISTS fail_erasure_audit");
  await db.auditLog.deleteMany();
  await db.tenant.deleteMany();
  await db.user.deleteMany();
  await db.user.createMany({
    data: ["admin", "owner", "foreign-owner"].map((id) => ({
      id,
      name: `Synthetic ${id}`,
      email: `${id}@erasure.test`,
      passwordHash: "synthetic-hash",
      role: id === "admin" ? "ADMIN" : "FRANCHISER",
      deletionRequestedAt: id === "owner" ? new Date("2026-09-14T00:00:00Z") : null,
    })),
  });
  await db.tenant.createMany({
    data: ["own", "foreign"].map((id) => ({
      id,
      ownerUserId: id === "own" ? "owner" : "foreign-owner",
      status: "REJECTED",
      name: `Synthetic ${id}`,
      slug: `${id}-bureau`,
      kvkNumber: id === "own" ? "12345678" : "87654321",
      activationNote: rejection.reason,
    })),
  });
  await db.auditLog.createMany({
    data: ["own", "foreign"].flatMap((id) => [
      {
        id: `${id}-registered`,
        actorId: id === "own" ? "owner" : "foreign-owner",
        action: "FRANCHISE_SELF_REGISTERED",
        entityType: "Tenant",
        entityId: id,
        metadata: JSON.stringify(registration),
        ipAddress: "192.0.2.1",
        userAgent: "Synthetic owner agent",
      },
      {
        id: `${id}-rejected`,
        actorId: "admin",
        action: "FRANCHISE_REJECTED",
        entityType: "Tenant",
        entityId: id,
        metadata: JSON.stringify(rejection),
        ipAddress: "192.0.2.2",
        userAgent: "Synthetic admin agent",
      },
    ]),
  });
});

afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

async function audit(id: string) {
  return db.auditLog.findUniqueOrThrow({ where: { id } });
}

describe("rejected bureau audit copies in real account erasure", () => {
  it("redacts registration fields and an admin-authored reason without an email, preserving accountability and foreign records", async () => {
    const beforeRegistration = await audit("own-registered");
    const beforeRejection = await audit("own-rejected");
    const foreign = await db.auditLog.findMany({
      where: { entityId: "foreign" },
      orderBy: { id: "asc" },
    });
    await anonymizeUser("owner");
    expect(await audit("own-registered")).toEqual({
      ...beforeRegistration,
      metadata: JSON.stringify({
        slug: "[verwijderd]",
        status: "PENDING",
        kvkNumber: "[verwijderd]",
      }),
      ipAddress: null,
      userAgent: null,
    });
    expect(await audit("own-rejected")).toEqual({
      ...beforeRejection,
      metadata: JSON.stringify({ ...rejection, reason: "[verwijderd]" }),
    });
    expect(
      await db.auditLog.findMany({ where: { entityId: "foreign" }, orderBy: { id: "asc" } }),
    ).toEqual(foreign);
    expect(await db.tenant.findUniqueOrThrow({ where: { id: "own" } })).toMatchObject({
      status: "REJECTED",
      slug: "verwijderd-own",
      kvkNumber: null,
      activationNote: null,
    });
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: "owner" } })).anonymizedAt,
    ).not.toBeNull();
  });

  it("combines the generic email scrub and tenant scrub without restoring either value", async () => {
    await db.auditLog.update({
      where: { id: "own-rejected" },
      data: {
        metadata: JSON.stringify({ ...rejection, email: "owner@erasure.test" }),
      },
    });
    await anonymizeUser("owner");
    expect(JSON.parse((await audit("own-rejected")).metadata!)).toEqual({
      ...rejection,
      reason: "[verwijderd]",
      email: "[verwijderd]",
    });
  });

  it.each(["PENDING", "ACTIVE", "SUSPENDED"])(
    "keeps all records intact for an operational %s tenant",
    async (status) => {
      await db.tenant.update({ where: { id: "own" }, data: { status } });
      const before = await db.auditLog.findMany({ orderBy: { id: "asc" } });
      await expect(anonymizeUser("owner")).rejects.toThrow();
      expect(await db.auditLog.findMany({ orderBy: { id: "asc" } })).toEqual(before);
      expect((await db.user.findUniqueOrThrow({ where: { id: "owner" } })).anonymizedAt).toBeNull();
    },
  );

  it("rolls back audit copies, tenant and account together if the erasure audit fails, then succeeds on retry", async () => {
    const before = await db.auditLog.findMany({ orderBy: { id: "asc" } });
    await db.$executeRawUnsafe(`CREATE TRIGGER fail_erasure_audit BEFORE INSERT ON AuditLog
      WHEN NEW.action = 'ACCOUNT_ANONYMIZED' BEGIN SELECT RAISE(ABORT, 'synthetic audit failure'); END`);
    await expect(anonymizeUser("owner")).rejects.toThrow();
    expect(await db.auditLog.findMany({ orderBy: { id: "asc" } })).toEqual(before);
    expect((await db.user.findUniqueOrThrow({ where: { id: "owner" } })).anonymizedAt).toBeNull();
    expect((await db.tenant.findUniqueOrThrow({ where: { id: "own" } })).kvkNumber).toBe(
      "12345678",
    );
    await db.$executeRawUnsafe("DROP TRIGGER fail_erasure_audit");
    await anonymizeUser("owner");
    expect(JSON.parse((await audit("own-rejected")).metadata!).reason).toBe("[verwijderd]");
  });
});
