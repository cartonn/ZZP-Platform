import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "credential-retention-cycle-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return {
    directory,
    url,
    db: new PrismaClient({ datasourceUrl: url }),
    actorId: "admin",
    failDelete: true,
    deleted: [] as string[],
  };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({
    id: fixture.actorId,
    role: fixture.actorId === "admin" ? "ADMIN" : "FREELANCER",
  })),
  AuthorizationError: class extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/services/storage", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getStorage: () => ({
    delete: async (key: string) => {
      if (fixture.failDelete) throw new Error("Synthetic storage failure");
      fixture.deleted.push(key);
    },
  }),
}));
import { rejectCredential } from "@/app/(protected)/admin/verificaties/actions";
import { requestVerification } from "./actions";
import { runCredentialEvidenceCleanupTask } from "@/lib/credential-evidence-cleanup-task";

const db = fixture.db;
function saved() {
  return db.credential.findUniqueOrThrow({ where: { id: "credential" } });
}
async function rejectCurrent() {
  const credential = await saved();
  const form = new FormData();
  form.set("updatedAt", credential.updatedAt.toISOString());
  form.set("documentId", credential.documentId ?? "");
  form.set("reason", "Corrigeer de titel.");
  fixture.actorId = "admin";
  await rejectCredential(credential.id, form);
}
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
    { env, stdio: "pipe", timeout: 30_000 },
  );
  for (const id of ["owner", "admin"]) {
    await db.user.create({
      data: {
        id,
        email: `${id}@retention-cycle.test`,
        name: "Synthetic user",
        passwordHash: "synthetic-hash",
        role: id === "owner" ? "FREELANCER" : "ADMIN",
      },
    });
  }
  await db.freelancerProfile.create({ data: { id: "profile", userId: "owner" } });
}, 40_000);
beforeEach(async () => {
  vi.stubEnv("CREDENTIAL_EVIDENCE_RETENTION_VOG", "metadata");
  fixture.actorId = "admin";
  fixture.failDelete = true;
  fixture.deleted = [];
  await db.credential.deleteMany();
  await db.document.deleteMany();
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.document.create({
    data: {
      id: "document",
      ownerId: "owner",
      filename: "synthetic.pdf",
      mimeType: "application/pdf",
      size: 10,
      storageKey: "synthetic-evidence",
    },
  });
  await db.credential.create({
    data: {
      id: "credential",
      freelancerProfileId: "profile",
      type: "VOG",
      title: "Synthetic VOG",
      status: "SUBMITTED",
      documentId: "document",
    },
  });
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

it("keeps resubmitted evidence after deferred cleanup and removes it after the new review", async () => {
  await rejectCurrent();
  expect(await saved()).toMatchObject({
    status: "REJECTED",
    documentId: "document",
    evidenceSeenAt: expect.any(Date),
    evidenceSeenById: "admin",
    evidenceRemovedAt: null,
  });

  fixture.actorId = "owner";
  await requestVerification("credential");
  expect(await saved()).toMatchObject({
    status: "SUBMITTED",
    documentId: "document",
    evidenceSeenAt: null,
    evidenceSeenById: null,
    evidenceRemovedAt: null,
  });
  fixture.failDelete = false;
  expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 0, failed: 0 });
  expect(fixture.deleted).toEqual([]);
  expect(await db.document.count()).toBe(1);
  expect(await db.verificationRequest.count({ where: { status: "PENDING" } })).toBe(1);
  expect(await db.auditLog.count({ where: { action: "CREDENTIAL_SUBMITTED" } })).toBe(1);

  await rejectCurrent();
  expect(await saved()).toMatchObject({
    status: "REJECTED",
    documentId: null,
    evidenceSeenAt: expect.any(Date),
    evidenceRemovedAt: expect.any(Date),
  });
  expect(fixture.deleted).toEqual(["synthetic-evidence"]);
  expect(await db.verificationRequest.count({ where: { status: "PENDING" } })).toBe(0);
  expect(await db.credentialVerification.count()).toBe(2);
  expect(await db.auditLog.count({ where: { action: "CREDENTIAL_EVIDENCE_REMOVED" } })).toBe(1);
});

it("still retries failed cleanup when the rejected evidence has not been resubmitted", async () => {
  await rejectCurrent();
  fixture.failDelete = false;
  expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 1, failed: 0 });
  expect(await saved()).toMatchObject({ status: "REJECTED", documentId: null });
  expect(fixture.deleted).toEqual(["synthetic-evidence"]);
});

it("cannot request a review again after its evidence was already removed", async () => {
  fixture.failDelete = false;
  await rejectCurrent();
  fixture.actorId = "owner";
  await expect(requestVerification("credential")).rejects.toThrow("Upload eerst een bewijsstuk.");
  expect(await db.verificationRequest.count()).toBe(0);
  expect(await db.auditLog.count({ where: { action: "CREDENTIAL_SUBMITTED" } })).toBe(0);
  expect(await saved()).toMatchObject({
    status: "REJECTED",
    evidenceSeenAt: expect.any(Date),
    evidenceRemovedAt: expect.any(Date),
  });
});

it("keeps the ordinary first request available from a draft", async () => {
  await db.credential.update({ where: { id: "credential" }, data: { status: "DRAFT" } });
  fixture.actorId = "owner";
  await requestVerification("credential");
  expect(await saved()).toMatchObject({ status: "SUBMITTED", documentId: "document" });
  expect(await db.verificationRequest.count({ where: { status: "PENDING" } })).toBe(1);
  expect(await db.auditLog.count({ where: { action: "CREDENTIAL_SUBMITTED" } })).toBe(1);
});
