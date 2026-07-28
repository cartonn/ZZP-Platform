import { prisma } from "@/lib/db";

/**
 * Begrensde steekproef van recent-geverifieerde certificaten voor de doorlooptijd-indicatie.
 * Alleen twee tijdstippen (geen identiteit/PII); de aanroeper aggregeert ze tot één mediaan/p90.
 * `take` begrenst de query (geen onbegrensde findMany); recentste eerst zodat de indicatie het
 * huidige tempo weerspiegelt.
 */
export const VERIFICATION_TURNAROUND_SAMPLE_LIMIT = 250;

export function getVerificationTurnaroundSamples(): Promise<
  Array<{ submittedAt: Date | null; verifiedAt: Date | null }>
> {
  return prisma.credential.findMany({
    where: {
      status: "VERIFIED",
      submittedAt: { not: null },
      verifiedAt: { not: null },
    },
    select: { submittedAt: true, verifiedAt: true },
    orderBy: { verifiedAt: "desc" },
    take: VERIFICATION_TURNAROUND_SAMPLE_LIMIT,
  });
}
