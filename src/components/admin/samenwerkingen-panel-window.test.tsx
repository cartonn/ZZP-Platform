import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { SamenwerkingenPanel } from "@/components/admin/samenwerkingen-panel";
import { renderToStaticMarkup } from "react-dom/server";
import { pendingTasks } from "@/lib/actions/pending-tasks";
import { navBadges } from "@/lib/signals";
import {
  getAdminCollaborations,
  collaborationDurationBoundary,
} from "@/lib/data/admin-collaborations";
import { parseCollaborationFilter } from "@/lib/collaboration-filter";
import { assessCollaborationDba, jobDbaIndicators } from "@/lib/dba-monitor";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "admin-collaboration-window-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  return { directory, url, db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/db", () => ({ prisma: fixture.db }));

const db = fixture.db;
// Crosses the Amsterdam autumn clock change: eligibility uses elapsed 24-hour days.
const NOW = new Date("2026-10-27T12:34:56.789Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);
async function load(now = NOW) {
  const { getAdminPerformanceEscalations } =
    await import("@/lib/data/admin-performance-escalations");
  return getAdminPerformanceEscalations(now);
}
async function performance(
  id: string,
  submittedAt: Date | null = daysAgo(8),
  status = "SUBMITTED",
) {
  await db.performance.create({
    data: {
      id,
      collaborationId: "collaboration",
      submittedAt,
      status,
      description: `Synthetic ${id}`,
    },
  });
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
  for (const [id, role] of [
    ["client", "CLIENT"],
    ["freelancer", "FREELANCER"],
  ]) {
    await db.user.create({
      data: {
        id,
        role,
        email: `${id}@performance-escalation.test`,
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
  await db.collaboration.update({
    where: { id: "collaboration" },
    data: { createdAt: new Date("2025-01-01") },
  });
  const ids = Array.from({ length: 500 }, (_, i) => `completed-${i}`);
  await db.job.createMany({
    data: ids.map((id) => ({ id, companyId: "company", title: id, description: "Synthetic" })),
  });
  await db.application.createMany({
    data: ids.map((id) => ({ id, jobId: id, freelancerId: "profile", motivation: "Synthetic" })),
  });
  await db.collaboration.createMany({
    data: ids.map((id) => ({
      id,
      jobId: id,
      applicationId: id,
      companyId: "company",
      freelancerId: "profile",
      status: "COMPLETED",
      createdAt: new Date("2026-01-01"),
    })),
  });
}, 40_000);

beforeEach(async () => {
  await db.performance.deleteMany();
  await db.invoice.deleteMany();
  await db.collaboration.update({ where: { id: "collaboration" }, data: { startDate: null } });
  await db.job.update({
    where: { id: "job" },
    data: {
      title: "Synthetic assignment",
      dbaDirectSupervision: false,
      dbaEmbedded: false,
      dbaFixedSchedule: false,
    },
  });
  await db.user.update({ where: { id: "freelancer" }, data: { name: "Synthetic freelancer" } });
  await performance("pending-old");
});

afterEach(() => vi.useRealTimers());

afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

it("keeps an older actionable collaboration searchable when 500 newer rows are completed", async () => {
  // Fix wall-clock so the task, badge and overview use the same synthetic instant.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  const escalations = await load();
  const tasks = await pendingTasks({ id: "admin", role: "ADMIN", status: "ACTIVE" });
  const badges = await navBadges("ADMIN", "admin");
  const html = renderToStaticMarkup(
    await SamenwerkingenPanel({ searchParams: { status: "ACTIVE", q: "Synthetic assignment" } }),
  );
  expect(escalations.map((r) => r.id)).toEqual(["pending-old"]);
  expect(tasks.some((t) => t.kind === "admin-performance-followup")).toBe(true);
  expect(badges["/admin/samenwerkingen"]?.count).toBe(1);
  expect(html).toContain("Alle statussen (501)");
  expect(html).toContain("Actief (1)");
  expect(html).not.toContain("Geen samenwerkingen die overeenkomen met de huidige filters.");
  expect(html).toContain('href="/samenwerkingen/collaboration"');
  expect(html).toContain("1 van 501 samenwerkingen");
  expect(html).toContain("prestatie wacht");
});

it("bounds pages, keeps complete counts, and preserves every filter in navigation", async () => {
  const filter = parseCollaborationFilter({});
  const first = await getAdminCollaborations(filter, "1", NOW);
  const second = await getAdminCollaborations(filter, "2", NOW);
  const last = await getAdminCollaborations(filter, "999999999999", NOW);
  expect(first.total).toBe(501);
  expect(first.rows).toHaveLength(50);
  expect(second.rows).toHaveLength(50);
  expect(new Set([...first.rows, ...second.rows].map((r) => r.id)).size).toBe(100);
  expect(last.page).toBe(11);
  expect(last.rows.map((r) => r.id)).toEqual(["collaboration"]);
  expect((await getAdminCollaborations(filter, "-1", NOW)).page).toBe(1);
  expect((await getAdminCollaborations(filter, "1.5", NOW)).page).toBe(1);
  const html = renderToStaticMarkup(
    await SamenwerkingenPanel({
      searchParams: { status: "COMPLETED", q: "completed", dba: "LAAG", page: "2" },
    }),
  );
  expect(html).toContain("500 van 501 samenwerkingen");
  expect(html).toContain("Pagina 2 van 10");
  expect(html).toContain("q=completed&amp;status=COMPLETED&amp;dba=LAAG&amp;page=1");
  expect(html).toContain("q=completed&amp;status=COMPLETED&amp;dba=LAAG&amp;page=3");
  expect(html.match(/href="\/samenwerkingen\//g)).toHaveLength(50);
});

it("searches across names, treats SQL/LIKE characters literally, and handles empty names", async () => {
  const search = (q: string) => getAdminCollaborations(parseCollaborationFilter({ q }), "1", NOW);
  expect((await search("ASSIGNMENT SYNTHETIC COMPANY")).rows.map((r) => r.id)).toEqual([
    "collaboration",
  ]);
  await db.user.update({ where: { id: "freelancer" }, data: { name: "" } });
  expect((await search("assignment Synthetic company")).total).toBe(1);
  await db.job.update({ where: { id: "job" }, data: { title: "Night 100%_! O'Brien" } });
  expect((await search("100%_!")).rows.map((r) => r.id)).toEqual(["collaboration"]);
  expect((await search("O'Brien")).total).toBe(1);
  expect((await search("' OR 1=1 --")).total).toBe(0);
  expect((await search("nonexistent")).rows).toHaveLength(0);
});

it("aggregates child status counts without returning child arrays", async () => {
  await db.performance.createMany({
    data: Array.from({ length: 75 }, (_, i) => ({
      id: `extra-performance-${i}`,
      collaborationId: "collaboration",
      description: "Synthetic",
      status: "SUBMITTED",
    })),
  });
  await db.invoice.createMany({
    data: ["SUBMITTED", "PAID", "PROCESSED", null].flatMap((lifecycleStatus, index) =>
      Array.from({ length: 60 }, (_, i) => ({
        number: `synthetic-${index}-${i}`,
        collaborationId: "collaboration",
        lifecycleStatus,
      })),
    ),
  });
  const result = await getAdminCollaborations(
    parseCollaborationFilter({ status: "ACTIVE" }),
    "1",
    NOW,
  );
  expect(result.rows).toHaveLength(1);
  expect(result.rows[0]!._count).toEqual({ performances: 76, invoices: 60 });
  expect(result.rows[0]).not.toHaveProperty("performances");
  expect(result.rows[0]).not.toHaveProperty("invoices");
  expect(result.paid.get("collaboration")).toBe(120);
});

it("matches derived DBA levels around calendar boundaries, flags and null dates", async () => {
  for (const now of [NOW, new Date(2026, 2, 31, 12), new Date(2028, 1, 29, 12)]) {
    const boundary6 = collaborationDurationBoundary(now, 6);
    const boundary12 = collaborationDurationBoundary(now, 12);
    for (const startDate of [
      null,
      new Date(now.getTime() + 86400000),
      new Date(boundary6.getTime() - 1),
      boundary6,
      new Date(boundary12.getTime() - 1),
      boundary12,
    ]) {
      for (const flag of ["none", "dbaDirectSupervision", "dbaEmbedded", "dbaFixedSchedule"]) {
        const job = {
          dbaDirectSupervision: flag === "dbaDirectSupervision",
          dbaEmbedded: flag === "dbaEmbedded",
          dbaFixedSchedule: flag === "dbaFixedSchedule",
        };
        await db.collaboration.update({ where: { id: "collaboration" }, data: { startDate } });
        await db.job.update({ where: { id: "job" }, data: job });
        const expected = assessCollaborationDba(
          { collaborationId: "collaboration", startDate, ...jobDbaIndicators(job) },
          now,
        ).level;
        for (const dba of ["LAAG", "VERHOOGD", "HOOG"]) {
          const result = await getAdminCollaborations(
            parseCollaborationFilter({ status: "ACTIVE", dba }),
            "1",
            now,
          );
          expect(
            result.total,
            `${now.toISOString()} / ${startDate?.toISOString()} / ${flag} / ${dba}`,
          ).toBe(dba === expected ? 1 : 0);
        }
      }
    }
  }
});
