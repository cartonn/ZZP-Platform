import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import type { Prisma } from "@prisma/client";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "credential-metadata-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  const db = new PrismaClient({ datasourceUrl: url });
  const state = { afterRead: null as null | (() => Promise<void>) };
  const actionDb = db.$extends({
    query: {
      credential: {
        async findUnique({ args, query }) {
          const snapshot = await query(args);
          const afterRead = state.afterRead;
          state.afterRead = null;
          if (afterRead) await afterRead();
          return snapshot;
        },
      },
    },
  });
  return { directory, url, db, actionDb, state };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.actionDb }));
vi.mock("@/lib/authz", () => ({
  requireRole: vi.fn(async () => ({ id: "owner", role: "FREELANCER" })),
  AuthorizationError: class extends Error {},
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/audit", () => ({ audit: vi.fn(), auditData: (data: unknown) => data }));
import { audit } from "@/lib/audit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { saveCredential, saveCredentialInline } from "./actions";

const db = fixture.db;
const originalDate = new Date("2026-10-01T00:00:00Z");
const originalVersion = new Date("2026-09-14T00:00:00Z");
function form(overrides: Record<string, string> = {}) {
  const result = new FormData();
  for (const [key, value] of Object.entries({
    credentialId: "credential",
    type: "LICENSE",
    title: "Rijbewijs",
    issuer: "",
    issuedAt: "",
    expiresAt: "2026-10-01",
    visibility: "PRIVATE",
    ...overrides,
  }))
    result.set(key, value);
  return result;
}
function changeAfterRead(data: Prisma.CredentialUpdateInput) {
  fixture.state.afterRead = async () => {
    await db.credential.update({
      where: { id: "credential" },
      data: {
        ...data,
        updatedAt: new Date("2026-09-14T00:01:00Z"),
      },
    });
  };
}
async function saved() {
  return db.credential.findUniqueOrThrow({ where: { id: "credential" } });
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
    { env, timeout: 30_000, stdio: "pipe" },
  );
  for (const id of ["owner", "other"]) {
    await db.user.create({
      data: {
        id,
        email: `${id}@credential-metadata.test`,
        name: "Synthetic owner",
        role: "FREELANCER",
        passwordHash: "synthetic-hash",
      },
    });
    await db.freelancerProfile.create({ data: { id: `${id}-profile`, userId: id } });
  }
}, 40_000);
beforeEach(async () => {
  vi.clearAllMocks();
  fixture.state.afterRead = null;
  await db.verificationRequest.deleteMany();
  await db.credential.deleteMany();
  await db.credential.create({
    data: {
      id: "credential",
      freelancerProfileId: "owner-profile",
      status: "SUBMITTED",
      type: "LICENSE",
      title: "Rijbewijs",
      visibility: "PRIVATE",
      expiresAt: originalDate,
      updatedAt: originalVersion,
    },
  });
});
afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

it.each(["VERIFIED", "REJECTED"])(
  "preserves a newer %s decision when saving metadata",
  async (status) => {
    changeAfterRead({ status });
    expect(await saveCredentialInline(undefined, form({ expiresAt: "2030-10-01" }))).toEqual({
      error: expect.stringMatching(/inmiddels beoordeeld/i),
    });
    expect(await saved()).toMatchObject({ status, expiresAt: originalDate });
    expect(await db.verificationRequest.count()).toBe(0);
    expect(audit).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  },
);
it("preserves a newer edit when the status stayed the same", async () => {
  changeAfterRead({ issuer: "New issuer" });
  expect(await saveCredentialInline(undefined, form({ title: "Gewijzigde titel" }))).toEqual({
    error: expect.any(String),
  });
  expect(await saved()).toMatchObject({
    issuer: "New issuer",
    title: "Rijbewijs",
    status: "SUBMITTED",
  });
});
it("does not restore old facts during a visibility edit after a new review", async () => {
  await db.credential.update({ where: { id: "credential" }, data: { status: "VERIFIED" } });
  changeAfterRead({ title: "Nieuw beoordeeld bewijs" });
  expect(await saveCredential(undefined, form({ visibility: "PUBLIC" }))).toEqual({
    error: expect.any(String),
  });
  expect(await saved()).toMatchObject({ title: "Nieuw beoordeeld bewijs", visibility: "PRIVATE" });
  expect(redirect).not.toHaveBeenCalled();
});
it("saves a normal submitted metadata edit", async () => {
  expect(await saveCredentialInline(undefined, form({ title: "Rijbewijs B" }))).toEqual({
    ok: true,
  });
  expect(await saved()).toMatchObject({ title: "Rijbewijs B", status: "SUBMITTED" });
  expect(audit).toHaveBeenCalledOnce();
});
it("keeps verification for a visibility-only edit", async () => {
  await db.credential.update({ where: { id: "credential" }, data: { status: "VERIFIED" } });
  expect(await saveCredentialInline(undefined, form({ visibility: "PUBLIC" }))).toEqual({
    ok: true,
  });
  expect(await saved()).toMatchObject({
    status: "VERIFIED",
    visibility: "PUBLIC",
    expiresAt: originalDate,
  });
  expect(await db.verificationRequest.count()).toBe(0);
});
it("still requests a new review for changed verified facts", async () => {
  await db.credential.update({ where: { id: "credential" }, data: { status: "VERIFIED" } });
  expect(await saveCredentialInline(undefined, form({ title: "Rijbewijs B" }))).toEqual({
    ok: true,
  });
  expect(await saved()).toMatchObject({ status: "SUBMITTED", title: "Rijbewijs B" });
  expect(await db.verificationRequest.count()).toBe(1);
});
it("does not save another profile's credential", async () => {
  await db.credential.update({
    where: { id: "credential" },
    data: { freelancerProfileId: "other-profile" },
  });
  await expect(saveCredentialInline(undefined, form())).rejects.toThrow(
    "Credential niet gevonden.",
  );
  expect(audit).not.toHaveBeenCalled();
});
