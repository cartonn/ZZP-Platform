// Moderatie-sluiting mag niet door de eigenaar ongedaan worden gemaakt (OWASP A01 — broken access
// control). `adminCloseJob` sluit een opdracht wegens ongepaste inhoud en zet `moderationClosedAt`;
// de CLIENT-eigenaar mag die opdracht hierna NIET heropenen (changeJobStatus) of bewerken (saveJob).
// Zonder de markering was `JOB_TRANSITIONS.CLOSED = ["PUBLISHED"]` genoeg om een gemodereerde
// opdracht simpelweg CLOSED→PUBLISHED terug te zetten. Een gewone EIGENAAR-sluiting (geen markering)
// blijft wél heropenbaar — de controle onderaan bewijst dat de fix dat legitieme pad niet breekt.
//
// Echte SQLite (prisma db push) + de echte server-actions; alleen auth/cache/navigatie gemockt.

import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = await vi.hoisted(async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { PrismaClient } = await import("@prisma/client");
  const directory = mkdtempSync(join(tmpdir(), "job-moderation-"));
  const url = `file:${join(directory, "test.sqlite")}`;
  const db = new PrismaClient({ datasourceUrl: url });
  return {
    directory,
    url,
    db,
    actor: { id: "client", role: "CLIENT" } as { id: string; role: string },
  };
});

vi.mock("@/lib/db", () => ({ prisma: fixture.db }));
vi.mock("@/lib/authz", () => ({
  AuthorizationError: class extends Error {},
  owns: (actor: { id: string; role: string } | null | undefined, ownerId: string) =>
    !!actor && (actor.id === ownerId || actor.role === "ADMIN"),
  requireRole: async (...roles: string[]) => {
    if (!roles.includes(fixture.actor.role)) throw new Error("Denied");
    return { ...fixture.actor, status: "ACTIVE" };
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { changeJobStatus, saveJob } from "./actions";
import { adminCloseJob } from "../admin/opdrachten/actions";

const db = fixture.db;

const asClient = () => (fixture.actor = { id: "client", role: "CLIENT" });
const asAdmin = () => (fixture.actor = { id: "admin", role: "ADMIN" });

const validJobForm = () => {
  const fd = new FormData();
  fd.set("jobId", "job");
  fd.set("title", "Zorgdienst weekend");
  fd.set("description", "Een geldige omschrijving van de opdracht.");
  fd.set("workMode", "ONSITE");
  return fd;
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
    { env, timeout: 30_000, stdio: "pipe" },
  );
  await db.user.create({
    data: { id: "client", email: "client@mod.test", name: "Client", passwordHash: "x" },
  });
  await db.user.create({
    data: { id: "admin", email: "admin@mod.test", name: "Admin", role: "ADMIN", passwordHash: "x" },
  });
  await db.company.create({ data: { id: "company", userId: "client", name: "Zorg BV" } });
  await db.job.create({
    data: {
      id: "job",
      companyId: "company",
      title: "Zorgdienst weekend",
      description: "Een geldige omschrijving van de opdracht.",
      status: "PUBLISHED",
      publishedAt: new Date(), // al eens gepubliceerd → heropenen triggert geen poule-uitnodigingen
    },
  });
}, 40_000);

beforeEach(async () => {
  asClient();
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.job.update({
    where: { id: "job" },
    data: { status: "PUBLISHED", moderationClosedAt: null, publishedAt: new Date() },
  });
});

afterAll(async () => {
  await db.$disconnect();
  const { rmSync } = await import("node:fs");
  rmSync(fixture.directory, { recursive: true, force: true });
});

it("adminCloseJob zet de moderatie-markering en sluit de opdracht", async () => {
  asAdmin();
  await adminCloseJob("job");
  const job = await db.job.findUniqueOrThrow({ where: { id: "job" } });
  expect(job.status).toBe("CLOSED");
  expect(job.moderationClosedAt).not.toBeNull();
});

it("de eigenaar kan een gemodereerde opdracht NIET heropenen (CLOSED→PUBLISHED geweigerd)", async () => {
  asAdmin();
  await adminCloseJob("job");

  asClient();
  const res = await changeJobStatus("job", "PUBLISHED");
  expect(res?.error).toMatch(/beheerder/i);

  const job = await db.job.findUniqueOrThrow({ where: { id: "job" } });
  expect(job.status).toBe("CLOSED"); // bleef gesloten — moderatie niet omzeild
});

it("de eigenaar kan een gemodereerde opdracht NIET bewerken (saveJob geweigerd)", async () => {
  asAdmin();
  await adminCloseJob("job");

  asClient();
  const res = await saveJob(undefined, validJobForm());
  expect(res?.error).toMatch(/beheerder/i);
});

it("controle: een eigen EIGENAAR-sluiting (geen markering) blijft wél heropenbaar", async () => {
  // Eigenaar sluit zelf (PUBLISHED→CLOSED): geen moderatie-markering.
  asClient();
  const closed = await changeJobStatus("job", "CLOSED");
  expect(closed?.error).toBeUndefined();
  expect((await db.job.findUniqueOrThrow({ where: { id: "job" } })).moderationClosedAt).toBeNull();

  // En kan daarna gewoon weer heropenen.
  const reopened = await changeJobStatus("job", "PUBLISHED");
  expect(reopened?.error).toBeUndefined();
  expect((await db.job.findUniqueOrThrow({ where: { id: "job" } })).status).toBe("PUBLISHED");
});
