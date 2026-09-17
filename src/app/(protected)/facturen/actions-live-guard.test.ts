import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "invoice-live-guard-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  const hooks = { afterRead: null as (() => Promise<void>) | null, failAudit: false };
  const db = new PrismaClient({ datasourceUrl: url }).$extends({
    query: {
      invoice: {
        async findUnique({ args, query }) {
          const snapshot = await query(args);
          const afterRead = hooks.afterRead;
          hooks.afterRead = null;
          if (afterRead) await afterRead();
          return snapshot;
        },
      },
      auditLog: {
        async create({ args, query }) {
          if (hooks.failAudit) throw new Error("Synthetic audit failure");
          return query(args);
        },
      },
    },
  });
  return { directory, url, db, hooks, actor: { id: "freelancer", role: "FREELANCER" } };
});

vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
vi.mock("@/lib/authz", () => ({
  AuthorizationError: class extends Error {},
  requireRole: async (role: string) => {
    if (fixture.actor.role !== role) throw new Error("Denied");
    return { ...fixture.actor, status: "ACTIVE" };
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/signals/invalidate", () => ({ invalidateSignals: vi.fn() }));

import { cancelInvoice, markInvoicePaid, sendInvoice } from "./actions";

const db = fixture.db;
const cases = [
  {
    name: "send",
    action: sendInvoice,
    from: "DRAFT",
    to: "SENT",
    role: "FREELANCER",
    id: "freelancer",
    notices: 1,
  },
  {
    name: "pay",
    action: markInvoicePaid,
    from: "SENT",
    to: "PAID",
    role: "CLIENT",
    id: "client",
    notices: 1,
  },
  {
    name: "cancel",
    action: cancelInvoice,
    from: "SENT",
    to: "CANCELLED",
    role: "FREELANCER",
    id: "freelancer",
    notices: 0,
  },
];

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
  for (const id of ["client", "freelancer", "outsider"]) {
    await db.user.create({
      data: { id, email: `${id}@invoice.test`, name: id, passwordHash: "synthetic-unused" },
    });
  }
  await db.company.create({ data: { id: "company", userId: "client", name: "Synthetic" } });
  await db.freelancerProfile.create({ data: { id: "profile", userId: "freelancer" } });
  await db.job.create({
    data: { id: "job", companyId: "company", title: "Synthetic", description: "Test" },
  });
  await db.application.create({
    data: { id: "application", jobId: "job", freelancerId: "profile", motivation: "Test" },
  });
  await db.collaboration.create({
    data: {
      id: "collaboration",
      jobId: "job",
      applicationId: "application",
      companyId: "company",
      freelancerId: "profile",
      status: "ACTIVE",
    },
  });
  await db.invoice.create({
    data: {
      id: "invoice",
      collaborationId: "collaboration",
      number: "synthetic-1",
      totalCents: 10000,
    },
  });
}, 40_000);

beforeEach(async () => {
  fixture.hooks.afterRead = null;
  fixture.hooks.failAudit = false;
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.company.update({ where: { id: "company" }, data: { userId: "client" } });
  await db.freelancerProfile.update({ where: { id: "profile" }, data: { userId: "freelancer" } });
  await db.collaboration.update({ where: { id: "collaboration" }, data: { disputedAt: null } });
  await db.invoice.update({
    where: { id: "invoice" },
    data: { status: "DRAFT", lifecycleStatus: null },
  });
});

afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

for (const c of cases) {
  const prepare = async () => {
    fixture.actor = { id: c.id, role: c.role };
    await db.invoice.update({ where: { id: "invoice" }, data: { status: c.from } });
  };
  const unchanged = async () => {
    expect((await db.invoice.findUniqueOrThrow({ where: { id: "invoice" } })).status).toBe(c.from);
    expect(await db.auditLog.count()).toBe(0);
    expect(await db.notification.count()).toBe(0);
  };

  it(`${c.name}: preserves status and side effects when a dispute opens after the read`, async () => {
    await prepare();
    fixture.hooks.afterRead = async () => {
      await db.collaboration.update({
        where: { id: "collaboration" },
        data: { disputedAt: new Date() },
      });
    };
    await c.action("invoice");
    await unchanged();
  });

  it(`${c.name}: refuses a stale legacy snapshot after cascade conversion`, async () => {
    await prepare();
    fixture.hooks.afterRead = async () => {
      await db.invoice.update({ where: { id: "invoice" }, data: { lifecycleStatus: "SUBMITTED" } });
    };
    await c.action("invoice");
    await unchanged();
  });

  it(`${c.name}: refuses a stale owner snapshot`, async () => {
    await prepare();
    fixture.hooks.afterRead = async () => {
      if (c.role === "CLIENT")
        await db.company.update({ where: { id: "company" }, data: { userId: "outsider" } });
      else
        await db.freelancerProfile.update({
          where: { id: "profile" },
          data: { userId: "outsider" },
        });
    };
    await c.action("invoice");
    await unchanged();
  });

  it(`${c.name}: commits a permitted transition with its audit and notifications`, async () => {
    await prepare();
    await c.action("invoice");
    expect((await db.invoice.findUniqueOrThrow({ where: { id: "invoice" } })).status).toBe(c.to);
    expect(await db.auditLog.count()).toBe(1);
    expect(await db.notification.count()).toBe(c.notices);
  });

  it(`${c.name}: rolls back status and notifications if the audit fails`, async () => {
    await prepare();
    fixture.hooks.failAudit = true;
    await expect(c.action("invoice")).rejects.toThrow("Synthetic audit failure");
    await unchanged();
  });
}
