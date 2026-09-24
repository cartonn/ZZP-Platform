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
    onDelete: undefined as undefined | (() => Promise<void>),
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
    put: async () => {},
    delete: async (key: string) => {
      if (fixture.failDelete) throw new Error("Synthetic storage failure");
      if (fixture.onDelete) await fixture.onDelete();
      fixture.deleted.push(key);
    },
  }),
}));
vi.mock("@/lib/services/upload-scanner", () => ({ assertUploadClean: vi.fn(async () => {}) }));
import { rejectCredential } from "@/app/(protected)/admin/verificaties/actions";
import { requestVerification, saveCredentialInline } from "./actions";
import { removeCredentialEvidence } from "@/lib/credential-evidence";
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
  fixture.onDelete = undefined;
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
  // Simulate the committed decision before its cleanup worker starts.
  await db.credential.update({
    where: { id: "credential" },
    data: { status: "REJECTED", evidenceSeenAt: new Date(), evidenceSeenById: "admin" },
  });
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
  expect(await db.credentialVerification.count()).toBe(1);
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

function metadataForm() {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    credentialId: "credential",
    type: "VOG",
    title: "Corrected VOG title",
    visibility: "PRIVATE",
    issuedAt: "",
    expiresAt: "",
  }))
    form.set(key, value);
  return form;
}

for (const mode of ["request", "metadata"] as const) {
  it(`blocks ${mode} resubmission while claimed storage removal is in flight`, async () => {
    await rejectCurrent();
    if (mode === "metadata")
      await db.credential.update({ where: { id: "credential" }, data: { status: "VERIFIED" } });
    fixture.failDelete = false;
    let started!: () => void, release!: () => void;
    const atDelete = new Promise<void>((resolve) => {
      started = resolve;
    });
    const resume = new Promise<void>((resolve) => {
      release = resolve;
    });
    fixture.onDelete = async () => {
      started();
      await resume;
    };
    const cleanup = runCredentialEvidenceCleanupTask();
    await atDelete;
    try {
      fixture.actorId = "owner";
      if (mode === "request")
        await expect(requestVerification("credential")).rejects.toThrow(
          "Upload een nieuw bewijsstuk",
        );
      else
        expect(await saveCredentialInline(undefined, metadataForm())).toEqual({
          fieldErrors: {
            document: "Dit bewijsstuk wordt verwijderd. Upload een nieuw bewijsstuk.",
          },
        });
      expect(await db.verificationRequest.count({ where: { status: "PENDING" } })).toBe(0);
      expect(
        await db.auditLog.count({
          where: { action: { in: ["CREDENTIAL_SUBMITTED", "CREDENTIAL_UPDATED"] } },
        }),
      ).toBe(0);
    } finally {
      release();
    }
    expect(await cleanup).toEqual({ removed: 1, failed: 0 });
    expect(await saved()).toMatchObject({
      status: mode === "request" ? "REJECTED" : "VERIFIED",
      documentId: null,
    });
    expect(fixture.deleted).toEqual(["synthetic-evidence"]);
  });
  it(`does not delete a stale cleanup selection after ${mode} resubmission won`, async () => {
    await db.credential.update({
      where: { id: "credential" },
      data: { status: mode === "request" ? "REJECTED" : "VERIFIED", evidenceSeenAt: new Date() },
    });
    fixture.actorId = "owner";
    if (mode === "request") await requestVerification("credential");
    else expect(await saveCredentialInline(undefined, metadataForm())).toEqual({ ok: true });
    fixture.failDelete = false;
    expect(
      await removeCredentialEvidence({
        actorId: null,
        credentialId: "credential",
        documentId: "document",
        source: "test",
      }),
    ).toEqual({ removed: false, skipped: "no-document" });
    expect(fixture.deleted).toEqual([]);
    expect(await db.document.findUniqueOrThrow({ where: { id: "document" } })).toMatchObject({
      evidenceRemovalStartedAt: null,
    });
    expect(await saved()).toMatchObject({
      status: "SUBMITTED",
      documentId: "document",
      evidenceSeenAt: null,
    });
    expect(await db.auditLog.count({ where: { action: "CREDENTIAL_EVIDENCE_REMOVED" } })).toBe(0);
  });
}

it("keeps a failed removal claim durable and rejects reuse until retry finishes", async () => {
  await rejectCurrent();
  expect(await db.document.findUniqueOrThrow({ where: { id: "document" } })).toMatchObject({
    evidenceRemovalStartedAt: expect.any(Date),
  });
  fixture.actorId = "owner";
  await expect(requestVerification("credential")).rejects.toThrow("Upload een nieuw bewijsstuk");
  expect(await db.auditLog.count({ where: { action: "CREDENTIAL_EVIDENCE_REMOVED" } })).toBe(0);
  fixture.failDelete = false;
  expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 1, failed: 0 });
  expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 0, failed: 0 });
  expect(await db.auditLog.count({ where: { action: "CREDENTIAL_EVIDENCE_REMOVED" } })).toBe(1);
});

