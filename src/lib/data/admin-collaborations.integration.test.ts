import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { isPostgresUrl } from "@/lib/db/text-search";
import { parseCollaborationFilter } from "@/lib/collaboration-filter";

// Only the disposable local PostgreSQL service in CI; never a remotely configured database.
const url = process.env.DATABASE_URL ?? "";
const disposable =
  process.env.CI === "true" &&
  isPostgresUrl(url) &&
  ["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname);
const prefix = `admin-page-${process.pid}-${Date.now()}`;
const ids = Array.from({ length: 51 }, (_, i) => `${prefix}-${i}`);
const oldId = `${prefix}-0`;
const now = new Date(2026, 9, 27, 12);

describe.skipIf(!disposable)("admin overview on disposable PostgreSQL", () => {
  let prisma: (typeof import("@/lib/db"))["prisma"];
  let getPage: (typeof import("./admin-collaborations"))["getAdminCollaborations"];
  beforeAll(async () => {
    ({ prisma } = await import("@/lib/db"));
    ({ getAdminCollaborations: getPage } = await import("./admin-collaborations"));
    const { collaborationDurationBoundary } = await import("./admin-collaborations");
    await prisma.user.createMany({
      data: ["client", "freelancer"].map((role) => ({
        id: `${prefix}-${role}`,
        email: `${prefix}-${role}@synthetic.test`,
        name: "Synthetic",
        passwordHash: "synthetic",
        role: role === "client" ? "CLIENT" : "FREELANCER",
      })),
    });
    await prisma.company.create({
      data: { id: prefix, userId: `${prefix}-client`, name: "Synthetic company" },
    });
    await prisma.freelancerProfile.create({ data: { id: prefix, userId: `${prefix}-freelancer` } });
    await prisma.job.createMany({
      data: ids.map((id) => ({
        id,
        companyId: prefix,
        title: `Épreuve 100%_! ${id}`,
        description: "Synthetic",
      })),
    });
    await prisma.application.createMany({
      data: ids.map((id) => ({ id, jobId: id, freelancerId: prefix, motivation: "Synthetic" })),
    });
    await prisma.collaboration.createMany({
      data: ids.map((id, i) => ({
        id,
        jobId: id,
        applicationId: id,
        companyId: prefix,
        freelancerId: prefix,
        status: i === 0 ? "ACTIVE" : "COMPLETED",
        createdAt: new Date(i === 0 ? "2025-01-01" : "2026-01-01"),
        startDate: i === 0 ? new Date(collaborationDurationBoundary(now, 12).getTime() - 1) : null,
      })),
    });
    await prisma.performance.create({
      data: { collaborationId: oldId, description: "Synthetic", status: "SUBMITTED" },
    });
    await prisma.invoice.createMany({
      data: ["SUBMITTED", "PAID", "PROCESSED", null].map((lifecycleStatus, i) => ({
        number: `${prefix}-invoice-${i}`,
        collaborationId: oldId,
        lifecycleStatus,
      })),
    });
  });
  afterAll(async () => {
    if (!prisma) return;
    await prisma.invoice.deleteMany({ where: { collaborationId: { in: ids } } });
    await prisma.performance.deleteMany({ where: { collaborationId: { in: ids } } });
    await prisma.collaboration.deleteMany({ where: { id: { in: ids } } });
    await prisma.application.deleteMany({ where: { id: { in: ids } } });
    await prisma.job.deleteMany({ where: { id: { in: ids } } });
    await prisma.freelancerProfile.deleteMany({ where: { id: prefix } });
    await prisma.company.deleteMany({ where: { id: prefix } });
    await prisma.user.deleteMany({
      where: { id: { in: [`${prefix}-client`, `${prefix}-freelancer`] } },
    });
    await prisma.$disconnect();
  });
  it("uses PostgreSQL text, count, date and aggregate types with bounded pages", async () => {
    const filter = parseCollaborationFilter({ q: `épreuve 100%_! ${prefix}` });
    const first = await getPage(filter, "1", now);
    const last = await getPage(filter, "2", now);
    expect(first.total).toBe(51);
    expect(first.rows).toHaveLength(50);
    expect(last.rows.map((row) => row.id)).toEqual([oldId]);
    expect(last.rows[0]!._count).toEqual({ performances: 1, invoices: 1 });
    expect(last.paid.get(oldId)).toBe(2);
    const high = await getPage(parseCollaborationFilter({ q: prefix, dba: "HOOG" }), "1", now);
    const low = await getPage(parseCollaborationFilter({ q: prefix, dba: "LAAG" }), "1", now);
    expect(high.rows.map((row) => row.id)).toEqual([oldId]);
    expect(low.total).toBe(50);
    expect(
      (await getPage(parseCollaborationFilter({ q: `${prefix}' OR 1=1 --` }), "1", now)).total,
    ).toBe(0);
  });
});
