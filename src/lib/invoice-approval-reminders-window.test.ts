import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "invoice-reminder-window-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));

const db = fixture.db;
// Crosses the Amsterdam autumn clock change: eligibility uses elapsed 24-hour days.
const NOW = new Date("2026-10-27T12:34:56.789Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);
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
  for (const [id, role] of [
    ["client", "CLIENT"],
    ["freelancer", "FREELANCER"],
  ]) {
    await db.user.create({
      data: {
        id,
        role,
        email: `${id}@invoice-reminder.test`,
        name: `Synthetic ${id}`,
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
      description: "Fixture",
    },
  });
  await db.application.create({
    data: { id: "application", jobId: "job", freelancerId: "profile", motivation: "Synthetic" },
  });
  await db.collaboration.create({
    data: {
      id: "collaboration",
      applicationId: "application",
      jobId: "job",
      companyId: "company",
      freelancerId: "profile",
      status: "ACTIVE",
    },
  });
}, 40_000);

beforeEach(async () => {
  await db.notification.deleteMany();
  await db.auditLog.deleteMany();
  await db.domainEvent.deleteMany();
  await db.invoice.deleteMany();
});

afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

describe("approval reminder queue capacity reproduction", () => {
  it.each([499, 500, 1001])(
    "reminds a current item behind %i already escalated older items",
    async (count) => {
      const old = Array.from({ length: count }, (_, i) => `old-${i}`);
      await db.invoice.createMany({
        data: old.map((id) => ({
          id,
          number: id,
          collaborationId: "collaboration",
          counterpartyUserId: "client",
          issuerUserId: "freelancer",
          lifecycleStatus: "SUBMITTED",
          issuedAt: daysAgo(10),
        })),
      });
      await db.domainEvent.createMany({
        data: old.map((id) => ({
          type: "INVOICE_APPROVAL_ESCALATION",
          actorRole: "SYSTEM",
          subjectType: "Invoice",
          subjectId: id,
          payload: "{}",
          dedupeKey: `invoice-approval-escalation-${id}`,
        })),
      });
      await db.invoice.create({
        data: {
          id: "fresh",
          number: "fresh",
          collaborationId: "collaboration",
          counterpartyUserId: "client",
          issuerUserId: "freelancer",
          lifecycleStatus: "SUBMITTED",
          issuedAt: daysAgo(3),
        },
      });
      const { runInvoiceApprovalReminderTask } = await import("./invoice-approval-reminders-task");
      expect(await runInvoiceApprovalReminderTask({ now: NOW })).toEqual({
        reminded: 1,
        escalated: 0,
      });
      expect(await db.notification.count()).toBe(1);
      expect(await runInvoiceApprovalReminderTask({ now: NOW })).toEqual({
        reminded: 0,
        escalated: 0,
      });
      expect(await db.notification.count()).toBe(1);
    },
  );
  it("traverses equal timestamps and counts every new reminder exactly once", async () => {
    await db.invoice.createMany({
      data: Array.from({ length: 501 }, (_, i) => ({
        id: `tie-${String(500 - i).padStart(4, "0")}`,
        number: `tie-${i}`,
        collaborationId: "collaboration",
        counterpartyUserId: "client",
        issuerUserId: "freelancer",
        lifecycleStatus: "SUBMITTED",
        issuedAt: daysAgo(3),
      })),
    });
    const { runInvoiceApprovalReminderTask } = await import("./invoice-approval-reminders-task");
    expect(await runInvoiceApprovalReminderTask({ now: NOW })).toEqual({
      reminded: 501,
      escalated: 0,
    });
    expect(await db.notification.count()).toBe(501);
    expect(await db.domainEvent.count()).toBe(501);
    expect(await runInvoiceApprovalReminderTask({ now: NOW })).toEqual({
      reminded: 0,
      escalated: 0,
    });
  });
  it("continues after a full page that has no planned signals", async () => {
    await db.invoice.createMany({
      data: Array.from({ length: 500 }, (_, i) => ({
        id: `quiet-${i}`,
        number: `quiet-${i}`,
        collaborationId: "collaboration",
        counterpartyUserId: "client",
        issuerUserId: "freelancer",
        lifecycleStatus: "SUBMITTED",
        issuedAt: daysAgo(4),
      })),
    });
    await db.invoice.create({
      data: {
        id: "fresh",
        number: "fresh",
        collaborationId: "collaboration",
        counterpartyUserId: "client",
        issuerUserId: "freelancer",
        lifecycleStatus: "SUBMITTED",
        issuedAt: daysAgo(3),
      },
    });
    const { runInvoiceApprovalReminderTask } = await import("./invoice-approval-reminders-task");
    expect(await runInvoiceApprovalReminderTask({ now: NOW })).toEqual({
      reminded: 1,
      escalated: 0,
    });
  });
  it("ignores null/future dates and noncandidates while retaining standalone invoices", async () => {
    await db.invoice.createMany({
      data: [
        {
          number: "null-date",
          lifecycleStatus: "SUBMITTED",
          counterpartyUserId: "client",
          issuedAt: null,
        },
        {
          number: "future",
          lifecycleStatus: "SUBMITTED",
          counterpartyUserId: "client",
          issuedAt: daysAgo(-3),
        },
        { number: "no-client", lifecycleStatus: "SUBMITTED", issuedAt: daysAgo(3) },
        {
          number: "draft",
          lifecycleStatus: "CONCEPT",
          counterpartyUserId: "client",
          issuedAt: daysAgo(3),
        },
        {
          id: "standalone",
          number: "standalone",
          lifecycleStatus: "SUBMITTED",
          counterpartyUserId: "client",
          issuedAt: daysAgo(3),
        },
      ],
    });
    const { runInvoiceApprovalReminderTask } = await import("./invoice-approval-reminders-task");
    expect(await runInvoiceApprovalReminderTask({ now: NOW })).toEqual({
      reminded: 1,
      escalated: 0,
    });
    expect(await db.domainEvent.findMany({ select: { subjectId: true } })).toEqual([
      { subjectId: "standalone" },
    ]);
    expect(await db.notification.count()).toBe(1);
    expect(await runInvoiceApprovalReminderTask({ now: NOW })).toEqual({
      reminded: 0,
      escalated: 0,
    });
  });
  it.each(["CANCELLED", "DISPUTED"])("keeps %s collaboration invoices quiet", async (mode) => {
    await db.collaboration.update({
      where: { id: "collaboration" },
      data: {
        status: mode === "CANCELLED" ? "CANCELLED" : "ACTIVE",
        disputedAt: mode === "DISPUTED" ? daysAgo(1) : null,
      },
    });
    try {
      await db.invoice.create({
        data: {
          number: "frozen",
          collaborationId: "collaboration",
          lifecycleStatus: "SUBMITTED",
          counterpartyUserId: "client",
          issuedAt: daysAgo(3),
        },
      });
      const { runInvoiceApprovalReminderTask } = await import("./invoice-approval-reminders-task");
      expect(await runInvoiceApprovalReminderTask({ now: NOW })).toEqual({
        reminded: 0,
        escalated: 0,
      });
      expect(await db.domainEvent.count()).toBe(0);
      expect(await db.notification.count()).toBe(0);
    } finally {
      await db.collaboration.update({
        where: { id: "collaboration" },
        data: { status: "ACTIVE", disputedAt: null },
      });
    }
  });
});
