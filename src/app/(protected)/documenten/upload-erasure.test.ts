import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "upload-erasure-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return {
    directory,
    url,
    db: new PrismaClient({ datasourceUrl: url }),
    blobs: new Map<string, Buffer>(),
    scannerHook: null as null | (() => Promise<void>),
    storageHook: null as null | (() => Promise<void>),
    deleteError: null as null | Error,
  };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/request-meta", () => ({ requestMeta: async () => ({}) }));
vi.mock("@/lib/authz", async () => {
  const actual: typeof import("@/lib/authz") = await vi.importActual("@/lib/authz");
  return {
    ...actual,
    requireRole: async (role: "ADMIN" | "FREELANCER") => {
      const user = await fixture.db.user.findUniqueOrThrow({
        where: { id: role === "ADMIN" ? "admin" : "owner" },
      });
      actual.assertRole({ ...user, role: user.role as typeof role }, role);
      if (user.anonymizedAt) throw new actual.AuthorizationError("Niet ingelogd.");
      return user;
    },
  };
});
vi.mock("@/lib/rate-limit", () => ({
  uploadRateLimiter: { check: async () => ({ allowed: true }) },
}));
vi.mock("@/lib/services/upload-scanner", () => ({
  assertUploadClean: async () => {
    await fixture.scannerHook?.();
  },
}));
vi.mock("@/lib/services/storage", async () => ({
  ...(await vi.importActual<typeof import("@/lib/services/storage")>("@/lib/services/storage")),
  getStorage: () => ({
    put: async (key: string, bytes: Buffer) => {
      fixture.blobs.set(key, bytes);
      await fixture.storageHook?.();
    },
    delete: async (key: string) => {
      if (fixture.deleteError) throw fixture.deleteError;
      fixture.blobs.delete(key);
    },
  }),
}));
vi.mock("@/lib/observability/logger", () => ({ logger: { error: vi.fn() } }));
import { logger } from "@/lib/observability/logger";
import { uploadDocument } from "./actions";
import { anonymizeUser } from "@/app/(protected)/admin/gebruikers/actions";

