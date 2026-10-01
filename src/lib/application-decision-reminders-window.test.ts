// Real-SQLite window-test voor runApplicationDecisionReminderTask: bewijst dat een beslis-herinnering
// bereikbaar blijft voorbij één scan-pagina (geen starvation) en dat de [createdAt, id]-tie-breaker op
// de paginagrens geen reactie overslaat of dubbel telt. Spiegelt de factuur-/indienherinnering-sweep.

import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "application-decision-window-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));

const db = fixture.db;
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
  await db.user.create({
    data: {
      id: "client",
      role: "CLIENT",
      email: "client@application-decision.test",
      name: "Synthetic client",
      passwordHash: "synthetic-hash",
    },
  });
  await db.user.create({
    data: {
      id: "freelancer",
      role: "FREELANCER",
      email: "freelancer@application-decision.test",
      name: "Synthetic freelancer",
      passwordHash: "synthetic-hash",
    },
  });
  await db.company.create({ data: { id: "company", userId: "client", name: "Synthetic company" } });
  await db.freelancerProfile.create({ data: { id: "profile", userId: "freelancer" } });
}, 40_000);

beforeEach(async () => {
  await db.notification.deleteMany();
  await db.auditLog.deleteMany();
  await db.domainEvent.deleteMany();
  await db.application.deleteMany();
  await db.job.deleteMany();
});

afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

// Eén reactie per (job, freelancer) door de @@unique-index: dus één job per reactie.
async function seedApplications(
  rows: Array<{ id: string; status: string; createdAt: Date }>,
): Promise<void> {
  await db.job.createMany({
    data: rows.map((r) => ({
      id: r.id,
      companyId: "company",
      title: "Synthetic assignment",
      description: "Fixture",
      status: "PUBLISHED",
    })),
  });
  await db.application.createMany({
    data: rows.map((r) => ({
      id: r.id,
      jobId: r.id,
      freelancerId: "profile",
      motivation: "Fixture",
      status: r.status,
      createdAt: r.createdAt,
    })),
  });
}

const { runApplicationDecisionReminderTask } =
  await import("./application-decision-reminders-task");

it.each([499, 500, 501])(
  "reaches a due decision reminder behind %i non-due viewed applications",
  async (count) => {
    // Niet-nudgebaar: VIEWED op dag 30 (drempel 14 + offsets [0,7] → dagen 14/21, 30 valt erbuiten),
    // ouder dan de nudgebare reactie zodat die voorbij de eerste pagina sorteert.
    const old = Array.from({ length: count }, (_, i) => ({
      id: `old-${String(i).padStart(4, "0")}`,
      status: "VIEWED",
      createdAt: daysAgo(30),
    }));
    // Nudgebaar: VIEWED precies op dag 14. Nieuwere createdAt → sorteert als laatste.
    await seedApplications([...old, { id: "zzz-due", status: "VIEWED", createdAt: daysAgo(14) }]);

    const first = await runApplicationDecisionReminderTask({ actorId: null, now: NOW });
    const repeat = await runApplicationDecisionReminderTask({ actorId: null, now: NOW });

    expect(first).toEqual({ reminded: 1 });
    expect(repeat).toEqual({ reminded: 0 });
    expect(
      await db.notification.findMany({ select: { userId: true, link: true, type: true } }),
    ).toEqual([{ userId: "client", link: "/kandidaten", type: "APPLICATION_DECISION_REMINDER" }]);
    expect(await db.domainEvent.count()).toBe(1);
    expect(await db.auditLog.count()).toBe(1);
  },
  30_000,
);

it("reminds every due application sharing one createdAt across the page boundary", async () => {
  // PAGE_SIZE + 1 nudgebare reacties met dezelfde createdAt: zonder id-tie-breaker zou de cursor op de
  // paginagrens een reactie overslaan of herhalen. Dag 14 = exact nudgebaar (drempel 14 + offset 0).
  const rows = Array.from({ length: 501 }, (_, i) => ({
    id: `due-${String(i).padStart(4, "0")}`,
    status: "VIEWED",
    createdAt: daysAgo(14),
  }));
  await seedApplications(rows);

  const first = await runApplicationDecisionReminderTask({ actorId: null, now: NOW });
  const repeat = await runApplicationDecisionReminderTask({ actorId: null, now: NOW });

  expect(first).toEqual({ reminded: 501 });
  expect(repeat).toEqual({ reminded: 0 });
  expect(await db.notification.count()).toBe(501);
  expect(await db.domainEvent.count()).toBe(501);
  expect(await db.auditLog.count()).toBe(501);
}, 30_000);
