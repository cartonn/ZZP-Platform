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
  await f.db.evidenceCleanupCursor.deleteMany();
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
    const ids = [...Array.from({ length: count }, (_, i) => `old-${i}`), "zz-fresh"];
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
        evidenceSeenAt: new Date(
          id === "zz-fresh" ? "2026-10-01T00:00:00Z" : "2026-09-30T00:00:00Z",
        ),
      })),
    });
    f.del.mockImplementation(async (key: string) => {
      if (key.startsWith("old-")) throw new Error("synthetic object-specific storage failure");
    });
    const first = await runCredentialEvidenceCleanupTask();
    expect(first.removed + first.failed).toBeLessThanOrEqual(200);
    const second = await runCredentialEvidenceCleanupTask();
    expect(second.removed + second.failed).toBeLessThanOrEqual(200);
    const fresh = await f.db.credential.findUniqueOrThrow({ where: { id: "zz-fresh" } });
    const calls = f.del.mock.calls.filter((c) => c[0] === "zz-fresh").length;
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
  30000,
);

it.each([false, true])(
  "bounds each run and durably rotates tied timestamps with mixed failures=%s",
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
    // The persisted queue must reach every tied candidate without an unbounded tick.
    for (const expected of [200, 200, 1]) {
      const before = f.del.mock.calls.length;
      const result = await runCredentialEvidenceCleanupTask();
      expect(result.removed + result.failed).toBe(expected);
      expect(f.del.mock.calls.length - before).toBe(expected);
    }
    expect(f.del).toHaveBeenCalledTimes(401);
    expect(new Set(f.del.mock.calls.map((c) => c[0])).size).toBe(401);
    const claimed = await f.db.document.findMany();
    expect(claimed.every((d) => d.evidenceRemovalStartedAt !== null)).toBe(true);
    f.del.mockClear();
    f.del.mockResolvedValue(undefined);
    for (let run = 0; run < 3; run++) {
      const before = f.del.mock.calls.length;
      const result = await runCredentialEvidenceCleanupTask();
      expect(result.failed).toBe(0);
      expect(f.del.mock.calls.length - before).toBeLessThanOrEqual(200);
    }
    expect(f.del).toHaveBeenCalledTimes(mixed ? 201 : 401);
    expect(await f.db.auditLog.count({ where: { action: "CREDENTIAL_EVIDENCE_REMOVED" } })).toBe(
      401,
    );
    expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 0, failed: 0 });
  },
  30000,
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

async function seedBacklog() {
  const ids = [...Array.from({ length: 200 }, (_, i) => `old-${i}`), "zz-fresh"];
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
}

it("persists a reservation across an aborted run and reconnect, then wraps for retries", async () => {
  await seedBacklog();
  const original = f.db.$transaction.bind(f.db);
  const transaction = vi.spyOn(f.db, "$transaction");
  transaction.mockImplementationOnce(original).mockRejectedValueOnce(new Error("synthetic abort"));
  try {
    await expect(runCredentialEvidenceCleanupTask()).rejects.toThrow("synthetic abort");
  } finally {
    transaction.mockRestore();
  }
  expect(f.del).not.toHaveBeenCalled();
  await f.db.$disconnect();
  await f.db.$connect();
  expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 1, failed: 0 });
  expect(f.del).toHaveBeenLastCalledWith("zz-fresh");
  // The cursor's credential was deleted above; its stored id still allows wraparound.
  expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 200, failed: 0 });
  expect(await f.db.auditLog.count()).toBe(201);
}, 30000);

it("reserves the next bounded page while the previous run waits for storage", async () => {
  await seedBacklog();
  let release!: () => void;
  let started!: () => void;
  const storageStarted = new Promise<void>((resolve) => {
    started = resolve;
  });
  const storageGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  f.del.mockImplementation(async (key: string) => {
    if (key.startsWith("old-")) {
      started();
      await storageGate;
      throw new Error("synthetic storage failure");
    }
  });
  const first = runCredentialEvidenceCleanupTask();
  try {
    await storageStarted;
    expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 1, failed: 0 });
    expect(f.del).toHaveBeenCalledWith("zz-fresh");
  } finally {
    release();
    await first;
  }
  expect(await first).toEqual({ removed: 0, failed: 200 });
  expect(f.del).toHaveBeenCalledTimes(201);
  expect(new Set(f.del.mock.calls.map((call) => call[0])).size).toBe(201);
}, 30000);
