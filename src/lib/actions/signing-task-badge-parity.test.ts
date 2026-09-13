import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { type Actor } from "@/lib/authz";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "signing-task-badge-parity-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));

import { pendingTasks } from "./pending-tasks";
import { navBadges } from "@/lib/signals";

const db = fixture.db;
const actors: Record<"CLIENT" | "FREELANCER", Actor> = {
  CLIENT: { id: "client", role: "CLIENT", status: "ACTIVE" },
  FREELANCER: { id: "freelancer", role: "FREELANCER", status: "ACTIVE" },
};

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
    { env, timeout: 30000, stdio: "pipe" },
  );
  for (const actor of Object.values(actors)) {
    await db.user.create({
      data: {
        ...actor,
        email: `${actor.id}@signing-task.test`,
        name: `Synthetic ${actor.id}`,
        passwordHash: "synthetic-hash",
      },
    });
  }
  await db.company.create({ data: { id: "company", userId: "client", name: "Synthetic company" } });
  await db.freelancerProfile.create({ data: { id: "profile", userId: "freelancer" } });
  await db.job.create({
    data: {
      id: "job",
      companyId: "company",
      title: "Synthetic assignment",
      description: "Task parity",
    },
  });
  await db.application.create({
    data: {
      id: "application",
      jobId: "job",
      freelancerId: "profile",
      motivation: "Synthetic",
      status: "ACCEPTED",
    },
  });
  await db.collaboration.create({
    data: {
      id: "collaboration",
      applicationId: "application",
      jobId: "job",
      companyId: "company",
      freelancerId: "profile",
      rate: 80,
    },
  });
}, 40000);

beforeEach(async () => {
  await db.contractSignature.deleteMany();
  await db.contractSigning.deleteMany();
  await db.collaboration.update({
    where: { id: "collaboration" },
    data: { status: "PROPOSED", disputedAt: null, signingEvidenceErasedAt: null },
  });
});

afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

async function storedSignature(party: "CLIENT" | "FREELANCER") {
  await db.contractSigning.upsert({
    where: { collaborationId: "collaboration" },
    update: {},
    create: {
      collaborationId: "collaboration",
      documentJson: "{}",
      documentHash: "a".repeat(64),
      documentPdf: Buffer.from("synthetic fixture"),
      pdfHash: "b".repeat(64),
    },
  });
  await db.contractSignature.create({
    data: {
      collaborationId: "collaboration",
      actorId: actors[party].id,
      party,
      signerName: `Synthetic ${party}`,
      consentVersion: "synthetic-consent",
      authenticationMethod: "PASSWORD_REAUTHENTICATION",
    },
  });
}

async function expectSigningWork(party: "CLIENT" | "FREELANCER", count: number) {
  const actor = actors[party];
  const tasks = (await pendingTasks(actor)).filter((task) => task.kind === "contract-sign");
  expect(tasks).toHaveLength(count);
  if (count) {
    expect(tasks[0]).toMatchObject({
      collabId: "collaboration",
      resolver: "link",
      href: "/samenwerkingen/collaboration/ondertekenen",
    });
  }
  const badges = await navBadges(party, actor.id);
  expect(badges["/samenwerkingen"]?.count ?? 0).toBe(count);
}

describe("real database: each party's signing task and navigation badge agree", () => {
  it("a fresh unsigned proposal asks both parties to read and sign", async () => {
    await expectSigningWork("CLIENT", 1);
    await expectSigningWork("FREELANCER", 1);
  });

  it.each(["CLIENT", "FREELANCER"] as const)(
    "a stored %s signature removes only that party's work",
    async (party) => {
      await storedSignature(party);
      await expectSigningWork(party, 0);
      await expectSigningWork(party === "CLIENT" ? "FREELANCER" : "CLIENT", 1);
      expect(
        await db.collaboration.findUniqueOrThrow({
          where: { id: "collaboration" },
          select: { status: true },
        }),
      ).toEqual({ status: "PROPOSED" });
    },
  );

  it("both stored signatures leave no signing work even before the proposal status changes", async () => {
    await storedSignature("CLIENT");
    await storedSignature("FREELANCER");
    await expectSigningWork("CLIENT", 0);
    await expectSigningWork("FREELANCER", 0);
  });

  it.each(["disputed", "erased", "cancelled"])(
    "%s evidence never recreates a signing task for either party",
    async (condition) => {
      await storedSignature("CLIENT");
      await db.collaboration.update({
        where: { id: "collaboration" },
        data:
          condition === "disputed"
            ? { disputedAt: new Date() }
            : condition === "erased"
              ? { signingEvidenceErasedAt: new Date() }
              : { status: "CANCELLED" },
      });
      if (condition === "erased") await db.contractSigning.deleteMany();
      await expectSigningWork("CLIENT", 0);
      await expectSigningWork("FREELANCER", 0);
    },
  );
});
