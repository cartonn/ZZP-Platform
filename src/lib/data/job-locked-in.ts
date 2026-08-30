import { prisma } from "@/lib/db";

/**
 * Bepaalt welke van de meegegeven opdrachten al 'vergeven' zijn: er ligt een kandidaat vast (een
 * ACCEPTED-reactie in de propose-limbo) óf er is een niet-geannuleerde samenwerking. Dit spiegelt exact
 * de `lockedIn`-poort die de opdrachtgever-next-actions hanteren (`getClientColdJobs` /
 * `getClientOverdueJobs`), zodat de ZZP'er-facing urgentiesignalen ("direct te starten") niet aansporen
 * op een opdracht waarvan de rol al bezet is. Server-side waarheid; het DB-filter doet de selectie,
 * begrensd op de (zichtbare) job-ids die de caller aanlevert. Lege invoer → lege set, geen query.
 */
export async function lockedInJobIds(jobIds: string[]): Promise<Set<string>> {
  if (jobIds.length === 0) return new Set();
  const rows = await prisma.job.findMany({
    where: {
      id: { in: jobIds },
      OR: [
        { applications: { some: { status: "ACCEPTED" } } },
        { collaborations: { some: { status: { not: "CANCELLED" } } } },
      ],
    },
    select: { id: true },
  });
  return new Set(rows.map((r) => r.id));
}
