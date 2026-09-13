import { cache } from "react";
import { prisma } from "@/lib/db";
import { PERFORMANCE_ESCALATE_AFTER_DAYS } from "@/lib/performance-approval-reminders";

/** One request snapshot for the administrator's action list and navigation badge. */
export const getAdminPerformanceEscalations = cache(async (now: Date = new Date()) => {
  // The reminder planner escalates after whole days, so day 7 remains a reminder.
  const cutoff = new Date(
    now.getTime() - (PERFORMANCE_ESCALATE_AFTER_DAYS + 1) * 24 * 60 * 60 * 1000,
  );
  return prisma.performance.findMany({
    where: {
      status: "SUBMITTED",
      submittedAt: { lte: cutoff },
      collaboration: { status: "ACTIVE", disputedAt: null },
    },
    select: {
      id: true,
      collaborationId: true,
      submittedAt: true,
      description: true,
      collaboration: { select: { job: { select: { title: true } } } },
    },
    orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
    take: 50,
  });
});
