import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { rmSync } from "node:fs";
const f = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const dir = mkdtempSync(join(tmpdir(), "freelancer-window-audit-"));
  const url = `file:${join(dir, "test.sqlite")}`;
  return { dir, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: f.db }));
import { getActiveCollaborationRequirements } from "./freelancer-compliance";
import { linkExpiryToInzet } from "@/lib/freelancer-compliance";
import { summarizeExpiry } from "@/lib/credential-expiry-overview";
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
      resolve("prisma/schema.prisma"),
    ],
    { env, stdio: "pipe", timeout: 30000 },
  );
  const db = f.db;
  await db.user.createMany({
    data: [
      {
        id: "client",
        email: "client@synthetic.test",
        role: "CLIENT",
        name: "Synthetic",
        passwordHash: "none",
      },
      {
        id: "freelancer",
        email: "free@synthetic.test",
        role: "FREELANCER",
        name: "Synthetic",
        passwordHash: "none",
      },
    ],
  });
  await db.company.create({ data: { id: "company", userId: "client", name: "Synthetic" } });
  await db.freelancerProfile.create({ data: { id: "profile", userId: "freelancer" } });
  await db.user.create({
    data: {
      id: "foreign",
      email: "foreign@synthetic.test",
      name: "Foreign",
      role: "FREELANCER",
      passwordHash: "none",
    },
  });
  await db.freelancerProfile.create({ data: { id: "foreign", userId: "foreign" } });
  for (let i = 0; i < 205; i++) {
    const id = `collab-${String(i).padStart(3, "0")}`;
    await db.job.create({
      data: {
        id,
        companyId: "company",
        title: id,
        description: "Synthetic",
        ...(i >= 200
          ? { credentialRequirements: { create: { credentialType: "VOG", required: i !== 203 } } }
          : {}),
      },
    });
    await db.application.create({
      data: {
        id,
        jobId: id,
        freelancerId: i === 202 ? "foreign" : "profile",
        motivation: "Synthetic",
      },
    });
    await db.collaboration.create({
      data: {
        id,
        jobId: id,
        applicationId: id,
        companyId: "company",
        freelancerId: i === 202 ? "foreign" : "profile",
        status: i === 201 ? "COMPLETED" : "ACTIVE",
        createdAt: new Date(i === 204 ? "2024-01-01" : "2025-01-01"),
        disputedAt: i === 204 ? new Date("2026-09-01") : null,
      },
    });
  }
});
afterAll(async () => {
  await f.db.$disconnect();
  rmSync(f.dir, { recursive: true, force: true });
});
it("keeps required placement impact after 200 irrelevant rows with owner/status/required boundaries", async () => {
  const rows = await getActiveCollaborationRequirements("freelancer");
  expect(rows.map((r) => r.collaborationId)).toEqual(["collab-204", "collab-200"]);
  const overview = summarizeExpiry(
    [
      {
        id: "vog",
        title: "VOG",
        type: "VOG",
        status: "VERIFIED",
        expiresAt: new Date("2026-09-30T12:00:00Z"),
      },
    ],
    new Date("2026-09-24T12:00:00Z"),
  );
  expect(linkExpiryToInzet(overview, rows).collaborationsAtRisk).toBe(2);
  expect(await getActiveCollaborationRequirements("missing")).toEqual([]);
  expect(
    (await getActiveCollaborationRequirements("foreign")).map((r) => r.collaborationId),
  ).toEqual(["collab-202"]);
});
it("preserves the existing 200-row bound with deterministic ordering", async () => {
  await f.db.jobCredentialRequirement.createMany({
    data: Array.from({ length: 200 }, (_, i) => ({
      jobId: `collab-${String(i).padStart(3, "0")}`,
      credentialType: "VOG",
      required: true,
    })),
  });
  const rows = await getActiveCollaborationRequirements("freelancer");
  expect(rows).toHaveLength(200);
  expect(rows[0]?.collaborationId).toBe("collab-204");
  expect(rows[199]?.collaborationId).toBe("collab-198");
});
