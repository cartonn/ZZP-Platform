import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "mail-retention-atomicity-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
vi.mock("@/lib/config", () => ({ mailIntakeRetentionDays: () => 180 }));
import { runMailIntakeRetentionTask } from "./mail-intake-retention-task";

const db = fixture.db;
const now = new Date("2026-09-15T00:00:00Z");
const old = new Date("2025-01-01T00:00:00Z");

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
  await db.user.create({
    data: {
      id: "owner",
      name: "Synthetic Owner",
      email: "owner@retention.test",
      role: "CLIENT",
      passwordHash: "synthetic-unused-hash",
    },
  });
  await db.company.create({ data: { id: "company", userId: "owner", name: "Synthetic company" } });
});
beforeEach(async () => {
  await db.$executeRawUnsafe("DROP TRIGGER IF EXISTS fail_retention");
  await db.auditLog.deleteMany();
  await db.mailIntake.deleteMany();
});
afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

async function intake(id: string, status = "DISMISSED", receivedAt = old) {
  const fromAddress = `${id}@external.example`;
  await db.mailIntake.create({
    data: {
      id,
      companyId: "company",
      messageId: `message-${id}`,
      fromAddress,
      subject: "Synthetic request",
      textBody: "Synthetic text",
      status,
      receivedAt,
    },
  });
  await db.auditLog.create({
    data: {
      id: `audit-${id}`,
      action: "MAIL_INTAKE_RECEIVED",
      entityType: "MailIntake",
      entityId: id,
      metadata: JSON.stringify({ fromAddress, messageId: `message-${id}` }),
    },
  });
}
async function address(id: string) {
  const row = await db.auditLog.findUniqueOrThrow({ where: { id: `audit-${id}` } });
  return JSON.parse(row.metadata!);
}

describe("mail retention commits deletion and audit redaction together", () => {
  it.each(["redaction", "completion audit"])(
    "rolls back a failing %s and retries safely",
    async (failure) => {
      await intake("a");
      await intake("b", "ACCEPTED");
      // Static SQL against this test's disposable database only. Fail after an earlier redaction,
      // or after all redactions, so rollback must restore every source and metadata copy.
      await db.$executeRawUnsafe(
        failure === "redaction"
          ? "CREATE TRIGGER fail_retention BEFORE UPDATE ON AuditLog WHEN OLD.id = 'audit-b' BEGIN SELECT RAISE(ABORT, 'synthetic retention failure'); END"
          : "CREATE TRIGGER fail_retention BEFORE INSERT ON AuditLog WHEN NEW.action = 'MAIL_INTAKE_PRUNED' BEGIN SELECT RAISE(ABORT, 'synthetic retention failure'); END",
      );
      await expect(runMailIntakeRetentionTask({ now })).rejects.toThrow();
      expect(await db.mailIntake.count()).toBe(2);
      expect((await address("a")).fromAddress).toBe("a@external.example");
      expect((await address("b")).fromAddress).toBe("b@external.example");
      expect(await db.auditLog.count({ where: { action: "MAIL_INTAKE_PRUNED" } })).toBe(0);

      await db.$executeRawUnsafe("DROP TRIGGER fail_retention");
      expect((await runMailIntakeRetentionTask({ now })).pruned).toBe(2);
      expect(await db.mailIntake.count()).toBe(0);
      expect(await address("a")).toEqual({ fromAddress: "[verwijderd]", messageId: "message-a" });
      expect(await address("b")).toEqual({ fromAddress: "[verwijderd]", messageId: "message-b" });
      expect((await runMailIntakeRetentionTask({ now })).pruned).toBe(0);
      expect(await db.auditLog.count({ where: { action: "MAIL_INTAKE_PRUNED" } })).toBe(1);
    },
  );

  it("keeps pending/recent sources and their audit metadata unchanged", async () => {
    await intake("pending", "NEW");
    await intake("recent", "DISMISSED", now);
    await intake("eligible", "ACCEPTED");
    expect((await runMailIntakeRetentionTask({ now })).pruned).toBe(1);
    expect((await db.mailIntake.findMany()).map((r) => r.id).sort()).toEqual(["pending", "recent"]);
    expect((await address("pending")).fromAddress).toBe("pending@external.example");
    expect((await address("recent")).fromAddress).toBe("recent@external.example");
    expect((await address("eligible")).fromAddress).toBe("[verwijderd]");
  });

  it("keeps a completed batch and retries only the batch whose audit failed", async () => {
    for (let i = 0; i < 501; i++) await intake(`batch-${i}`);
    await db.$executeRawUnsafe(
      "CREATE TRIGGER fail_retention BEFORE INSERT ON AuditLog WHEN NEW.action = 'MAIL_INTAKE_PRUNED' AND (SELECT COUNT(*) FROM AuditLog WHERE action = 'MAIL_INTAKE_PRUNED') = 1 BEGIN SELECT RAISE(ABORT, 'synthetic second batch failure'); END",
    );
    await expect(runMailIntakeRetentionTask({ now })).rejects.toThrow();
    const remaining = await db.mailIntake.findMany();
    expect(remaining).toHaveLength(1);
    expect((await address(remaining[0]!.id)).fromAddress).toBe(remaining[0]!.fromAddress);
    const completed = await db.auditLog.findMany({ where: { action: "MAIL_INTAKE_PRUNED" } });
    expect(completed).toHaveLength(1);
    expect(JSON.parse(completed[0]!.metadata!)).toMatchObject({ pruned: 500, auditScrubbed: 500 });

    await db.$executeRawUnsafe("DROP TRIGGER fail_retention");
    expect((await runMailIntakeRetentionTask({ now })).pruned).toBe(1);
    expect(await db.mailIntake.count()).toBe(0);
    expect((await address(remaining[0]!.id)).fromAddress).toBe("[verwijderd]");
    const batches = await db.auditLog.findMany({ where: { action: "MAIL_INTAKE_PRUNED" } });
    expect(batches).toHaveLength(2);
    expect(batches.reduce((total, row) => total + JSON.parse(row.metadata!).pruned, 0)).toBe(501);
  });
});
