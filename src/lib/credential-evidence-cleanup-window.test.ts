import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
const f = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "evidence-retry-proof-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }), del: vi.fn() };
});
vi.mock("@/lib/db", () => ({ prisma: f.db }));
vi.mock("@/lib/services/storage", () => ({ getStorage: () => ({ delete: f.del }) }));
vi.mock("@/lib/observability/storage-failure", () => ({ logStorageCleanupFailure: vi.fn() }));
import { runCredentialEvidenceCleanupTask } from "./credential-evidence-cleanup-task";
beforeAll(async () => {
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: f.url };
  delete env.RUST_LOG;
  execFileSync(
    process.execPath,
    [
      "node_modules/prisma/build/index.js",
      "db",
      "push",
      "--skip-generate",
      "--schema",
      "prisma/schema.prisma",
    ],
    { env, stdio: "pipe" },
  );
  await f.db.user.create({
    data: {
      id: "synthetic",
      role: "FREELANCER",
      name: "Synthetic",
      email: "proof@synthetic.test",
      passwordHash: "synthetic",
    },
  });
  await f.db.freelancerProfile.create({ data: { id: "synthetic", userId: "synthetic" } });
}, 40000);
beforeEach(async () => {
  await f.db.auditLog.deleteMany();
  await f.db.credential.deleteMany();
  await f.db.document.deleteMany();
  f.del.mockReset();
  delete process.env.CREDENTIAL_EVIDENCE_RETENTION_VOG;
});
afterAll(async () => {
  await f.db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(f.directory, { recursive: true, force: true });
});
it.each([199, 200])(
  "actual runner reaches later deletable VOG behind %i failed old objects",
  async (count) => {
    const ids = [...Array.from({ length: count }, (_, i) => `old-${i}`), "fresh"];
    await f.db.document.createMany({
      data: ids.map((id) => ({
        id,
        ownerId: "synthetic",
        filename: "synthetic.pdf",
        mimeType: "application/pdf",
        size: 1,
        storageKey: id,
      })),
    });
    await f.db.credential.createMany({
      data: ids.map((id) => ({
        id,
        freelancerProfileId: "synthetic",
        type: "VOG",
        title: "Synthetic VOG",
        status: "VERIFIED",
        documentId: id,
        evidenceSeenAt: new Date(id === "fresh" ? "2026-10-01T00:00:00Z" : "2026-09-30T00:00:00Z"),
      })),
    });
    f.del.mockImplementation(async (key: string) => {
      if (key.startsWith("old-")) throw new Error("synthetic object-specific storage failure");
    });
    const first = await runCredentialEvidenceCleanupTask();
    const second = await runCredentialEvidenceCleanupTask();
    const fresh = await f.db.credential.findUniqueOrThrow({ where: { id: "fresh" } });
    const calls = f.del.mock.calls.filter((c) => c[0] === "fresh").length;
    console.log(
      JSON.stringify({
        count,
        first,
        second,
        freshAttempts: calls,
        freshDocument: fresh.documentId,
      }),
    );
    expect(calls).toBe(1);
    expect(fresh.documentId).toBeNull();
  },
);

it.each([false, true])(
  "traverses tied timestamps with mixed failures=%s and retries once per run",
  async (mixed) => {
    const ids = Array.from({ length: 401 }, (_, i) => `tie-${String(i).padStart(4, "0")}`);
    await f.db.document.createMany({
      data: ids.map((id) => ({
        id,
        ownerId: "synthetic",
        filename: "synthetic.pdf",
        mimeType: "application/pdf",
        size: 1,
        storageKey: id,
      })),
    });
    await f.db.credential.createMany({
      data: ids.map((id) => ({
        id,
        freelancerProfileId: "synthetic",
        type: "VOG",
        title: "Synthetic VOG",
        status: "VERIFIED",
        documentId: id,
        evidenceSeenAt: new Date("2026-09-30T00:00:00Z"),
      })),
    });
    f.del.mockImplementation(async (key: string) => {
      if (!mixed || Number(key.slice(4)) % 2 === 0) throw new Error("synthetic object failure");
    });
    expect(await runCredentialEvidenceCleanupTask()).toEqual({
      removed: mixed ? 200 : 0,
      failed: mixed ? 201 : 401,
    });
    expect(f.del).toHaveBeenCalledTimes(401);
    expect(new Set(f.del.mock.calls.map((c) => c[0])).size).toBe(401);
    const claimed = await f.db.document.findMany();
    expect(claimed.every((d) => d.evidenceRemovalStartedAt !== null)).toBe(true);
    f.del.mockClear();
    f.del.mockResolvedValue(undefined);
    expect(await runCredentialEvidenceCleanupTask()).toEqual({
      removed: mixed ? 201 : 401,
      failed: 0,
    });
    expect(f.del).toHaveBeenCalledTimes(mixed ? 201 : 401);
    expect(await f.db.auditLog.count({ where: { action: "CREDENTIAL_EVIDENCE_REMOVED" } })).toBe(
      401,
    );
    expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 0, failed: 0 });
  },
);
it("file override leaves every page and claim unchanged", async () => {
  const ids = Array.from({ length: 201 }, (_, i) => `override-${i}`);
  await f.db.document.createMany({
    data: ids.map((id) => ({
      id,
      ownerId: "synthetic",
      filename: "synthetic.pdf",
      mimeType: "application/pdf",
      size: 1,
      storageKey: id,
    })),
  });
  await f.db.credential.createMany({
    data: ids.map((id) => ({
      id,
      freelancerProfileId: "synthetic",
      type: "VOG",
      title: "Synthetic VOG",
      status: "VERIFIED",
      documentId: id,
      evidenceSeenAt: new Date("2026-09-30T00:00:00Z"),
    })),
  });
  process.env.CREDENTIAL_EVIDENCE_RETENTION_VOG = "file";
  try {
    expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 0, failed: 0 });
    expect(f.del).not.toHaveBeenCalled();
    expect(await f.db.document.count({ where: { evidenceRemovalStartedAt: null } })).toBe(201);
    expect(await f.db.auditLog.count()).toBe(0);
  } finally {
    delete process.env.CREDENTIAL_EVIDENCE_RETENTION_VOG;
  }
});
