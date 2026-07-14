import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

// Request-niveau gedeelde load van het ZZP-profiel voor completeness + zichtbaarheid.
// React cache() dedupliceert binnen één render: het dashboard (dashboardData) en de
// taken-enumerator (pendingTasks) draaien in dezelfde render en delen zo één query
// i.p.v. twee identieke. Aanroepers die een ánder veld-profiel nodig hebben
// (bv. recommendedJobs met credentials/applications) houden bewust hun eigen query.
export const getCompletenessProfile = cache((userId: string) =>
  prisma.freelancerProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      visibility: true,
      headline: true,
      bio: true,
      hourlyRate: true,
      location: true,
      availability: true,
      languages: true,
      monthlyIncomeGoalCents: true,
      skills: { select: { skillId: true } },
      industries: { select: { industryId: true } },
    },
  }),
);
