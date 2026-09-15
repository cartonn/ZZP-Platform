import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import {
  countByStatus,
  filterCollaborations,
  parseCollaborationFilter,
} from "@/lib/collaboration-filter";
import { summarizeFranchiseCollaborations } from "@/lib/franchise/collaboration-oversight";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "franchise-collaborations-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
import { getFranchiseCollaborations } from "./franchise-collaborations";

const db = fixture.db;
const NOW = new Date("2026-09-15T12:00:00Z");
const OLD = new Date("2026-01-01T12:00:00Z");
const TOMORROW = new Date(NOW.getTime() + 86_400_000);

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
  await db.user.createMany({
    data: ["owner", "other-owner", "client", "freelancer"].map((id) => ({
      id,
      name: `Synthetic ${id}`,
      email: `${id}@franchise-queue.test`,
      passwordHash: "synthetic-hash",
    })),
  });
  await db.tenant.createMany({
    data: [
      { id: "own", name: "Own tenant", slug: "own", ownerUserId: "owner" },
      { id: "foreign", name: "Foreign tenant", slug: "foreign", ownerUserId: "other-owner" },
    ],
  });
  await db.company.create({
    data: { id: "company", userId: "client", name: "Own company", tenantId: "own" },
  });
  await db.freelancerProfile.create({
    data: { id: "profile", userId: "freelancer", tenantId: "own" },
  });
}, 40_000);

beforeEach(async () => {
  await db.collaboration.deleteMany();
  await db.application.deleteMany();
  await db.job.deleteMany();
});
afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

async function seedRows(
  rows: {
    id: string;
    status: string;
    tenantId?: string | null;
    updatedAt?: Date;
    endDate?: Date | null;
    disputedAt?: Date | null;
  }[],
) {
  await db.job.createMany({
    data: rows.map((r) => ({
      id: r.id,
      companyId: "company",
      tenantId: r.tenantId === undefined ? "own" : r.tenantId,
      title: `Assignment ${r.id}`,
      description: "Synthetic fixture",
    })),
  });
  await db.application.createMany({
    data: rows.map((r) => ({
      id: r.id,
      jobId: r.id,
      freelancerId: "profile",
      motivation: "Synthetic fixture",
    })),
  });
  await db.collaboration.createMany({
    data: rows.map((r) => ({
      id: r.id,
      applicationId: r.id,
      jobId: r.id,
      companyId: "company",
      freelancerId: "profile",
      status: r.status,
      contractStatus: "SIGNED",
      createdAt: OLD,
      updatedAt: r.updatedAt ?? NOW,
      endDate: r.endDate ?? null,
      disputedAt: r.disputedAt ?? null,
    })),
  });
}
async function overview() {
  return (await getFranchiseCollaborations("own")).map((r) => ({
    ...r,
    dbaLevel: "",
    jobTitle: r.job.title,
    companyName: r.company.name,
    freelancerName: r.freelancer.user.name,
  }));
}

describe("franchise oversight against an isolated database", () => {
  it("keeps an old renewal visible after a hundred newer completed collaborations", async () => {
    await seedRows([
      { id: "old-active", status: "ACTIVE", updatedAt: OLD, endDate: TOMORROW },
      ...Array.from({ length: 100 }, (_, i) => ({ id: `closed-${i}`, status: "COMPLETED" })),
    ]);
    const rows = await overview();
    expect(
      filterCollaborations(
        rows,
        parseCollaborationFilter({ status: "ACTIVE", q: "old-active" }),
      ).map((r) => r.id),
    ).toEqual(["old-active"]);
    expect(countByStatus(rows)).toEqual({
      all: 101,
      ACTIVE: 1,
      COMPLETED: 100,
      PROPOSED: 0,
      CANCELLED: 0,
    });
    expect(summarizeFranchiseCollaborations(rows, NOW).endingSoon).toBe(1);
  });

  it("keeps the full active queue, disputed rows and old proposals available", async () => {
    await seedRows([
      ...Array.from({ length: 101 }, (_, i) => ({
        id: `active-${i}`,
        status: "ACTIVE",
        endDate: TOMORROW,
      })),
      { id: "old-dispute", status: "ACTIVE", updatedAt: OLD, disputedAt: NOW },
      { id: "old-proposal", status: "PROPOSED", updatedAt: OLD },
    ]);
    const rows = await overview();
    expect(filterCollaborations(rows, parseCollaborationFilter({ status: "ACTIVE" }))).toHaveLength(
      102,
    );
    expect(
      filterCollaborations(rows, parseCollaborationFilter({ q: "old-proposal" })).map((r) => r.id),
    ).toEqual(["old-proposal"]);
    expect(summarizeFranchiseCollaborations(rows, NOW)).toMatchObject({
      total: 103,
      active: 102,
      proposed: 1,
      endingSoon: 101,
      disputed: 1,
    });
  });

  it("scopes by the job tenant even when company and freelancer belong to the viewer", async () => {
    await seedRows([
      { id: "own-row", status: "ACTIVE" },
      { id: "foreign-row", status: "ACTIVE", tenantId: "foreign" },
      { id: "direct-row", status: "ACTIVE", tenantId: null },
    ]);
    expect((await getFranchiseCollaborations("own")).map((r) => r.id)).toEqual(["own-row"]);
    expect(await getFranchiseCollaborations(null)).toEqual([]);
    expect(await getFranchiseCollaborations("unknown")).toEqual([]);
  });
});
