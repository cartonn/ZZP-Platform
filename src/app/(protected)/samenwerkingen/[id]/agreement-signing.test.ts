import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "agreement-signing-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  const hooks = { afterRead: null as (() => Promise<void>) | null };
  const db = new PrismaClient({ datasourceUrl: url }).$extends({
    query: {
      collaboration: {
        async findUnique({ args, query }) {
          const snapshot = await query(args);
          const afterRead = hooks.afterRead;
          hooks.afterRead = null;
          if (afterRead) await afterRead();
          return snapshot;
        },
      },
    },
  });
  return { directory, url, db, hooks, actorId: "client" };
});

vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
vi.mock("@/lib/authz", () => ({
  requireActor: async () => ({
    id: fixture.actorId,
    role: fixture.actorId === "outsider" ? "FREELANCER" : fixture.actorId.toUpperCase(),
    status: "ACTIVE",
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { signModelAgreementAction } from "./actions";

const db = fixture.db;
const signatureFields = {
  client: "agreementClientSignedAt",
  freelancer: "agreementFreelancerSignedAt",
} as const;

beforeAll(async () => {
  // Never use an inherited database: every run owns a fresh synthetic SQLite file.
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
  for (const id of ["client", "freelancer", "outsider"]) {
    await db.user.create({
      data: { id, email: `${id}@agreement.test`, name: id, passwordHash: "synthetic-unused" },
    });
  }
  await db.company.create({ data: { id: "company", userId: "client", name: "Synthetic company" } });
  await db.freelancerProfile.create({ data: { id: "freelancer-profile", userId: "freelancer" } });
  await db.job.create({
    data: { id: "job", companyId: "company", title: "Synthetic", description: "Test" },
  });
  await db.application.create({
    data: {
      id: "application",
      jobId: "job",
      freelancerId: "freelancer-profile",
      motivation: "Test",
    },
  });
  await db.collaboration.create({
    data: {
      id: "collaboration",
      jobId: "job",
      applicationId: "application",
      companyId: "company",
      freelancerId: "freelancer-profile",
    },
  });
}, 40_000);

beforeEach(async () => {
  fixture.hooks.afterRead = null;
  fixture.actorId = "client";
  await db.auditLog.deleteMany();
  await db.collaboration.update({
    where: { id: "collaboration" },
    data: {
      status: "ACTIVE",
      disputedAt: null,
      agreementClientSignedAt: null,
      agreementFreelancerSignedAt: null,
    },
  });
});

afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

describe.each(["client", "freelancer"] as const)("model agreement signing by %s", (party) => {
  it.each(["PROPOSED", "ACTIVE"])(
    "signs once on %s and keeps the original timestamp",
    async (status) => {
      fixture.actorId = party;
      await db.collaboration.update({ where: { id: "collaboration" }, data: { status } });
      await signModelAgreementAction("collaboration");
      const first = await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } });
      expect(first[signatureFields[party]]).toBeInstanceOf(Date);
      await signModelAgreementAction("collaboration");
      const second = await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } });
      expect(second[signatureFields[party]]).toEqual(first[signatureFields[party]]);
      const entries = await db.auditLog.findMany();
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        actorId: party,
        action: "MODEL_AGREEMENT_SIGNED",
        entityId: "collaboration",
        metadata: JSON.stringify({ party: party.toUpperCase() }),
      });
    },
  );

  it.each(["COMPLETED", "CANCELLED", "INVALID"])(
    "rejects a new signature on %s without writes",
    async (status) => {
      fixture.actorId = party;
      await db.collaboration.update({ where: { id: "collaboration" }, data: { status } });
      await expect(signModelAgreementAction("collaboration")).rejects.toThrow();
      const row = await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } });
      expect(row[signatureFields[party]]).toBeNull();
      expect(await db.auditLog.count()).toBe(0);
    },
  );

  it("rejects a new signature during a dispute", async () => {
    fixture.actorId = party;
    await db.collaboration.update({
      where: { id: "collaboration" },
      data: { disputedAt: new Date() },
    });
    await expect(signModelAgreementAction("collaboration")).rejects.toThrow();
    expect(
      (await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } }))[
        signatureFields[party]
      ],
    ).toBeNull();
    expect(await db.auditLog.count()).toBe(0);
  });

  it("preserves an existing historical signature on a closed disputed row", async () => {
    fixture.actorId = party;
    const signedAt = new Date("2026-01-01T12:00:00Z");
    await db.collaboration.update({
      where: { id: "collaboration" },
      data: { status: "COMPLETED", disputedAt: new Date(), [signatureFields[party]]: signedAt },
    });
    await signModelAgreementAction("collaboration");
    expect(
      (await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } }))[
        signatureFields[party]
      ],
    ).toEqual(signedAt);
    expect(await db.auditLog.count()).toBe(0);
  });
});

it.each(["outsider", "admin", "franchiser"])(
  "gives non-party %s the same error as an unknown id",
  async (actorId) => {
    fixture.actorId = actorId;
    await expect(signModelAgreementAction("collaboration")).rejects.toThrow(
      "Samenwerking niet gevonden.",
    );
    await expect(signModelAgreementAction("missing")).rejects.toThrow(
      "Samenwerking niet gevonden.",
    );
    expect(await db.auditLog.count()).toBe(0);
  },
);

it.each([{ status: "CANCELLED" }, { status: "COMPLETED" }, { disputedAt: new Date() }])(
  "rejects a lifecycle change after the initial read: %j",
  async (data) => {
    fixture.hooks.afterRead = async () => {
      await db.collaboration.update({ where: { id: "collaboration" }, data });
    };
    await expect(signModelAgreementAction("collaboration")).rejects.toThrow();
    expect(
      (await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } }))
        .agreementClientSignedAt,
    ).toBeNull();
    expect(await db.auditLog.count()).toBe(0);
  },
);

it("two signing requests with stale reads commit one signature and one audit", async () => {
  let signedAt: Date | null = null;
  fixture.hooks.afterRead = async () => {
    // A second real action commits while the first holds its unsigned snapshot.
    await signModelAgreementAction("collaboration");
    signedAt = (await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } }))
      .agreementClientSignedAt;
  };
  await signModelAgreementAction("collaboration");
  expect(signedAt).toBeInstanceOf(Date);
  expect(
    (await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } }))
      .agreementClientSignedAt,
  ).toEqual(signedAt);
  expect(await db.auditLog.count()).toBe(1);
});

it("lets both parties sign independently", async () => {
  await signModelAgreementAction("collaboration");
  fixture.actorId = "freelancer";
  await signModelAgreementAction("collaboration");
  const row = await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } });
  expect(row.agreementClientSignedAt).toBeInstanceOf(Date);
  expect(row.agreementFreelancerSignedAt).toBeInstanceOf(Date);
  expect(await db.auditLog.count()).toBe(2);
});

it("rolls back the signature if the audit write fails", async () => {
  await db.$executeRawUnsafe(
    `CREATE TRIGGER reject_signing_audit BEFORE INSERT ON AuditLog BEGIN SELECT RAISE(ABORT, 'synthetic audit failure'); END;`,
  );
  try {
    await expect(signModelAgreementAction("collaboration")).rejects.toThrow();
    expect(
      (await db.collaboration.findUniqueOrThrow({ where: { id: "collaboration" } }))
        .agreementClientSignedAt,
    ).toBeNull();
    expect(await db.auditLog.count()).toBe(0);
  } finally {
    await db.$executeRawUnsafe("DROP TRIGGER reject_signing_audit");
  }
});
