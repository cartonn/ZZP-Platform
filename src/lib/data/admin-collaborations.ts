import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DBA_THRESHOLDS } from "@/lib/config";
import { isPostgresUrl } from "@/lib/db/text-search";
import { COLLAB_STATUS_VALUES, type CollaborationFilter } from "@/lib/collaboration-filter";

export const ADMIN_COLLABORATION_PAGE_SIZE = 50;

/** Exclusive local-calendar boundary matching monthsBetween, including the whole threshold day. */
export function collaborationDurationBoundary(now: Date, months: number): Date {
  const target = new Date(now.getFullYear(), now.getMonth() - months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(now.getDate(), lastDay) + 1);
  return target;
}

function conditions(filter: CollaborationFilter, now: Date): Prisma.Sql {
  const dateValue = (months: number) => {
    const boundary = collaborationDurationBoundary(now, months);
    return isPostgresUrl(process.env.DATABASE_URL) ? boundary : boundary.getTime();
  };
  const strong = Prisma.sql`(j."dbaDirectSupervision" = ${true} OR
    (c."startDate" IS NOT NULL AND c."startDate" < ${dateValue(DBA_THRESHOLDS.durationStrongSignalMonths)}))`;
  const medium = Prisma.sql`(j."dbaEmbedded" = ${true} OR j."dbaFixedSchedule" = ${true} OR
    (c."startDate" IS NOT NULL AND c."startDate" < ${dateValue(DBA_THRESHOLDS.durationSignalMonths)}))`;
  const clauses: Prisma.Sql[] = [];
  if (filter.status) clauses.push(Prisma.sql`c."status" = ${filter.status}`);
  if (filter.dba === "HOOG") clauses.push(strong);
  if (filter.dba === "VERHOOGD") clauses.push(Prisma.sql`NOT ${strong} AND ${medium}`);
  if (filter.dba === "LAAG") clauses.push(Prisma.sql`NOT ${strong} AND NOT ${medium}`);
  if (filter.q) {
    // Literal substring over the same joined fields; escape LIKE metacharacters, never SQL values.
    // LOWER follows the database collation (SQLite folds ASCII; PostgreSQL uses its locale).
    const needle = `%${filter.q.toLowerCase().replace(/[!%_]/g, "!$&")}%`;
    clauses.push(
      Prisma.sql`LOWER(j."title" || ' ' || co."name" || ' ' || COALESCE(u."name", '')) LIKE ${needle} ESCAPE '!'`,
    );
  }
  return clauses.length ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}` : Prisma.empty;
}

const relations = Prisma.sql`FROM "Collaboration" c
  JOIN "Job" j ON j."id" = c."jobId"
  JOIN "Company" co ON co."id" = c."companyId"
  JOIN "FreelancerProfile" f ON f."id" = c."freelancerId"
  JOIN "User" u ON u."id" = f."userId"`;

/** ADMIN-only caller: aggregate the full set, but load at most one page and no child arrays. */
export async function getAdminCollaborations(
  filter: CollaborationFilter,
  requestedPage: string | string[] | undefined,
  now: Date,
) {
  const where = conditions(filter, now);
  const [all, statusGroups, matches] = await Promise.all([
    prisma.collaboration.count(),
    prisma.collaboration.groupBy({
      by: ["status"],
      where: { status: { in: [...COLLAB_STATUS_VALUES] } },
      _count: { _all: true },
    }),
    prisma.$queryRaw<{ total: bigint | number }[]>(
      Prisma.sql`SELECT COUNT(*) AS "total" ${relations} ${where}`,
    ),
  ]);
  const counts = { all, PROPOSED: 0, ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 };
  for (const group of statusGroups) {
    if ((COLLAB_STATUS_VALUES as readonly string[]).includes(group.status)) {
      counts[group.status as (typeof COLLAB_STATUS_VALUES)[number]] = group._count._all;
    }
  }
  const total = Number(matches[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_COLLABORATION_PAGE_SIZE));
  const raw = Array.isArray(requestedPage) ? requestedPage[0] : requestedPage;
  const parsed = Number(raw ?? 1);
  const page = Math.min(totalPages, Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1);
  const ids = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT c."id" ${relations} ${where}
    ORDER BY c."createdAt" DESC, c."id" DESC
    LIMIT ${ADMIN_COLLABORATION_PAGE_SIZE} OFFSET ${(page - 1) * ADMIN_COLLABORATION_PAGE_SIZE}`);
  const pageIds = ids.map((row) => row.id);
  const [rows, paidGroups] = await Promise.all([
    prisma.collaboration.findMany({
      where: { id: { in: pageIds } },
      take: ADMIN_COLLABORATION_PAGE_SIZE,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        status: true,
        disputedAt: true,
        createdAt: true,
        startDate: true,
        job: {
          select: {
            title: true,
            dbaDirectSupervision: true,
            dbaEmbedded: true,
            dbaFixedSchedule: true,
          },
        },
        company: { select: { name: true } },
        freelancer: { select: { user: { select: { name: true } } } },
        _count: {
          select: {
            performances: { where: { status: "SUBMITTED" } },
            invoices: { where: { lifecycleStatus: "SUBMITTED" } },
          },
        },
      },
    }),
    prisma.invoice.groupBy({
      by: ["collaborationId"],
      where: { collaborationId: { in: pageIds }, lifecycleStatus: { in: ["PAID", "PROCESSED"] } },
      _count: { _all: true },
    }),
  ]);
  const paid = new Map(paidGroups.map((group) => [group.collaborationId, group._count._all]));
  return { rows, paid, counts, total, page, totalPages };
}
