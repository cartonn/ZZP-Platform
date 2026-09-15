import { prisma } from "@/lib/db";

/** Oversight rows for the authenticated franchiser's tenant, scoped by the job. */
export async function getFranchiseCollaborations(tenantId: string | null) {
  if (!tenantId) return [];

  // unbounded-allow: one tenant's oversight queue; filtering, counts and attention sorting require
  // the complete set. Select only row fields: newer history must not hide an actionable placement.
  return prisma.collaboration.findMany({
    where: { job: { tenantId } },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      status: true,
      contractStatus: true,
      createdAt: true,
      updatedAt: true,
      endDate: true,
      disputedAt: true,
      cancellationReason: true,
      cancelledAt: true,
      cancelledById: true,
      cancellationChargeable: true,
      job: { select: { title: true, department: { select: { name: true } } } },
      company: { select: { name: true, userId: true } },
      freelancer: { select: { user: { select: { name: true } } } },
    },
  });
}
