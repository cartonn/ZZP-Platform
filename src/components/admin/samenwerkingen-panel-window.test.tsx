import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { SamenwerkingenPanel } from "@/components/admin/samenwerkingen-panel";
import { renderToStaticMarkup } from "react-dom/server";
import { pendingTasks } from "@/lib/actions/pending-tasks";
import { navBadges } from "@/lib/signals";

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
}, 40_000);

afterEach(() => vi.useRealTimers());

afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

it("keeps an older actionable collaboration searchable when 500 newer rows are completed", async () => {
  await db.collaboration.update({
    where: { id: "collaboration" },
    data: { createdAt: new Date("2025-01-01") },
  });
  await performance("pending-old");
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
