// Grensproef voor runJobEngagementTask: een koude opdracht voorbij de scan-cap moet nog steeds
// bereikt worden. Vroeger selecteerde de runner met één vaste `take` (SCAN_LIMIT=200) op
// `publishedAt asc`; omdat de dedup pas bij het signaal gebeurt, bezetten reeds gewaarschuwde
// koude opdrachten de oudste plekken en bleven nieuwere koude opdrachten permanent onbereikt.
// De cursor-paginatie loopt nu door álle matchende rijen. Draait tegen een echte SQLite-database.

import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "job-engagement-window-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));

const db = fixture.db;
const NOW = new Date("2026-06-17T12:00:00.000Z");
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
      email: "client@job-engagement.test",
      name: "Synthetic client",
      passwordHash: "synthetic-hash",
    },
  });
  await db.company.create({ data: { id: "company", userId: "client", name: "Synthetic company" } });
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

// 199/200/401: rond en voorbij de oude SCAN_LIMIT van 200.
it.each([199, 200, 401])(
  "reaches a fresh cold job behind %i already-alerted cold jobs",
  async (count) => {
    // Oudere, reeds gewaarschuwde koude opdrachten die onder de oude cap de oudste plekken bezetten.
    const fillerIds = Array.from({ length: count }, (_, i) => `old-${String(i).padStart(4, "0")}`);
    await db.job.createMany({
      data: fillerIds.map((id) => ({
        id,
        companyId: "company",
        title: `Koud ${id}`,
        description: "Fixture",
        status: "PUBLISHED",
        publishedAt: daysAgo(60),
      })),
    });
    // Deze opdrachten hebben al een signaal gehad: dedup laat ze geen nieuw signaal geven,
    // maar ze blijven wel meegeteld in de scan (zoals in productie).
    await db.domainEvent.createMany({
      data: fillerIds.map((id) => ({
        type: "JOB_COLD",
        actorRole: "SYSTEM",
        subjectType: "Job",
        subjectId: id,
        dedupeKey: `job-cold:${id}`,
      })),
    });
    // Nieuwere, nog niet gewaarschuwde koude opdracht (8 dagen open > drempel van 7).
    await db.job.create({
      data: {
        id: "zzz-fresh",
        companyId: "company",
        title: "Nieuwe koude opdracht",
        description: "Fixture",
        status: "PUBLISHED",
        publishedAt: daysAgo(8),
      },
    });

    const { runJobEngagementTask } = await import("./job-engagement-task");
    const first = await runJobEngagementTask({ now: NOW });
    const repeat = await runJobEngagementTask({ now: NOW });

    // De verse opdracht is bereikt ondanks de volle cap; herhaling is idempotent.
    expect(first).toEqual({ alerted: 1, jobs: count + 1 });
    expect(repeat).toEqual({ alerted: 0, jobs: count + 1 });

    const notifications = await db.notification.findMany({
      select: { userId: true, link: true, type: true },
    });
    expect(notifications).toEqual([
      { userId: "client", link: "/opdrachten/zzz-fresh", type: "JOB_COLD" },
    ]);
  },
  40_000,
);