it.each(["DIPLOMA", "VOG"])(
  "does not claim retained %s evidence from a stale selection",
  async (type) => {
    await db.credential.update({
      where: { id: "credential" },
      data: { type, status: "VERIFIED", evidenceSeenAt: new Date() },
    });
    if (type === "VOG") vi.stubEnv("CREDENTIAL_EVIDENCE_RETENTION_VOG", "file");
    fixture.failDelete = false;
    expect(
      await removeCredentialEvidence({
        actorId: null,
        credentialId: "credential",
        documentId: "document",
        source: "test",
      }),
    ).toEqual({ removed: false, skipped: "no-document" });
    expect(fixture.deleted).toEqual([]);
    expect(await db.document.findUniqueOrThrow({ where: { id: "document" } })).toMatchObject({
      evidenceRemovalStartedAt: null,
    });
  },
);

it("allows a new upload while old claimed evidence removal is in flight", async () => {
  await rejectCurrent();
  fixture.failDelete = false;
  let started!: () => void, release!: () => void;
  const atDelete = new Promise<void>((resolve) => {
    started = resolve;
  });
  const resume = new Promise<void>((resolve) => {
    release = resolve;
  });
  fixture.onDelete = async () => {
    fixture.onDelete = undefined;
    started();
    await resume;
  };
  const cleanup = runCredentialEvidenceCleanupTask();
  await atDelete;
  try {
    fixture.actorId = "owner";
    const form = metadataForm();
    form.set(
      "document",
      new File(["%PDF-1.7\nNew synthetic evidence"], "replacement.pdf", {
        type: "application/pdf",
      }),
    );
    expect(await saveCredentialInline(undefined, form)).toEqual({ ok: true });
    const credential = await saved();
    expect(credential).toMatchObject({
      status: "SUBMITTED",
      evidenceSeenAt: null,
      evidenceRemovedAt: null,
    });
    expect(credential.documentId).not.toBe("document");
    expect(
      await db.document.findUniqueOrThrow({ where: { id: credential.documentId! } }),
    ).toMatchObject({ evidenceRemovalStartedAt: null });
  } finally {
    release();
  }
  expect(await cleanup).toEqual({ removed: 0, failed: 1 });
  expect((await saved()).documentId).not.toBeNull();
  expect(new Set(fixture.deleted)).toEqual(new Set(["synthetic-evidence"]));
  expect(await db.auditLog.count({ where: { action: "CREDENTIAL_EVIDENCE_REMOVED" } })).toBe(0);
});

it("rolls back the claim when another dossier references the file", async () => {
  await db.credential.update({
    where: { id: "credential" },
    data: { status: "VERIFIED", evidenceSeenAt: new Date() },
  });
  await db.credential.create({
    data: {
      id: "other",
      freelancerProfileId: "profile",
      type: "DIPLOMA",
      title: "Other synthetic",
      documentId: "document",
    },
  });
  fixture.failDelete = false;
  expect(
    await removeCredentialEvidence({
      actorId: null,
      credentialId: "credential",
      documentId: "document",
      source: "test",
    }),
  ).toEqual({ removed: false, skipped: "still-referenced" });
  expect(fixture.deleted).toEqual([]);
  expect(await db.document.findUniqueOrThrow({ where: { id: "document" } })).toMatchObject({
    evidenceRemovalStartedAt: null,
  });
});

it("does not claim a document that is no longer attached to the selected credential", async () => {
  await db.credential.update({
    where: { id: "credential" },
    data: { documentId: null, status: "VERIFIED", evidenceSeenAt: new Date() },
  });
  fixture.failDelete = false;
  expect(
    await removeCredentialEvidence({
      actorId: null,
      credentialId: "credential",
      documentId: "document",
      source: "test",
    }),
  ).toEqual({ removed: false, skipped: "no-document" });
  expect(fixture.deleted).toEqual([]);
  expect(await db.document.findUniqueOrThrow({ where: { id: "document" } })).toMatchObject({
    evidenceRemovalStartedAt: null,
  });
});

it("protects retained type changes made before cleanup and rejects them after its claim", async () => {
  await db.credential.update({
    where: { id: "credential" },
    data: { status: "REJECTED", evidenceSeenAt: new Date() },
  });
  fixture.actorId = "owner";
  const form = metadataForm();
  form.set("type", "DIPLOMA");
  expect(await saveCredentialInline(undefined, form)).toEqual({ ok: true });
  fixture.failDelete = false;
  expect(
    await removeCredentialEvidence({
      actorId: null,
      credentialId: "credential",
      documentId: "document",
      source: "test",
    }),
  ).toEqual({ removed: false, skipped: "no-document" });
  await db.credential.update({ where: { id: "credential" }, data: { type: "VOG" } });
  fixture.failDelete = true;
  expect(await runCredentialEvidenceCleanupTask()).toEqual({ removed: 0, failed: 1 });
  expect(await saveCredentialInline(undefined, form)).toEqual({
    fieldErrors: { document: "Dit bewijsstuk wordt verwijderd. Upload een nieuw bewijsstuk." },
  });
  expect((await saved()).type).toBe("VOG");
});