function form() {
  const data = new FormData();
  data.set("kind", "VOG");
  data.set(
    "document",
    new File(["%PDF-1.4\nSynthetic content"], "synthetic.pdf", { type: "application/pdf" }),
  );
  return data;
}

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
    { env, stdio: "pipe", timeout: 30000 },
  );
}, 40000);
beforeEach(async () => {
  fixture.scannerHook = fixture.storageHook = null;
  fixture.deleteError = null;
  fixture.blobs.clear();
  vi.clearAllMocks();
  await fixture.db.$executeRawUnsafe("DROP TRIGGER IF EXISTS reject_upload_audit");
  await fixture.db.auditLog.deleteMany();
  await fixture.db.document.deleteMany();
  await fixture.db.tenant.deleteMany();
  await fixture.db.user.deleteMany();
  for (const id of ["owner", "admin"]) {
    await fixture.db.user.create({
      data: {
        id,
        email: `${id}@synthetic.test`,
        name: "Synthetic",
        passwordHash: "synthetic",
        role: id === "admin" ? "ADMIN" : "FREELANCER",
        deletionRequestedAt: id === "owner" ? new Date() : null,
      },
    });
  }
});
afterAll(async () => {
  await fixture.db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

async function expectNoUpload() {
  expect(await fixture.db.document.count()).toBe(0);
  expect(await fixture.db.auditLog.count({ where: { action: "DOCUMENT_UPLOADED" } })).toBe(0);
  expect(fixture.blobs.size).toBe(0);
}

it.each(["scannerHook", "storageHook"] as const)(
  "rejects an in-flight upload after real erasure during %s",
  async (hook) => {
    fixture[hook] = async () => {
      await anonymizeUser("owner");
      expect(
        (await fixture.db.user.findUniqueOrThrow({ where: { id: "owner" } })).anonymizedAt,
      ).not.toBeNull();
      expect(await fixture.db.document.count()).toBe(0);
    };
    expect(await uploadDocument(undefined, form())).toEqual({
      error: "Geen toegang tot documentupload.",
    });
    await expectNoUpload();
    await expect(anonymizeUser("owner")).rejects.toThrow("al geanonimiseerd");
  },
);

it("commits an authorized upload and audit together, then erases its row and bytes", async () => {
  expect(await uploadDocument(undefined, form())).toEqual({ ok: true });
  const document = await fixture.db.document.findFirstOrThrow();
  expect(fixture.blobs.has(document.storageKey)).toBe(true);
  expect(
    await fixture.db.auditLog.findFirst({ where: { action: "DOCUMENT_UPLOADED" } }),
  ).toMatchObject({ actorId: "owner", entityId: document.id });
  await anonymizeUser("owner");
  expect(await fixture.db.document.count()).toBe(0);
  expect(fixture.blobs.size).toBe(0);
});

it.each([
  { status: "SUSPENDED" },
  { anonymizedAt: new Date("2026-01-01") },
  { role: "CLIENT" },
  { mustChangePassword: true },
])("rejects changed authorization after storage: %j", async (data) => {
  fixture.storageHook = async () => {
    await fixture.db.user.update({ where: { id: "owner" }, data });
  };
  expect(await uploadDocument(undefined, form())).toEqual({
    error: "Geen toegang tot documentupload.",
  });
  await expectNoUpload();
});

it("rolls back the document when its audit cannot be written", async () => {
  await fixture.db.$executeRawUnsafe(
    `CREATE TRIGGER reject_upload_audit BEFORE INSERT ON AuditLog WHEN NEW.action = 'DOCUMENT_UPLOADED' BEGIN SELECT RAISE(ABORT, 'synthetic audit failure'); END`,
  );
  await expect(uploadDocument(undefined, form())).rejects.toThrow();
  await expectNoUpload();
});

it("preserves the original storage error and logs cleanup failure through the safe helper", async () => {
  const original = new Error("synthetic put failure");
  fixture.storageHook = async () => {
    throw original;
  };
  fixture.deleteError = new Error("synthetic delete failure");
  await expect(uploadDocument(undefined, form())).rejects.toBe(original);
  expect(await fixture.db.document.count()).toBe(0);
  expect(logger.error).toHaveBeenCalledWith(
    "[documenten] upload storage-opruiming mislukt",
    expect.objectContaining({
      storageKey: expect.any(String),
      error: expect.objectContaining({ message: "synthetic delete failure" }),
    }),
  );
});

it.each([false, true])(
  "checks current tenant access after storage (suspended: %s)",
  async (suspended) => {
    await fixture.db.tenant.create({
      data: { id: "tenant", name: "Synthetic tenant", slug: "synthetic", ownerUserId: "admin" },
    });
    await fixture.db.user.update({ where: { id: "owner" }, data: { tenantId: "tenant" } });
    if (suspended)
      fixture.storageHook = async () => {
        await fixture.db.tenant.update({ where: { id: "tenant" }, data: { status: "SUSPENDED" } });
      };
    expect(await uploadDocument(undefined, form())).toEqual(
      suspended ? { error: "Geen toegang tot documentupload." } : { ok: true },
    );
    if (suspended) await expectNoUpload();
    else expect(await fixture.db.document.count()).toBe(1);
  },
);

it("keeps the authorization error when rejected-upload cleanup fails", async () => {
  fixture.storageHook = async () => {
    await anonymizeUser("owner");
    fixture.deleteError = new Error("synthetic delete failure");
  };
  expect(await uploadDocument(undefined, form())).toEqual({
    error: "Geen toegang tot documentupload.",
  });
  expect(await fixture.db.document.count()).toBe(0);
  expect(await fixture.db.auditLog.count({ where: { action: "DOCUMENT_UPLOADED" } })).toBe(0);
  expect(logger.error).toHaveBeenCalledWith(
    "[documenten] upload storage-opruiming mislukt",
    expect.objectContaining({ storageKey: expect.any(String) }),
  );
});
